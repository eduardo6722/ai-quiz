import type { QuestionType } from "@ai-quiz/domain";
import type { QuizJudgeOutput } from "./output-schema.js";

export type JudgeQuestionInput = {
  caseId: string;
  topic: string;
  snapshot: string;
  questionPosition: number;
  prompt: string;
  type: QuestionType;
  options: { position: number; label: string }[];
};

export type JudgePort = {
  evaluate(input: { caseId: string; topic: string; snapshot: string; questions: JudgeQuestionInput[] }): Promise<QuizJudgeOutput>;
};
