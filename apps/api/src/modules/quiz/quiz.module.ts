import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
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
  UnitOfWorkPort,
} from "@ai-quiz/domain";
import { parseApiEnv } from "../../infrastructure/env";
import { PrismaService } from "../../infrastructure/prisma.service";
import { AttemptController } from "./adapters/in/rest/attempt.controller";
import { HttpErrorFilter } from "./adapters/in/rest/http-error.filter";
import { QuizController } from "./adapters/in/rest/quiz.controller";
import { OpenAiQuizGenerationAdapter } from "./adapters/out/llm/openai-quiz-generation.adapter";
import { PrismaUnitOfWork } from "./adapters/out/prisma/prisma-unit-of-work";
import { AttemptPrismaRepository } from "./adapters/out/prisma/attempt.prisma-repository";
import { QuizPrismaRepository } from "./adapters/out/prisma/quiz.prisma-repository";
import { defaultFetchTransport, type FetchTransport } from "./adapters/out/source-fetch/fetch-transport";
import { HttpsMarkdownSourceAdapter } from "./adapters/out/source-fetch/https-markdown-source.adapter";
import {
  ATTEMPT_REPOSITORY_PORT,
  FETCH_TRANSPORT,
  MARKDOWN_SOURCE_PORT,
  QUIZ_GENERATION_PORT,
  QUIZ_REPOSITORY_PORT,
  UNIT_OF_WORK_PORT,
} from "./quiz.tokens";

@Module({
  controllers: [QuizController, AttemptController],
  providers: [
    { provide: APP_FILTER, useClass: HttpErrorFilter },
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
      ) => new CreateQuizUseCase(source, generation, uow),
      inject: [MARKDOWN_SOURCE_PORT, QUIZ_GENERATION_PORT, UNIT_OF_WORK_PORT],
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
