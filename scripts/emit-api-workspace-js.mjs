#!/usr/bin/env node
/**
 * Production-image helper: emit JavaScript for workspace packages the API
 * loads at runtime. Node 24 will not strip TypeScript under node_modules.
 * Mutates package.json exports in the image only; do not run against a
 * developer checkout you intend to keep as TypeScript sources.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const packages = [
  { rel: "packages/domain", types: [] },
  { rel: "packages/contracts", types: [] },
  { rel: "packages/application", types: ["node"] },
  { rel: "evals", types: ["node"] },
];

for (const { rel, types } of packages) {
  const pkgDir = join(root, rel);
  const tsconfigPath = join(pkgDir, "tsconfig.runtime-emit.json");
  writeFileSync(
    tsconfigPath,
    `${JSON.stringify(
      {
        extends: "./tsconfig.json",
        compilerOptions: {
          noEmit: false,
          outDir: "dist",
          rootDir: "src",
          declaration: false,
          declarationMap: false,
          sourceMap: false,
          types,
        },
        exclude: ["src/**/*.spec.ts", "src/**/*.test.ts", "dist"],
      },
      null,
      2,
    )}\n`,
  );

  const result = spawnSync("pnpm", ["exec", "tsc", "-p", tsconfigPath], {
    cwd: root,
    stdio: "inherit",
  });
  rmSync(tsconfigPath, { force: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const { rel } of packages) {
  const pkgJsonPath = join(root, rel, "package.json");
  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  pkg.exports = { ".": "./dist/index.js" };
  pkg.main = "./dist/index.js";
  pkg.files = ["dist"];
  writeFileSync(pkgJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
}
