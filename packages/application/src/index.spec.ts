import { applicationReady } from "./index.js";

describe("application shell", () => {
  it("exports a typed ready flag composed from domain", () => {
    expect(applicationReady).toBe(true);
  });
});
