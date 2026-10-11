import type { Quiz } from "@ai-quiz/domain";
import type { CheckResult } from "../experiment/types.js";

export function evaluateDuplicates(quiz: Quiz): CheckResult {
  const seen = new Set<string>();
  for (const question of quiz.questions) {
    const key = question.prompt.trim().toLocaleLowerCase();
    if (seen.has(key)) {
      return { name: "duplicates", passed: false, detail: `duplicate prompt: ${question.prompt}` };
    }
    seen.add(key);
  }
  return { name: "duplicates", passed: true, detail: "" };
}
