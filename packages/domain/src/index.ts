export { DomainError, isDomainError } from "./errors.js";
export type { DomainErrorCode } from "./errors.js";
export { validateQuiz } from "./quiz.js";
export type { Option, Question, QuestionType, Quiz } from "./quiz.js";
export {
  MULTIPLE_CHOICE_POLICY_NOTE,
  scoreMultipleChoice,
  scoreQuestion,
  scoreSingleChoice,
} from "./scoring-policy.js";
export {
  calculateWeightedScore,
  roundForDisplay,
  toPercentage,
  toPercentageDisplay,
} from "./weighted-score.js";
export { applySelections, assertAttemptMatchesQuiz, scoreAttempt } from "./attempt.js";
export type {
  AnswerSelection,
  Attempt,
  QuestionScore,
  ScoredOption,
  ScoredQuestion,
  ScoredResult,
} from "./attempt.js";
export type { MarkdownSourcePort, SourceSnapshot } from "./ports/markdown-source-port.js";
export type { GenerateQuizInput, QuizGenerationPort } from "./ports/quiz-generation-port.js";
export type {
  InsertQuizInput,
  QuizRecord,
  QuizRepositoryPort,
  QuizStatus,
} from "./ports/quiz-repository-port.js";
export type {
  AttemptRecord,
  AttemptRepositoryPort,
  AttemptStatus,
  CreateOpenAttemptInput,
  FinalizeAttemptInput,
} from "./ports/attempt-repository-port.js";
export type { UnitOfWorkPort, UnitOfWorkRepos } from "./ports/unit-of-work-port.js";
