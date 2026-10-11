import { randomUUID } from "node:crypto";
import {
  DomainError,
  validateQuiz,
  type MarkdownSourcePort,
  type QuizGenerationPort,
  type UnitOfWorkPort,
} from "@ai-quiz/domain";
import type { CreateQuizRequest, CreateQuizResponse } from "@ai-quiz/contracts";

const MAX_SNAPSHOT_BYTES = 512 * 1024;

export class CreateQuizUseCase {
  constructor(
    private readonly source: MarkdownSourcePort,
    private readonly generation: QuizGenerationPort,
    private readonly uow: UnitOfWorkPort,
  ) {}

  async execute(request: CreateQuizRequest): Promise<CreateQuizResponse> {
    const snapshot = await this.source.fetch(request.sourceUrl);
    if (snapshot.contentSnapshot.trim().length === 0) {
      throw new DomainError("QUIZ_INVALID", "source snapshot is empty");
    }
    if (Buffer.byteLength(snapshot.contentSnapshot, "utf8") > MAX_SNAPSHOT_BYTES) {
      throw new DomainError("QUIZ_INVALID", "source snapshot exceeds 512 KiB");
    }

    const questions = await this.generation.generate({
      topic: request.topic,
      sourceText: snapshot.contentSnapshot,
      count: request.questionCount,
      strategy: request.strategy,
    });

    const quiz = {
      id: randomUUID(),
      topic: request.topic,
      sourceUrl: snapshot.originalUrl,
      questions,
    };
    validateQuiz(quiz);

    const record = await this.uow.transaction((repos) =>
      repos.quizzes.insert({
        source: snapshot,
        quiz,
        strategy: request.strategy,
        status: "ready",
      }),
    );

    return { id: record.quiz.id, status: "ready" };
  }
}
