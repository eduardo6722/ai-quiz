import { evaluateScoringInvariant } from "./scoring-invariant.js";

describe("scoring invariant", () => {
  it("matches the Phase 1 hand sample without calling a judge", () => {
    expect(evaluateScoringInvariant()).toEqual({ name: "scoringInvariant", passed: true, detail: "" });
  });
});
