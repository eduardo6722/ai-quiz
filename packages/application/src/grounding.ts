import type { Question } from "@ai-quiz/domain";
import { ApplicationError } from "./errors.js";

export function assertGrounded(questions: Question[], snapshotText: string): void {
  for (const question of questions) {
    const excerpt = question.sourceExcerpt?.trim() ?? "";
    if (excerpt.length === 0 || !snapshotText.includes(excerpt)) {
      throw new ApplicationError(
        "GENERATION_INVALID",
        "each question must include a source excerpt from the snapshot",
      );
    }
  }
}
