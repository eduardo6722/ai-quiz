import type {
  AnswerSelection,
  AttemptRecord,
  QuizRecord,
  UnitOfWorkPort,
  UnitOfWorkRepos,
} from "@ai-quiz/domain";
import type { PublicResult } from "@ai-quiz/contracts";
import { gradeAttempt } from "./grade-attempt.js";
import { toPublicResult } from "./to-public-result.js";
import { ApplicationError, isAlreadyScoredConflictError } from "../errors.js";
import { tokenHashesMatch } from "../util/token-hash.js";

export class SubmitQuizUseCase {
  constructor(private readonly uow: UnitOfWorkPort) {}

  async execute(input: {
    attemptId: string;
    tokenHash: string;
    answers: AnswerSelection[];
  }): Promise<PublicResult> {
    try {
      return await this.uow.transaction((repos) => this.submitInTransaction(repos, input));
    } catch (error) {
      if (!isAlreadyScoredConflictError(error)) {
        throw error;
      }
      return this.uow.transaction((repos) => this.readStoredResult(repos, input));
    }
  }

  private async submitInTransaction(
    repos: UnitOfWorkRepos,
    input: { attemptId: string; tokenHash: string; answers: AnswerSelection[] },
  ): Promise<PublicResult> {
    const { attempt, quizRecord } = await this.loadAuthorized(repos, input);

    if (attempt.status === "scored" && attempt.result !== undefined) {
      return this.toStoredResult(quizRecord, attempt);
    }

    const graded = gradeAttempt({
      quiz: quizRecord.quiz,
      answers: input.answers,
      attempt: { id: attempt.id, quizId: attempt.quizId, status: "open" },
    });
    if (graded.attempt.status !== "scored" || graded.attempt.result === undefined) {
      throw new ApplicationError("ATTEMPT_NOT_FOUND", "Grading did not produce a result");
    }

    const outcome = await repos.attempts.finalizeIfOpen({
      attemptId: attempt.id,
      quizId: attempt.quizId,
      result: graded.attempt.result,
    });

    if (outcome === "already_scored") {
      return this.readStoredResult(repos, input);
    }

    return graded.result;
  }

  private async readStoredResult(
    repos: UnitOfWorkRepos,
    input: { attemptId: string; tokenHash: string },
  ): Promise<PublicResult> {
    const { attempt, quizRecord } = await this.loadAuthorized(repos, input);
    if (attempt.result === undefined) {
      throw new ApplicationError("ATTEMPT_NOT_FOUND", "Attempt not found");
    }
    return this.toStoredResult(quizRecord, attempt);
  }

  private async loadAuthorized(
    repos: UnitOfWorkRepos,
    input: { attemptId: string; tokenHash: string },
  ): Promise<{ attempt: AttemptRecord; quizRecord: QuizRecord }> {
    const attempt = await repos.attempts.findById(input.attemptId);
    if (attempt === undefined) {
      throw new ApplicationError("ATTEMPT_NOT_FOUND", "Attempt not found");
    }
    if (!tokenHashesMatch(attempt.publicTokenHash, input.tokenHash)) {
      throw new ApplicationError("UNAUTHORIZED_ATTEMPT", "Unauthorized attempt");
    }
    const quizRecord = await repos.quizzes.findById(attempt.quizId);
    if (quizRecord === undefined) {
      throw new ApplicationError("QUIZ_NOT_FOUND", "Quiz not found");
    }
    if (quizRecord.status !== "ready") {
      throw new ApplicationError("QUIZ_NOT_PLAYABLE", "Quiz is not playable");
    }
    return { attempt, quizRecord };
  }

  private toStoredResult(quizRecord: QuizRecord, attempt: AttemptRecord): PublicResult {
    if (attempt.result === undefined) {
      throw new ApplicationError("ATTEMPT_NOT_FOUND", "Attempt not found");
    }
    return toPublicResult(quizRecord.quiz, {
      id: attempt.id,
      quizId: attempt.quizId,
      status: "scored",
      result: attempt.result,
    });
  }
}
