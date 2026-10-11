import { CreateQuizUseCase, StartAttemptUseCase, SubmitQuizUseCase } from "@ai-quiz/application";
import type { PrismaClient } from "../../../src/generated/prisma/client";
import { FixedGenerationAdapter } from "../../../src/quiz/fixture/fixed-generation.adapter";
import { FixedSourceAdapter } from "../../../src/quiz/fixture/fixed-source.adapter";
import { PrismaUnitOfWork } from "../../../src/quiz/persistence/prisma-unit-of-work";
import { QuizPrismaRepository } from "../../../src/quiz/persistence/quiz.prisma-repository";
import { hashAttemptToken, mintAttemptToken } from "../../../src/attempt/http/attempt-token";

export const CREATE_BODY = {
  topic: "Hexagonal architecture",
  sourceUrl: "https://example.com/README.md",
  questionCount: 5,
  strategy: "balanced" as const,
};

export function createQuizUseCase(prisma: PrismaClient): CreateQuizUseCase {
  return new CreateQuizUseCase(
    new FixedSourceAdapter(),
    new FixedGenerationAdapter(),
    PrismaUnitOfWork.fromClient(prisma),
  );
}

export async function persistFixtureQuiz(prisma: PrismaClient, questionCount = 5) {
  return createQuizUseCase(prisma).execute({ ...CREATE_BODY, questionCount });
}

export async function startFixtureAttempt(prisma: PrismaClient, quizId: string) {
  const token = mintAttemptToken();
  const started = await new StartAttemptUseCase(
    new QuizPrismaRepository(prisma),
    PrismaUnitOfWork.fromClient(prisma),
  ).execute({
    quizId,
    tokenHash: hashAttemptToken(token),
  });
  return { ...started, token, tokenHash: hashAttemptToken(token) };
}

export function submitUseCase(prisma: PrismaClient): SubmitQuizUseCase {
  return new SubmitQuizUseCase(PrismaUnitOfWork.fromClient(prisma));
}
