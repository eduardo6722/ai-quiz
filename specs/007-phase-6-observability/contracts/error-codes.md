# Error codes (Phase 6 additions)

Stable string codes. Fail closed. Do not leak stack traces, Prisma traces, provider traces, prompts, tokens, hashes, API keys or answer keys.

Body shape unchanged: `{ "code": "<CODE>", "message": "<English, non-secret>" }`.

Phase 2 and Phase 3 codes remain with the same HTTP mapping ([Phase 3 error-codes.md](../../005-phase-3-markdown-generation/contracts/error-codes.md)). This cycle adds two operational codes.

| Code | HTTP | Meaning |
| ---- | ---- | ------- |
| `REQUEST_RATE_LIMITED` | 429 | This client identity already used 5 `POST /v1/quizzes` attempts in the last 60 seconds. **No** source fetch and **no** model call for this request. |
| `GENERATION_CONCURRENCY_LIMIT` | 503 | The API process already has 2 create-quiz executions in flight. **No** source fetch and **no** model call for this request. |

Suggested English messages (non-secret):

- `REQUEST_RATE_LIMITED` — `too many quiz creates, try again shortly`
- `GENERATION_CONCURRENCY_LIMIT` — `generation is busy, try again shortly`

`Retry-After` is not required this phase.

Existing codes keep their meaning, including `GENERATION_RETRIES_EXHAUSTED` (3 attempts) and fetch/SSRF codes. Limits do **not** replace those failures: a request that is allowed through the limiter still maps Phase 3 codes as before.

Correlation: error responses MUST still include `x-request-id` ([correlation.md](./correlation.md)). The JSON body does **not** need a `requestId` field.
