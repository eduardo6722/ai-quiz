import type { PrismaClient } from "../../../../../generated/prisma/client";

export type DbClient = {
  sourceDocument: PrismaClient["sourceDocument"];
  quiz: PrismaClient["quiz"];
  question: PrismaClient["question"];
  questionOption: PrismaClient["questionOption"];
  quizAttempt: PrismaClient["quizAttempt"];
  attemptAnswer: PrismaClient["attemptAnswer"];
  attemptAnswerSelection: PrismaClient["attemptAnswerSelection"];
  $queryRaw: PrismaClient["$queryRaw"];
};

export const quizInclude = {
  sourceDocument: true,
  questions: { include: { options: true } },
} as const;
