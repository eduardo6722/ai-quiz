import { createHash } from "node:crypto";
import { AlreadyScoredConflictError } from "./errors.js";
import { SubmitQuizUseCase } from "./submit-quiz.js";
import { memoryPorts } from "./test-memory-ports.js";
import { correctAnswers, sampleQuiz } from "./quiz-fixture.js";
import { gradeAttempt } from "./grade-attempt.js";
import * as Grade from "./grade-attempt.js";

function hashFrom(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

describe("SubmitQuizUseCase", () => {
  async function readyAttempt(token = "secret-token") {
    const ports = memoryPorts();
    const quiz = sampleQuiz();
    await ports.quizzes.insert({
      source: {
        originalUrl: quiz.sourceUrl,
        resolvedUrl: quiz.sourceUrl,
        contentSnapshot: "# x",
        contentHash: "h",
        fetchedAt: new Date(),
      },
      quiz,
      strategy: "balanced",
      status: "ready",
    });
    const tokenHash = hashFrom(token);
    const open = await ports.attempts.createOpen({
      id: "att-1",
      quizId: quiz.id,
      publicTokenHash: tokenHash,
    });
    return { ports, quiz, token, tokenHash, attemptId: open.id };
  }

  it("grades a complete legal first submit via gradeAttempt", async () => {
    const ctx = await readyAttempt();
    const result = await new SubmitQuizUseCase(ctx.ports.uow).execute({
      attemptId: ctx.attemptId,
      tokenHash: ctx.tokenHash,
      answers: correctAnswers(ctx.quiz),
    });
    const expected = gradeAttempt({ quiz: ctx.quiz, answers: correctAnswers(ctx.quiz) });
    expect(result.weightedScore).toBe(expected.result.weightedScore);
    expect(ctx.ports.store.attempts.get(ctx.attemptId)?.status).toBe("scored");
  });

  it("returns the stored result on a second submit and ignores new answers", async () => {
    const ctx = await readyAttempt();
    const useCase = new SubmitQuizUseCase(ctx.ports.uow);
    const spy = jest.spyOn(Grade, "gradeAttempt");
    const first = await useCase.execute({
      attemptId: ctx.attemptId,
      tokenHash: ctx.tokenHash,
      answers: correctAnswers(ctx.quiz),
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const same = await useCase.execute({
      attemptId: ctx.attemptId,
      tokenHash: ctx.tokenHash,
      answers: correctAnswers(ctx.quiz),
    });
    expect(same).toEqual(first);
    const wrong = ctx.quiz.questions.map((question) => ({
      questionId: question.id,
      selectedOptionIds: [question.options.find((option) => !option.isCorrect)?.id ?? question.options[0]!.id],
    }));
    const second = await useCase.execute({
      attemptId: ctx.attemptId,
      tokenHash: ctx.tokenHash,
      answers: wrong,
    });
    expect(second).toEqual(first);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("reloads the stored result when finalize reports a unique-constraint conflict", async () => {
    const ctx = await readyAttempt();
    const original = ctx.ports.attempts.finalizeIfOpen.bind(ctx.ports.attempts);
    jest.spyOn(ctx.ports.attempts, "finalizeIfOpen").mockImplementation(async (input) => {
      await original(input);
      throw new AlreadyScoredConflictError();
    });
    const result = await new SubmitQuizUseCase(ctx.ports.uow).execute({
      attemptId: ctx.attemptId,
      tokenHash: ctx.tokenHash,
      answers: correctAnswers(ctx.quiz),
    });
    const expected = gradeAttempt({ quiz: ctx.quiz, answers: correctAnswers(ctx.quiz) });
    expect(result.weightedScore).toBe(expected.result.weightedScore);
  });

  it("rejects a hash mismatch without plaintext", async () => {
    const ctx = await readyAttempt();
    await expect(
      new SubmitQuizUseCase(ctx.ports.uow).execute({
        attemptId: ctx.attemptId,
        tokenHash: hashFrom("other"),
        answers: correctAnswers(ctx.quiz),
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED_ATTEMPT" });
  });

  it("rejects missing attempts", async () => {
    const ctx = await readyAttempt();
    await expect(
      new SubmitQuizUseCase(ctx.ports.uow).execute({
        attemptId: "missing",
        tokenHash: ctx.tokenHash,
        answers: correctAnswers(ctx.quiz),
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_NOT_FOUND" });
  });

  it("rejects foreign option ids and incomplete sets without finalizing", async () => {
    const ctx = await readyAttempt();
    const finalize = jest.spyOn(ctx.ports.attempts, "finalizeIfOpen");
    const foreign = correctAnswers(ctx.quiz);
    foreign[0] = { questionId: ctx.quiz.questions[0]!.id, selectedOptionIds: ["other-quiz-opt"] };
    await expect(
      new SubmitQuizUseCase(ctx.ports.uow).execute({
        attemptId: ctx.attemptId,
        tokenHash: ctx.tokenHash,
        answers: foreign,
      }),
    ).rejects.toMatchObject({ code: "SELECTION_ILLEGAL" });
    expect(ctx.ports.store.attempts.get(ctx.attemptId)?.status).toBe("open");

    await expect(
      new SubmitQuizUseCase(ctx.ports.uow).execute({
        attemptId: ctx.attemptId,
        tokenHash: ctx.tokenHash,
        answers: correctAnswers(ctx.quiz).slice(0, 4),
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_INCOMPLETE" });
    expect(finalize).not.toHaveBeenCalled();
    expect(ctx.ports.store.attempts.get(ctx.attemptId)?.status).toBe("open");
  });

  it("scores 0 for a wrong-but-legal single selection", async () => {
    const ctx = await readyAttempt();
    const answers = correctAnswers(ctx.quiz);
    const first = ctx.quiz.questions[0]!;
    answers[0] = {
      questionId: first.id,
      selectedOptionIds: [first.options.find((option) => !option.isCorrect)!.id],
    };
    const result = await new SubmitQuizUseCase(ctx.ports.uow).execute({
      attemptId: ctx.attemptId,
      tokenHash: ctx.tokenHash,
      answers,
    });
    expect(result.questions[0]?.rawScore).toBe(0);
  });
});
