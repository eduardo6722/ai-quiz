import { parseApiEnv } from "../src/infrastructure/env";

describe("API environment validation", () => {
  const valid = {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ai_quiz",
    PORT: "3001",
    NODE_ENV: "test",
  };

  it("accepts a valid PostgreSQL URL and default port", () => {
    const env = parseApiEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.PORT).toBe(3001);
  });

  it("fails closed when DATABASE_URL is missing and names the key without leaking a secret", () => {
    expect(() => parseApiEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    try {
      parseApiEnv({ ...valid, DATABASE_URL: undefined });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      expect(message).not.toMatch(/postgres:postgres/);
    }
  });

  it("fails closed when DATABASE_URL is malformed and does not log the secret value", () => {
    const secret = "postgresql://super-secret-user:super-secret-pass@localhost:5432/ai_quiz";
    expect(() => parseApiEnv({ ...valid, DATABASE_URL: "not-a-url" })).toThrow(/DATABASE_URL/);
    try {
      parseApiEnv({ ...valid, DATABASE_URL: secret.replace("postgresql", "notaurl") });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      expect(message).not.toContain("super-secret-pass");
    }
  });

  it("does not require OPENAI_API_KEY or Langfuse keys", () => {
    expect(() =>
      parseApiEnv({
        ...valid,
        OPENAI_API_KEY: undefined,
        LANGFUSE_SECRET_KEY: undefined,
      }),
    ).not.toThrow();
  });
});
