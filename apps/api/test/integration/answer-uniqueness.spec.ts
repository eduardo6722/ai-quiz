import { QuizPrismaRepository } from "../../src/modules/quiz/adapters/out/prisma/quiz.prisma-repository";
import { persistFixtureQuiz, startFixtureAttempt, submitUseCase } from "./create-fixture-quiz";
import { testPrisma } from "./postgres.setup";

describe("answer uniqueness", () => {
  it("enforces one answer per question and option ownership", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma);
    const started = await startFixtureAttempt(prisma, created.id);
    const record = await new QuizPrismaRepository(prisma).findById(created.id);
    if (record === undefined) {
      throw new Error("expected persisted quiz");
    }
    const question = record.quiz.questions[0]!;
    await prisma.attemptAnswer.create({
      data: { attemptId: started.attemptId, questionId: question.id, rawScore: 0 },
    });
    await expect(
      prisma.attemptAnswer.create({
        data: { attemptId: started.attemptId, questionId: question.id, rawScore: 1 },
      }),
    ).rejects.toThrow();

    await prisma.attemptAnswer.deleteMany({ where: { attemptId: started.attemptId } });
    const answers = record.quiz.questions.map((item) => ({
      questionId: item.id,
      selectedOptionIds: item.options.filter((option) => option.isCorrect).map((option) => option.id),
    }));
    await submitUseCase(prisma).execute({
      attemptId: started.attemptId,
      tokenHash: started.tokenHash,
      answers,
    });

    const stored = await prisma.attemptAnswer.findMany({
      where: { attemptId: started.attemptId },
      include: { selections: true, question: { include: { options: true } } },
    });
    expect(stored).toHaveLength(record.quiz.questions.length);
    for (const answer of stored) {
      const optionIds = new Set(answer.question.options.map((option) => option.id));
      for (const selection of answer.selections) {
        expect(optionIds.has(selection.optionId)).toBe(true);
      }
    }
  });
});
