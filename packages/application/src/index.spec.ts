import { gradeAttempt } from "./index.js";
import type { Quiz } from "@ai-quiz/domain";

describe("application public API", () => {
  it("exports gradeAttempt composed from domain", () => {
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
    const output = gradeAttempt({
      quiz,
      answers: quiz.questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds: [`${question.id}-0`],
      })),
    });
    expect(output.result.weightedScore).toBe(4);
  });
});
