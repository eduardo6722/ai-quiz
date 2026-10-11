import { toPublicQuizView } from "@ai-quiz/application";
import type { Quiz } from "@ai-quiz/domain";
import type { CheckResult } from "../experiment/types.js";

export function evaluateLeakage(quiz: Quiz): CheckResult {
  const serialized = JSON.stringify(toPublicQuizView(quiz));
  if (serialized.includes("isCorrect") || serialized.includes("sourceExcerpt")) {
    return { name: "leakage", passed: false, detail: "public view leaked isCorrect or sourceExcerpt" };
  }
  return { name: "leakage", passed: true, detail: "" };
}
