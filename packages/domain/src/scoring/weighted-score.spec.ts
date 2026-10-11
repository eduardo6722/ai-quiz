import {
  calculateWeightedScore,
  roundForDisplay,
  toPercentage,
  toPercentageDisplay,
} from "./weighted-score.js";

describe("calculateWeightedScore", () => {
  it("matches the isolated 4, 2, 0 hand sample", () => {
    const scores = [4, 2, 0];
    expect(4 * 1.0 + 2 * 1.1 + 0 * 1.21).toBe(6.2);
    expect(1.0 + 1.1 + 1.21).toBe(3.31);
    const expected =
      (4 * 1.1 ** 0 + 2 * 1.1 ** 1 + 0 * 1.1 ** 2) / (1.1 ** 0 + 1.1 ** 1 + 1.1 ** 2);
    expect(calculateWeightedScore(scores)).toBe(expected);
  });

  it("equals 4 when every score is 4 on playable lengths 5 and 8", () => {
    expect(calculateWeightedScore([4, 4, 4, 4, 4])).toBe(4);
    expect(calculateWeightedScore([4, 4, 4, 4, 4, 4, 4, 4])).toBe(4);
  });

  it("equals 0 when every score is 0", () => {
    expect(calculateWeightedScore([0, 0, 0, 0, 0])).toBe(0);
  });

  it("uses 1.1 ** 7 for index 7 on an eight-score list", () => {
    const scores = [0, 0, 0, 0, 0, 0, 0, 4];
    const weights = scores.map((_, index) => 1.1 ** index);
    expect(weights[0]).toBe(1);
    expect(weights[7]).toBe(1.1 ** 7);
    const expected = (4 * (1.1 ** 7)) / weights.reduce((sum, weight) => sum + weight, 0);
    expect(calculateWeightedScore(scores)).toBe(expected);
  });

  it("changes when two positions are swapped even if raw scores are the same set", () => {
    const original = calculateWeightedScore([4, 0, 2, 0, 0]);
    const swapped = calculateWeightedScore([0, 4, 2, 0, 0]);
    expect(original).not.toBe(swapped);
  });
});

describe("display rounding", () => {
  it("rounds the 4, 2, 0 sample to 1.87 and 46.83 without changing the unrounded value", () => {
    const weightedScore = calculateWeightedScore([4, 2, 0]);
    expect(weightedScore).toBe(
      (4 * 1.1 ** 0 + 2 * 1.1 ** 1 + 0 * 1.1 ** 2) / (1.1 ** 0 + 1.1 ** 1 + 1.1 ** 2),
    );
    expect(roundForDisplay(weightedScore)).toBe(1.87);
    expect(roundForDisplay(toPercentage(weightedScore))).toBe(46.83);
    expect(toPercentageDisplay(weightedScore)).toBe(46.83);
  });
});
