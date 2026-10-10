export const ErrorCodes = {
  CREATE_QUIZ_INVALID: "CREATE_QUIZ_INVALID",
  SUBMIT_ANSWERS_INVALID: "SUBMIT_ANSWERS_INVALID",
  QUIZ_INVALID: "QUIZ_INVALID",
  SELECTION_ILLEGAL: "SELECTION_ILLEGAL",
  ATTEMPT_INCOMPLETE: "ATTEMPT_INCOMPLETE",
  ATTEMPT_NOT_SCORED: "ATTEMPT_NOT_SCORED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class ContractError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "ContractError";
    this.code = code;
  }
}
