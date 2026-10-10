import { contractsReady } from "./index.js";

describe("contracts shell", () => {
  it("exports a typed ready flag", () => {
    expect(contractsReady).toBe(true);
  });
});
