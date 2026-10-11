import { Injectable } from "@nestjs/common";
import type { UnitOfWorkPort, UnitOfWorkRepos } from "@ai-quiz/domain";
import { PrismaService } from "../../../../../infrastructure/prisma.service";
import type { PrismaClient } from "../../../../../generated/prisma/client";
import { AttemptPrismaRepository } from "./attempt.prisma-repository";
import { QuizPrismaRepository } from "./quiz.prisma-repository";

@Injectable()
export class PrismaUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly prisma: PrismaService) {}

  /** Allow tests to construct with a plain PrismaClient. */
  static fromClient(prisma: PrismaClient): PrismaUnitOfWork {
    return new PrismaUnitOfWork(prisma as PrismaService);
  }

  transaction<T>(fn: (repos: UnitOfWorkRepos) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => {
      const repos: UnitOfWorkRepos = {
        quizzes: new QuizPrismaRepository(tx),
        attempts: new AttemptPrismaRepository(tx),
      };
      return fn(repos);
    });
  }
}
