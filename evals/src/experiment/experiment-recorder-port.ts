import type { CaseResult, ExperimentRun } from "./types.js";

export type ExperimentRecorderPort = {
  recordItem(input: CaseResult): Promise<void>;
  recordRun(input: ExperimentRun): Promise<void>;
  flush(): Promise<void>;
};
