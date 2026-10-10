import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("hexagonal ESLint boundaries", () => {
  it("forbids packages/domain from importing @nestjs/core", () => {
    const source = readFileSync(join(__dirname, "../hexagonal.cjs"), "utf8");
    expect(source).toContain('name: "@nestjs/core"');
  });
});
