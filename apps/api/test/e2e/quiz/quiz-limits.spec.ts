import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import type { MarkdownSourcePort, QuizGenerationPort } from "@ai-quiz/domain";
import { CREATE_BODY, createApiApp } from "../support/create-app";
import { FixedGenerationAdapter } from "../../../src/quiz/fixture/fixed-generation.adapter";
import { FixedSourceAdapter } from "../../../src/quiz/fixture/fixed-source.adapter";
import { testPrisma } from "../../integration/support/postgres.setup";

async function waitUntil(predicate: () => boolean, timeoutMs = 2_000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("timed out waiting for in-flight creates");
}

describe("quiz create limits", () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it("rejects a sixth create in the window without calling source or generation", async () => {
    const source = new FixedSourceAdapter();
    const generation = new FixedGenerationAdapter();
    const fetch = jest.spyOn(source, "fetch");
    const generate = jest.spyOn(generation, "generate");
    app = await createApiApp({ source, generation });
    const server = app.getHttpServer();
    const before = await testPrisma().quiz.count({ where: { status: "ready" } });

    for (let i = 0; i < 5; i += 1) {
      const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
      expect(created.status).toBe(201);
    }
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(generate).toHaveBeenCalledTimes(5);

    const sixth = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(sixth.status).toBe(429);
    expect(sixth.body).toMatchObject({
      code: "REQUEST_RATE_LIMITED",
      message: "too many quiz creates, try again shortly",
    });
    expect(fetch).toHaveBeenCalledTimes(5);
    expect(generate).toHaveBeenCalledTimes(5);
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(before + 5);
  });

  it("rejects a third overlapping create without fetch or generate", async () => {
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    let fetches = 0;
    const source: MarkdownSourcePort = {
      fetch: jest.fn(async () => {
        fetches += 1;
        await hold;
        return new FixedSourceAdapter().fetch("https://example.com/README.md");
      }),
    };
    const generate = jest.fn(async (input) => new FixedGenerationAdapter().generate(input));
    const generation: QuizGenerationPort = { generate };
    app = await createApiApp({ source, generation });
    const server = app.getHttpServer();
    const first = request(server).post("/v1/quizzes").send(CREATE_BODY);
    const second = request(server).post("/v1/quizzes").send(CREATE_BODY);
    void first.catch(() => undefined);
    void second.catch(() => undefined);
    await waitUntil(() => fetches >= 2);
    const third = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(third.status).toBe(503);
    expect(third.body).toMatchObject({
      code: "GENERATION_CONCURRENCY_LIMIT",
      message: "generation is busy, try again shortly",
    });
    expect(fetches).toBe(2);
    expect(generate).not.toHaveBeenCalled();
    release();
    expect((await first).status).toBe(201);
    expect((await second).status).toBe(201);
  });

  it("allows a create within limits and still starts attempts", async () => {
    app = await createApiApp();
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(created.status).toBe(201);
    const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    expect(started.status).toBe(201);
  });

  it("does not charge invalid bodies to the rate window", async () => {
    app = await createApiApp();
    const server = app.getHttpServer();
    for (let i = 0; i < 5; i += 1) {
      const invalid = await request(server).post("/v1/quizzes").send({ topic: "   ", sourceUrl: CREATE_BODY.sourceUrl });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ code: "CREATE_QUIZ_INVALID" });
    }
    for (let i = 0; i < 5; i += 1) {
      const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
      expect(created.status).toBe(201);
    }
    const sixth = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(sixth.status).toBe(429);
    expect(sixth.body).toMatchObject({ code: "REQUEST_RATE_LIMITED" });
  });
});
