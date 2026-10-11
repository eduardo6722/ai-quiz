import { StartAttemptUseCase } from "./start-attempt.js";
import { memoryPorts } from "./test-memory-ports.js";
import { sampleQuiz } from "./quiz-fixture.js";

describe("StartAttemptUseCase", () => {
  it("creates an open attempt with the token hash only", async () => {
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
    const started = await new StartAttemptUseCase(ports.quizzes, ports.uow).execute({
      quizId: quiz.id,
      tokenHash: "abc123hash",
    });
    const stored = await ports.attempts.findById(started.attemptId);
    expect(stored?.status).toBe("open");
    expect(stored?.publicTokenHash).toBe("abc123hash");
  });
});
