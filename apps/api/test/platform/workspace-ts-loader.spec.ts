import { spawnSync } from "node:child_process";
import path from "node:path";

describe("workspace TypeScript loader", () => {
  it("loads @ai-quiz/application through Node with .js specifiers mapped to .ts", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--experimental-transform-types",
        "--import",
        "./js-to-ts-register.mjs",
        "--input-type=module",
        "-e",
        "import { gradeAttempt } from '@ai-quiz/application'; if (typeof gradeAttempt !== 'function') process.exit(2);",
      ],
      { cwd: path.resolve(__dirname, "../.."), encoding: "utf8" },
    );

    expect(result.stderr).not.toMatch(/ERR_MODULE_NOT_FOUND/);
    expect(result.status).toBe(0);
  });
});
