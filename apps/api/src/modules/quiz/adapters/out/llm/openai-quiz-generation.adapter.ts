import { randomUUID } from "node:crypto";
import { Logger } from "@nestjs/common";
import { ApplicationError } from "@ai-quiz/application";
import type { GenerateQuizInput, GeneratedQuiz, Question, QuizGenerationPort } from "@ai-quiz/domain";
import { sanitizeLogText } from "../../../../../infrastructure/sanitize-log";
import { generatedQuizSchema, type GeneratedQuizPayload } from "./generated-quiz.schema";
import { summarizeProviderFailure } from "./provider-failure";
import { buildQuizMessages } from "./quiz-prompt";

export type QuizGenerateTextFn = (options: {
  model: unknown;
  output: unknown;
  abortSignal: AbortSignal;
  maxRetries: number;
  system: string;
  prompt: string;
}) => Promise<{
  output?: GeneratedQuizPayload;
  usage?: { inputTokens?: number; outputTokens?: number };
}>;

type GenerationLogger = {
  log(message: string): void;
  warn(message: string): void;
};

export class OpenAiQuizGenerationAdapter implements QuizGenerationPort {
  private readonly logger: GenerationLogger;

  constructor(
    private readonly options: {
      apiKey: string | undefined;
      modelId: string | undefined;
      generateTextFn?: QuizGenerateTextFn;
      logger?: GenerationLogger;
    },
  ) {
    this.logger = options.logger ?? new Logger(OpenAiQuizGenerationAdapter.name);
  }

  async generate(input: GenerateQuizInput): Promise<GeneratedQuiz> {
    const apiKey = this.options.apiKey?.trim() ?? "";
    const modelId = this.options.modelId?.trim() ?? "";
    if (apiKey.length === 0 || modelId.length === 0) {
      this.logger.warn(
        `generation skipped: ${modelId.length === 0 ? "model id missing" : "api key missing"}`,
      );
      throw new ApplicationError("GENERATION_UPSTREAM_FAILED", "generation is not configured");
    }

    const started = Date.now();
    this.logger.log(
      `generation start model=${modelId} count=${input.count} topicChars=${input.topic.length} sourceChars=${input.sourceText.length}`,
    );

    try {
      const [{ createOpenAI }, ai] = await Promise.all([import("@ai-sdk/openai"), import("ai")]);
      const generate = this.options.generateTextFn ?? (ai.generateText as QuizGenerateTextFn);
      const messages = buildQuizMessages({
        topic: input.topic,
        sourceText: input.sourceText,
        count: input.count,
        strategy: input.strategy,
      });
      const openai = createOpenAI({ apiKey });
      const result = await generate({
        model: openai(modelId),
        output: ai.Output.object({ schema: generatedQuizSchema(input.count) }),
        abortSignal: AbortSignal.timeout(30_000),
        maxRetries: 0,
        system: messages.system,
        prompt: messages.prompt,
      });
      const payload = result.output;
      if (payload === undefined) {
        this.logger.warn(`generation invalid model=${modelId} reason=empty-output ${Date.now() - started}ms`);
        throw new ApplicationError("GENERATION_INVALID", "model did not return structured output");
      }
      this.logger.log(
        `generation ok model=${modelId} questions=${payload.questions.length} ${Date.now() - started}ms`,
      );
      return {
        modelId,
        questions: this.toQuestions(payload),
        usage:
          result.usage !== undefined
            ? { inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens }
            : undefined,
      };
    } catch (error) {
      if (isApplicationErrorCode(error)) {
        throw error;
      }
      if (isNoObjectGenerated(error)) {
        this.logger.warn(`generation invalid model=${modelId} reason=schema ${Date.now() - started}ms`);
        throw new ApplicationError("GENERATION_INVALID", "model output failed schema validation");
      }
      const summary = summarizeProviderFailure(error);
      this.logger.warn(
        sanitizeLogText(
          `generation failed model=${modelId} kind=${summary.kind} name=${summary.name} status=${summary.statusCode ?? "n/a"} ${summary.message} ${Date.now() - started}ms`,
        ),
      );
      throw new ApplicationError("GENERATION_UPSTREAM_FAILED", summary.clientMessage);
    }
  }

  private toQuestions(payload: GeneratedQuizPayload): Question[] {
    return payload.questions.map((question, position) => ({
      id: randomUUID(),
      position,
      prompt: question.prompt,
      type: question.type,
      sourceExcerpt: question.sourceExcerpt,
      options: question.options.map((option, optionPosition) => ({
        id: randomUUID(),
        position: optionPosition,
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    }));
  }
}

function isApplicationErrorCode(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

function isNoObjectGenerated(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AI_NoObjectGeneratedError"
  );
}
