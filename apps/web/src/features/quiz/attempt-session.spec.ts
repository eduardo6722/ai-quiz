import {
  ensureOpenSitting,
  loadSitting,
  playerPath,
  resultsPath,
  saveSitting,
  sittingStorageKey,
} from "./attempt-session";

describe("attempt sitting", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("uses a quiz-scoped sessionStorage key and round-trips fields", () => {
    expect(sittingStorageKey("quiz-1")).toBe("ai-quiz.attempt.quiz-1");
    const sitting = {
      attemptId: "attempt-1",
      token: "secret-token-value",
      currentIndex: 2,
      selections: { q0: ["q0-a"] },
      status: "open" as const,
    };
    saveSitting("quiz-1", sitting);
    expect(loadSitting("quiz-1")).toEqual(sitting);
    expect(loadSitting("missing")).toBeNull();
  });

  it("does not put the token in player or results paths", () => {
    expect(playerPath("quiz-1")).toBe("/quiz/quiz-1");
    expect(resultsPath("quiz-1")).toBe("/quiz/quiz-1/results");
    expect(playerPath("quiz-1")).not.toContain("token");
    expect(resultsPath("quiz-1")).not.toMatch(/secret/);
  });

  it("starts at most once when two loads overlap", async () => {
    const start = jest.fn().mockImplementation(
      async () =>
        new Promise<{ attemptId: string; token: string }>((resolve) => {
          setTimeout(() => resolve({ attemptId: "attempt-1", token: "a".repeat(32) }), 20);
        }),
    );
    const [first, second] = await Promise.all([
      ensureOpenSitting("quiz-race", start),
      ensureOpenSitting("quiz-race", start),
    ]);
    expect(start).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(loadSitting("quiz-race")?.attemptId).toBe("attempt-1");
  });
});
