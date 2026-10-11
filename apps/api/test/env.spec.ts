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

  it("does not require OPENAI_API_KEY, OPENAI_MODEL, or Langfuse keys to boot", () => {
    const env = parseApiEnv({
      ...valid,
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: undefined,
      LANGFUSE_SECRET_KEY: undefined,
    });
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.OPENAI_MODEL).toBeUndefined();
  });

  it("defaults WEB_ORIGIN to the local web app and rejects an invalid URL", () => {
    const env = parseApiEnv({ ...valid, WEB_ORIGIN: undefined });
    expect(env.WEB_ORIGIN).toBe("http://localhost:3000");
    expect(parseApiEnv({ ...valid, WEB_ORIGIN: "" }).WEB_ORIGIN).toBe("http://localhost:3000");
    expect(() => parseApiEnv({ ...valid, WEB_ORIGIN: "not-a-url" })).toThrow(/WEB_ORIGIN/);
  });

  it("accepts empty OpenAI fields at parse time without printing secrets", () => {
    const env = parseApiEnv({
      ...valid,
      OPENAI_API_KEY: "",
      OPENAI_MODEL: "gpt-4o-mini",
    });
    expect(env.OPENAI_API_KEY).toBe("");
    expect(env.OPENAI_MODEL).toBe("gpt-4o-mini");
    expect(JSON.stringify(env)).not.toMatch(/sk-/);
  });
});
