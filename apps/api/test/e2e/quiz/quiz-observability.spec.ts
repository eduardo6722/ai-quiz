import { Logger } from "@nestjs/common";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApplicationError, RecordingTelemetryPort } from "@ai-quiz/application";
import type { MarkdownSourcePort, QuizGenerationPort } from "@ai-quiz/domain";
import { bearer, CREATE_BODY, createApiApp } from "../support/create-app";
import { FixedGenerationAdapter } from "../../../src/quiz/fixture/fixed-generation.adapter";
import { testPrisma } from "../../integration/support/postgres.setup";
import { publicQuizViewSchema } from "@ai-quiz/contracts";
import { correctAnswersFromPublicQuiz } from "../support/fixture-answers";

function captureHttpLogs() {
  const lines: string[] = [];
  const push = (message: unknown) => {
    if (typeof message === "string") {
      lines.push(message);
    }
  };
  jest.spyOn(Logger.prototype, "log").mockImplementation(push);
  jest.spyOn(Logger.prototype, "warn").mockImplementation(push);
  jest.spyOn(Logger.prototype, "error").mockImplementation(push);
  return {
    lines,
    records(): Array<Record<string, unknown>> {
      return lines.flatMap((line) => {
        try {
          const parsed = JSON.parse(line) as unknown;
          if (parsed && typeof parsed === "object" && "requestId" in parsed) {
            return [parsed as Record<string, unknown>];
          }
        } catch {
          return [];
        }
        return [];
      });
    },
  };
}

describe("quiz observability", () => {
  let app: INestApplication;

  afterEach(async () => {
    jest.restoreAllMocks();
    await app?.close();
  });

  it("records fetch error without a successful generation stage", async () => {
    const telemetry = new RecordingTelemetryPort();
    const source: MarkdownSourcePort = {
      fetch: async () => {
        throw new ApplicationError("SOURCE_FETCH_FAILED", "dns failed");
      },
    };
    const generation: QuizGenerationPort = { generate: jest.fn() };
    app = await createApiApp({ source, generation, telemetry });
    const response = await request(app.getHttpServer()).post("/v1/quizzes").send(CREATE_BODY);
    expect(response.status).toBe(502);
    expect(response.body).toMatchObject({ code: "SOURCE_FETCH_FAILED" });
    expect(telemetry.stages.filter((stage) => stage.name === "generation" && stage.outcome === "ok")).toHaveLength(0);
    expect(telemetry.stages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "fetch", outcome: "error", errorCode: "SOURCE_FETCH_FAILED" }),
      ]),
    );
    expect(generation.generate).not.toHaveBeenCalled();
  });

  it("leaves zero ready rows when generation retries exhaust", async () => {
    const telemetry = new RecordingTelemetryPort();
    const generation: QuizGenerationPort = {
      generate: async () => ({ questions: [] }),
    };
    app = await createApiApp({ generation, telemetry });
    const before = await testPrisma().quiz.count({ where: { status: "ready" } });
    const response = await request(app.getHttpServer()).post("/v1/quizzes").send(CREATE_BODY);
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "GENERATION_RETRIES_EXHAUSTED" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(before);
    expect(telemetry.stages.filter((stage) => stage.name === "generation")).toHaveLength(3);
  });

  it("records fetch preprocessing generation validation on success", async () => {
    const telemetry = new RecordingTelemetryPort();
    app = await createApiApp({ telemetry });
    const response = await request(app.getHttpServer()).post("/v1/quizzes").send(CREATE_BODY);
    expect(response.status).toBe(201);
    const names = telemetry.stages.map((stage) => stage.name);
    expect(names).toEqual(expect.arrayContaining(["fetch", "preprocessing", "generation", "validation"]));
    expect(telemetry.stages.filter((stage) => stage.name === "create-quiz")[0]?.outcome).toBe("ok");
  });

  it("assigns, echoes, and replaces x-request-id and logs JSON", async () => {
    const logs = captureHttpLogs();
    const telemetry = new RecordingTelemetryPort();
    app = await createApiApp({ telemetry });
    const server = app.getHttpServer();

    const omitted = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(omitted.status).toBe(201);
    const assigned = omitted.headers["x-request-id"];
    expect(typeof assigned).toBe("string");
    expect(assigned.length).toBeGreaterThanOrEqual(8);
    const createLog = logs.records().find((record) => record.path === "/v1/quizzes" && record.status === 201);
    expect(createLog?.requestId).toBe(assigned);
    expect(createLog).toEqual(
      expect.objectContaining({
        method: "POST",
        path: "/v1/quizzes",
        status: 201,
        durationMs: expect.any(Number),
        timestamp: expect.any(String),
        level: "info",
      }),
    );

    const echoed = await request(server)
      .post("/v1/quizzes")
      .set("x-request-id", "demo-trace-0001")
      .send(CREATE_BODY);
    expect(echoed.headers["x-request-id"]).toBe("demo-trace-0001");

    const malformed = await request(server).post("/v1/quizzes").set("x-request-id", "bad id").send(CREATE_BODY);
    expect(malformed.headers["x-request-id"]).not.toBe("bad id");
    expect(typeof malformed.headers["x-request-id"]).toBe("string");

    const health = await request(server).get("/health");
    expect(health.status).toBe(200);
    expect(typeof health.headers["x-request-id"]).toBe("string");
    expect(health.headers["x-request-id"].length).toBeGreaterThanOrEqual(8);
  });

  it("logs failed creates with code and warn or error level", async () => {
    const logs = captureHttpLogs();
    const generation: QuizGenerationPort = {
      generate: async () => {
        throw new ApplicationError("GENERATION_UPSTREAM_FAILED", "generation is not configured");
      },
    };
    app = await createApiApp({ generation });
    const response = await request(app.getHttpServer()).post("/v1/quizzes").send(CREATE_BODY);
    expect(response.status).toBe(502);
    const record = logs.records().find((item) => item.code === "GENERATION_UPSTREAM_FAILED");
    expect(record).toEqual(
      expect.objectContaining({
        code: "GENERATION_UPSTREAM_FAILED",
        status: 502,
        level: "error",
        requestId: response.headers["x-request-id"],
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain("sk-");
    expect(JSON.stringify(response.body)).not.toMatch(/prompt/i);
  });

  it("redacts bearer tokens, secrets, and option ids from logs and telemetry", async () => {
    const logs = captureHttpLogs();
    const telemetry = new RecordingTelemetryPort();
    app = await createApiApp({ telemetry, generation: new FixedGenerationAdapter() });
    const server = app.getHttpServer();
    const created = await request(server).post("/v1/quizzes").send(CREATE_BODY);
    expect(created.status).toBe(201);
    const quiz = publicQuizViewSchema.parse((await request(server).get(`/v1/quizzes/${created.body.id}`)).body);
    const started = await request(server).post(`/v1/quizzes/${created.body.id}/attempts`);
    const answers = correctAnswersFromPublicQuiz(quiz);
    await request(server)
      .post(`/v1/attempts/${started.body.attemptId}/submit`)
      .set(bearer("secret-token-value"))
      .send({ answers });

    const blob = `${logs.lines.join("\n")}\n${JSON.stringify({ stages: telemetry.stages, events: telemetry.events })}`;
    expect(blob).not.toContain("secret-token-value");
    expect(blob).not.toMatch(/sk-[A-Za-z0-9]/);
    for (const answer of answers) {
      for (const optionId of answer.selectedOptionIds) {
        expect(JSON.stringify({ stages: telemetry.stages, events: telemetry.events })).not.toContain(optionId);
      }
    }
  });
});
