import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { loadDotenvFiles } from "../../../src/platform/config/env";
import { createApiApp } from "../support/create-app";

loadDotenvFiles();

const liveEnabled =
  process.env.PHASE6_LIVE_LANGFUSE === "1" &&
  Boolean(process.env.LANGFUSE_PUBLIC_KEY?.trim()) &&
  Boolean(process.env.LANGFUSE_SECRET_KEY?.trim());

const describeLive = liveEnabled ? describe : describe.skip;

describeLive("live Langfuse create-quiz tracing", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp({ contentPorts: "product", useProductTelemetry: true });
  }, 120_000);

  afterAll(async () => {
    await app.close();
  });

  it("echoes x-request-id demo-trace-0001 and does not leak secrets", async () => {
    const response = await request(app.getHttpServer())
      .post("/v1/quizzes")
      .set("x-request-id", "demo-trace-0001")
      .send({
        topic: "Express routing",
        sourceUrl: "https://github.com/expressjs/express/blob/master/Readme.md",
        questionCount: 5,
      });
    expect([201, 422, 502, 504]).toContain(response.status);
    expect(response.headers["x-request-id"]).toBe("demo-trace-0001");
    expect(response.body.questions).toBeUndefined();
    const leaked = JSON.stringify(response.body);
    expect(leaked).not.toContain("isCorrect");
    expect(leaked).not.toMatch(/sk-/);
    expect(leaked).not.toContain("LANGFUSE_SECRET_KEY");
  });
});
