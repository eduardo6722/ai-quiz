import type { ExperimentRecorderPort } from "../experiment/experiment-recorder-port.js";
import type { CaseResult, ExperimentRun } from "../experiment/types.js";

export class RecordingExperimentRecorder implements ExperimentRecorderPort {
  readonly items: CaseResult[] = [];
  readonly runs: ExperimentRun[] = [];
  flushCalls = 0;

  async recordItem(input: CaseResult): Promise<void> {
    this.items.push(input);
  }

  async recordRun(input: ExperimentRun): Promise<void> {
    this.runs.push(input);
  }

  async flush(): Promise<void> {
    this.flushCalls += 1;
  }
}
