import { publicResultSchema } from "./public-result.js";

function question(index: number) {
  return {
    id: `q${index}`,
    position: index,
    type: "single" as const,
    rawScore: 4,
    selectedOptionIds: [`q${index}-0`],
    options: [0, 1, 2, 3].map((position) => ({
      id: `q${index}-${position}`,
      position,
      label: `Label ${position}`,
      isCorrect: position === 0,
    })),
  };
}

describe("publicResultSchema", () => {
  it("requires scores, display fields, and isCorrect", () => {
    const parsed = publicResultSchema.parse({
      attemptId: "att-1",
      quizId: "quiz-1",
      weightedScore: 4,
      weightedScoreDisplay: 4,
      percentageDisplay: 100,
      questions: [0, 1, 2, 3, 4].map(question),
    });
    expect(parsed.questions[0]?.options[0]?.isCorrect).toBe(true);
    expect(parsed.questions[0]?.rawScore).toBe(4);
  });

  it("rejects a result option without isCorrect", () => {
    const questions = [0, 1, 2, 3, 4].map(question);
    const original = questions[0]!.options[0]!;
    questions[0]!.options[0] = {
      id: original.id,
      position: original.position,
      label: original.label,
    } as (typeof questions)[0]["options"][0];
    expect(() =>
      publicResultSchema.parse({
        attemptId: "att-1",
        quizId: "quiz-1",
        weightedScore: 4,
        weightedScoreDisplay: 4,
        percentageDisplay: 100,
        questions,
      }),
    ).toThrow();
  });
});
