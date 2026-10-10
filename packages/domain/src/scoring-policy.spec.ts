import { DomainError } from "./errors.js";
import type { Option, Question } from "./quiz.js";
import {
  MULTIPLE_CHOICE_POLICY_NOTE,
  scoreMultipleChoice,
  scoreQuestion,
  scoreSingleChoice,
} from "./scoring-policy.js";

function options(correct: number | number[]): Option[] {
  const correctSet = new Set(Array.isArray(correct) ? correct : [correct]);
  return [0, 1, 2, 3].map((position) => ({
    id: `opt-${position}`,
    position,
    label: `Choice ${position}`,
    isCorrect: correctSet.has(position),
  }));
}

function singleQuestion(): Question {
  return {
    id: "q-single",
    position: 0,
    prompt: "Pick one",
    type: "single",
    options: options(1),
  };
}

function multipleQuestion(correct: number[]): Question {
  return {
    id: "q-multi",
    position: 0,
    prompt: "Pick some",
    type: "multiple",
    options: options(correct),
  };
}

describe("scoreSingleChoice", () => {
  it("awards 4 when the selected option is the correct one", () => {
    expect(scoreSingleChoice(singleQuestion(), ["opt-1"])).toBe(4);
  });

  it("awards 0 when a legal selection is not the correct option", () => {
    expect(scoreSingleChoice(singleQuestion(), ["opt-0"])).toBe(0);
  });
});

describe("scoreMultipleChoice", () => {
  it("awards k when k correct options are selected and no others", () => {
    const question = multipleQuestion([0, 1, 2]);
    expect(scoreMultipleChoice(question, ["opt-0"])).toBe(1);
    expect(scoreMultipleChoice(question, ["opt-0", "opt-1"])).toBe(2);
    expect(scoreMultipleChoice(question, ["opt-0", "opt-1", "opt-2"])).toBe(3);
  });

  it("does not subtract for extra incorrect selections", () => {
    const question = multipleQuestion([0, 1]);
    expect(scoreMultipleChoice(question, ["opt-0", "opt-1", "opt-2"])).toBe(2);
  });

  it("does not normalize a partial correct set to 4", () => {
    const question = multipleQuestion([0, 1, 2]);
    expect(scoreMultipleChoice(question, ["opt-0", "opt-1", "opt-2"])).toBe(3);
  });

  it("reaches 4 only when all four options are correct and selected", () => {
    const question = multipleQuestion([0, 1, 2, 3]);
    expect(scoreMultipleChoice(question, ["opt-0", "opt-1", "opt-2", "opt-3"])).toBe(4);
  });

  it("awards 0 when only incorrect options are selected", () => {
    expect(scoreMultipleChoice(multipleQuestion([0, 1]), ["opt-2"])).toBe(0);
  });
});

describe("MULTIPLE_CHOICE_POLICY_NOTE", () => {
  it("documents the provisional roadmap reading", () => {
    expect(MULTIPLE_CHOICE_POLICY_NOTE).toMatch(/provisional/i);
    expect(MULTIPLE_CHOICE_POLICY_NOTE).toMatch(/did not specify penalties/i);
    expect(MULTIPLE_CHOICE_POLICY_NOTE).toMatch(/normalization|normalized|rescaled/i);
    expect(MULTIPLE_CHOICE_POLICY_NOTE).toMatch(/replaced/i);
    expect(MULTIPLE_CHOICE_POLICY_NOTE).toMatch(/weighting/i);
  });
});

describe("scoreQuestion", () => {
  it("dispatches single and multiple without mixing rubrics", () => {
    expect(scoreQuestion(singleQuestion(), ["opt-1"])).toBe(4);
    expect(scoreQuestion(multipleQuestion([0, 1]), ["opt-0"])).toBe(1);
  });

  it("rejects unknown option ids", () => {
    expect(() => scoreSingleChoice(singleQuestion(), ["nope"])).toThrow(DomainError);
    try {
      scoreSingleChoice(singleQuestion(), ["nope"]);
    } catch (error) {
      expect(error).toMatchObject({ code: "SELECTION_ILLEGAL" });
    }
  });
});
