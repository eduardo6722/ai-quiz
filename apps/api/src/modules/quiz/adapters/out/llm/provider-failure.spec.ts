import { summarizeProviderFailure } from "./provider-failure";

describe("summarizeProviderFailure", () => {
  it("classifies OpenAI credit exhaustion from RetryError without reading cause", () => {
    const error = Object.assign(new Error("Failed after 3 attempts. Last error: You have no credits remaining."), {
      name: "AI_RetryError",
      lastError: Object.assign(new Error("You have no credits remaining. Add credits to continue using the API."), {
        name: "AI_APICallError",
        statusCode: 429,
        cause: "sk-live-secret",
      }),
    });
    const summary = summarizeProviderFailure(error);
    expect(summary.kind).toBe("quota");
    expect(summary.statusCode).toBe(429);
    expect(summary.clientMessage).toBe("model provider quota exceeded");
    expect(JSON.stringify(summary)).not.toContain("sk-live-secret");
  });

  it("maps invalid keys to credentials without retryable client copy", () => {
    const summary = summarizeProviderFailure(
      Object.assign(new Error("Incorrect API key provided"), { name: "AI_APICallError", statusCode: 401 }),
    );
    expect(summary.kind).toBe("credentials");
    expect(summary.clientMessage).toBe("model provider rejected credentials");
  });
});
