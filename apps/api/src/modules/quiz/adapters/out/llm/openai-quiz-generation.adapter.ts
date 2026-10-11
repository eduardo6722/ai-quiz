import { randomUUID } from "node:crypto";
import { ApplicationError } from "@ai-quiz/application";
import type { GenerateQuizInput, GeneratedQuiz, Question, QuizGenerationPort } from "@ai-quiz/domain";
import { generatedQuizSchema, type GeneratedQuizPayload } from "./generated-quiz.schema";
import { buildQuizMessages } from "./quiz-prompt";

export type QuizGenerateTextFn = (options: {
  model: unknown;
  output: unknown;
  abortSignal: AbortSignal;
  system: string;
  prompt: string;
}) => Promise<{ output?: GeneratedQuizPayload }>;

export class OpenAiQuizGenerationAdapter implements QuizGenerationPort {
  constructor(
    private readonly options: {
      apiKey: string | undefined;
      modelId: string | undefined;
      generateTextFn?: QuizGenerateTextFn;
    },
  ) {}

  async generate(input: GenerateQuizInput): Promise<GeneratedQuiz> {
    const apiKey = this.options.apiKey?.trim() ?? "";
    const modelId = this.options.modelId?.trim() ?? "";
    if (apiKey.length === 0 || modelId.length === 0) {
      throw new ApplicationError("GENERATION_UPSTREAM_FAILED", "generation is not configured");
    }

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
        system: messages.system,
        prompt: messages.prompt,
      });
      const payload = result.output;
      if (payload === undefined) {
        throw new ApplicationError("GENERATION_INVALID", "model did not return structured output");
      }
      return {
        modelId,
        questions: this.toQuestions(payload),
      };
    } catch (error) {
      if (isApplicationErrorCode(error)) {
        throw error;
      }
      if (isNoObjectGenerated(error)) {
        throw new ApplicationError("GENERATION_INVALID", "model output failed schema validation");
      }
      throw new ApplicationError("GENERATION_UPSTREAM_FAILED", "model provider request failed");
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
