import { Module } from "@nestjs/common";
import {
  CreateQuizUseCase,
  GetQuizResultUseCase,
  GetQuizUseCase,
  StartAttemptUseCase,
  SubmitQuizUseCase,
} from "@ai-quiz/application";
import type {
  AttemptRepositoryPort,
  MarkdownSourcePort,
  QuizGenerationPort,
  QuizRepositoryPort,
  TelemetryPort,
  UnitOfWorkPort,
} from "@ai-quiz/domain";
import { AttemptController } from "../attempt/http/attempt.controller";
import { AttemptPrismaRepository } from "../attempt/persistence/attempt.prisma-repository";
import { parseApiEnv } from "../platform/config/env";
import { PrismaService } from "../platform/persistence/prisma.service";
import { OpenAiQuizGenerationAdapter } from "./generation/openai-quiz-generation.adapter";
import { CreateQuizLimiter } from "./http/create-quiz-limiter";
import { QuizController } from "./http/quiz.controller";
import { PrismaUnitOfWork } from "./persistence/prisma-unit-of-work";
import { QuizPrismaRepository } from "./persistence/quiz.prisma-repository";
import { defaultFetchTransport, type FetchTransport } from "./source/fetch-transport";
import { HttpsMarkdownSourceAdapter } from "./source/https-markdown-source.adapter";
import { LangfuseTelemetryAdapter } from "./telemetry/langfuse-telemetry.adapter";
import { NoOpTelemetryPort } from "./telemetry/noop-telemetry.adapter";
import {
  ATTEMPT_REPOSITORY_PORT,
  FETCH_TRANSPORT,
  MARKDOWN_SOURCE_PORT,
  QUIZ_GENERATION_PORT,
  QUIZ_REPOSITORY_PORT,
  TELEMETRY_PORT,
  UNIT_OF_WORK_PORT,
} from "./quiz.tokens";

function telemetryFromEnv(): TelemetryPort {
  const env = parseApiEnv(process.env);
  const publicKey = env.LANGFUSE_PUBLIC_KEY?.trim() ?? "";
  const secretKey = env.LANGFUSE_SECRET_KEY?.trim() ?? "";
  if (publicKey.length === 0 || secretKey.length === 0) {
    return new NoOpTelemetryPort();
  }
  return new LangfuseTelemetryAdapter({
    publicKey,
    secretKey,
    baseUrl: env.LANGFUSE_BASE_URL?.trim() || undefined,
    promptVersion: env.PROMPT_VERSION?.trim() || undefined,
  });
}

@Module({
  controllers: [QuizController, AttemptController],
  providers: [
    { provide: CreateQuizLimiter, useFactory: () => new CreateQuizLimiter() },
    { provide: FETCH_TRANSPORT, useFactory: () => defaultFetchTransport() },
    {
      provide: MARKDOWN_SOURCE_PORT,
      useFactory: (transport: FetchTransport) => new HttpsMarkdownSourceAdapter(transport),
      inject: [FETCH_TRANSPORT],
    },
    {
      provide: QUIZ_GENERATION_PORT,
      useFactory: () => {
        const env = parseApiEnv(process.env);
        return new OpenAiQuizGenerationAdapter({
          apiKey: env.OPENAI_API_KEY,
          modelId: env.OPENAI_MODEL,
        });
      },
    },
    { provide: TELEMETRY_PORT, useFactory: telemetryFromEnv },
    {
      provide: QUIZ_REPOSITORY_PORT,
      useFactory: (prisma: PrismaService) => new QuizPrismaRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: ATTEMPT_REPOSITORY_PORT,
      useFactory: (prisma: PrismaService) => new AttemptPrismaRepository(prisma),
      inject: [PrismaService],
    },
    { provide: UNIT_OF_WORK_PORT, useClass: PrismaUnitOfWork },
    {
      provide: CreateQuizUseCase,
      useFactory: (
        source: MarkdownSourcePort,
        generation: QuizGenerationPort,
        uow: UnitOfWorkPort,
        telemetry: TelemetryPort,
      ) => new CreateQuizUseCase(source, generation, uow, telemetry),
      inject: [MARKDOWN_SOURCE_PORT, QUIZ_GENERATION_PORT, UNIT_OF_WORK_PORT, TELEMETRY_PORT],
    },
    {
      provide: GetQuizUseCase,
      useFactory: (quizzes: QuizRepositoryPort) => new GetQuizUseCase(quizzes),
      inject: [QUIZ_REPOSITORY_PORT],
    },
    {
      provide: StartAttemptUseCase,
      useFactory: (quizzes: QuizRepositoryPort, uow: UnitOfWorkPort) =>
        new StartAttemptUseCase(quizzes, uow),
      inject: [QUIZ_REPOSITORY_PORT, UNIT_OF_WORK_PORT],
    },
    {
      provide: SubmitQuizUseCase,
      useFactory: (uow: UnitOfWorkPort) => new SubmitQuizUseCase(uow),
      inject: [UNIT_OF_WORK_PORT],
    },
    {
      provide: GetQuizResultUseCase,
      useFactory: (quizzes: QuizRepositoryPort, attempts: AttemptRepositoryPort) =>
        new GetQuizResultUseCase(quizzes, attempts),
      inject: [QUIZ_REPOSITORY_PORT, ATTEMPT_REPOSITORY_PORT],
    },
  ],
})
export class QuizModule {}
