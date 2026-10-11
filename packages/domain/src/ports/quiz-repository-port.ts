import type { Quiz } from "../quiz.js";
import type { SourceSnapshot } from "./markdown-source-port.js";

export type QuizStatus = "generating" | "ready" | "failed";

export type QuizRecord = {
  quiz: Quiz;
  status: QuizStatus;
  sourceDocumentId: string;
  strategy: string;
};

export type InsertQuizInput = {
  source: SourceSnapshot;
  quiz: Quiz;
  strategy: string;
  status: "ready";
};

export type QuizRepositoryPort = {
  insert(input: InsertQuizInput): Promise<QuizRecord>;
  findById(id: string): Promise<QuizRecord | undefined>;
};
