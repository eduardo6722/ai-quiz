import { createHash } from "node:crypto";
import { CreateQuizUseCase, toPublicQuizView } from "@ai-quiz/application";
import type { MarkdownSourcePort, QuizGenerationPort } from "@ai-quiz/domain";
import { buildFixtureQuestions, FIXTURE_EXCERPT, FIXTURE_SNAPSHOT } from "../../src/modules/quiz/adapters/out/fixture/fixture-bank";
import { PrismaUnitOfWork } from "../../src/modules/quiz/adapters/out/prisma/prisma-unit-of-work";
import { testPrisma } from "./postgres.setup";

const ORIGINAL_URL = "https://github.com/expressjs/express/blob/master/Readme.md";
const RESOLVED_URL = "https://raw.githubusercontent.com/expressjs/express/master/Readme.md";

describe("generated quiz persistence", () => {
  it("stores blob metadata, excerpts, modelId, and a key-free public view", async () => {
    const prisma = testPrisma();
    const source: MarkdownSourcePort = {
      fetch: async () => ({
        originalUrl: ORIGINAL_URL,
        resolvedUrl: RESOLVED_URL,
        contentSnapshot: FIXTURE_SNAPSHOT,
        contentHash: createHash("sha256").update(FIXTURE_SNAPSHOT, "utf8").digest("hex"),
        fetchedAt: new Date("2026-10-10T00:00:00Z"),
      }),
    };
    const generation: QuizGenerationPort = {
      generate: async ({ count }) => ({
        questions: buildFixtureQuestions(count),
        modelId: "gpt-4o-mini",
      }),
    };
    const created = await new CreateQuizUseCase(
      source,
      generation,
      PrismaUnitOfWork.fromClient(prisma),
    ).execute({
      topic: "Express routing",
      sourceUrl: ORIGINAL_URL,
      questionCount: 5,
      strategy: "balanced",
    });

    const quiz = await prisma.quiz.findUnique({
      where: { id: created.id },
      include: { sourceDocument: true, questions: { include: { options: true } } },
    });
    expect(quiz).not.toBeNull();
    expect(quiz?.status).toBe("ready");
    expect(quiz?.modelId).toBe("gpt-4o-mini");
    expect(quiz?.sourceDocument.originalUrl).toBe(ORIGINAL_URL);
    expect(quiz?.sourceDocument.resolvedUrl).toBe(RESOLVED_URL);
    expect(quiz?.sourceDocument.originalUrl).not.toBe(quiz?.sourceDocument.resolvedUrl);
    expect(quiz?.sourceDocument.contentSnapshot).toBe(FIXTURE_SNAPSHOT);
    expect(quiz?.sourceDocument.contentHash).toBe(
      createHash("sha256").update(quiz?.sourceDocument.contentSnapshot ?? "", "utf8").digest("hex"),
    );
    expect(quiz?.sourceDocument.fetchedAt).toBeInstanceOf(Date);
    expect(quiz?.questions).toHaveLength(5);
    for (const question of quiz?.questions ?? []) {
      expect(question.sourceExcerpt).toBe(FIXTURE_EXCERPT);
      expect(question.options).toHaveLength(4);
      expect(question.options.some((option) => option.isCorrect)).toBe(true);
    }

    const record = {
      id: quiz!.id,
      topic: quiz!.topic,
      sourceUrl: quiz!.sourceDocument.originalUrl,
      questions: quiz!.questions.map((question) => ({
        id: question.id,
        position: question.position,
        prompt: question.prompt,
        type: question.type,
        sourceExcerpt: question.sourceExcerpt ?? undefined,
        options: question.options.map((option) => ({
          id: option.id,
          position: option.position,
          label: option.label,
          isCorrect: option.isCorrect,
        })),
      })),
    };
    const view = toPublicQuizView(record);
    expect(JSON.stringify(view)).not.toContain("isCorrect");
    expect(JSON.stringify(view)).not.toContain("sourceExcerpt");
    expect(JSON.stringify(view)).not.toContain("modelId");
    expect(JSON.stringify(view)).not.toContain("gpt-4o-mini");
  });
});
