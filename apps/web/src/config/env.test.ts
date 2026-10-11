import { parseWebEnv } from "./env";

describe("web environment validation", () => {
  it("accepts an absolute API URL", () => {
    const parsed = parseWebEnv({ NEXT_PUBLIC_API_URL: "http://localhost:3001" });
    expect(parsed.NEXT_PUBLIC_API_URL).toBe("http://localhost:3001");
  });

  it("requires NEXT_PUBLIC_API_URL as an absolute URL", () => {
    expect(() => parseWebEnv({ NEXT_PUBLIC_API_URL: undefined })).toThrow(/NEXT_PUBLIC_API_URL/);
    expect(() => parseWebEnv({ NEXT_PUBLIC_API_URL: "not-a-url" })).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it("does not accept DATABASE_URL on the public schema", () => {
    const parsed = parseWebEnv({
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ai_quiz",
    });
    expect(parsed).toEqual({ NEXT_PUBLIC_API_URL: "http://localhost:3001" });
    expect(parsed).not.toHaveProperty("DATABASE_URL");
  });
});
