import type { AnswerSelection, Attempt, Quiz } from "@ai-quiz/domain";
import { assertAttemptMatchesQuiz, scoreAttempt, validateQuiz } from "@ai-quiz/domain";
import type { PublicResult } from "@ai-quiz/contracts";
import { toPublicResult } from "./map-public.js";

export type GradeAttemptInput = {
  quiz: Quiz;
  answers: AnswerSelection[];
  attempt?: Attempt;
};

export type GradeAttemptOutput = {
  attempt: Attempt;
  result: PublicResult;
};

export function gradeAttempt(input: GradeAttemptInput): GradeAttemptOutput {
  const attempt: Attempt =
    input.attempt ??
    ({
      id: "attempt",
      quizId: input.quiz.id,
      status: "open",
    } satisfies Attempt);

  assertAttemptMatchesQuiz(attempt, input.quiz);

  if (attempt.status === "scored" && attempt.result !== undefined) {
    return {
      attempt,
      result: toPublicResult(input.quiz, attempt),
    };
  }

  validateQuiz(input.quiz);
  const result = scoreAttempt(input.quiz, input.answers);
  const scoredAttempt: Attempt = {
    ...attempt,
    status: "scored",
    result,
  };
  return {
    attempt: scoredAttempt,
    result: toPublicResult(input.quiz, scoredAttempt),
  };
}
