import { ApplicationError } from "./errors.js";
import { assertGrounded } from "./grounding.js";
import { SAMPLE_EXCERPT, SAMPLE_SNAPSHOT, sampleQuiz } from "./quiz-fixture.js";

describe("assertGrounded", () => {
  it("accepts excerpts that appear in the snapshot", () => {
    expect(() => assertGrounded(sampleQuiz().questions, SAMPLE_SNAPSHOT)).not.toThrow();
  });

  it("rejects missing excerpts", () => {
    const questions = sampleQuiz().questions.map((question) => ({
      ...question,
      sourceExcerpt: undefined,
    }));
    expect(() => assertGrounded(questions, SAMPLE_SNAPSHOT)).toThrow(ApplicationError);
  });

  it("rejects excerpts that are not substrings", () => {
    const questions = sampleQuiz().questions.map((question) => ({
      ...question,
      sourceExcerpt: `${SAMPLE_EXCERPT} missing`,
    }));
    expect(() => assertGrounded(questions, SAMPLE_SNAPSHOT)).toThrow(ApplicationError);
  });
});
