export type ApplicationErrorCode =
  | "QUIZ_NOT_FOUND"
  | "ATTEMPT_NOT_FOUND"
  | "UNAUTHORIZED_ATTEMPT"
  | "QUIZ_NOT_PLAYABLE";

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message: string) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
  }
}

export function isApplicationError(value: unknown): value is ApplicationError {
  return value instanceof ApplicationError;
}

/** Thrown when a concurrent finalize hits a unique answer constraint; the PG transaction is aborted. */
export class AlreadyScoredConflictError extends Error {
  constructor() {
    super("Attempt was already scored");
    this.name = "AlreadyScoredConflictError";
  }
}

export function isAlreadyScoredConflictError(value: unknown): value is AlreadyScoredConflictError {
  return value instanceof AlreadyScoredConflictError;
}
