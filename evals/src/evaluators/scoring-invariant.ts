import {
  calculateWeightedScore,
  scoreQuestion,
  type Question,
} from "@ai-quiz/domain";
import type { CheckResult } from "../experiment/types.js";

function question(type: "single" | "multiple", correct: number[]): Question {
  return {
    id: "q",
    position: 0,
    prompt: "p",
    type,
    options: [0, 1, 2, 3].map((position) => ({
      id: `o${position}`,
      position,
      label: `L${position}`,
      isCorrect: correct.includes(position),
    })),
  };
}

export function evaluateScoringInvariant(): CheckResult {
  const single = question("single", [0]);
  if (scoreQuestion(single, ["o0"]) !== 4 || scoreQuestion(single, ["o1"]) !== 0) {
    return { name: "scoringInvariant", passed: false, detail: "single-answer 4/0 failed" };
  }
  const multiple = question("multiple", [0, 1]);
  if (scoreQuestion(multiple, ["o0"]) !== 1) {
    return { name: "scoringInvariant", passed: false, detail: "multi-select one-point policy failed" };
  }
  const expected =
    (4 * 1.1 ** 0 + 2 * 1.1 ** 1 + 0 * 1.1 ** 2) / (1.1 ** 0 + 1.1 ** 1 + 1.1 ** 2);
  if (calculateWeightedScore([4, 2, 0]) !== expected) {
    return { name: "scoringInvariant", passed: false, detail: "weighted [4,2,0] sample drifted" };
  }
  if (calculateWeightedScore([4, 4, 4, 4, 4]) !== 4 || calculateWeightedScore([0, 0, 0, 0, 0]) !== 0) {
    return { name: "scoringInvariant", passed: false, detail: "all-4 or all-0 drifted" };
  }
  const eight = [0, 0, 0, 0, 0, 0, 0, 4];
  const weights = eight.map((_, index) => 1.1 ** index);
  const index7 = (4 * (1.1 ** 7)) / weights.reduce((sum, weight) => sum + weight, 0);
  if (calculateWeightedScore(eight) !== index7) {
    return { name: "scoringInvariant", passed: false, detail: "index-7 weight drifted" };
  }
  return { name: "scoringInvariant", passed: true, detail: "" };
}
