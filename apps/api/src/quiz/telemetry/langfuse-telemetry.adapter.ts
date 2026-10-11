import type { OnModuleDestroy } from "@nestjs/common";
import type { TelemetryAttributes, TelemetryPort, TelemetryStageName } from "@ai-quiz/domain";
import { getRequestId } from "../../platform/http/request-context";
import { redactAttributes, redactSensitive } from "../../platform/logging/redact-sensitive";

type ObservationRunner = <T>(
  name: TelemetryStageName,
  attributes: Record<string, string | number | boolean>,
  fn: () => Promise<T>,
) => Promise<T>;

type SpanLike = {
  update: (fields: Record<string, unknown>) => void;
};

export class LangfuseTelemetryAdapter implements TelemetryPort, OnModuleDestroy {
  private exporter:
    | { shutdown: () => Promise<void>; forceFlush?: () => Promise<void> }
    | undefined;

  constructor(
    private readonly options: {
      publicKey: string;
      secretKey: string;
      baseUrl?: string;
      promptVersion?: string;
      observe?: ObservationRunner;
    },
  ) {}

  async runStage<T>(
    input: { name: TelemetryStageName; attributes?: TelemetryAttributes },
    fn: () => Promise<T>,
  ): Promise<T> {
    const correlationId = getRequestId() ?? input.attributes?.correlationId;
    const attributes = redactAttributes({
      ...stringifyAttributes(input.attributes),
      ...(correlationId !== undefined ? { correlationId } : {}),
      ...(this.options.promptVersion ? { promptVersion: this.options.promptVersion } : {}),
    });
    const observe = this.options.observe ?? ((name, attrs, wrapped) => this.defaultObserve(name, attrs, wrapped));
    let invoked = false;
    const wrapped = async (): Promise<T> => {
      invoked = true;
      return fn();
    };
    try {
      return await observe(input.name, attributes, wrapped);
    } catch (error) {
      if (invoked) {
        throw error;
      }
      try {
        return await observe(input.name, attributes, wrapped);
      } catch (retryError) {
        if (invoked) {
          throw retryError;
        }
        return fn();
      }
    }
  }

  recordEvent(input: { name: string; attributes?: TelemetryAttributes }): void {
    const correlationId = getRequestId() ?? input.attributes?.correlationId;
    const attributes = redactAttributes({
      event: input.name,
      ...stringifyAttributes(input.attributes),
      ...(correlationId !== undefined ? { correlationId } : {}),
    });
    void this.emitEvent(input.name, attributes);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.exporter?.forceFlush?.();
      await this.exporter?.shutdown();
    } catch {
      return;
    }
  }

  private async emitEvent(
    name: string,
    attributes: Record<string, string | number | boolean>,
  ): Promise<void> {
    try {
      await this.ensureExporter();
      const tracing = await import("@langfuse/tracing");
      tracing.startObservation(name, { metadata: attributes }, { asType: "event" });
    } catch {
      return;
    }
  }

  private async defaultObserve<T>(
    name: TelemetryStageName,
    attributes: Record<string, string | number | boolean>,
    fn: () => Promise<T>,
  ): Promise<T> {
    await this.ensureExporter();
    let started = false;
    try {
      const tracing = await import("@langfuse/tracing");
      const run = async (span: SpanLike): Promise<T> => {
        started = true;
        span.update({
          metadata: attributes,
          ...(typeof attributes.modelId === "string" ? { model: attributes.modelId } : {}),
          ...usageDetailsFrom(attributes),
        });
        try {
          const result = await fn();
          span.update({ output: { outcome: "ok" }, ...usageFrom(result) });
          return result;
        } catch (error) {
          span.update({
            output: { outcome: "error" },
            level: "ERROR",
            ...(codeOf(error) !== undefined ? { statusMessage: codeOf(error) } : {}),
          });
          throw error;
        }
      };
      if (name === "generation") {
        return await tracing.startActiveObservation(name, run, { asType: "generation" });
      }
      return await tracing.startActiveObservation(name, run);
    } catch (error) {
      if (started) {
        throw error;
      }
      return fn();
    }
  }

  private async ensureExporter(): Promise<void> {
    if (this.exporter !== undefined || this.options.observe !== undefined) {
      return;
    }
    try {
      const [{ NodeSDK }, { LangfuseSpanProcessor }] = await Promise.all([
        import("@opentelemetry/sdk-node"),
        import("@langfuse/otel"),
      ]);
      const processor = new LangfuseSpanProcessor({
        publicKey: this.options.publicKey,
        secretKey: this.options.secretKey,
        baseUrl: this.options.baseUrl,
        mask: ({ data }) => (typeof data === "string" ? redactSensitive(data) : data),
      });
      const sdk = new NodeSDK({ spanProcessors: [processor] });
      sdk.start();
      this.exporter = {
        forceFlush: () => processor.forceFlush(),
        shutdown: async () => {
          await processor.forceFlush();
          await sdk.shutdown();
        },
      };
    } catch {
      this.exporter = {
        shutdown: async () => undefined,
      };
    }
  }
}

function stringifyAttributes(
  attributes: TelemetryAttributes | undefined,
): Record<string, string | number | boolean | undefined> {
  if (attributes === undefined) {
    return {};
  }
  const next: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(attributes)) {
    next[key] = typeof value === "string" ? redactSensitive(value) : value;
  }
  return next;
}

function usageDetailsFrom(
  attributes: Record<string, string | number | boolean>,
): Record<string, unknown> {
  const usageDetails: Record<string, number> = {};
  if (typeof attributes.inputTokens === "number") {
    usageDetails.input = attributes.inputTokens;
  }
  if (typeof attributes.outputTokens === "number") {
    usageDetails.output = attributes.outputTokens;
  }
  return Object.keys(usageDetails).length > 0 ? { usageDetails } : {};
}

function usageFrom(result: unknown): Record<string, unknown> {
  if (typeof result !== "object" || result === null || !("usage" in result)) {
    return {};
  }
  const usage = (result as { usage?: { inputTokens?: number; outputTokens?: number } }).usage;
  if (usage === undefined) {
    return {};
  }
  const usageDetails: Record<string, number> = {};
  if (typeof usage.inputTokens === "number") {
    usageDetails.input = usage.inputTokens;
  }
  if (typeof usage.outputTokens === "number") {
    usageDetails.output = usage.outputTokens;
  }
  return Object.keys(usageDetails).length > 0 ? { usageDetails } : {};
}

function codeOf(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}
