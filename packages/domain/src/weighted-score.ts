export function calculateWeightedScore(scores: number[]): number {
  if (scores.length === 0) {
    throw new Error("scores must be a non-empty ordered list");
  }
  let weightedSum = 0;
  let weightSum = 0;
  for (let index = 0; index < scores.length; index += 1) {
    const weight = 1.1 ** index;
    weightedSum += scores[index]! * weight;
    weightSum += weight;
  }
  return weightedSum / weightSum;
}

/** Ordinary half-up to two decimals for non-negative 0–4 scores. */
export function roundForDisplay(value: number): number {
  return Math.round(value * 100) / 100;
}

export function toPercentage(weightedScore: number): number {
  return (weightedScore / 4) * 100;
}

export function toPercentageDisplay(weightedScore: number): number {
  return roundForDisplay(toPercentage(weightedScore));
}
