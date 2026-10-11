import type { CaseResult, ExperimentRun } from "@ai-quiz/evals";
import { LangfuseExperimentAdapter, redactedMetadata } from "./langfuse-experiment.adapter";

describe("LangfuseExperimentAdapter", () => {
  const item: CaseResult = {
    caseId: "express-routing-5",
    repeatIndex: 1,
    mode: "mocked",
    sourceChecksum: "sha256:" + "a".repeat(64),
    expectedBehavior: "valid-grounded-quiz",
    deterministic: [{ name: "schema", passed: true, detail: "" }],
    blockingFailures: [],
    outcome: "passed",
  };
  const run: ExperimentRun = {
    id: "run-1",
    datasetVersion: "1.0.0",
    rubricVersion: "judge-v1",
    evaluatorVersions: { deterministic: "1.0.0", judge: "1.0.0", report: "1.0.0" },
    mode: "mocked",
    startedAt: "t0",
    finishedAt: "t1",
    caseResults: [item],
    aggregates: { passed: 1, failed: 0, notRun: 0 },
  };

  it("records allowlisted scores and does not throw after one flush retry", async () => {
    const adapter = new LangfuseExperimentAdapter({
      experiment: {
        run: jest.fn().mockRejectedValueOnce(new Error("temp")).mockResolvedValueOnce({ id: "exp-1" }),
      },
    });
    await adapter.recordItem(item);
    await adapter.recordRun(run);
    await expect(adapter.flush()).resolves.toBeUndefined();
    expect(adapter.lastDestinationId).toBe("exp-1");
    const byExperimentId = new LangfuseExperimentAdapter({
      experiment: {
        run: jest.fn().mockResolvedValue({ experimentId: "exp-2" }),
      },
    });
    await byExperimentId.recordItem(item);
    await byExperimentId.recordRun(run);
    await byExperimentId.flush();
    expect(byExperimentId.lastDestinationId).toBe("exp-2");
    const metadata = redactedMetadata({ token: "Bearer secret-token-value", key: "sk-abcdefghijklmnopqrstuvwxyz" });
    expect(metadata.token).toContain("[redacted]");
    expect(metadata.key).toBe("[redacted]");
  });
});
