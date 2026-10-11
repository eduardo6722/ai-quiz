import { assertDatasetCoverage, loadGoldenDataset } from "./load-dataset.js";

describe("golden-v1 coverage", () => {
  it("meets the Phase 7 coverage contract", () => {
    const loaded = loadGoldenDataset();
    expect(loaded.dataset.cases.length).toBeGreaterThanOrEqual(12);
    expect(loaded.dataset.cases.length).toBeLessThanOrEqual(20);
    expect(loaded.errors).toEqual([]);
    expect(() => assertDatasetCoverage(loaded.dataset.cases)).not.toThrow();
  });
});
