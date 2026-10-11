const MAX_LOG_CHARS = 280;

export function sanitizeLogText(value: string, maxLength = MAX_LOG_CHARS): string {
  let next = value.replaceAll("\n", " ").replace(/\s+/g, " ").trim();
  next = next.replace(/sk-[A-Za-z0-9_-]{8,}/g, "[redacted]");
  next = next.replace(/Bearer\s+\S+/gi, "[redacted]");
  if (next.length <= maxLength) {
    return next;
  }
  return `${next.slice(0, maxLength)}…`;
}
