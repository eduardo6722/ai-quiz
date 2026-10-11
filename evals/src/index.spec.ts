import { loadGoldenDataset } from "./index.js";

describe("@ai-quiz/evals exports", () => {
  it("loads the golden dataset from the package", () => {
    const loaded = loadGoldenDataset();
    expect(loaded.dataset.id).toBe("golden-v1");
    expect(loaded.dataset.cases.length).toBeGreaterThanOrEqual(12);
  });
});
