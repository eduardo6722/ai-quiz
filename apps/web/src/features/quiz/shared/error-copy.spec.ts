import { ErrorCodes } from "@ai-quiz/contracts";
import { learnerMessageForCode } from "./error-copy";

const expected: Record<string, string> = {
  [ErrorCodes.CREATE_QUIZ_INVALID]: "Check the topic, URL, and question count.",
  [ErrorCodes.SOURCE_UNSAFE_DESTINATION]: "That address cannot be used as a quiz source.",
  [ErrorCodes.SOURCE_UNSUPPORTED_TYPE]: "That source is not usable Markdown.",
  [ErrorCodes.SOURCE_TOO_LARGE]: "That source is too large to use.",
  [ErrorCodes.SOURCE_UNUSABLE]: "That source is not usable Markdown.",
  [ErrorCodes.SOURCE_TIMEOUT]: "Could not read the Markdown source. Try again.",
  [ErrorCodes.SOURCE_FETCH_FAILED]: "Could not read the Markdown source. Try again.",
  [ErrorCodes.GENERATION_INVALID]: "Could not prepare questions from that source. Try again.",
  [ErrorCodes.GENERATION_RETRIES_EXHAUSTED]: "Could not prepare questions from that source. Try again.",
  [ErrorCodes.GENERATION_UPSTREAM_FAILED]: "Could not prepare questions from that source. Try again.",
  [ErrorCodes.QUIZ_INVALID]: "Could not prepare questions from that source. Try again.",
  [ErrorCodes.QUIZ_NOT_FOUND]: "This quiz is not available.",
  [ErrorCodes.QUIZ_NOT_PLAYABLE]: "This quiz is not available.",
  [ErrorCodes.ATTEMPT_NOT_FOUND]: "This result cannot be shown from this browser sitting.",
  [ErrorCodes.UNAUTHORIZED_ATTEMPT]: "This result cannot be shown from this browser sitting.",
  [ErrorCodes.ATTEMPT_NOT_SCORED]: "Submit your answers to see the result.",
  [ErrorCodes.SUBMIT_ANSWERS_INVALID]: "Check your answers and try submitting again.",
  [ErrorCodes.SELECTION_ILLEGAL]: "Check your answers and try submitting again.",
  [ErrorCodes.ATTEMPT_INCOMPLETE]: "Answer every question before submitting.",
  [ErrorCodes.REQUEST_RATE_LIMITED]: "Too many quizzes right now. Wait a minute and try again.",
  [ErrorCodes.GENERATION_CONCURRENCY_LIMIT]: "The quiz service is busy. Try again in a moment.",
  NETWORK: "Could not reach the quiz service. Try again.",
  INTERNAL_ERROR: "Something went wrong. Try again.",
};

describe("learnerMessageForCode", () => {
  it.each(Object.entries(expected))("maps %s", (code, copy) => {
    expect(learnerMessageForCode(code)).toBe(copy);
    expect(copy).not.toMatch(/sk-/);
    expect(copy).not.toMatch(/token/i);
  });

  it("uses the generic fallback for unknown codes", () => {
    expect(learnerMessageForCode("WEIRD")).toBe("Something went wrong. Try again.");
  });
});
