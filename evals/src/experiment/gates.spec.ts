import { applyHumanOverrides, summarizeCalibration } from "./calibration.js";
import { applyGates } from "./gates.js";
import type { CaseResult } from "./types.js";

function result(overrides: Partial<CaseResult> = {}): CaseResult {
  return {
    caseId: "express-routing-5",
    repeatIndex: 1,
    mode: "live",
    sourceChecksum: "sha256:" + "a".repeat(64),
    expectedBehavior: "valid-grounded-quiz",
    deterministic: [{ name: "schema", passed: true, detail: "" }],
    blockingFailures: [],
    outcome: "passed",
    ...overrides,
  };
}

describe("applyGates", () => {
  it("does not map skip to passed", () => {
    const gates = applyGates({
      caseResults: [result({ outcome: "not_run", notRunDetail: "missing-openai-key" })],
      scoringInvariantPassed: true,
      calibration: { state: "not_run", sampleSize: 0, agreement: 0, disagreements: [], notes: "" },
      baselineExists: false,
    });
    expect(gates.every((gate) => gate.state !== "passed" || gate.id === "deterministic")).toBeTruthy();
    expect(gates.find((gate) => gate.id === "humanRelevanceClarity")?.state).toBe("not_run");
    expect(gates.find((gate) => gate.id === "regression")?.state).toBe("not_run");
  });

  it("fails unsupportedKeys on a schema-valid unsupported-key case", () => {
    const gates = applyGates({
      caseResults: [
        result({
          blockingFailures: ["unsupported-key"],
          outcome: "failed",
          judge: { questions: [], setCoverage: 3, notes: "" },
        }),
      ],
      scoringInvariantPassed: true,
      calibration: { state: "not_run", sampleSize: 0, agreement: 0, disagreements: [], notes: "" },
      baselineExists: false,
    });
    expect(gates.find((gate) => gate.id === "unsupportedKeys")?.state).toBe("failed");
  });

  it("treats wording-only repeats as non-regression when no new blocker appears", () => {
    const gates = applyGates({
      caseResults: [result({ repeatIndex: 1 }), result({ caseId: "express-routing-5", repeatIndex: 2 })],
      scoringInvariantPassed: true,
      calibration: { state: "not_run", sampleSize: 0, agreement: 0, disagreements: [], notes: "" },
      baselineExists: true,
      baselineFailedGates: [],
    });
    expect(gates.find((gate) => gate.id === "regression")?.state).toBe("passed");
  });

  it("fails humanRelevanceClarity and unsupportedKeys from human fields, not the judge", () => {
    const labeled = applyHumanOverrides(
      [result(), result({ caseId: "fastify-plugins-5" })],
      [
        {
          caseId: "express-routing-5",
          runId: "run-1",
          acceptableRelevance: false,
          acceptableClarity: false,
          blockingKeyFailure: true,
          disagreesWithJudge: true,
          notes: "",
        },
        {
          caseId: "fastify-plugins-5",
          runId: "run-1",
          acceptableRelevance: true,
          acceptableClarity: true,
          blockingKeyFailure: false,
          disagreesWithJudge: false,
          notes: "",
        },
      ],
    );
    const calibration = summarizeCalibration({
      labels: [
        {
          caseId: "express-routing-5",
          runId: "run-1",
          acceptableRelevance: false,
          acceptableClarity: false,
          blockingKeyFailure: true,
          disagreesWithJudge: true,
          notes: "",
        },
        {
          caseId: "fastify-plugins-5",
          runId: "run-1",
          acceptableRelevance: true,
          acceptableClarity: true,
          blockingKeyFailure: false,
          disagreesWithJudge: false,
          notes: "",
        },
      ],
      caseResults: labeled,
      sourceTagsByCase: new Map([
        ["express-routing-5", ["express", "single"]],
        ["fastify-plugins-5", ["fastify", "multiple"]],
      ]),
    });
    const gates = applyGates({
      caseResults: labeled,
      scoringInvariantPassed: true,
      calibration,
      baselineExists: false,
    });
    expect(calibration.state).toBe("failed");
    expect(gates.find((gate) => gate.id === "humanRelevanceClarity")?.state).toBe("failed");
    expect(gates.find((gate) => gate.id === "unsupportedKeys")?.state).toBe("failed");
  });
});
