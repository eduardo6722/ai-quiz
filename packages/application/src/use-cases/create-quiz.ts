import { randomUUID } from "node:crypto";
import {
  isDomainError,
  validateQuiz,
  type MarkdownSourcePort,
  type QuizGenerationPort,
  type UnitOfWorkPort,
} from "@ai-quiz/domain";
import type { CreateQuizRequest, CreateQuizResponse } from "@ai-quiz/contracts";
import { ApplicationError, isApplicationError } from "../errors.js";
import { assertGrounded } from "../grounding/grounding.js";

const MAX_SNAPSHOT_BYTES = 512 * 1024;
const MIN_USABLE_CHARS = 200;
const GENERATION_WINDOW_CHARS = 32_000;
const MAX_GENERATION_ATTEMPTS = 3;

export class CreateQuizUseCase {
  constructor(
    private readonly source: MarkdownSourcePort,
    private readonly generation: QuizGenerationPort,
    private readonly uow: UnitOfWorkPort,
  ) {}

  async execute(request: CreateQuizRequest): Promise<CreateQuizResponse> {
    const snapshot = await this.source.fetch(request.sourceUrl);
    if (snapshot.contentSnapshot.trim().length < MIN_USABLE_CHARS) {
      throw new ApplicationError("SOURCE_UNUSABLE", "source is too short");
    }
    if (Buffer.byteLength(snapshot.contentSnapshot, "utf8") > MAX_SNAPSHOT_BYTES) {
      throw new ApplicationError("SOURCE_TOO_LARGE", "source snapshot exceeds 512 KiB");
    }

    const sourceText = snapshot.contentSnapshot.slice(0, GENERATION_WINDOW_CHARS);
    let lastInvalid: ApplicationError | undefined;

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
      try {
        const generated = await this.generation.generate({
          topic: request.topic,
          sourceText,
          count: request.questionCount,
          strategy: request.strategy,
        });
        assertGrounded(generated.questions, snapshot.contentSnapshot);
        const quiz = {
          id: randomUUID(),
          topic: request.topic,
          sourceUrl: snapshot.originalUrl,
          questions: generated.questions,
        };
        validateQuiz(quiz);
        const record = await this.uow.transaction((repos) =>
          repos.quizzes.insert({
            source: snapshot,
            quiz,
            strategy: request.strategy,
            status: "ready",
            modelId: generated.modelId,
          }),
        );
        return { id: record.quiz.id, status: "ready" };
      } catch (error) {
        if (isApplicationError(error) && error.code === "GENERATION_UPSTREAM_FAILED") {
          if (/not configured/i.test(error.message) || attempt === MAX_GENERATION_ATTEMPTS) {
            throw error;
          }
          lastInvalid = error;
          continue;
        }
        if (isApplicationError(error) && error.code === "GENERATION_INVALID") {
          lastInvalid = error;
          continue;
        }
        if (isDomainError(error) && error.code === "QUIZ_INVALID") {
          lastInvalid = new ApplicationError("GENERATION_INVALID", error.message);
          continue;
        }
        throw error;
      }
    }

    if (lastInvalid?.code === "GENERATION_UPSTREAM_FAILED") {
      throw lastInvalid;
    }
    throw new ApplicationError("GENERATION_RETRIES_EXHAUSTED", "generation retries exhausted");
  }
}
