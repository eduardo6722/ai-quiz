const preset = require("./jest.preset.cjs");

/** @type {import("jest").Config} */
module.exports = {
  ...preset,
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
};
