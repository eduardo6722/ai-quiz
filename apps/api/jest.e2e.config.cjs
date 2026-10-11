const preset = require("@ai-quiz/config/jest.preset.cjs");

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  rootDir: ".",
  testTimeout: 30000,
  maxWorkers: 1,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript", decorators: true, tsx: false },
          transform: { legacyDecorator: true, decoratorMetadata: true },
          target: "es2022",
        },
        module: { type: "commonjs" },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!.*(@nestjs/|ai/|@ai-sdk/|@workflow/|@langfuse/|@opentelemetry/))"],
  setupFiles: ["<rootDir>/test/jest.setup.ts", "<rootDir>/test/integration/set-test-env.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/integration/postgres.setup.ts"],
  testMatch: ["<rootDir>/test/e2e/**/*.spec.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@ai-quiz/domain$": "<rootDir>/../../packages/domain/src/index.ts",
    "^@ai-quiz/application$": "<rootDir>/../../packages/application/src/index.ts",
    "^@ai-quiz/contracts$": "<rootDir>/../../packages/contracts/src/index.ts",
  },
};
