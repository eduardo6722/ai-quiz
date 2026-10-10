/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/jest.env.cjs"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          jsx: "react-jsx",
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
        },
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@ai-quiz/ui$": "<rootDir>/../../packages/ui/src/index.ts",
    "^@ai-quiz/contracts$": "<rootDir>/../../packages/contracts/src/index.ts",
    "^.+\\.css$": "<rootDir>/css-stub.cjs",
  },
};
