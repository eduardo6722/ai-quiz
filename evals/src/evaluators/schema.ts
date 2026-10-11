import { validateQuiz, type Quiz } from "@ai-quiz/domain";
import type { CheckResult } from "../experiment/types.js";

export function evaluateSchema(quiz: Quiz): CheckResult {
  try {
    validateQuiz(quiz);
    return { name: "schema", passed: true, detail: "" };
  } catch (error) {
    return { name: "schema", passed: false, detail: error instanceof Error ? error.message : "invalid quiz" };
  }
}
