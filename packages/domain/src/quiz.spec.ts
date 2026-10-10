import { DomainError } from "./errors.js";
import type { Option, Question, Quiz } from "./quiz.js";
import { validateQuiz } from "./quiz.js";

function fourOptions(correct: number | number[], prefix = "o"): Option[] {
  const correctSet = new Set(Array.isArray(correct) ? correct : [correct]);
  return [0, 1, 2, 3].map((position) => ({
    id: `${prefix}-${position}`,
    position,
    label: `${prefix} label ${position}`,
    isCorrect: correctSet.has(position),
  }));
}

function validQuestion(index: number, type: "single" | "multiple" = "single"): Question {
  return {
    id: `q${index}`,
    position: index,
    prompt: `Prompt ${index}`,
    type,
    options: fourOptions(type === "single" ? 0 : [0, 1], `q${index}`),
  };
}

function validQuiz(count = 5): Quiz {
  return {
    id: "quiz-1",
    topic: "Ports and adapters",
    sourceUrl: "https://example.com/README.md",
    questions: Array.from({ length: count }, (_, index) => validQuestion(index)),
  };
}

function expectCode(run: () => void, code: string): void {
  expect(run).toThrow(DomainError);
  try {
    run();
  } catch (error) {
    expect(error).toMatchObject({ code });
  }
}

describe("validateQuiz", () => {
  it("accepts a 5-question and an 8-question quiz", () => {
    expect(() => validateQuiz(validQuiz(5))).not.toThrow();
    expect(() => validateQuiz(validQuiz(8))).not.toThrow();
  });

  it("rejects fewer than 5 or more than 8 questions", () => {
    expectCode(() => validateQuiz(validQuiz(4)), "QUIZ_INVALID");
    expectCode(() => validateQuiz(validQuiz(9)), "QUIZ_INVALID");
  });

  it("rejects a question that does not have exactly four options", () => {
    const quiz = validQuiz();
    quiz.questions[0]!.options = quiz.questions[0]!.options.slice(0, 3);
    expectCode(() => validateQuiz(quiz), "QUIZ_INVALID");
  });

  it("rejects duplicate option identities or labels", () => {
    const byId = validQuiz();
    byId.questions[0]!.options[1]!.id = byId.questions[0]!.options[0]!.id;
    expectCode(() => validateQuiz(byId), "QUIZ_INVALID");

    const byLabel = validQuiz();
    byLabel.questions[0]!.options[1]!.label = byLabel.questions[0]!.options[0]!.label;
    expectCode(() => validateQuiz(byLabel), "QUIZ_INVALID");
  });

  it("rejects single-answer questions with several marked-correct options", () => {
    const quiz = validQuiz();
    quiz.questions[0]!.options[1]!.isCorrect = true;
    expectCode(() => validateQuiz(quiz), "QUIZ_INVALID");
  });

  it("rejects multiple-answer questions with zero correct options", () => {
    const quiz = validQuiz();
    quiz.questions[0]!.type = "multiple";
    quiz.questions[0]!.options = fourOptions([], "q0");
    expectCode(() => validateQuiz(quiz), "QUIZ_INVALID");
  });

  it("rejects non-contiguous or colliding question positions", () => {
    const quiz = validQuiz();
    quiz.questions[1]!.position = 0;
    expectCode(() => validateQuiz(quiz), "QUIZ_INVALID");
  });

  it("rejects empty prompt or label after trim", () => {
    const emptyPrompt = validQuiz();
    emptyPrompt.questions[0]!.prompt = "   ";
    expectCode(() => validateQuiz(emptyPrompt), "QUIZ_INVALID");

    const emptyLabel = validQuiz();
    emptyLabel.questions[0]!.options[0]!.label = " ";
    expectCode(() => validateQuiz(emptyLabel), "QUIZ_INVALID");
  });
});
