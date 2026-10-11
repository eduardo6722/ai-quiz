import { renderPhase7Report } from "./report.js";
import type { ExperimentRun } from "./types.js";

const run: ExperimentRun = {
  id: "run-1",
  datasetVersion: "1.0.0",
  rubricVersion: "judge-v1",
  evaluatorVersions: { deterministic: "1.0.0", judge: "1.0.0", report: "1.0.0" },
  mode: "mocked",
  startedAt: "2026-10-11T00:00:00.000Z",
  finishedAt: "2026-10-11T00:00:01.000Z",
  caseResults: [
    {
      caseId: "express-routing-5",
      repeatIndex: 1,
      mode: "mocked",
      sourceChecksum: "sha256:" + "a".repeat(64),
      expectedBehavior: "valid-grounded-quiz",
      deterministic: [{ name: "schema", passed: true, detail: "" }],
      blockingFailures: [],
      outcome: "passed",
    },
  ],
  aggregates: { passed: 1, failed: 0, notRun: 0 },
};

describe("renderPhase7Report", () => {
  it("includes required sections and labels mocked rows", () => {
    const body = renderPhase7Report({
      run,
      gates: [{ id: "deterministic", target: "100%", state: "passed", sampleSize: 1, notes: "" }],
      calibration: { state: "not_run", sampleSize: 0, agreement: 0, disagreements: [], notes: "empty" },
      checksums: [
        {
          caseId: "express-routing-5",
          sourceUrl: "https://github.com/expressjs/express/blob/master/Readme.md",
          checksum: "sha256:" + "a".repeat(64),
          topic: "Express routing",
          count: 5,
          expectedBehavior: "valid-grounded-quiz",
        },
      ],
      environmentBlockers: [],
      targetedFixes: "none",
    });
    expect(body).toContain("## 1. Run identity");
    expect(body).toContain("## 11. Scoring attestation");
    expect(body).toContain("mocked");
    expect(body).not.toContain("sk-");
    expect(body).not.toContain("Bearer ");
    expect(body).not.toContain("postgresql://user:pass");
  });
});
