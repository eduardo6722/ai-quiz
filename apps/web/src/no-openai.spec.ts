import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseWebEnv } from "./env";

describe("web has no OpenAI surface", () => {
  it("does not parse OPENAI_API_KEY into web env", () => {
    const parsed = parseWebEnv({
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
      OPENAI_API_KEY: "sk-secret",
    });
    expect(parsed).toEqual({ NEXT_PUBLIC_API_URL: "http://localhost:3001" });
    expect(parsed).not.toHaveProperty("OPENAI_API_KEY");
    expect(JSON.stringify(parsed)).not.toContain("sk-");
  });

  it("does not depend on ai or @ai-sdk/openai", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.ai).toBeUndefined();
    expect(pkg.dependencies?.["@ai-sdk/openai"]).toBeUndefined();
    expect(pkg.devDependencies?.ai).toBeUndefined();
    expect(pkg.devDependencies?.["@ai-sdk/openai"]).toBeUndefined();
  });
});
