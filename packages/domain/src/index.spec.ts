import { scoreSingleChoice, validateQuiz } from "./index.js";
import type { Quiz } from "./index.js";

describe("domain public API", () => {
  it("exports scoring and quiz validation", () => {
    const quiz: Quiz = {
      id: "quiz-1",
      topic: "API",
      sourceUrl: "https://example.com/README.md",
      questions: [0, 1, 2, 3, 4].map((index) => ({
        id: `q${index}`,
        position: index,
        prompt: `P${index}`,
        type: "single",
        options: [0, 1, 2, 3].map((position) => ({
          id: `q${index}-${position}`,
          position,
          label: `L${position}`,
          isCorrect: position === 0,
        })),
      })),
    };
    expect(() => validateQuiz(quiz)).not.toThrow();
    expect(scoreSingleChoice(quiz.questions[0]!, ["q0-0"])).toBe(4);
  });
});
