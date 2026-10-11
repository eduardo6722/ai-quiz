import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadBaseline, newFailedGateIds, writeBaseline } from "./baseline.js";
import type { QualityGate } from "./gates.js";

const passed = (id: string): QualityGate => ({
  id,
  target: "",
  state: "passed",
  sampleSize: 1,
  notes: "",
});

describe("baseline", () => {
  it("loads an accepted baseline and reports newly failed gates", () => {
    const root = mkdtempSync(join(tmpdir(), "evals-baseline-"));
    mkdirSync(join(root, "baselines"), { recursive: true });
    try {
      writeBaseline({
        evalsRoot: root,
        run: {
          id: "run-1",
          datasetVersion: "1.0.0",
          rubricVersion: "judge-v1",
          evaluatorVersions: { deterministic: "1.0.0", judge: "1.0.0", report: "1.0.0" },
          mode: "live",
          startedAt: "t0",
          finishedAt: "t1",
          caseResults: [],
          aggregates: { passed: 1, failed: 0, notRun: 0 },
        },
        gates: [passed("deterministic"), passed("unsupportedKeys"), passed("regression")],
        checksums: {},
      });
      const baseline = loadBaseline(root);
      expect(baseline?.datasetVersion).toBe("1.0.0");
      expect(
        newFailedGateIds(baseline!, [
          { ...passed("deterministic"), state: "failed" },
          passed("unsupportedKeys"),
          passed("regression"),
        ]),
      ).toEqual(["deterministic"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("returns undefined when the baseline file is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "evals-baseline-missing-"));
    try {
      expect(loadBaseline(root)).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
