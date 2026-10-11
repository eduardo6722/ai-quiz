import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { publicQuizViewSchema } from "@ai-quiz/contracts";
import { bearer, CREATE_BODY, createApiApp } from "./create-app";
import { correctAnswersFromPublicQuiz } from "./fixture-answers";

describe("attempt token authorization", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("accepts the owning token and rejects missing, malformed, wrong and foreign tokens", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    const quiz = publicQuizViewSchema.parse(
      (await request(server).get(`/v1/quizzes/${created.body.id}`)).body,
    );
    const first = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    const second = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    expect(first.body.attemptId).not.toBe(second.body.attemptId);
    expect(first.body.token).not.toBe(second.body.token);

    const answers = correctAnswersFromPublicQuiz(quiz);
    const submit = (attemptId: string, header?: Record<string, string>) => {
      const req = request(server).post(`/v1/attempts/${attemptId}/submit`).send({ answers });
      return header === undefined ? req : req.set(header);
    };

    expect((await submit(first.body.attemptId)).status).toBe(401);
    expect((await submit(first.body.attemptId, { Authorization: "Basic x" })).body).toMatchObject({
      code: "UNAUTHORIZED_ATTEMPT",
    });
    expect((await submit(first.body.attemptId, bearer("wrong-token"))).body).toMatchObject({
      code: "UNAUTHORIZED_ATTEMPT",
    });
    expect((await submit(first.body.attemptId, bearer(second.body.token))).body).toMatchObject({
      code: "UNAUTHORIZED_ATTEMPT",
    });

    const ok = await submit(first.body.attemptId, bearer(first.body.token));
    expect(ok.status).toBe(200);
    expect(JSON.stringify(ok.body)).not.toContain(first.body.token);

    const scoredBad = await request(server)
      .get(`/v1/attempts/${first.body.attemptId}/result`)
      .set(bearer("wrong-token"));
    expect(scoredBad.status).toBe(401);
    expect(scoredBad.body).toMatchObject({ code: "UNAUTHORIZED_ATTEMPT" });
    expect(JSON.stringify(scoredBad.body)).not.toContain("isCorrect");
    expect(JSON.stringify(scoredBad.body)).not.toContain("weightedScore");

    const scoredOk = await request(server)
      .get(`/v1/attempts/${first.body.attemptId}/result`)
      .set(bearer(first.body.token));
    expect(scoredOk.status).toBe(200);
  });
});
