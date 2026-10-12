import type { Option, Question, Quiz } from "./quiz.js";
import { validateQuiz } from "./quiz.js";
import { mixQuizOptionOrder } from "./mix-option-order.js";
import { scoreQuestion } from "../scoring/scoring-policy.js";
import { calculateWeightedScore } from "../scoring/weighted-score.js";

function fourOptions(correct: number | number[], prefix: string): Option[] {
  const correctSet = new Set(Array.isArray(correct) ? correct : [correct]);
  return [0, 1, 2, 3].map((position) => ({
    id: `${prefix}-${position}`,
    position,
    label: `${prefix} label ${position}`,
    isCorrect: correctSet.has(position),
  }));
}

function leadingKeySingles(id = "quiz-lead"): Quiz {
  return {
    id,
    topic: "Ports and adapters",
    sourceUrl: "https://example.com/README.md",
    questions: [0, 1, 2, 3, 4].map((index) => ({
      id: `${id}-q${index}`,
      position: index,
      prompt: `Prompt ${index}`,
      type: "single" as const,
      options: fourOptions(0, `${id}-q${index}`),
    })),
  };
}

function leadingBlockMultiples(id = "quiz-multi"): Quiz {
  return {
    id,
    topic: "Ports and adapters",
    sourceUrl: "https://example.com/README.md",
    questions: [0, 1, 2, 3, 4].map((index) => ({
      id: `${id}-q${index}`,
      position: index,
      prompt: `Multi prompt ${index}`,
      type: "multiple" as const,
      options: fourOptions([0, 1], `${id}-q${index}`),
    })),
  };
}

function quizWithAllFourCorrect(id = "quiz-all"): Quiz {
  const questions: Question[] = [0, 1, 2, 3].map((index) => ({
    id: `${id}-q${index}`,
    position: index,
    prompt: `Single prompt ${index}`,
    type: "single",
    options: fourOptions(0, `${id}-q${index}`),
  }));
  questions.push({
    id: `${id}-q4`,
    position: 4,
    prompt: "All four correct",
    type: "multiple",
    options: fourOptions([0, 1, 2, 3], `${id}-q4`),
  });
  return {
    id,
    topic: "Ports and adapters",
    sourceUrl: "https://example.com/README.md",
    questions,
  };
}

function alwaysFirstAnswers(quiz: Quiz) {
  return quiz.questions.map((question) => {
    const correctCount = question.options.filter((option) => option.isCorrect).length;
    const take = question.type === "single" ? 1 : correctCount;
    return {
      questionId: question.id,
      selectedOptionIds: question.options
        .filter((option) => option.position < take)
        .map((option) => option.id),
    };
  });
}

function trueKeyAnswers(quiz: Quiz) {
  return quiz.questions.map((question) => ({
    questionId: question.id,
    selectedOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
  }));
}

function weightedScore(quiz: Quiz, answers: ReturnType<typeof trueKeyAnswers>): number {
  const scores = quiz.questions.map((question, index) =>
    scoreQuestion(question, answers[index]!.selectedOptionIds),
  );
  return calculateWeightedScore(scores);
}

function pairingKey(question: Question): string[] {
  return [...question.options]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((option) => `${option.id}:${option.label}:${option.isCorrect}`);
}

function hasLeadingBlock(question: Question): boolean {
  const n = question.options.filter((option) => option.isCorrect).length;
  if (n < 2 || n > 3) {
    return false;
  }
  return question.options.every((option) => (option.position < n) === option.isCorrect);
}

describe("mixQuizOptionOrder", () => {
  it("accepts an unmixed leading-key quiz in validateQuiz", () => {
    expect(() => validateQuiz(leadingKeySingles())).not.toThrow();
  });

  it("keeps validateQuiz succeeding after mix and does not change question order", () => {
    const mixed = mixQuizOptionOrder(leadingKeySingles());
    expect(() => validateQuiz(mixed)).not.toThrow();
    expect(mixed.questions.map((question) => question.position)).toEqual([0, 1, 2, 3, 4]);
    expect(mixed.questions.map((question) => question.id)).toEqual([
      "quiz-lead-q0",
      "quiz-lead-q1",
      "quiz-lead-q2",
      "quiz-lead-q3",
      "quiz-lead-q4",
    ]);
  });

  it("keeps each option id/label/isCorrect pairing", () => {
    const original = leadingKeySingles();
    const mixed = mixQuizOptionOrder(original);
    for (const [index, question] of original.questions.entries()) {
      expect(pairingKey(mixed.questions[index]!)).toEqual(pairingKey(question));
    }
  });

  it("returns the same option arrays for the same quiz id", () => {
    const first = mixQuizOptionOrder(leadingKeySingles("stable-id"));
    const second = mixQuizOptionOrder(leadingKeySingles("stable-id"));
    expect(
      second.questions.map((question) => question.options.map((option) => option.id)),
    ).toEqual(first.questions.map((question) => question.options.map((option) => option.id)));
  });

  it("makes always-first score below 4 and true-key remain 4 on five leading-key singles", () => {
    const mixed = mixQuizOptionOrder(leadingKeySingles());
    expect(weightedScore(mixed, trueKeyAnswers(mixed))).toBe(4);
    expect(weightedScore(mixed, alwaysFirstAnswers(mixed))).toBeLessThan(4);
  });

  it("places correct options in at least two distinct display slots", () => {
    const mixed = mixQuizOptionOrder(leadingKeySingles());
    const slots = new Set(
      mixed.questions.flatMap((question) =>
        question.options.filter((option) => option.isCorrect).map((option) => option.position),
      ),
    );
    expect(slots.size).toBeGreaterThanOrEqual(2);
  });

  it("does not leave every 2-correct multiple as an unbroken leading block", () => {
    const mixed = mixQuizOptionOrder(leadingBlockMultiples());
    const blocked = mixed.questions.filter((question) => hasLeadingBlock(question));
    expect(blocked.length).toBeLessThan(mixed.questions.length);
  });

  it("still awards full credit to always-first on an all-four-correct question", () => {
    const mixed = mixQuizOptionOrder(quizWithAllFourCorrect());
    const allFour = mixed.questions[4]!;
    expect(allFour.options.every((option) => option.isCorrect)).toBe(true);
    expect(scoreQuestion(allFour, alwaysFirstAnswers(mixed)[4]!.selectedOptionIds)).toBe(4);
    expect(weightedScore(mixed, alwaysFirstAnswers(mixed))).toBeLessThan(
      weightedScore(mixed, trueKeyAnswers(mixed)),
    );
  });
});
