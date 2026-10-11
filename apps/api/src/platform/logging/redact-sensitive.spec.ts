import { redactSensitive } from "./redact-sensitive";

describe("redactSensitive", () => {
  it("redacts OpenAI-shaped sk- keys", () => {
    expect(redactSensitive("key=sk-abcdefghijklmnopqrstuvwxyz")).toContain("[redacted]");
    expect(redactSensitive("key=sk-abcdefghijklmnopqrstuvwxyz")).not.toContain("sk-abcdef");
  });

  it("redacts Langfuse sk-lf- and pk-lf- tokens", () => {
    expect(redactSensitive("sk-lf-secretvalue999")).toBe("[redacted]");
    expect(redactSensitive("pk-lf-publicvalue999")).toBe("[redacted]");
  });

  it("redacts Bearer tokens", () => {
    expect(redactSensitive("Authorization Bearer secret-token-value")).toBe("Authorization Bearer [redacted]");
  });

  it("redacts postgres userinfo passwords", () => {
    expect(redactSensitive("postgresql://user:pass@localhost:5432/ai_quiz")).toBe(
      "postgresql://[redacted]@localhost:5432/ai_quiz",
    );
  });

  it("caps output at 280 characters", () => {
    const redacted = redactSensitive("a".repeat(400));
    expect(redacted.length).toBeLessThanOrEqual(281);
    expect(redacted.endsWith("…")).toBe(true);
  });
});
