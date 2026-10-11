import { randomUUID } from "node:crypto";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApplicationError } from "@ai-quiz/application";
import type { QuizGenerationPort } from "@ai-quiz/domain";
import { CREATE_BODY, createApiApp } from "./create-app";
import { testPrisma } from "../integration/postgres.setup";

describe("quiz generation errors", () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it("maps always-invalid generation to 422 GENERATION_RETRIES_EXHAUSTED and stores no ready quiz", async () => {
    const generation: QuizGenerationPort = {
      generate: async () => ({ questions: [] }),
    };
    app = await createApiApp({ generation });
    const response = await request(app.getHttpServer()).post("/v1/quizzes").send(CREATE_BODY);
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "GENERATION_RETRIES_EXHAUSTED" });
    expect(JSON.stringify(response.body)).not.toContain("sk-");
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps upstream failure to 502 GENERATION_UPSTREAM_FAILED", async () => {
    const generation: QuizGenerationPort = {
      generate: async () => {
        throw new ApplicationError("GENERATION_UPSTREAM_FAILED", "generation is not configured");
      },
    };
    app = await createApiApp({ generation });
    const response = await request(app.getHttpServer()).post("/v1/quizzes").send(CREATE_BODY);
    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({ code: "GENERATION_UPSTREAM_FAILED" });
    expect(JSON.stringify(response.body)).not.toContain("sk-");
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("rejects start-attempt on a failed leftover without leaking keys", async () => {
    app = await createApiApp();
    const leftover = await testPrisma().quiz.create({
      data: {
        id: randomUUID(),
        topic: "Failed leftover",
        strategy: "balanced",
        status: "failed",
        sourceDocument: {
          create: {
            originalUrl: "https://example.com/README.md",
            resolvedUrl: "https://example.com/README.md",
            contentHash: "abc",
            fetchedAt: new Date(),
            contentSnapshot: "Ports are interfaces the core depends on. ".repeat(8),
          },
        },
      },
    });
    const response = await request(app.getHttpServer()).post(`/v1/quizzes/${leftover.id}/attempts`);
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ code: "QUIZ_NOT_PLAYABLE" });
    expect(JSON.stringify(response.body)).not.toContain("isCorrect");
    expect(JSON.stringify(response.body)).not.toContain("sk-");
  });
});
