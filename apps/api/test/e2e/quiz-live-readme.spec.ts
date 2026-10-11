import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { gradeAttempt } from "@ai-quiz/application";
import { publicQuizViewSchema, publicResultSchema, startAttemptResponseSchema } from "@ai-quiz/contracts";
import type { Quiz } from "@ai-quiz/domain";
import { loadDotenvFiles } from "../../src/infrastructure/env";
import { testPrisma } from "../integration/postgres.setup";
import { bearer, createApiApp } from "./create-app";

loadDotenvFiles();

const liveEnabled =
  process.env.PHASE3_LIVE_README === "1" && Boolean(process.env.OPENAI_API_KEY?.trim());

const describeLive = liveEnabled ? describe : describe.skip;

const LIVE_SOURCES = [
  {
    name: "Express",
    topic: "Express routing",
    sourceUrl: "https://github.com/expressjs/express/blob/master/Readme.md",
  },
  {
    name: "Fastify",
    topic: "Fastify plugins",
    sourceUrl: "https://github.com/fastify/fastify/blob/main/README.md",
  },
] as const;

describeLive("live README generation (two sources)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp({ contentPorts: "product" });
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it.each(LIVE_SOURCES)(
    "creates, grounds, submits and persists a quiz from the $name README",
    async (source) => {
      const server = app.getHttpServer();
      const created = await request(server).post("/v1/quizzes").send({
        topic: source.topic,
        sourceUrl: source.sourceUrl,
        questionCount: 5,
      });
      expect(created.status).toBe(201);
      expect(created.body.status).toBe("ready");
      expect(created.body.questions).toBeUndefined();
      const leaked = JSON.stringify(created.body);
      expect(leaked).not.toContain("isCorrect");
      expect(leaked).not.toContain("OPENAI");
      expect(leaked).not.toContain("sourceExcerpt");

      const got = await request(server).get(`/v1/quizzes/${created.body.id}`);
      expect(got.status).toBe(200);
      const quiz = publicQuizViewSchema.parse(got.body);
      expect(quiz.questions).toHaveLength(5);
      expect(quiz.sourceUrl).toBe(source.sourceUrl);
      expect(quiz.questions.every((question) => question.options.length === 4)).toBe(true);
      const body = JSON.stringify(got.body);
      expect(body).not.toContain("isCorrect");
      expect(body).not.toContain("sourceExcerpt");
      expect(body).not.toContain("OPENAI");
      expect(body).not.toContain("modelId");

      const stored = await testPrisma().quiz.findUnique({
        where: { id: created.body.id },
        include: {
          sourceDocument: true,
          questions: { include: { options: true }, orderBy: { position: "asc" } },
        },
      });
      expect(stored).not.toBeNull();
      expect(stored?.sourceDocument.originalUrl).toBe(source.sourceUrl);
      expect(stored?.sourceDocument.resolvedUrl).toContain("raw.githubusercontent.com");
      expect(stored?.sourceDocument.originalUrl).not.toBe(stored?.sourceDocument.resolvedUrl);
      expect(stored?.questions).toHaveLength(5);
      for (const question of stored?.questions ?? []) {
        expect(question.sourceExcerpt?.length).toBeGreaterThan(0);
        expect(stored?.sourceDocument.contentSnapshot).toContain(question.sourceExcerpt ?? "");
        expect(question.options).toHaveLength(4);
        expect(question.options.some((option) => option.isCorrect)).toBe(true);
      }

      const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
      expect(started.status).toBe(201);
      const startBody = startAttemptResponseSchema.parse(started.body);

      const answers = stored!.questions.map((question) => ({
        questionId: question.id,
        selectedOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
      }));
      const domainQuiz: Quiz = {
        id: stored!.id,
        topic: stored!.topic,
        sourceUrl: stored!.sourceDocument.originalUrl,
        questions: stored!.questions.map((question) => ({
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
      const expected = gradeAttempt({ quiz: domainQuiz, answers });

      const submitted = await request(server)
        .post(`/v1/attempts/${startBody.attemptId}/submit`)
        .set(bearer(startBody.token))
        .send({ answers });
      expect(submitted.status).toBe(200);
      const result = publicResultSchema.parse(submitted.body);
      expect(result.questions).toHaveLength(5);
      expect(result.questions.every((question) => question.rawScore >= 1)).toBe(true);
      expect(result.weightedScore).toBe(expected.result.weightedScore);
      expect(result.questions.map((question) => question.rawScore)).toEqual(
        expected.result.questions.map((question) => question.rawScore),
      );

      const attempt = await testPrisma().quizAttempt.findUnique({
        where: { id: startBody.attemptId },
        include: { answers: { include: { selections: true } } },
      });
      expect(attempt?.status).toBe("scored");
      expect(attempt?.weightedScore).toBe(result.weightedScore);
      expect(attempt?.answers).toHaveLength(5);
      expect(attempt?.answers.every((answer) => answer.selections.length > 0)).toBe(true);

      // Capture interview-demo evidence without keys, tokens, or excerpts (excerpts stay server-only).
      console.log(
        "DEMO_EVIDENCE",
        JSON.stringify({
          name: source.name,
          topic: source.topic,
          sourceUrl: source.sourceUrl,
          quizId: created.body.id,
          questionCount: quiz.questions.length,
          prompts: quiz.questions.map((question) => question.prompt),
          types: quiz.questions.map((question) => question.type),
          groundedExcerpts: stored!.questions.every((question) =>
            stored!.sourceDocument.contentSnapshot.includes(question.sourceExcerpt ?? ""),
          ),
          weightedScore: result.weightedScore,
          weightedScoreDisplay: result.weightedScoreDisplay,
          percentageDisplay: result.percentageDisplay,
          rawScores: result.questions.map((question) => question.rawScore),
        }),
      );
    },
    180_000,
  );
});
