# Structured request logs

Each HTTP request emits **one JSON object** (Nest logger message may be `JSON.stringify` of this object). A free-text line alone is not enough.

## Fields

| Field | Required | Notes |
| ----- | -------- | ----- |
| `timestamp` | yes | ISO-8601 |
| `level` | yes | `info` / `warn` / `error` |
| `requestId` | yes | Same as `x-request-id` |
| `method` | yes | |
| `path` | yes | Route or URL path; redact query secrets if any appear |
| `status` | yes | HTTP status |
| `durationMs` | yes | Integer milliseconds |
| `code` | on errors | Stable contract code when present |

## Redaction

Apply the same helper to log strings and telemetry free-text attributes:

| Pattern | Replacement |
| ------- | ----------- |
| `sk-[A-Za-z0-9_-]{8,}` | `[redacted]` |
| `sk-lf-` / `pk-lf-` tokens | `[redacted]` |
| `Bearer\s+\S+` | `Bearer [redacted]` |
| `postgres(ql)?://[^@]+@` | scheme + `[redacted]@` |

Cap log strings at **280** characters (existing sanitizer). Never log `Authorization` headers, attempt tokens, answer keys, selected option ids, or full prompts.

`GET /health` logs MUST still include `requestId` and MUST NOT show a database or tracer call.

## Levels

| HTTP status | level |
| ----------- | ----- |
| 2xx | `info` |
| 4xx | `warn` |
| 5xx | `error` |
