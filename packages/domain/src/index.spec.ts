import { domainReady } from "./index.js";

describe("domain shell", () => {
  it("exports a typed ready flag", () => {
    expect(domainReady).toBe(true);
  });
});
