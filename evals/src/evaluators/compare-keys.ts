import type { Question } from "@ai-quiz/domain";
import type { QuestionJudgeOutput } from "../judge/output-schema.js";

export function generatedCorrectPositions(question: Question): number[] {
  return question.options.filter((option) => option.isCorrect).map((option) => option.position);
}

export function compareKeys(question: Question, verdict: QuestionJudgeOutput): {
  answerKeyMatch: boolean;
  blockingUnsupportedKey: boolean;
} {
  const generated = generatedCorrectPositions(question);
  const proposed = [...verdict.proposedCorrectPositions].sort((a, b) => a - b);
  const actual = [...generated].sort((a, b) => a - b);
  const answerKeyMatch = actual.length === proposed.length && actual.every((value, index) => value === proposed[index]);
  const unsupportedGenerated = generated.some((position) => {
    const support = verdict.optionSupport.find((item) => item.position === position);
    return support?.supportedBySource === false;
  });
  return {
    answerKeyMatch,
    blockingUnsupportedKey: !answerKeyMatch || unsupportedGenerated,
  };
}
