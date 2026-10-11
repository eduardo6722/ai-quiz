import type { QuizGenerationPort } from "@ai-quiz/domain";
import { ApplicationError, CreateQuizUseCase, gradeAttempt } from "@ai-quiz/application";
import { FixedSourceAdapter } from "../../src/modules/quiz/adapters/out/fixture/fixed-source.adapter";
import { PrismaUnitOfWork } from "../../src/modules/quiz/adapters/out/prisma/prisma-unit-of-work";
import { QuizPrismaRepository } from "../../src/modules/quiz/adapters/out/prisma/quiz.prisma-repository";
import {
  CREATE_BODY,
  persistFixtureQuiz,
  startFixtureAttempt,
  submitUseCase,
} from "./create-fixture-quiz";
import { testPrisma } from "./postgres.setup";

describe("playable quiz immutability", () => {
  it("rejects duplicate option labels on the same question", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma);
    const record = await new QuizPrismaRepository(prisma).findById(created.id);
    if (record === undefined) {
      throw new Error("expected persisted quiz");
    }
    const question = record.quiz.questions[0]!;
    await expect(
      prisma.questionOption.create({
        data: {
          questionId: question.id,
          position: 4,
          label: question.options[0]!.label,
          isCorrect: false,
        },
      }),
    ).rejects.toThrow();
  });

  it("exposes insert and findById only on the quiz repository", () => {
    const names = Object.getOwnPropertyNames(QuizPrismaRepository.prototype);
    expect(names).toEqual(expect.arrayContaining(["insert", "findById"]));
    expect(names).not.toContain("update");
    expect(names).not.toContain("updateKeys");
    const repo = new QuizPrismaRepository(testPrisma());
    expect((repo as { update?: unknown }).update).toBeUndefined();
  });

  it("leaves no playable quiz when create fails validation", async () => {
    const prisma = testPrisma();
    const generation: QuizGenerationPort = {
      generate: async () => ({ questions: [] }),
    };
    await expect(
      new CreateQuizUseCase(
        new FixedSourceAdapter(),
        generation,
        PrismaUnitOfWork.fromClient(prisma),
      ).execute(CREATE_BODY),
    ).rejects.toBeInstanceOf(ApplicationError);
    expect(await prisma.quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("grades a second attempt on the original fixture the same way", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma);
    const record = await new QuizPrismaRepository(prisma).findById(created.id);
    if (record === undefined) {
      throw new Error("expected persisted quiz");
    }
    const answers = record.quiz.questions.map((question) => ({
      questionId: question.id,
      selectedOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
    }));
    const expected = gradeAttempt({ quiz: record.quiz, answers });
    const firstStart = await startFixtureAttempt(prisma, created.id);
    const first = await submitUseCase(prisma).execute({
      attemptId: firstStart.attemptId,
      tokenHash: firstStart.tokenHash,
      answers,
    });
    const secondStart = await startFixtureAttempt(prisma, created.id);
    const second = await submitUseCase(prisma).execute({
      attemptId: secondStart.attemptId,
      tokenHash: secondStart.tokenHash,
      answers,
    });
    expect(first.weightedScore).toBe(expected.result.weightedScore);
    expect(second.weightedScore).toBe(first.weightedScore);
  });
});
