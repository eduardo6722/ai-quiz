import { redactSensitive } from "./redact-sensitive";

const MAX_LOG_CHARS = 280;

export function sanitizeLogText(value: string, maxLength = MAX_LOG_CHARS): string {
  return redactSensitive(value, maxLength);
}
