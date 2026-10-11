import type { TelemetryAttributes, TelemetryPort, TelemetryStageName } from "@ai-quiz/domain";

export class NoOpTelemetryPort implements TelemetryPort {
  async runStage<T>(
    input: { name: TelemetryStageName; attributes?: TelemetryAttributes },
    fn: () => Promise<T>,
  ): Promise<T> {
    void input;
    return fn();
  }

  recordEvent(): void {
    return undefined;
  }
}
