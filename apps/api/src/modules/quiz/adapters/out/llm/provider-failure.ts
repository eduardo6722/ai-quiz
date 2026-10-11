export type ProviderFailureKind = "quota" | "credentials" | "timeout" | "network" | "unknown";

export type ProviderFailureSummary = {
  kind: ProviderFailureKind;
  name: string;
  statusCode?: number;
  message: string;
  clientMessage: string;
};

export function summarizeProviderFailure(error: unknown): ProviderFailureSummary {
  const name = readString(error, "name") ?? (error instanceof Error ? error.constructor.name : "Error");
  const statusCode = readStatusCode(error);
  const message = collectSafeMessages(error);
  const kind = classifyProviderFailure(message, statusCode);
  return {
    kind,
    name,
    statusCode,
    message,
    clientMessage: clientMessageFor(kind),
  };
}

function clientMessageFor(kind: ProviderFailureKind): string {
  if (kind === "quota") {
    return "model provider quota exceeded";
  }
  if (kind === "credentials") {
    return "model provider rejected credentials";
  }
  return "model provider request failed";
}

function classifyProviderFailure(message: string, statusCode: number | undefined): ProviderFailureKind {
  if (statusCode === 401 || statusCode === 403 || /invalid api key|incorrect api key|unauthorized/i.test(message)) {
    return "credentials";
  }
  if (
    statusCode === 402 ||
    /credits remaining|insufficient[_ ]quota|exceeded your.{0,40}quota|billing/i.test(message)
  ) {
    return "quota";
  }
  if (statusCode === 408 || /abort|timeout|timed out/i.test(message)) {
    return "timeout";
  }
  if (/fetch failed|network|ECONNRESET|ENOTFOUND|ECONNREFUSED/i.test(message)) {
    return "network";
  }
  return "unknown";
}

function collectSafeMessages(error: unknown): string {
  const parts = [readString(error, "message")];
  if (typeof error === "object" && error !== null && "lastError" in error) {
    parts.push(readString((error as { lastError: unknown }).lastError, "message"));
  }
  return parts.filter((part): part is string => part !== undefined && part.length > 0).join(" | ");
}

function readStatusCode(error: unknown): number | undefined {
  const direct = readNumber(error, "statusCode");
  if (direct !== undefined) {
    return direct;
  }
  if (typeof error === "object" && error !== null && "lastError" in error) {
    return readNumber((error as { lastError: unknown }).lastError, "statusCode");
  }
  return undefined;
}

function readString(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined;
}

function readNumber(value: unknown, key: string): number | undefined {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : undefined;
}
