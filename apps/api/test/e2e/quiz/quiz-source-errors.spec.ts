import request from "supertest";
import {
  FetchTimeoutError,
  FetchTooLargeError,
  type FetchTransport,
} from "../../../src/quiz/source/fetch-transport";
import { CREATE_BODY, createApiApp } from "../support/create-app";
import { testPrisma } from "../../integration/support/postgres.setup";

const MARKDOWN = `# Title\n\n${"Ports are interfaces the core depends on. ".repeat(8)}`;

function transport(get: FetchTransport["get"]): FetchTransport {
  return {
    lookup: async () => [{ address: "8.8.8.8", family: 4 }],
    get,
  };
}

describe("quiz source errors", () => {
  async function postWith(
    fetchTransport: FetchTransport,
    sourceUrl = CREATE_BODY.sourceUrl,
    extra: Record<string, unknown> = {},
  ) {
    const app = await createApiApp({ fetchTransport });
    try {
      return await request(app.getHttpServer())
        .post("/v1/quizzes")
        .send({ ...CREATE_BODY, sourceUrl, ...extra });
    } finally {
      await app.close();
    }
  }

  function plainText(body: string): FetchTransport {
    return transport(async () => ({
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
      body: Buffer.from(body, "utf8"),
    }));
  }

  it("maps an unsafe destination to 400 SOURCE_UNSAFE_DESTINATION", async () => {
    const response = await postWith(
      transport(async () => {
        throw new Error("must not fetch");
      }),
      "https://127.0.0.1/README.md",
    );
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ code: "SOURCE_UNSAFE_DESTINATION" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps an oversized body to 413 SOURCE_TOO_LARGE", async () => {
    const response = await postWith(
      transport(async () => {
        throw new FetchTooLargeError();
      }),
    );
    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({ code: "SOURCE_TOO_LARGE" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps an unsupported type to 415 SOURCE_UNSUPPORTED_TYPE", async () => {
    const response = await postWith(
      transport(async () => ({
        status: 200,
        headers: { "content-type": "text/html" },
        body: Buffer.from(MARKDOWN, "utf8"),
      })),
    );
    expect(response.status).toBe(415);
    expect(response.body).toMatchObject({ code: "SOURCE_UNSUPPORTED_TYPE" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps a timeout to 504 SOURCE_TIMEOUT", async () => {
    const response = await postWith(
      transport(async () => {
        throw new FetchTimeoutError();
      }),
    );
    expect(response.status).toBe(504);
    expect(response.body).toMatchObject({ code: "SOURCE_TIMEOUT" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps unusable Markdown to 422 SOURCE_UNUSABLE and stores no ready quiz", async () => {
    const response = await postWith(plainText("   too short   "));
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "SOURCE_UNUSABLE" });
    expect(JSON.stringify(response.body)).not.toContain("sk-");
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps an empty Markdown body to 422 SOURCE_UNUSABLE", async () => {
    const response = await postWith(plainText(""));
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "SOURCE_UNUSABLE" });
    expect(JSON.stringify(response.body)).not.toContain("sk-");
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps whitespace-only Markdown to 422 SOURCE_UNUSABLE", async () => {
    const response = await postWith(plainText("   \n\t  "));
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "SOURCE_UNUSABLE" });
    expect(JSON.stringify(response.body)).not.toContain("sk-");
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps a long repeated-sentence body to 422 SOURCE_UNUSABLE", async () => {
    const repeated = "Ports are interfaces the core depends on. ".repeat(12);
    const response = await postWith(plainText(repeated));
    expect(repeated.length).toBeGreaterThan(200);
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "SOURCE_UNUSABLE" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });

  it("maps a one-section source at count 8 to 422 SOURCE_UNUSABLE", async () => {
    const oneSection = `# Setup

Install the widget with npm to add routing helpers to your application.
`;
    const response = await postWith(plainText(oneSection), CREATE_BODY.sourceUrl, {
      questionCount: 8,
    });
    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ code: "SOURCE_UNUSABLE" });
    expect(await testPrisma().quiz.count({ where: { status: "ready" } })).toBe(0);
  });
});
