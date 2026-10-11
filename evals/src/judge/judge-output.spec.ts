import { quizJudgeOutputSchema } from "./output-schema.js";
import { evaluateSemantic } from "../evaluators/semantic.js";
import { fixtureQuiz } from "../testing/quiz-fixture.js";

describe("judge output", () => {
  it("rejects relevance outside 1–5", () => {
    expect(
      quizJudgeOutputSchema.safeParse({
        setCoverage: 4,
        notes: "",
        questions: [],
      }).success,
    ).toBe(true);
    expect(quizJudgeOutputSchema.safeParse({ setCoverage: 9, notes: "", questions: [] }).success).toBe(false);
  });

  it("marks invalid judge output as not_run after one retry", async () => {
    const quiz = fixtureQuiz({ excerpt: "Ports are interfaces the core depends on" });
    const result = await evaluateSemantic({
      quiz,
      snapshot: "Ports are interfaces the core depends on",
      caseId: "c1",
      topic: quiz.topic,
      expectedBehavior: "valid-grounded-quiz",
      judge: {
        evaluate: async () => ({ bad: true }) as never,
      },
    });
    expect(result.notRunDetail).toBe("judge-invalid");
    expect(result.judge).toBeUndefined();
  });
});
