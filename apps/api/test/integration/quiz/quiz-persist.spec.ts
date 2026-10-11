import { createHash } from "node:crypto";
import { FIXTURE_SNAPSHOT } from "../../../src/quiz/fixture/fixture-bank";
import { persistFixtureQuiz } from "../support/create-fixture-quiz";
import { testPrisma } from "../support/postgres.setup";

describe("quiz persistence", () => {
  it("stores source metadata, a ready quiz, and keyed options", async () => {
    const prisma = testPrisma();
    const created = await persistFixtureQuiz(prisma, 5);
    const quiz = await prisma.quiz.findUnique({
      where: { id: created.id },
      include: { sourceDocument: true, questions: { include: { options: true } } },
    });

    expect(quiz).not.toBeNull();
    expect(quiz?.status).toBe("ready");
    expect(quiz?.strategy).toBe("balanced");
    expect(quiz?.modelId).toBeNull();
    expect(quiz?.sourceDocument.originalUrl).toBe("https://example.com/README.md");
    expect(quiz?.sourceDocument.resolvedUrl).toBe(quiz?.sourceDocument.originalUrl);
    expect(quiz?.sourceDocument.contentHash).toBe(
      createHash("sha256").update(FIXTURE_SNAPSHOT, "utf8").digest("hex"),
    );
    expect(quiz?.sourceDocument.contentSnapshot).toBe(FIXTURE_SNAPSHOT);
    expect(quiz?.sourceDocument.fetchedAt).toBeInstanceOf(Date);
    expect(quiz?.questions).toHaveLength(5);
    for (const question of quiz?.questions ?? []) {
      expect(question.options).toHaveLength(4);
      expect(question.options.some((option) => option.isCorrect)).toBe(true);
    }
  });
});
