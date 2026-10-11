import {
  describeAnswerComparison,
  isFullyCorrectQuestion,
  joinEnglishList,
  optionReviewState,
} from "./question-outcome";

describe("isFullyCorrectQuestion", () => {
  it("is true for a single-answer question with the correct option selected", () => {
    expect(
      isFullyCorrectQuestion({
        selectedOptionIds: ["a"],
        options: [
          { id: "a", isCorrect: true },
          { id: "b", isCorrect: false },
          { id: "c", isCorrect: false },
          { id: "d", isCorrect: false },
        ],
      }),
    ).toBe(true);
  });

  it("is false for a single-answer question with a wrong option selected", () => {
    expect(
      isFullyCorrectQuestion({
        selectedOptionIds: ["b"],
        options: [
          { id: "a", isCorrect: true },
          { id: "b", isCorrect: false },
          { id: "c", isCorrect: false },
          { id: "d", isCorrect: false },
        ],
      }),
    ).toBe(false);
  });

  it("is true when every correct multi-select option is selected and nothing extra", () => {
    expect(
      isFullyCorrectQuestion({
        selectedOptionIds: ["pnpm", "turbo"],
        options: [
          { id: "pnpm", isCorrect: true },
          { id: "turbo", isCorrect: true },
          { id: "npm", isCorrect: false },
          { id: "lerna", isCorrect: false },
        ],
      }),
    ).toBe(true);
  });

  it("is false when a multi-select answer misses a correct option", () => {
    expect(
      isFullyCorrectQuestion({
        selectedOptionIds: ["pnpm"],
        options: [
          { id: "pnpm", isCorrect: true },
          { id: "turbo", isCorrect: true },
          { id: "npm", isCorrect: false },
          { id: "lerna", isCorrect: false },
        ],
      }),
    ).toBe(false);
  });

  it("is false when a multi-select answer includes an extra incorrect option", () => {
    expect(
      isFullyCorrectQuestion({
        selectedOptionIds: ["pnpm", "turbo", "npm"],
        options: [
          { id: "pnpm", isCorrect: true },
          { id: "turbo", isCorrect: true },
          { id: "npm", isCorrect: false },
          { id: "lerna", isCorrect: false },
        ],
      }),
    ).toBe(false);
  });
});

describe("optionReviewState", () => {
  it("keeps selection and correctness as independent states", () => {
    expect(optionReviewState(true, true)).toBe("selected-correct");
    expect(optionReviewState(true, false)).toBe("selected-incorrect");
    expect(optionReviewState(false, true)).toBe("missed-correct");
    expect(optionReviewState(false, false)).toBe("unselected");
  });
});

describe("joinEnglishList", () => {
  it("joins two and many labels in readable English", () => {
    expect(joinEnglishList(["Domain"])).toBe("Domain");
    expect(joinEnglishList(["Domain", "Contracts"])).toBe("Domain and Contracts");
    expect(joinEnglishList(["Domain", "Application", "UI"])).toBe(
      "Domain, Application, and UI",
    );
  });
});

describe("describeAnswerComparison", () => {
  it("summarizes a partial multi-select with missed correct options", () => {
    expect(
      describeAnswerComparison({
        type: "multiple",
        selectedOptionIds: ["domain", "contracts"],
        options: [
          { id: "domain", label: "Domain", isCorrect: true },
          { id: "application", label: "Application", isCorrect: true },
          { id: "contracts", label: "Contracts", isCorrect: true },
          { id: "ui", label: "UI", isCorrect: true },
        ],
      }),
    ).toBe("You selected Domain and Contracts. You missed Application and UI.");
  });

  it("names the correct option on a wrong single-select", () => {
    expect(
      describeAnswerComparison({
        type: "single",
        selectedOptionIds: ["b"],
        options: [
          { id: "a", label: "setImmediate", isCorrect: true },
          { id: "b", label: "setTimeout", isCorrect: false },
          { id: "c", label: "setInterval", isCorrect: false },
          { id: "d", label: "process.nextTick", isCorrect: false },
        ],
      }),
    ).toBe("You selected setTimeout. The correct answer is setImmediate.");
  });

  it("returns null when the selection matches every correct option", () => {
    expect(
      describeAnswerComparison({
        type: "multiple",
        selectedOptionIds: ["a", "b"],
        options: [
          { id: "a", label: "Domain", isCorrect: true },
          { id: "b", label: "Contracts", isCorrect: true },
          { id: "c", label: "Helpers", isCorrect: false },
          { id: "d", label: "Utils", isCorrect: false },
        ],
      }),
    ).toBeNull();
  });
});
