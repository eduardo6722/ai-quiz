import { applyHumanOverrides, humanOverridesJudge, summarizeCalibration } from "./calibration.js";
import type { HumanLabel } from "./human-labels.js";
import type { CaseResult } from "./types.js";

const baseResult: CaseResult = {
  caseId: "express-routing-5",
  repeatIndex: 1,
  mode: "mocked",
  sourceChecksum: "sha256:" + "a".repeat(64),
  expectedBehavior: "valid-grounded-quiz",
  deterministic: [],
  blockingFailures: [],
  outcome: "passed",
};

describe("calibration", () => {
  it("uses human fields when disagreesWithJudge is true", () => {
    const label = {
      caseId: "express-routing-5",
      runId: "run-1",
      acceptableRelevance: false,
      acceptableClarity: true,
      blockingKeyFailure: true,
      disagreesWithJudge: true,
      notes: "judge missed an extra multi-select option",
    };
    expect(humanOverridesJudge(label).blockingKeyFailure).toBe(true);
    expect(humanOverridesJudge(label).acceptableRelevance).toBe(false);
  });

  it("is not_run when labels are empty", () => {
    const summary = summarizeCalibration({
      labels: [],
      caseResults: [baseResult],
      sourceTagsByCase: new Map([["express-routing-5", ["express", "single"]]]),
    });
    expect(summary.state).toBe("not_run");
  });

  it("is not_run when a source or question type is missing from the sample", () => {
    const summary = summarizeCalibration({
      labels: [
        {
          caseId: "express-routing-5",
          runId: "run-1",
          acceptableRelevance: true,
          acceptableClarity: true,
          blockingKeyFailure: false,
          disagreesWithJudge: false,
          notes: "",
        },
      ],
      caseResults: [baseResult],
      sourceTagsByCase: new Map([["express-routing-5", ["express", "single"]]]),
    });
    expect(summary.state).toBe("not_run");
  });

  it("uses only labeled cases for stratification and the 90% human gate", () => {
    const labels: HumanLabel[] = [
      {
        caseId: "express-routing-5",
        runId: "run-1",
        acceptableRelevance: false,
        acceptableClarity: false,
        blockingKeyFailure: false,
        disagreesWithJudge: false,
        notes: "",
      },
      {
        caseId: "fastify-plugins-5",
        runId: "run-1",
        acceptableRelevance: false,
        acceptableClarity: false,
        blockingKeyFailure: false,
        disagreesWithJudge: false,
        notes: "",
      },
    ];
    const summary = summarizeCalibration({
      labels,
      caseResults: [
        baseResult,
        { ...baseResult, caseId: "fastify-plugins-5" },
      ],
      sourceTagsByCase: new Map([
        ["express-routing-5", ["express", "single"]],
        ["fastify-plugins-5", ["fastify", "multiple"]],
        ["unlabeled-fastify", ["fastify", "multiple"]],
      ]),
    });
    expect(summary.state).toBe("failed");
    expect(summary.sampleSize).toBe(2);
  });

  it("applies human blockingKeyFailure so the case is not a silent judge pass", () => {
    const overridden = applyHumanOverrides(
      [baseResult],
      [
        {
          caseId: "express-routing-5",
          runId: "run-1",
          acceptableRelevance: false,
          acceptableClarity: true,
          blockingKeyFailure: true,
          disagreesWithJudge: true,
          notes: "judge missed an extra multi-select option",
        },
      ],
    );
    expect(overridden[0]?.blockingFailures).toContain("wrong-key");
    expect(overridden[0]?.outcome).toBe("failed");
  });
});
