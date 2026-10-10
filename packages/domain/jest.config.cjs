const preset = require("@ai-quiz/config/jest.preset.cjs");

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
};
