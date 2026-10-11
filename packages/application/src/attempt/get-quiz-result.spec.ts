import { GetQuizResultUseCase } from "./get-quiz-result.js";
import { memoryPorts } from "../testing/test-memory-ports.js";
import { correctAnswers, sampleQuiz } from "../testing/quiz-fixture.js";
import { SubmitQuizUseCase } from "./submit-quiz.js";
import { createHash } from "node:crypto";

function hashFrom(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

describe("GetQuizResultUseCase", () => {
  it("returns stored scores after submit and rejects before scoring", async () => {
    const ports = memoryPorts();
    const quiz = sampleQuiz();
    const tokenHash = hashFrom("secret-token");
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
    await ports.attempts.createOpen({ id: "att-1", quizId: quiz.id, publicTokenHash: tokenHash });
    const getResult = new GetQuizResultUseCase(ports.quizzes, ports.attempts);
    await expect(getResult.execute({ attemptId: "att-1", tokenHash })).rejects.toMatchObject({
      code: "ATTEMPT_NOT_SCORED",
    });
    await new SubmitQuizUseCase(ports.uow).execute({
      attemptId: "att-1",
      tokenHash,
      answers: correctAnswers(quiz),
    });
    const result = await getResult.execute({ attemptId: "att-1", tokenHash });
    expect(result.quizId).toBe(quiz.id);
    expect(result.questions.some((question) => question.options.some((option) => option.isCorrect))).toBe(
      true,
    );
  });

  it("rejects a mismatched hash without receiving plaintext", async () => {
    const ports = memoryPorts();
    const quiz = sampleQuiz();
    const tokenHash = hashFrom("secret-token");
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
    await ports.attempts.createOpen({ id: "att-1", quizId: quiz.id, publicTokenHash: tokenHash });
    await expect(
      new GetQuizResultUseCase(ports.quizzes, ports.attempts).execute({
        attemptId: "att-1",
        tokenHash: hashFrom("other-token"),
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED_ATTEMPT" });
  });

  it("rejects a missing attempt", async () => {
    const ports = memoryPorts();
    await expect(
      new GetQuizResultUseCase(ports.quizzes, ports.attempts).execute({
        attemptId: "missing",
        tokenHash: hashFrom("x"),
      }),
    ).rejects.toMatchObject({ code: "ATTEMPT_NOT_FOUND" });
  });
});
