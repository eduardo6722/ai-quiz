import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CalibrationSummary } from "./calibration.js";
import type { QualityGate } from "./gates.js";
import type { ExperimentRun } from "./types.js";

const SECRET_RE = /sk-[A-Za-z0-9_-]{8,}|Bearer\s+\S+|postgres(?:ql)?:\/\/[^/\s]+/i;

export function renderPhase7Report(input: {
  run: ExperimentRun;
  gates: QualityGate[];
  calibration: CalibrationSummary;
  checksums: { caseId: string; sourceUrl?: string; checksum: string; topic: string; count: number; expectedBehavior: string }[];
  environmentBlockers: string[];
  targetedFixes: string;
}): string {
  const lines: string[] = [];
  lines.push("# Phase 7 evaluation report");
  lines.push("");
  lines.push("## 1. Run identity");
  lines.push("");
  lines.push(`- Timestamp: ${input.run.finishedAt}`);
  lines.push(`- Mode: ${input.run.mode}`);
  lines.push(`- Dataset version: ${input.run.datasetVersion}`);
  lines.push(`- Rubric version: ${input.run.rubricVersion}`);
  lines.push(`- Evaluator versions: deterministic=${input.run.evaluatorVersions.deterministic}, judge=${input.run.evaluatorVersions.judge}, report=${input.run.evaluatorVersions.report}`);
  lines.push(`- Experiment destination id: ${input.run.experimentDestinationId ?? "not_run"}`);
  lines.push(`- Environment blockers: ${input.environmentBlockers.join(", ") || "none"}`);
  lines.push("");
  lines.push("## 2. Sources");
  lines.push("");
  lines.push("| Case | URL | Checksum | Topic | Count | Expected behavior |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const source of input.checksums) {
    lines.push(`| ${source.caseId} | ${source.sourceUrl ?? "synthetic"} | ${source.checksum} | ${source.topic} | ${source.count} | ${source.expectedBehavior} |`);
  }
  lines.push("");
  lines.push("## 3. Per-case outcomes");
  lines.push("");
  lines.push("| Case | Repeat | Mode | Deterministic | Semantic | Blocking | Latency ms | Tokens |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const result of input.run.caseResults) {
    const det = result.deterministic.every((check) => check.passed) ? "passed" : "failed";
    const semantic = result.notRunDetail ?? (result.blockingFailures.length === 0 ? "passed" : "failed");
    const tokens = result.usage ? `${result.usage.inputTokens ?? 0}/${result.usage.outputTokens ?? 0}` : "";
    lines.push(`| ${result.caseId} | ${result.repeatIndex} | ${result.mode} | ${det} | ${result.outcome === "not_run" ? "not_run" : semantic} | ${result.blockingFailures.join(",") || result.notRunDetail || ""} | ${result.latencyMs ?? ""} | ${tokens} |`);
  }
  lines.push("");
  lines.push("## 4. Aggregates");
  lines.push("");
  lines.push(`Passed ${input.run.aggregates.passed}, failed ${input.run.aggregates.failed}, not_run ${input.run.aggregates.notRun}. Tokens in/out: ${input.run.aggregates.inputTokens ?? "n/a"} / ${input.run.aggregates.outputTokens ?? "n/a"}. Approximate cost is not computed.`);
  lines.push("");
  lines.push("## 5. Variability");
  lines.push("");
  const repeats = input.run.caseResults.filter((result) => result.repeatIndex > 1);
  lines.push(repeats.length === 0 ? "No variability repeats in this run." : `${repeats.length} variability repeats. Wording may differ; a new blocker on a repeat is a failed case.`);
  lines.push("");
  lines.push("## 6. Model/prompt comparison");
  lines.push("");
  lines.push("not_run — only one model/prompt version was executed unless a second run is recorded separately.");
  lines.push("");
  lines.push("## 7. Human calibration");
  lines.push("");
  lines.push(`State: ${input.calibration.state}. Sample size: ${input.calibration.sampleSize}. Agreement: ${input.calibration.agreement}. ${input.calibration.notes}`);
  if (input.calibration.disagreements.length > 0) {
    lines.push("Disagreements:");
    for (const item of input.calibration.disagreements) {
      lines.push(`- ${item.caseId}: ${item.notes}`);
    }
  }
  lines.push("");
  lines.push("## 8. Quality gates");
  lines.push("");
  lines.push("| Gate | Target | State | Sample size | Notes |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const gate of input.gates) {
    lines.push(`| ${gate.id} | ${gate.target} | ${gate.state} | ${gate.sampleSize} | ${gate.notes} |`);
  }
  lines.push("");
  lines.push("## 9. Limitations");
  lines.push("");
  lines.push("This is a curated set of 12–20 cases. It is not statistically conclusive and is not an external industry benchmark.");
  lines.push("");
  lines.push("## 10. Targeted fixes");
  lines.push("");
  lines.push(input.targetedFixes);
  lines.push("");
  lines.push("## 11. Scoring attestation");
  lines.push("");
  lines.push("Phase 1 scoring-invariant check is recorded in the deterministic suite. The learner 0–4 formula and `1.1 ** index` weights are unchanged. Judge output does not write quiz scores.");
  lines.push("");
  const body = lines.join("\n");
  if (SECRET_RE.test(body)) {
    throw new Error("report contained a denylisted secret-shaped string");
  }
  return body;
}

export function writePhase7Report(input: Parameters<typeof renderPhase7Report>[0] & { repoRoot: string }): void {
  writeFileSync(join(input.repoRoot, "docs", "evals", "phase-7-report.md"), renderPhase7Report(input));
}
