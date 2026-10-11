import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import {
  createQuizResponseSchema,
  publicQuizViewSchema,
  publicResultSchema,
  startAttemptResponseSchema,
} from "@ai-quiz/contracts";
import { testPrisma } from "../../integration/support/postgres.setup";
import { bearer, createApiApp } from "../support/create-app";
import {
  EXPRESS_EXCERPT,
  EXPRESS_URL,
  NEST_EXCERPT,
  NEST_URL,
  expectedWeightedScore,
  markdownTransport,
  sourceAwareGeneration,
} from "../support/two-source-fixtures";

describe("two distinct Markdown sources (mocked generator)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp({
      fetchTransport: markdownTransport(),
      generation: sourceAwareGeneration,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates, scores, and persists source-specific quizzes with a hand-calculated weight", async () => {
    const server = app.getHttpServer();
    const expressResult = await completeSource({
      server,
      topic: "Express routing",
      sourceUrl: EXPRESS_URL,
      excerpt: EXPRESS_EXCERPT,
      promptNeedle: "Express",
    });
    const nestResult = await completeSource({
      server,
      topic: "NestJS modules",
      sourceUrl: NEST_URL,
      excerpt: NEST_EXCERPT,
      promptNeedle: "NestJS",
    });

    expect(expressResult.prompts.some((prompt) => prompt.includes("NestJS"))).toBe(false);
    expect(nestResult.prompts.some((prompt) => prompt.includes("Express"))).toBe(false);
    expect(expressResult.sourceUrl).not.toBe(nestResult.sourceUrl);
    expect(expressResult.weightedScore).toBe(nestResult.weightedScore);
  });
});

async function completeSource(input: {
  server: ReturnType<INestApplication["getHttpServer"]>;
  topic: string;
  sourceUrl: string;
  excerpt: string;
  promptNeedle: string;
}): Promise<{ prompts: string[]; sourceUrl: string; weightedScore: number }> {
  const created = await request(input.server).post("/v1/quizzes").send({
    topic: input.topic,
    sourceUrl: input.sourceUrl,
    questionCount: 5,
  });
  expect(created.status).toBe(201);
  const createBody = createQuizResponseSchema.parse(created.body);
  expect(createBody.status).toBe("ready");
  expect(JSON.stringify(created.body)).not.toContain("isCorrect");

  const got = await request(input.server).get(`/v1/quizzes/${createBody.id}`);
  expect(got.status).toBe(200);
  const quiz = publicQuizViewSchema.parse(got.body);
  expect(quiz.sourceUrl).toBe(input.sourceUrl);
  expect(quiz.questions).toHaveLength(5);
  expect(quiz.questions.every((question) => question.options.length === 4)).toBe(true);
  expect(quiz.questions.every((question) => question.prompt.includes(input.promptNeedle))).toBe(true);
  expect(JSON.stringify(got.body)).not.toContain("isCorrect");
  expect(JSON.stringify(got.body)).not.toContain("sourceExcerpt");

  const persisted = await testPrisma().quiz.findUnique({
    where: { id: createBody.id },
    include: {
      sourceDocument: true,
      questions: { include: { options: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
    },
  });
  expect(persisted).not.toBeNull();
  expect(persisted?.sourceDocument.originalUrl).toBe(input.sourceUrl);
  expect(persisted?.sourceDocument.contentSnapshot).toContain(input.excerpt);
  expect(persisted?.questions).toHaveLength(5);
  for (const question of persisted?.questions ?? []) {
    expect(question.sourceExcerpt).toBe(input.excerpt);
    expect(persisted?.sourceDocument.contentSnapshot).toContain(question.sourceExcerpt ?? "");
    expect(question.options).toHaveLength(4);
    expect(question.options.filter((option) => option.isCorrect)).toHaveLength(1);
  }

  const started = await request(input.server).post(`/v1/quizzes/${createBody.id}/attempts`);
  expect(started.status).toBe(201);
  const startBody = startAttemptResponseSchema.parse(started.body);

  const answers = quiz.questions.map((question, index) => {
    const stored = persisted!.questions[index]!;
    const correctId = stored.options.find((option) => option.isCorrect)!.id;
    const wrongId = stored.options.find((option) => !option.isCorrect)!.id;
    return {
      questionId: question.id,
      selectedOptionIds: [index === 0 ? wrongId : correctId],
    };
  });

  const submitted = await request(input.server)
    .post(`/v1/attempts/${startBody.attemptId}/submit`)
    .set(bearer(startBody.token))
    .send({ answers });
  expect(submitted.status).toBe(200);
  const result = publicResultSchema.parse(submitted.body);
  const expectedScores = [0, 4, 4, 4, 4];
  expect(result.questions.map((question) => question.rawScore)).toEqual(expectedScores);
  expect(result.weightedScore).toBeCloseTo(expectedWeightedScore(expectedScores), 10);

  const attempt = await testPrisma().quizAttempt.findUnique({
    where: { id: startBody.attemptId },
    include: { answers: { include: { selections: true } } },
  });
  expect(attempt?.status).toBe("scored");
  expect(attempt?.weightedScore).toBeCloseTo(expectedWeightedScore(expectedScores), 10);
  expect(attempt?.answers).toHaveLength(5);
  expect(attempt?.answers.every((answer) => answer.selections.length === 1)).toBe(true);
  expect(attempt?.answers.map((answer) => answer.rawScore).sort()).toEqual([0, 4, 4, 4, 4].sort());

  return {
    prompts: quiz.questions.map((question) => question.prompt),
    sourceUrl: quiz.sourceUrl,
    weightedScore: result.weightedScore,
  };
}
