const MAX_LOG_CHARS = 280;

export function redactSensitive(value: string, maxLength = MAX_LOG_CHARS): string {
  let next = value.replaceAll("\n", " ").replace(/\s+/g, " ").trim();
  next = next.replace(/sk-lf-[A-Za-z0-9_-]+/gi, "[redacted]");
  next = next.replace(/pk-lf-[A-Za-z0-9_-]+/gi, "[redacted]");
  next = next.replace(/sk-[A-Za-z0-9_-]{8,}/g, "[redacted]");
  next = next.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
  next = next.replace(/postgres(?:ql)?:\/\/[^@\s]+@/gi, (match) => {
    const scheme = match.startsWith("postgresql") ? "postgresql://" : "postgres://";
    return `${scheme}[redacted]@`;
  });
  if (next.length <= maxLength) {
    return next;
  }
  return `${next.slice(0, maxLength)}…`;
}

export function redactAttributes(
  attributes: Record<string, string | number | boolean | undefined>,
): Record<string, string | number | boolean> {
  const next: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) {
      continue;
    }
    next[key] = typeof value === "string" ? redactSensitive(value) : value;
  }
  return next;
}
