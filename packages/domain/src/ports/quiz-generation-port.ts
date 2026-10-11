import type { Question } from "../quiz.js";

export type GenerateQuizInput = {
  topic: string;
  sourceText: string;
  count: number;
  strategy: "balanced";
};

export type QuizGenerationPort = {
  generate(input: GenerateQuizInput): Promise<Question[]>;
};
