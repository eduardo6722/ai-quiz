import { DomainError, type Quiz } from "@ai-quiz/domain";
import { publicResultSchema } from "@ai-quiz/contracts";
import { gradeAttempt } from "./grade-attempt.js";

function quiz(): Quiz {
  return {
    id: "quiz-1",
    topic: "Scoring",
    sourceUrl: "https://example.com/README.md",
    questions: [0, 1, 2, 3, 4].map((index) => ({
      id: `q${index}`,
      position: index,
      prompt: `Prompt ${index}`,
      type: index === 1 ? ("multiple" as const) : ("single" as const),
      options: [0, 1, 2, 3].map((position) => ({
        id: `q${index}-${position}`,
        position,
        label: `Label ${position}`,
        isCorrect: index === 1 ? position === 0 || position === 1 : position === 0,
      })),
    })),
  };
}

function completeAnswers() {
  return [
    { questionId: "q0", selectedOptionIds: ["q0-0"] },
    { questionId: "q1", selectedOptionIds: ["q1-0", "q1-1"] },
    { questionId: "q2", selectedOptionIds: ["q2-0"] },
    { questionId: "q3", selectedOptionIds: ["q3-0"] },
    { questionId: "q4", selectedOptionIds: ["q4-0"] },
  ];
}

describe("gradeAttempt", () => {
  it("scores a complete legal attempt and includes correctness", () => {
    const output = gradeAttempt({ quiz: quiz(), answers: completeAnswers() });
    expect(output.attempt.status).toBe("scored");
    const parsed = publicResultSchema.parse(output.result);
    expect(parsed.questions.some((question) => question.options.some((option) => option.isCorrect))).toBe(
      true,
    );
    expect(parsed.weightedScore).toBe(output.result.weightedScore);
  });

  it("returns the original result when submitted again with the same answers", () => {
    const first = gradeAttempt({ quiz: quiz(), answers: completeAnswers() });
    const second = gradeAttempt({
      quiz: quiz(),
      answers: completeAnswers(),
      attempt: first.attempt,
    });
    expect(second.result).toEqual(first.result);
  });

  it("ignores a different payload after scoring", () => {
    const first = gradeAttempt({ quiz: quiz(), answers: completeAnswers() });
    const wrong = completeAnswers().map((answer, index) =>
      index === 0 ? { ...answer, selectedOptionIds: ["q0-3"] } : answer,
    );
    const second = gradeAttempt({
      quiz: quiz(),
      answers: wrong,
      attempt: first.attempt,
    });
    expect(second.result.weightedScore).toBe(first.result.weightedScore);
    expect(second.result.questions[0]?.selectedOptionIds).toEqual(["q0-0"]);
  });

  it("rejects a frozen attempt when the caller passes a different quiz", () => {
    const first = gradeAttempt({ quiz: quiz(), answers: completeAnswers() });
    const other = quiz();
    other.id = "quiz-other";
    expect(() =>
      gradeAttempt({
        quiz: other,
        answers: completeAnswers(),
        attempt: first.attempt,
      }),
    ).toThrow(DomainError);
    try {
      gradeAttempt({
        quiz: other,
        answers: completeAnswers(),
        attempt: first.attempt,
      });
    } catch (error) {
      expect(error).toMatchObject({ code: "QUIZ_INVALID" });
    }
  });

  it("keeps stored answer keys when the same quiz id is passed with flipped correctness", () => {
    const first = gradeAttempt({ quiz: quiz(), answers: completeAnswers() });
    const mutated = quiz();
    for (const question of mutated.questions) {
      for (const option of question.options) {
        option.isCorrect = !option.isCorrect;
      }
    }
    const second = gradeAttempt({
      quiz: mutated,
      answers: completeAnswers(),
      attempt: first.attempt,
    });
    expect(second.result.questions.map((question) => question.options.map((option) => option.isCorrect))).toEqual(
      first.result.questions.map((question) => question.options.map((option) => option.isCorrect)),
    );
    expect(second.result.weightedScore).toBe(first.result.weightedScore);
  });

  it("rejects incomplete answers without a result", () => {
    expect(() =>
      gradeAttempt({
        quiz: quiz(),
        answers: completeAnswers().slice(0, 4),
      }),
    ).toThrow(DomainError);
    try {
      gradeAttempt({ quiz: quiz(), answers: completeAnswers().slice(0, 4) });
    } catch (error) {
      expect(error).toMatchObject({ code: "ATTEMPT_INCOMPLETE" });
    }
  });
});
