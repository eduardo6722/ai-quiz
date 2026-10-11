import { readFileSync } from "node:fs";
import { parseEvalArgs, runEvalCli } from "./cli";

describe("eval CLI", () => {
  const env = {
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/ai_quiz",
    NODE_ENV: "test",
  };

  it("parses flags", () => {
    expect(parseEvalArgs(["--mocked", "--skip-judge"])).toEqual({
      mocked: true,
      live: false,
      skipJudge: true,
      repeat: false,
      acceptBaseline: false,
    });
  });

  it("runs --mocked without model keys and labels the report mocked", async () => {
    const result = await runEvalCli({ argv: ["--mocked", "--skip-judge"], env });
    expect(result.exitCode).toBe(0);
    const body = readFileSync(result.reportPath, "utf8");
    expect(body).toContain("mocked");
    expect(body).toContain("## 1. Run identity");
  });

  it("exits non-zero on --live without keys and records not_run", async () => {
    const result = await runEvalCli({ argv: ["--live"], env });
    expect(result.exitCode).toBe(1);
    const body = readFileSync(result.reportPath, "utf8");
    expect(body).toMatch(/not_run|missing-openai-key/);
    expect(body).not.toContain("sk-live-secret");
  });
});
