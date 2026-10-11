import { isFullyCorrectQuestion } from "./question-outcome";

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
