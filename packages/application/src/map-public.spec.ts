import { DomainError, scoreAttempt, type Attempt, type Quiz } from "@ai-quiz/domain";
import { publicQuizViewSchema, publicResultSchema } from "@ai-quiz/contracts";
import { toPublicQuizView, toPublicResult } from "./map-public.js";

function quiz(): Quiz {
  return {
    id: "quiz-1",
    topic: "Hexagonal architecture",
    sourceUrl: "https://example.com/README.md",
    questions: [0, 1, 2, 3, 4].map((index) => ({
      id: `q${index}`,
      position: index,
      prompt: `Prompt ${index}`,
      type: "single" as const,
      options: [0, 1, 2, 3].map((position) => ({
        id: `q${index}-${position}`,
        position,
        label: `Label ${position}`,
        isCorrect: position === 0,
      })),
    })),
  };
}

function completeAnswers() {
  return [0, 1, 2, 3, 4].map((index) => ({
    questionId: `q${index}`,
    selectedOptionIds: [`q${index}-0`],
  }));
}

describe("toPublicQuizView", () => {
  it("omits correctness flags and passes the public quiz schema", () => {
    const view = toPublicQuizView(quiz());
    expect(JSON.stringify(view)).not.toContain("isCorrect");
    expect(publicQuizViewSchema.parse(view).questions).toHaveLength(5);
  });
});

describe("toPublicResult", () => {
  it("fails when the attempt is still open", () => {
    const open: Attempt = { id: "att-1", quizId: "quiz-1", status: "open" };
    expect(() => toPublicResult(quiz(), open)).toThrow(DomainError);
    try {
      toPublicResult(quiz(), open);
    } catch (error) {
      expect(error).toMatchObject({ code: "ATTEMPT_NOT_SCORED" });
    }
  });

  it("includes per-question scores and which options were correct", () => {
    const model = quiz();
    const scored: Attempt = {
      id: "att-1",
      quizId: model.id,
      status: "scored",
      result: scoreAttempt(model, completeAnswers()),
    };
    const result = toPublicResult(model, scored);
    expect(publicResultSchema.parse(result).questions[0]?.options.some((option) => option.isCorrect)).toBe(
      true,
    );
    expect(result.weightedScore).toBe(4);
  });

  it("rejects mapping a scored attempt onto a different quiz", () => {
    const model = quiz();
    const scored: Attempt = {
      id: "att-1",
      quizId: model.id,
      status: "scored",
      result: scoreAttempt(model, completeAnswers()),
    };
    const other = quiz();
    other.id = "quiz-other";
    expect(() => toPublicResult(other, scored)).toThrow(DomainError);
    try {
      toPublicResult(other, scored);
    } catch (error) {
      expect(error).toMatchObject({ code: "QUIZ_INVALID" });
    }
  });

  it("does not remap answer keys from a live quiz with extra questions", () => {
    const model = quiz();
    const scored: Attempt = {
      id: "att-1",
      quizId: model.id,
      status: "scored",
      result: scoreAttempt(model, completeAnswers()),
    };
    const extra = quiz();
    extra.questions = [
      ...extra.questions,
      {
        id: "q-extra",
        position: 5,
        prompt: "Extra",
        type: "single",
        options: [0, 1, 2, 3].map((position) => ({
          id: `q-extra-${position}`,
          position,
          label: `Extra ${position}`,
          isCorrect: position === 0,
        })),
      },
    ];
    const result = toPublicResult(extra, scored);
    expect(result.questions).toHaveLength(5);
    expect(result.questions.some((question) => question.id === "q-extra")).toBe(false);
    expect(result.questions[0]?.options[0]?.isCorrect).toBe(true);
  });
});
