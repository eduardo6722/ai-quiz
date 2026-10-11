import { createRequire } from "node:module";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

const require = createRequire(import.meta.url);
const hexagonal = require("./hexagonal.cjs");

const ignores = [
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/generated/**",
  "**/node_modules/**",
  "**/*.cjs",
  "**/*.min.js",
];

/** Hexagonal import gates for domain and application shells. */
export const hexagonalBoundaries = {
  plugins: { boundaries },
  settings: {
    "boundaries/elements": [
      { type: "domain", pattern: "packages/domain/**" },
      { type: "application", pattern: "packages/application/**" },
      { type: "contracts", pattern: "packages/contracts/**" },
      { type: "ui", pattern: "packages/ui/**" },
      { type: "api", pattern: "apps/api/**" },
      { type: "web", pattern: "apps/web/**" },
    ],
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          { from: "domain", allow: [] },
          { from: "application", allow: ["domain", "contracts"] },
          { from: "contracts", allow: [] },
          { from: "ui", allow: [] },
          { from: "api", allow: ["domain", "application", "contracts"] },
          { from: "web", allow: ["contracts", "ui"] },
        ],
      },
    ],
  },
};

export const frameworkFreeImports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: hexagonal.restrictedPaths,
        patterns: hexagonal.restrictedPatterns,
      },
    ],
  },
};

export default tseslint.config(
  { ignores: [...ignores, "*.cjs", "hexagonal.cjs", "jest.config.cjs", "jest.preset.cjs"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.spec.ts", "**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        jest: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
);
