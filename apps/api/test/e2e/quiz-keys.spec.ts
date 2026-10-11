import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { publicQuizViewSchema, publicResultSchema } from "@ai-quiz/contracts";
import { bearer, CREATE_BODY, createApiApp } from "./create-app";
import { correctAnswersFromPublicQuiz } from "./fixture-answers";

function assertNoKeys(payload: unknown): void {
  const text = JSON.stringify(payload);
  expect(text).not.toContain("isCorrect");
  expect(text).not.toContain("rawScore");
  expect(text).not.toContain("weightedScore");
}

describe("quiz key privacy", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("omits keys before submit and includes them on the scored result", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(created.status).toBe(201);
    expect(created.body.questions).toBeUndefined();
    assertNoKeys(created.body);

    const got = await request(server)
      .get(`/v1/quizzes/${created.body.id}`)
      .set(bearer("ignored-token"));
    expect(got.status).toBe(200);
    const quiz = publicQuizViewSchema.parse(got.body);
    assertNoKeys(got.body);

    const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    const openResult = await request(server)
      .get(`/v1/attempts/${started.body.attemptId}/result`)
      .set(bearer(started.body.token));
    expect(openResult.status).toBe(409);
    expect(openResult.body).toMatchObject({ code: "ATTEMPT_NOT_SCORED" });
    expect(JSON.stringify(openResult.body)).not.toContain("isCorrect");

    const submitted = await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer(started.body.token))
      .send({ answers: correctAnswersFromPublicQuiz(quiz) });
    const result = publicResultSchema.parse(submitted.body);
    expect(result.questions.some((question) => question.options.some((option) => option.isCorrect))).toBe(
      true,
    );
    expect(result.questions.every((question) => typeof question.rawScore === "number")).toBe(true);

    const failedCreate = await request(server).post("/v1/quizzes").send({ topic: "", sourceUrl: "https://x.com/a.md" });
    expect(JSON.stringify(failedCreate.body)).not.toContain("isCorrect");
  });
});
