import { hashAttemptToken } from "../../../src/attempt/http/attempt-token";
import { persistFixtureQuiz, startFixtureAttempt } from "../support/create-fixture-quiz";
import { testPrisma } from "../support/postgres.setup";

describe("attempt token storage", () => {
  it("stores only the SHA-256 hash of the minted token", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma);
    const started = await startFixtureAttempt(prisma, created.id);
    const attempt = await prisma.quizAttempt.findUnique({ where: { id: started.attemptId } });

    expect(attempt).not.toBeNull();
    expect(attempt?.publicTokenHash).toBe(hashAttemptToken(started.token));
    expect(attempt?.publicTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(attempt)).not.toContain(started.token);
    expect(Object.keys(attempt ?? {})).not.toContain("token");
    expect(Object.keys(attempt ?? {})).not.toContain("publicToken");
  });
});
