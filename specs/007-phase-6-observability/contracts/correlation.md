# Correlation identity

Header name: `x-request-id` (case-insensitive on read; send as `x-request-id`).

## Incoming

| Incoming header | Server behavior |
| --------------- | ---------------- |
| Absent | Assign a UUID v4 string. |
| Visible ASCII, length 8–128, no whitespace or control characters | Reuse that value. |
| Any other value (too short, too long, spaces, newlines, non-ASCII controls) | Ignore; assign a UUID v4 string. |

## Outgoing

Every API response MUST include `x-request-id` with the chosen value, including:

- `201` create-quiz
- `4xx`/`5xx` error bodies
- `GET /health` and `GET /ready`

## Join key

The same value MUST appear as:

- HTTP response header `x-request-id`
- Structured log field `requestId` ([structured-logs.md](./structured-logs.md))
- Telemetry attribute `correlationId` on all stages of that request ([telemetry.md](./telemetry.md))

Application use cases MUST NOT parse HTTP headers. The API middleware stores the identity in request-scoped context that the telemetry adapter and logger read.
