import type { CaseResult, ExperimentRecorderPort, ExperimentRun } from "@ai-quiz/evals";
import { redactSensitive } from "../platform/logging/redact-sensitive";

export type LangfuseScore = { name: string; value: number };

export type LangfuseExperimentClient = {
  experiment: {
    run: (input: {
      name: string;
      runName?: string;
      data: unknown[];
      metadata?: Record<string, string>;
      task: (item: { input: unknown }) => Promise<unknown>;
      evaluators?: Array<(args: { output: CaseResult }) => Promise<LangfuseScore | LangfuseScore[]>>;
      runEvaluators?: Array<(args: { itemResults: Array<{ output: CaseResult }> }) => Promise<LangfuseScore>>;
    }) => Promise<{ id?: string; experimentId?: string }>;
  };
};

export class LangfuseExperimentAdapter implements ExperimentRecorderPort {
  private items: CaseResult[] = [];
  private run: ExperimentRun | undefined;
  lastDestinationId?: string;

  constructor(private readonly client: LangfuseExperimentClient) {}

  async recordItem(input: CaseResult): Promise<void> {
    this.items.push(input);
  }

  async recordRun(input: ExperimentRun): Promise<void> {
    this.run = input;
  }

  async flush(): Promise<void> {
    if (this.run === undefined) {
      return;
    }
    const run = this.run;
    const items = this.items;
    const attempt = async () => {
      const result = await this.client.experiment.run({
        name: "phase-7-golden",
        runName: `${run.finishedAt}-${run.mode}`,
        metadata: redactedMetadata({
          datasetVersion: run.datasetVersion,
          rubricVersion: run.rubricVersion,
          mode: run.mode,
        }),
        data: items.map((item) => ({
          input: {
            caseId: item.caseId,
            sourceChecksum: item.sourceChecksum,
            mode: item.mode,
            expectedBehavior: item.expectedBehavior,
          },
        })),
        task: async (row) => {
          const caseId = (row.input as { caseId: string }).caseId;
          return items.find((item) => item.caseId === caseId);
        },
        evaluators: [
          async ({ output }) => ({
            name: "deterministic_pass",
            value: output.deterministic.every((check) => check.passed) ? 1 : 0,
          }),
          async ({ output }) => ({
            name: "blocking_semantic_fail",
            value: output.blockingFailures.length > 0 ? 1 : 0,
          }),
          async ({ output }) => {
            const first = output.judge?.questions[0];
            if (first === undefined) {
              return [];
            }
            return [
              { name: "relevance", value: first.relevance },
              { name: "clarity", value: first.clarity },
              { name: "ambiguity", value: first.ambiguity },
              { name: "distractorQuality", value: first.distractorQuality },
              { name: "coverageContribution", value: first.coverageContribution },
            ];
          },
        ],
        runEvaluators: [
          async ({ itemResults }) => {
            const executed = itemResults.filter((item) => item.output.outcome !== "not_run");
            const passed = executed.filter((item) =>
              item.output.deterministic.every((check) => check.passed),
            ).length;
            return {
              name: "deterministic_rate",
              value: executed.length === 0 ? 0 : passed / executed.length,
            };
          },
          async ({ itemResults }) => ({
            name: "blocking_fail_count",
            value: itemResults.filter((item) => item.output.blockingFailures.length > 0).length,
          }),
        ],
      });
      const destinationId = result.experimentId ?? result.id;
      this.lastDestinationId = destinationId;
      run.experimentDestinationId = destinationId;
    };
    try {
      await attempt();
    } catch {
      try {
        await attempt();
      } catch {
        // drop after one retry
      }
    }
  }
}

export function redactedMetadata(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, redactSensitive(value)]));
}
