import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { publicQuizViewSchema, publicResultSchema } from "@ai-quiz/contracts";
import { bearer, CREATE_BODY, createApiApp } from "../support/create-app";
import { answersWithWrongFirstSingle, correctAnswersFromPublicQuiz } from "../support/fixture-answers";

describe("submit idempotency", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns the original stored result for later submits and concurrent overlap", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    const quiz = publicQuizViewSchema.parse(
      (await request(server).get(`/v1/quizzes/${created.body.id}`)).body,
    );
    const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    const answers = correctAnswersFromPublicQuiz(quiz);
    const first = await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer(started.body.token))
      .send({ answers });
    expect(first.status).toBe(200);
    const original = publicResultSchema.parse(first.body);

    const same = await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer(started.body.token))
      .send({ answers });
    expect(same.status).toBe(200);
    expect(same.body).toEqual(original);

    const different = await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer(started.body.token))
      .send({ answers: answersWithWrongFirstSingle(quiz) });
    expect(different.status).toBe(200);
    expect(different.body).toEqual(original);

    const otherStart = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    const [left, right] = await Promise.all([
      request(server)
        .post(`/v1/attempts/${otherStart.body.attemptId}/submit`)
        .set(bearer(otherStart.body.token))
        .send({ answers }),
      request(server)
        .post(`/v1/attempts/${otherStart.body.attemptId}/submit`)
        .set(bearer(otherStart.body.token))
        .send({ answers }),
    ]);
    expect(left.status).toBe(200);
    expect(right.status).toBe(200);
    expect(left.body.weightedScore).toBe(right.body.weightedScore);
    expect(left.body.weightedScore).toBe(original.weightedScore);
  });
});
