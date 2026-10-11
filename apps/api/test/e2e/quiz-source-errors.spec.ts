import request from "supertest";
import {
  FetchTimeoutError,
  FetchTooLargeError,
  type FetchTransport,
} from "../../src/modules/quiz/adapters/out/source-fetch/fetch-transport";
import { CREATE_BODY, createApiApp } from "./create-app";
import { testPrisma } from "../integration/postgres.setup";

const MARKDOWN = `# Title\n\n${"Ports are interfaces the core depends on. ".repeat(8)}`;

function transport(get: FetchTransport["get"]): FetchTransport {
  return {
    lookup: async () => [{ address: "8.8.8.8", family: 4 }],
    get,
  };
}

describe("quiz source errors", () => {
  async function postWith(fetchTransport: FetchTransport, sourceUrl = CREATE_BODY.sourceUrl) {
    const app = await createApiApp({ fetchTransport });
    try {
      return await request(app.getHttpServer())
        .post("/v1/quizzes")
        .send({ ...CREATE_BODY, sourceUrl });
    } finally {
      await app.close();
    }
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
});
