import { ErrorCodes } from "./error-codes.js";

const PHASE_2_CODES = [
  "CREATE_QUIZ_INVALID",
  "SUBMIT_ANSWERS_INVALID",
  "QUIZ_INVALID",
  "SELECTION_ILLEGAL",
  "ATTEMPT_INCOMPLETE",
  "ATTEMPT_NOT_SCORED",
  "QUIZ_NOT_FOUND",
  "ATTEMPT_NOT_FOUND",
  "UNAUTHORIZED_ATTEMPT",
  "QUIZ_NOT_PLAYABLE",
] as const;

describe("ErrorCodes", () => {
  it("matches the Phase 2 contract codes", () => {
    expect(Object.values(ErrorCodes).sort()).toEqual([...PHASE_2_CODES].sort());
  });
});
