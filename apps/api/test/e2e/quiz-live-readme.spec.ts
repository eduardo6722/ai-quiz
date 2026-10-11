import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { publicQuizViewSchema } from "@ai-quiz/contracts";
import { createApiApp } from "./create-app";

const liveEnabled =
  process.env.PHASE3_LIVE_README === "1" && Boolean(process.env.OPENAI_API_KEY?.trim());

const describeLive = liveEnabled ? describe : describe.skip;

describeLive("live README generation", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp({ contentPorts: "product" });
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it("creates a ready quiz from the Express README without leaking keys", async () => {
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send({
      topic: "Express routing",
      sourceUrl: "https://github.com/expressjs/express/blob/master/Readme.md",
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
    expect(quiz.sourceUrl).toBe("https://github.com/expressjs/express/blob/master/Readme.md");
    expect(quiz.questions.every((question) => question.options.length === 4)).toBe(true);
    const body = JSON.stringify(got.body);
    expect(body).not.toContain("isCorrect");
    expect(body).not.toContain("sourceExcerpt");
    expect(body).not.toContain("OPENAI");
    expect(body).not.toContain("modelId");

    const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    expect(started.status).toBe(201);
    expect(started.body.attemptId).toEqual(expect.any(String));
  }, 120_000);
});
