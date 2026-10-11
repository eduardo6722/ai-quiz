import { QuizPrismaRepository } from "../../../src/quiz/persistence/quiz.prisma-repository";
import { persistFixtureQuiz, startFixtureAttempt, submitUseCase } from "../support/create-fixture-quiz";
import { testPrisma } from "../support/postgres.setup";

describe("attempt finalize", () => {
  it("writes scores, selections and submittedAt together on first success", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma);
    const started = await startFixtureAttempt(prisma, created.id);
    const record = await new QuizPrismaRepository(prisma).findById(created.id);
    if (record === undefined) {
      throw new Error("expected persisted quiz");
    }
    const answers = record.quiz.questions.map((question) => ({
      questionId: question.id,
      selectedOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
    }));
    await submitUseCase(prisma).execute({
      attemptId: started.attemptId,
      tokenHash: started.tokenHash,
      answers,
    });

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: started.attemptId },
      include: { answers: { include: { selections: true } } },
    });
    expect(attempt?.status).toBe("scored");
    expect(attempt?.submittedAt).toBeInstanceOf(Date);
    expect(attempt?.weightedScore).not.toBeNull();
    expect(attempt?.weightedScoreDisplay).not.toBeNull();
    expect(attempt?.percentageDisplay).not.toBeNull();
    expect(attempt?.answers).toHaveLength(record.quiz.questions.length);
    expect(attempt?.answers.every((answer) => answer.selections.length > 0)).toBe(true);
  });

  it("leaves the attempt open when submit validation fails", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma);
    const started = await startFixtureAttempt(prisma, created.id);
    const record = await new QuizPrismaRepository(prisma).findById(created.id);
    if (record === undefined) {
      throw new Error("expected persisted quiz");
    }
    await expect(
      submitUseCase(prisma).execute({
        attemptId: started.attemptId,
        tokenHash: started.tokenHash,
        answers: record.quiz.questions.slice(0, 4).map((question) => ({
          questionId: question.id,
          selectedOptionIds: [question.options[0]!.id],
        })),
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_INCOMPLETE" });

    const attempt = await prisma.quizAttempt.findUnique({ where: { id: started.attemptId } });
    expect(attempt?.status).toBe("open");
    expect(attempt?.weightedScore).toBeNull();
    expect(await prisma.attemptAnswer.count({ where: { attemptId: started.attemptId } })).toBe(0);
  });

  it("converges concurrent legal submits on one stored result", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma);
    const started = await startFixtureAttempt(prisma, created.id);
    const record = await new QuizPrismaRepository(prisma).findById(created.id);
    if (record === undefined) {
      throw new Error("expected persisted quiz");
    }
    const answers = record.quiz.questions.map((question) => ({
      questionId: question.id,
      selectedOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
    }));
    const useCase = submitUseCase(prisma);
    const [first, second] = await Promise.all([
      useCase.execute({ attemptId: started.attemptId, tokenHash: started.tokenHash, answers }),
      useCase.execute({ attemptId: started.attemptId, tokenHash: started.tokenHash, answers }),
    ]);
    expect(first.weightedScore).toBe(second.weightedScore);
    expect(await prisma.quizAttempt.count({ where: { id: started.attemptId, status: "scored" } })).toBe(1);
    expect(await prisma.attemptAnswer.count({ where: { attemptId: started.attemptId } })).toBe(
      record.quiz.questions.length,
    );
  });
});
