const preset = require("@ai-quiz/config/jest.preset.cjs");

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@ai-quiz/domain$": "<rootDir>/../domain/src/index.ts",
    "^@ai-quiz/contracts$": "<rootDir>/../contracts/src/index.ts",
  },
};
