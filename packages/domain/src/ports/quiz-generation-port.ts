import type { Question } from "../quiz/quiz.js";

export type GenerateQuizInput = {
  topic: string;
  sourceText: string;
  count: number;
  strategy: "balanced";
};

export type GeneratedQuiz = {
  questions: Question[];
  modelId?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export type QuizGenerationPort = {
  generate(input: GenerateQuizInput): Promise<GeneratedQuiz>;
};
