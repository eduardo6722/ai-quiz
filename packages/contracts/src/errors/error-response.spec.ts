import { ErrorCodes } from "./error-codes.js";
import { errorResponseSchema } from "./error-response.js";

describe("errorResponseSchema", () => {
  it("accepts code and message", () => {
    expect(errorResponseSchema.parse({ code: ErrorCodes.QUIZ_NOT_FOUND, message: "Quiz not found" })).toEqual({
      code: "QUIZ_NOT_FOUND",
      message: "Quiz not found",
    });
  });

  it("exports the Phase 2 codes", () => {
    expect(ErrorCodes.UNAUTHORIZED_ATTEMPT).toBe("UNAUTHORIZED_ATTEMPT");
    expect(ErrorCodes.ATTEMPT_NOT_FOUND).toBe("ATTEMPT_NOT_FOUND");
    expect(ErrorCodes.QUIZ_NOT_PLAYABLE).toBe("QUIZ_NOT_PLAYABLE");
  });
});
