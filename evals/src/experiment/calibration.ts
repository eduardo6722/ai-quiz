import type { HumanLabel } from "./human-labels.js";
import type { CaseResult } from "./types.js";

export type CalibrationSummary = {
  state: "passed" | "failed" | "not_run";
  sampleSize: number;
  agreement: number;
  disagreements: HumanLabel[];
  notes: string;
};

export function summarizeCalibration(input: {
  labels: HumanLabel[];
  caseResults: CaseResult[];
  sourceTagsByCase: Map<string, string[]>;
}): CalibrationSummary {
  if (input.labels.length === 0) {
    return { state: "not_run", sampleSize: 0, agreement: 0, disagreements: [], notes: "no human labels" };
  }

  const labeledCases = new Set(input.labels.map((label) => label.caseId));
  const tags = input.labels.flatMap((label) => input.sourceTagsByCase.get(label.caseId) ?? []);
  const hasExpress = tags.includes("express");
  const hasFastify = tags.includes("fastify");
  const hasSingle = tags.includes("single");
  const hasMultiple = tags.includes("multiple");

  const disagreements = input.labels.filter((label) => label.disagreesWithJudge);
  const unlabeledBlocker = input.caseResults.some(
    (result) => result.blockingFailures.length > 0 && !labeledCases.has(result.caseId),
  );

  if (!hasExpress || !hasFastify || !hasSingle || !hasMultiple || unlabeledBlocker) {
    return {
      state: "not_run",
      sampleSize: input.labels.length,
      agreement: 0,
      disagreements,
      notes: "sample is not stratified or a disagreement/blocker is unlabeled",
    };
  }

  const accepted = input.labels.filter((label) => {
    const verdict = humanOverridesJudge(label);
    return verdict.acceptableRelevance && verdict.acceptableClarity;
  }).length;
  const acceptRate = accepted / input.labels.length;
  const agreed = input.labels.filter((label) => !label.disagreesWithJudge).length;
  return {
    state: acceptRate >= 0.9 ? "passed" : "failed",
    sampleSize: input.labels.length,
    agreement: agreed / input.labels.length,
    disagreements,
    notes:
      disagreements.map((item) => item.notes).filter(Boolean).join("; ") ||
      `${accepted}/${input.labels.length} human-reviewed questions acceptable for relevance and clarity`,
  };
}

export function applyHumanOverrides(caseResults: CaseResult[], labels: HumanLabel[]): CaseResult[] {
  return caseResults.map((result) => {
    const label = labels.find((item) => item.caseId === result.caseId);
    if (label === undefined || !label.disagreesWithJudge) {
      return result;
    }
    const verdict = humanOverridesJudge(label);
    const blockingFailures = [...result.blockingFailures];
    if (
      verdict.blockingKeyFailure &&
      !blockingFailures.includes("wrong-key") &&
      !blockingFailures.includes("unsupported-key")
    ) {
      blockingFailures.push("wrong-key");
    }
    return {
      ...result,
      blockingFailures,
      outcome: blockingFailures.length > 0 && result.outcome !== "not_run" ? "failed" : result.outcome,
    };
  });
}

export function humanOverridesJudge(label: HumanLabel): Pick<
  HumanLabel,
  "acceptableRelevance" | "acceptableClarity" | "blockingKeyFailure"
> {
  return {
    acceptableRelevance: label.acceptableRelevance,
    acceptableClarity: label.acceptableClarity,
    blockingKeyFailure: label.blockingKeyFailure,
  };
}
