import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export function findEvalsRoot(start = process.cwd()): string {
  let dir = resolve(start);
  for (let i = 0; i < 10; i += 1) {
    const herePkg = join(dir, "package.json");
    if (existsSync(herePkg)) {
      try {
        const parsed = JSON.parse(readFileSync(herePkg, "utf8")) as { name?: string };
        if (parsed.name === "@ai-quiz/evals") {
          return dir;
        }
      } catch {
        // keep walking
      }
    }
    const nested = join(dir, "evals", "package.json");
    if (existsSync(nested)) {
      return join(dir, "evals");
    }
    const parent = resolve(dir, "..");
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  throw new Error("evals root not found");
}
