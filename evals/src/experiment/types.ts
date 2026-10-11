import type { QuizJudgeOutput } from "../judge/output-schema.js";

export type CheckResult = {
  name: string;
  passed: boolean;
  detail: string;
};

export type CaseResult = {
  caseId: string;
  repeatIndex: number;
  mode: "live" | "mocked";
  sourceChecksum: string;
  expectedBehavior: string;
  modelId?: string;
  promptVersion?: string;
  latencyMs?: number;
  usage?: { inputTokens?: number; outputTokens?: number };
  deterministic: CheckResult[];
  judge?: QuizJudgeOutput;
  blockingFailures: string[];
  outcome: "passed" | "failed" | "not_run";
  notRunDetail?: string;
};

export type ExperimentRun = {
  id: string;
  datasetVersion: string;
  rubricVersion: string;
  evaluatorVersions: { deterministic: string; judge: string; report: string };
  mode: "live" | "mocked" | "mixed";
  startedAt: string;
  finishedAt: string;
  experimentDestinationId?: string;
  caseResults: CaseResult[];
  aggregates: {
    passed: number;
    failed: number;
    notRun: number;
    inputTokens?: number;
    outputTokens?: number;
  };
};
