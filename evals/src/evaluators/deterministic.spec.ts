import { fixtureQuiz } from "../testing/quiz-fixture.js";
import { evaluateDeterministic } from "./deterministic.js";
import { evaluateDuplicates } from "./duplicates.js";
import { evaluateGroundedExcerpt } from "./grounded-excerpt.js";
import { evaluateLeakage } from "./leakage.js";
import { evaluateSchema } from "./schema.js";

const excerpt = "Ports are interfaces the core depends on";
const snapshot = `${excerpt}. Extra snapshot text for length.`;

describe("deterministic evaluators", () => {
  it("passes a valid five-question fixture", () => {
    const quiz = fixtureQuiz({ excerpt, count: 5 });
    expect(evaluateSchema(quiz).passed).toBe(true);
    expect(evaluateDuplicates(quiz).passed).toBe(true);
    expect(evaluateLeakage(quiz).passed).toBe(true);
    expect(evaluateGroundedExcerpt({ quiz, snapshot, generationFailed: false, expectedBehavior: "valid-grounded-quiz" }).passed).toBe(true);
  });

  it("fails duplicate prompts with a case-level detail", () => {
    const quiz = fixtureQuiz({ excerpt, duplicatePrompts: true });
    const result = evaluateDuplicates(quiz);
    expect(result.passed).toBe(false);
    expect(result.detail).toMatch(/duplicate prompt/i);
  });

  it("fails leakage when the public view would include isCorrect", () => {
    const quiz = fixtureQuiz({ excerpt });
    expect(evaluateLeakage(quiz).passed).toBe(true);
    const leaked = JSON.stringify(quiz);
    expect(leaked).toContain("isCorrect");
  });

  it("fails groundedExcerpt when the excerpt is not in the snapshot", () => {
    const quiz = fixtureQuiz({ excerpt: "not in the snapshot at all" });
    expect(
      evaluateGroundedExcerpt({
        quiz,
        snapshot,
        generationFailed: false,
        expectedBehavior: "valid-grounded-quiz",
      }).passed,
    ).toBe(false);
  });

  it("does not require a judge", () => {
    const quiz = fixtureQuiz({ excerpt });
    const checks = evaluateDeterministic({
      quiz,
      snapshot,
      generationFailed: false,
      expectedBehavior: "valid-grounded-quiz",
    });
    expect(checks.every((check) => typeof check.passed === "boolean")).toBe(true);
  });
});
