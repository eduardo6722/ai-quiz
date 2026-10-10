import { applySelections, assertAttemptMatchesQuiz, scoreAttempt } from "./attempt.js";
import { DomainError } from "./errors.js";
import type { Option, Question, Quiz } from "./quiz.js";
import { calculateWeightedScore } from "./weighted-score.js";
import { scoreQuestion } from "./scoring-policy.js";

function fourOptions(correct: number | number[], prefix: string): Option[] {
  const correctSet = new Set(Array.isArray(correct) ? correct : [correct]);
  return [0, 1, 2, 3].map((position) => ({
    id: `${prefix}-${position}`,
    position,
    label: `${prefix} ${position}`,
    isCorrect: correctSet.has(position),
  }));
}

function mixedQuiz(): Quiz {
  const questions: Question[] = [
    {
      id: "q0",
      position: 0,
      prompt: "Single A",
      type: "single",
      options: fourOptions(1, "q0"),
    },
    {
      id: "q1",
      position: 1,
      prompt: "Multi B",
      type: "multiple",
      options: fourOptions([0, 1], "q1"),
    },
    {
      id: "q2",
      position: 2,
      prompt: "Single C",
      type: "single",
      options: fourOptions(0, "q2"),
    },
    {
      id: "q3",
      position: 3,
      prompt: "Multi D",
      type: "multiple",
      options: fourOptions([2], "q3"),
    },
    {
      id: "q4",
      position: 4,
      prompt: "Single E",
      type: "single",
      options: fourOptions(3, "q4"),
    },
  ];
  return {
    id: "quiz-mix",
    topic: "Mixed",
    sourceUrl: "https://example.com/README.md",
    questions,
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

describe("applySelections", () => {
  it("rejects a single-answer with no option or more than one option", () => {
    const quiz = mixedQuiz();
    const base = [
      { questionId: "q1", selectedOptionIds: ["q1-0"] },
      { questionId: "q2", selectedOptionIds: ["q2-0"] },
      { questionId: "q3", selectedOptionIds: ["q3-2"] },
      { questionId: "q4", selectedOptionIds: ["q4-3"] },
    ];
    expectCode(
      () => applySelections(quiz, [{ questionId: "q0", selectedOptionIds: [] }, ...base]),
      "SELECTION_ILLEGAL",
    );
    expectCode(
      () =>
        applySelections(quiz, [
          { questionId: "q0", selectedOptionIds: ["q0-1", "q0-2"] },
          ...base,
        ]),
      "SELECTION_ILLEGAL",
    );
  });

  it("rejects repeated options or options from another question", () => {
    const quiz = mixedQuiz();
    const answers = [
      { questionId: "q0", selectedOptionIds: ["q0-1", "q0-1"] },
      { questionId: "q1", selectedOptionIds: ["q1-0"] },
      { questionId: "q2", selectedOptionIds: ["q2-0"] },
      { questionId: "q3", selectedOptionIds: ["q3-2"] },
      { questionId: "q4", selectedOptionIds: ["q4-3"] },
    ];
    expectCode(() => applySelections(quiz, answers), "SELECTION_ILLEGAL");

    answers[0] = { questionId: "q0", selectedOptionIds: ["q1-0"] };
    expectCode(() => applySelections(quiz, answers), "SELECTION_ILLEGAL");
  });

  it("rejects unknown question ids", () => {
    const quiz = mixedQuiz();
    expectCode(
      () =>
        applySelections(quiz, [
          { questionId: "q0", selectedOptionIds: ["q0-1"] },
          { questionId: "q1", selectedOptionIds: ["q1-0"] },
          { questionId: "q2", selectedOptionIds: ["q2-0"] },
          { questionId: "q3", selectedOptionIds: ["q3-2"] },
          { questionId: "q4", selectedOptionIds: ["q4-3"] },
          { questionId: "nope", selectedOptionIds: ["q0-1"] },
        ]),
      "SELECTION_ILLEGAL",
    );
  });

  it("rejects incomplete attempts without producing a weighted score", () => {
    const quiz = mixedQuiz();
    expectCode(
      () =>
        applySelections(quiz, [
          { questionId: "q0", selectedOptionIds: ["q0-1"] },
          { questionId: "q1", selectedOptionIds: ["q1-0"] },
          { questionId: "q2", selectedOptionIds: ["q2-0"] },
          { questionId: "q3", selectedOptionIds: ["q3-2"] },
        ]),
      "ATTEMPT_INCOMPLETE",
    );
    expectCode(
      () =>
        scoreAttempt(quiz, [
          { questionId: "q0", selectedOptionIds: ["q0-1"] },
          { questionId: "q1", selectedOptionIds: ["q1-0"] },
          { questionId: "q2", selectedOptionIds: ["q2-0"] },
          { questionId: "q3", selectedOptionIds: ["q3-2"] },
        ]),
      "ATTEMPT_INCOMPLETE",
    );
  });

  it("accepts a legal wrong single selection for later scoring as 0", () => {
    const quiz = mixedQuiz();
    const selected = applySelections(quiz, [
      { questionId: "q0", selectedOptionIds: ["q0-0"] },
      { questionId: "q1", selectedOptionIds: ["q1-0"] },
      { questionId: "q2", selectedOptionIds: ["q2-0"] },
      { questionId: "q3", selectedOptionIds: ["q3-2"] },
      { questionId: "q4", selectedOptionIds: ["q4-3"] },
    ]);
    expect(scoreQuestion(quiz.questions[0]!, selected.get("q0") ?? [])).toBe(0);
  });
});

describe("assertAttemptMatchesQuiz", () => {
  it("rejects an attempt bound to a different quiz", () => {
    const quiz = mixedQuiz();
    expectCode(
      () =>
        assertAttemptMatchesQuiz({ id: "att-1", quizId: "other-quiz", status: "open" }, quiz),
      "QUIZ_INVALID",
    );
  });
});

describe("mixed quiz scoring", () => {
  it("scores each question with its own rule then weights by position", () => {
    const quiz = mixedQuiz();
    const answers = [
      { questionId: "q0", selectedOptionIds: ["q0-1"] },
      { questionId: "q1", selectedOptionIds: ["q1-0", "q1-1"] },
      { questionId: "q2", selectedOptionIds: ["q2-1"] },
      { questionId: "q3", selectedOptionIds: ["q3-2"] },
      { questionId: "q4", selectedOptionIds: ["q4-3"] },
    ];
    const result = scoreAttempt(quiz, answers);
    expect(result.questionScores.map((item) => item.rawScore)).toEqual([4, 2, 0, 1, 4]);
    expect(result.weightedScore).toBe(calculateWeightedScore([4, 2, 0, 1, 4]));
    expect(result.questions[0]?.options.map((option) => option.isCorrect)).toEqual([
      false,
      true,
      false,
      false,
    ]);
    expect(result.questions[0]?.selectedOptionIds).toEqual(["q0-1"]);
  });
});
