import { randomUUID } from "node:crypto";
import type { QuizRepositoryPort, UnitOfWorkPort } from "@ai-quiz/domain";
import { ApplicationError } from "../errors.js";

export class StartAttemptUseCase {
  constructor(
    private readonly quizzes: QuizRepositoryPort,
    private readonly uow: UnitOfWorkPort,
  ) {}

  async execute(input: { quizId: string; tokenHash: string }): Promise<{ attemptId: string }> {
    const quiz = await this.quizzes.findById(input.quizId);
    if (quiz === undefined) {
      throw new ApplicationError("QUIZ_NOT_FOUND", "Quiz not found");
    }
    if (quiz.status !== "ready") {
      throw new ApplicationError("QUIZ_NOT_PLAYABLE", "Quiz is not playable");
    }

    const attemptId = randomUUID();
    await this.uow.transaction((repos) =>
      repos.attempts.createOpen({
        id: attemptId,
        quizId: input.quizId,
        publicTokenHash: input.tokenHash,
      }),
    );
    return { attemptId };
  }
}
