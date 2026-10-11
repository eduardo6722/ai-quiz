export type DomainErrorCode =
  | "QUIZ_INVALID"
  | "SELECTION_ILLEGAL"
  | "ATTEMPT_INCOMPLETE"
  | "ATTEMPT_NOT_SCORED";

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export function isDomainError(value: unknown): value is DomainError {
  return value instanceof DomainError;
}
