import { ApplicationError } from "@ai-quiz/application";
import {
  FetchTimeoutError,
  FetchTooLargeError,
  type FetchGetOptions,
  type FetchGetResult,
  type FetchTransport,
} from "./fetch-transport";
import { HttpsMarkdownSourceAdapter } from "./https-markdown-source.adapter";

const MARKDOWN = `# Express\n\n${"Routing maps HTTP methods to handler functions. ".repeat(8)}`;

function okResult(overrides: Partial<FetchGetResult> = {}): FetchGetResult {
  return {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" },
    body: Buffer.from(MARKDOWN, "utf8"),
    ...overrides,
  };
}

function fakeTransport(input: {
  lookup?: FetchTransport["lookup"];
  get?: FetchTransport["get"];
}): FetchTransport {
  return {
    lookup: input.lookup ?? (async () => [{ address: "8.8.8.8", family: 4 }]),
    get: input.get ?? (async () => okResult()),
  };
}

async function expectCode(run: () => Promise<unknown>, code: string): Promise<void> {
  await expect(run()).rejects.toBeInstanceOf(ApplicationError);
  await expect(run()).rejects.toMatchObject({ code });
}

describe("HttpsMarkdownSourceAdapter", () => {
  it("rejects loopback, private, and link-local DNS answers", async () => {
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({ lookup: async () => [{ address: "127.0.0.1", family: 4 }] }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({ lookup: async () => [{ address: "10.0.0.1", family: 4 }] }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({ lookup: async () => [{ address: "169.254.169.254", family: 4 }] }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({ lookup: async () => [{ address: "::ffff:7f00:1", family: 6 }] }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
  });

  it("rejects http redirects and redirects to a private IP", async () => {
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({
            get: async () =>
              okResult({ status: 302, headers: { location: "http://example.com/README.md" } }),
          }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({
            get: async () =>
              okResult({ status: 302, headers: { location: "https://127.0.0.1/README.md" } }),
          }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
  });

  it("rejects a fourth redirect", async () => {
    const get = jest.fn(async () =>
      okResult({ status: 302, headers: { location: "https://example.com/next.md" } }),
    );
    await expect(
      new HttpsMarkdownSourceAdapter(fakeTransport({ get })).fetch("https://example.com/README.md"),
    ).rejects.toMatchObject({ code: "SOURCE_FETCH_FAILED" });
    expect(get).toHaveBeenCalledTimes(4);
  });

  it("maps timeout and oversized bodies", async () => {
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({
            get: async () => {
              throw new FetchTimeoutError();
            },
          }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_TIMEOUT",
    );
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({
            get: async () => {
              throw new FetchTooLargeError();
            },
          }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_TOO_LARGE",
    );
  });

  it("rejects html content types", async () => {
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter(
          fakeTransport({
            get: async () => okResult({ headers: { "content-type": "text/html" } }),
          }),
        ).fetch("https://example.com/README.md"),
      "SOURCE_UNSUPPORTED_TYPE",
    );
  });

  it("rejects http, userinfo, and non-443 URLs without calling the transport", async () => {
    const lookup = jest.fn();
    const get = jest.fn();
    const adapter = new HttpsMarkdownSourceAdapter({ lookup, get });
    await expectCode(() => adapter.fetch("http://example.com/README.md"), "SOURCE_UNSAFE_DESTINATION");
    await expectCode(
      () => adapter.fetch("https://user:pass@example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    await expectCode(
      () => adapter.fetch("https://example.com:8443/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    await expectCode(() => adapter.fetch("https://127.0.0.1/README.md"), "SOURCE_UNSAFE_DESTINATION");
    await expectCode(
      () => adapter.fetch("https://[::ffff:7f00:1]/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    await expectCode(
      () => adapter.fetch("https://[::ffff:a9fe:a9fe]/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    expect(lookup).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it("looks up and fetches the raw host for a GitHub blob URL", async () => {
    const lookup = jest.fn(async (host: string) => {
      expect(host).toBe("raw.githubusercontent.com");
      return [{ address: "1.1.1.1", family: 4 as const }];
    });
    const get = jest.fn(async (options: FetchGetOptions) => {
      expect(options.hostname).toBe("raw.githubusercontent.com");
      expect(options.ip).toBe("1.1.1.1");
      expect(options.path).toBe("/expressjs/express/master/Readme.md");
      return okResult({ headers: {} });
    });
    const snapshot = await new HttpsMarkdownSourceAdapter({ lookup, get }).fetch(
      "https://github.com/expressjs/express/blob/master/Readme.md",
    );
    expect(snapshot.originalUrl).toBe("https://github.com/expressjs/express/blob/master/Readme.md");
    expect(snapshot.resolvedUrl).toBe(
      "https://raw.githubusercontent.com/expressjs/express/master/Readme.md",
    );
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("rejects DNS answers that mix a public address with a private one", async () => {
    const get = jest.fn();
    await expectCode(
      () =>
        new HttpsMarkdownSourceAdapter({
          lookup: async () => [
            { address: "8.8.8.8", family: 4 },
            { address: "127.0.0.1", family: 4 },
          ],
          get,
        }).fetch("https://example.com/README.md"),
      "SOURCE_UNSAFE_DESTINATION",
    );
    expect(get).not.toHaveBeenCalled();
  });

  it("pins GET to the looked-up public IP", async () => {
    const get = jest.fn(async (options: FetchGetOptions) => {
      expect(options.ip).toBe("8.8.8.8");
      expect(options.hostname).toBe("example.com");
      return okResult();
    });
    await new HttpsMarkdownSourceAdapter({
      lookup: async () => [{ address: "8.8.8.8", family: 4 }],
      get,
    }).fetch("https://example.com/README.md");
    expect(get).toHaveBeenCalledTimes(1);
  });
});
