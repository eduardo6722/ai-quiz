import type { ExperimentRecorderPort } from "./experiment-recorder-port.js";

export class NoOpExperimentRecorder implements ExperimentRecorderPort {
  async recordItem(): Promise<void> {}
  async recordRun(): Promise<void> {}
  async flush(): Promise<void> {}
}
