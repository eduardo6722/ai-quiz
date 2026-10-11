import type { AttemptRepositoryPort, QuizRepositoryPort } from "@ai-quiz/domain";
import { DomainError } from "@ai-quiz/domain";
import type { PublicResult } from "@ai-quiz/contracts";
import { toPublicResult } from "./to-public-result.js";
import { ApplicationError } from "../errors.js";
import { tokenHashesMatch } from "../util/token-hash.js";

export class GetQuizResultUseCase {
  constructor(
    private readonly quizzes: QuizRepositoryPort,
    private readonly attempts: AttemptRepositoryPort,
  ) {}

  async execute(input: { attemptId: string; tokenHash: string }): Promise<PublicResult> {
    const attempt = await this.attempts.findById(input.attemptId);
    if (attempt === undefined) {
      throw new ApplicationError("ATTEMPT_NOT_FOUND", "Attempt not found");
    }
    if (!tokenHashesMatch(attempt.publicTokenHash, input.tokenHash)) {
      throw new ApplicationError("UNAUTHORIZED_ATTEMPT", "Unauthorized attempt");
    }
    if (attempt.status !== "scored" || attempt.result === undefined) {
      throw new DomainError("ATTEMPT_NOT_SCORED", "Public result requested before scoring");
    }

    const quizRecord = await this.quizzes.findById(attempt.quizId);
    if (quizRecord === undefined) {
      throw new ApplicationError("QUIZ_NOT_FOUND", "Quiz not found");
    }

    return toPublicResult(quizRecord.quiz, {
      id: attempt.id,
      quizId: attempt.quizId,
      status: "scored",
      result: attempt.result,
    });
  }
}
