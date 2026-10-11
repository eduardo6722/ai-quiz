import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { findEvalsRoot } from "./dataset/paths.js";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("evals import boundaries", () => {
  it("does not import Langfuse, AI SDK, Nest, or Prisma", () => {
    const root = join(findEvalsRoot(), "src");
    const forbidden = /@langfuse\/|from ["']ai["']|@nestjs\/|@prisma\//;
    for (const file of walk(root).filter((path) => path.endsWith(".ts") && !path.endsWith(".spec.ts"))) {
      const source = readFileSync(file, "utf8");
      expect(`${file}:${source}`).not.toMatch(forbidden);
    }
  });
});
