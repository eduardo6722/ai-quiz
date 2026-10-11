import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { gradeAttempt } from "@ai-quiz/application";
import {
  createQuizResponseSchema,
  publicQuizViewSchema,
  publicResultSchema,
  startAttemptResponseSchema,
} from "@ai-quiz/contracts";
import { testPrisma } from "../integration/postgres.setup";
import { bearer, CREATE_BODY, createApiApp } from "./create-app";
import { correctAnswersFromPublicQuiz, quizWithFixtureKeys } from "./fixture-answers";

describe("quiz REST flow", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates, reads, starts, submits and returns a Phase 1-equal stored result", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(created.status).toBe(201);
    const createBody = createQuizResponseSchema.parse(created.body);
    expect(createBody.status).toBe("ready");
    expect(JSON.stringify(created.body)).not.toContain("questions");
    expect(JSON.stringify(created.body)).not.toContain("isCorrect");

    const got = await request(server).get(`/v1/quizzes/${createBody.id}`);
    expect(got.status).toBe(200);
    const quiz = publicQuizViewSchema.parse(got.body);
    expect(JSON.stringify(got.body)).not.toContain("isCorrect");

    const started = await request(server).post(`/v1/quizzes/${createBody.id}/attempts`);
    expect(started.status).toBe(201);
    const startBody = startAttemptResponseSchema.parse(started.body);

    const answers = correctAnswersFromPublicQuiz(quiz);
    const expected = gradeAttempt({ quiz: quizWithFixtureKeys(quiz), answers });
    const submitted = await request(server)
      .post(`/v1/attempts/${startBody.attemptId}/submit`)
      .set(bearer(startBody.token))
      .send({ answers });
    expect(submitted.status).toBe(200);
    const result = publicResultSchema.parse(submitted.body);
    expect(result.weightedScore).toBe(expected.result.weightedScore);
    expect(result.questions.map((question) => question.rawScore)).toEqual(
      expected.result.questions.map((question) => question.rawScore),
    );

    const stored = await request(server)
      .get(`/v1/attempts/${startBody.attemptId}/result`)
      .set(bearer(startBody.token));
    expect(stored.status).toBe(200);
    expect(stored.body).toEqual(submitted.body);
  });

  it("rejects an invalid create body and persists nothing playable", async () => {
    const server = app.getHttpServer();
    const response = await request(server).post("/v1/quizzes").send({
      topic: "   ",
      sourceUrl: "https://example.com/a.md",
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: "CREATE_QUIZ_INVALID" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps unknown ids to not-found codes", async () => {
    const server = app.getHttpServer();
    const missingQuiz = await request(server).get("/v1/quizzes/00000000-0000-4000-8000-000000000000");
    expect(missingQuiz.status).toBe(404);
    expect(missingQuiz.body).toMatchObject({ code: "QUIZ_NOT_FOUND" });
  });
});
