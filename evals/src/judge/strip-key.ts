import type { Question } from "@ai-quiz/domain";
import type { JudgeQuestionInput } from "./judge-port.js";

export function toJudgeInput(input: {
  caseId: string;
  topic: string;
  snapshot: string;
  questions: Question[];
}): { caseId: string; topic: string; snapshot: string; questions: JudgeQuestionInput[] } {
  return {
    caseId: input.caseId,
    topic: input.topic,
    snapshot: input.snapshot,
    questions: input.questions.map((question) => ({
      caseId: input.caseId,
      topic: input.topic,
      snapshot: input.snapshot,
      questionPosition: question.position,
      prompt: question.prompt,
      type: question.type,
      options: question.options.map((option) => ({ position: option.position, label: option.label })),
    })),
  };
}
