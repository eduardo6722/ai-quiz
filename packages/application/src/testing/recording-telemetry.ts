import type { TelemetryAttributes, TelemetryPort, TelemetryStageName } from "@ai-quiz/domain";

export type RecordedStage = {
  name: TelemetryStageName;
  attributes: TelemetryAttributes;
  outcome: "ok" | "error";
  durationMs: number;
  errorCode?: string;
};

export type RecordedEvent = {
  name: string;
  attributes?: TelemetryAttributes;
};

export class RecordingTelemetryPort implements TelemetryPort {
  readonly stages: RecordedStage[] = [];
  readonly events: RecordedEvent[] = [];

  async runStage<T>(
    input: { name: TelemetryStageName; attributes?: TelemetryAttributes },
    fn: () => Promise<T>,
  ): Promise<T> {
    const started = Date.now();
    try {
      const result = await fn();
      this.stages.push({
        name: input.name,
        attributes: { ...input.attributes, ...extraFromResult(result) },
        outcome: "ok",
        durationMs: Math.max(0, Date.now() - started),
      });
      return result;
    } catch (error) {
      this.stages.push({
        name: input.name,
        attributes: { ...input.attributes },
        outcome: "error",
        durationMs: Math.max(0, Date.now() - started),
        errorCode: codeOf(error),
      });
      throw error;
    }
  }

  recordEvent(input: { name: string; attributes?: TelemetryAttributes }): void {
    this.events.push({ name: input.name, attributes: input.attributes });
  }
}

function extraFromResult(result: unknown): TelemetryAttributes {
  if (typeof result !== "object" || result === null) {
    return {};
  }
  const record = result as {
    modelId?: unknown;
    contentHash?: unknown;
    usage?: { inputTokens?: number; outputTokens?: number };
  };
  const extra: TelemetryAttributes = {};
  if (typeof record.modelId === "string") {
    extra.modelId = record.modelId;
  }
  if (typeof record.contentHash === "string") {
    extra.sourceHash = record.contentHash;
  }
  if (typeof record.usage?.inputTokens === "number") {
    extra.inputTokens = record.usage.inputTokens;
  }
  if (typeof record.usage?.outputTokens === "number") {
    extra.outputTokens = record.usage.outputTokens;
  }
  return extra;
}

function codeOf(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}
