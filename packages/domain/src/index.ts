export { DomainError, isDomainError } from "./shared/errors.js";
export type { DomainErrorCode } from "./shared/errors.js";
export { validateQuiz } from "./quiz/quiz.js";
export { mixQuizOptionOrder } from "./quiz/mix-option-order.js";
export type { Option, Question, QuestionType, Quiz } from "./quiz/quiz.js";
export {
  MULTIPLE_CHOICE_POLICY_NOTE,
  scoreMultipleChoice,
  scoreQuestion,
  scoreSingleChoice,
} from "./scoring/scoring-policy.js";
export {
  calculateWeightedScore,
  roundForDisplay,
  toPercentage,
  toPercentageDisplay,
} from "./scoring/weighted-score.js";
export { applySelections, assertAttemptMatchesQuiz, scoreAttempt } from "./attempt/attempt.js";
export type {
  AnswerSelection,
  Attempt,
  QuestionScore,
  ScoredOption,
  ScoredQuestion,
  ScoredResult,
} from "./attempt/attempt.js";
export type { MarkdownSourcePort, SourceSnapshot } from "./quiz/markdown-source-port.js";
export type {
  GenerateQuizInput,
  GeneratedQuiz,
  QuizGenerationPort,
} from "./quiz/quiz-generation-port.js";
export type {
  InsertQuizInput,
  QuizRecord,
  QuizRepositoryPort,
  QuizStatus,
} from "./quiz/quiz-repository-port.js";
export type {
  AttemptRecord,
  AttemptRepositoryPort,
  AttemptStatus,
  CreateOpenAttemptInput,
  FinalizeAttemptInput,
} from "./attempt/attempt-repository-port.js";
export type { UnitOfWorkPort, UnitOfWorkRepos } from "./shared/unit-of-work-port.js";
export type {
  TelemetryAttributes,
  TelemetryPort,
  TelemetryStageName,
} from "./shared/telemetry-port.js";
