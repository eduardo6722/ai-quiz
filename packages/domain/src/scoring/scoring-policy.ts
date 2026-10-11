import { DomainError } from "../errors.js";
import type { Question } from "../quiz/quiz.js";

export const MULTIPLE_CHOICE_POLICY_NOTE = [
  "Provisional multiple-answer policy from roadmap.md:",
  "award one point per correctly selected option, clamped to the inclusive range 0–4.",
  "Incorrect selections add nothing and subtract nothing (no invented penalties).",
  "A partial correct set is not normalized or rescaled to 4.",
  "The assessment did not specify penalties or whether a 1–3 correct set can reach 4;",
  "this isolated function can be replaced without changing quiz shape or weighting.",
].join(" ");

function uniqueBelongingOptions(question: Question, selectedOptionIds: string[]): string[] {
  if (new Set(selectedOptionIds).size !== selectedOptionIds.length) {
    throw new DomainError("SELECTION_ILLEGAL", "duplicate option id in selection");
  }
  for (const id of selectedOptionIds) {
    if (!question.options.some((option) => option.id === id)) {
      throw new DomainError("SELECTION_ILLEGAL", "selected option does not belong to the question");
    }
  }
  return selectedOptionIds;
}

export function scoreSingleChoice(question: Question, selectedOptionIds: string[]): number {
  if (question.type !== "single") {
    throw new DomainError("SELECTION_ILLEGAL", "scoreSingleChoice requires a single-answer question");
  }
  const selected = uniqueBelongingOptions(question, selectedOptionIds);
  if (selected.length !== 1) {
    throw new DomainError("SELECTION_ILLEGAL", "single-answer requires exactly one selection");
  }
  const option = question.options.find((item) => item.id === selected[0]);
  return option?.isCorrect ? 4 : 0;
}

export function scoreMultipleChoice(question: Question, selectedOptionIds: string[]): number {
  if (question.type !== "multiple") {
    throw new DomainError("SELECTION_ILLEGAL", "scoreMultipleChoice requires a multiple-answer question");
  }
  const selected = uniqueBelongingOptions(question, selectedOptionIds);
  if (selected.length < 1) {
    throw new DomainError("SELECTION_ILLEGAL", "multiple-answer requires at least one selection");
  }
  const correctSelected = selected.filter((id) =>
    question.options.some((option) => option.id === id && option.isCorrect),
  ).length;
  return Math.min(4, Math.max(0, correctSelected));
}

export function scoreQuestion(question: Question, selectedOptionIds: string[]): number {
  return question.type === "single"
    ? scoreSingleChoice(question, selectedOptionIds)
    : scoreMultipleChoice(question, selectedOptionIds);
}
