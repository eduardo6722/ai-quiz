import type { Attempt, Quiz } from "@ai-quiz/domain";
import { assertAttemptMatchesQuiz, DomainError } from "@ai-quiz/domain";
import type { PublicResult } from "@ai-quiz/contracts";

export function toPublicResult(quiz: Quiz, attempt: Attempt): PublicResult {
  if (attempt.status !== "scored" || attempt.result === undefined) {
    throw new DomainError("ATTEMPT_NOT_SCORED", "Public result requested before scoring");
  }
  assertAttemptMatchesQuiz(attempt, quiz);
  const scored = attempt.result;
  return {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    weightedScore: scored.weightedScore,
    weightedScoreDisplay: scored.weightedScoreDisplay,
    percentageDisplay: scored.percentageDisplay,
    questions: scored.questions.map((question) => ({
      id: question.questionId,
      position: question.position,
      type: question.type,
      rawScore: question.rawScore,
      selectedOptionIds: question.selectedOptionIds,
      options: question.options.map((option) => ({
        id: option.id,
        position: option.position,
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    })),
  };
}
