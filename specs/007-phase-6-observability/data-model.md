# Data Model: Phase 6 Observability and Operational Controls

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-11

This phase **does not add PostgreSQL tables or migrations**. Quiz, snapshot, attempt, answer and selection entities stay as in Phases 2–3. The models below are **operational**: they exist in process memory, logs, and traces.

## Entities

### Correlation identity

Joins one HTTP request to structured logs and telemetry stages.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `value` | string | 8–128 visible ASCII characters, no whitespace or control characters. |
| `source` | `incoming` \| `assigned` | `incoming` only when the `x-request-id` header passes validation; otherwise `assigned` (`randomUUID()`). |

**Validation**: Reject malformed incoming values by assigning a new identity; do not echo the unsafe header. Echo the chosen value on every response as `x-request-id`.

**Relationships**: One identity per HTTP request. All stages of that create-quiz share it. Health/ready also carry one.

### Trace

One create-quiz observation (root stage `create-quiz`).

| Field | Type | Rules |
| ----- | ---- | ----- |
| `correlationId` | string | Same as the HTTP identity. |
| `strategy` | string | `balanced` (only public value this phase). |
| `quizId` | uuid string? | Set after persist; omitted on failure before insert. |
| `modelId` | string? | Configured model when generation ran. |
| `promptVersion` | string? | `PROMPT_VERSION` when set; omit when unset. |
| `outcome` | `ok` \| `error` | Root outcome. |
| `durationMs` | number | Wall time of the root stage. |

**Relationships**: Contains ordered stages. Not stored in PostgreSQL.

### Trace stage

Named span inside a trace.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `name` | `create-quiz` \| `fetch` \| `preprocessing` \| `generation` \| `validation` | Required. |
| `attempt` | int? | Generation retry index `1..3`. Required on `generation` stages. |
| `outcome` | `ok` \| `error` | Required. A retried invalid generation is `error` on that attempt; a later attempt may be `ok`. |
| `durationMs` | number | Required. |
| `errorCode` | string? | Stable code when `outcome` is `error` (existing fetch/generation codes). |
| `usage` | `{ inputTokens?: number; outputTokens?: number }`? | Only on `generation`, and only when the model reported usage. Do not invent. |
| `sourceHash` | string? | Snapshot checksum after fetch; never the full Markdown. |
| `topicChars` / `sourceChars` | int? | Counts only. |

**Forbidden attributes**: env secrets, Langfuse keys, `DATABASE_URL`, raw attempt tokens, `Authorization`, selected option ids, `isCorrect`, full prompts, full source text.

**State transitions** (create-quiz):

```text
fetch
  ├─ error → end (no generation)
  └─ ok → preprocessing
            ├─ error (unusable/too large) → end
            └─ ok → generation (attempt 1..3)
                      ├─ error + retries left → generation (next attempt)
                      ├─ error + exhausted → end (GENERATION_RETRIES_EXHAUSTED / UPSTREAM)
                      └─ ok → validation
                                ├─ error → generation (next attempt) or end
                                └─ ok → persist → quizId set → end ok
```

### Telemetry boundary

Replaceable port. Not persisted.

| Implementation | When used |
| -------------- | --------- |
| `NoOpTelemetryPort` | Product path without Langfuse keys; default if unconfigured. |
| `RecordingTelemetryPort` | Unit and E2E assertions. |
| `LangfuseTelemetryAdapter` | Product path when public+secret keys are both non-empty. |

Domain and application depend only on the port type.

### Structured log record

One JSON object per HTTP request (success or failure).

| Field | Type | Rules |
| ----- | ---- | ----- |
| `timestamp` | string | ISO-8601. |
| `level` | `info` \| `warn` \| `error` | `error` for HTTP ≥500; `warn` for 4xx; `info` otherwise. |
| `requestId` | string | Correlation identity. |
| `method` | string | HTTP method. |
| `path` | string | Route path after redaction (no bearer tokens in query; quiz MVP does not put tokens in the URL). |
| `status` | int | HTTP status. |
| `durationMs` | number | |
| `code` | string? | Stable error code when the response is an error body. |

**Forbidden**: same denylist as traces.

### Client identity

Key for the create-quiz rate window.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `value` | string | `req.ip` (network peer). Missing IP → `"unknown"` (still rate-limited as one bucket). |

Must not be a client-supplied header (spoofing would bypass FR-007). Concurrency does not use this key.

### Rate window

In-process sliding window per client identity.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `clientId` | string | Client identity. |
| `attemptedAt` | timestamp[] | Timestamps of create-quiz **attempts** in the last 60 seconds. |
| `limit` | 5 | Hardcoded. |
| `windowMs` | 60_000 | Hardcoded. |

**Transitions**: On `POST /v1/quizzes`, drop timestamps older than 60s. If `length >= 5`, reject with `REQUEST_RATE_LIMITED` (do not start fetch/generation). Else append `now` and proceed to the concurrency gate.

### Generation slot

Process-global in-flight counter.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `inFlight` | int | `0..2`. |
| `max` | 2 | Hardcoded. |

**Transitions**: After the rate window allows the request, if `inFlight >= 2` → `GENERATION_CONCURRENCY_LIMIT` (no fetch/generation). Else `inFlight += 1`, run create-quiz, `inFlight -= 1` in `finally` (success or failure).

### Prompt version label

Optional configuration, not a secret.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `PROMPT_VERSION` | string? | Present on traces when non-empty. Must not be the full system prompt. Default: omit. |

### Redaction rule

Pure function over strings (and recursively over attribute values).

| Pattern | Replacement |
| ------- | ----------- |
| OpenAI-shaped `sk-…` | `[redacted]` |
| Langfuse `sk-lf-…` / `pk-lf-…` | `[redacted]` |
| `Bearer` + token | `Bearer [redacted]` |
| `postgres(ql)://user:pass@…` | URL with password removed / `[redacted]` |
| Length over 280 characters (logs) | Truncate with ellipsis |

Apply before writing logs or telemetry attributes.

## Unchanged product entities

`SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, `AttemptAnswer` — no new fields required. Optional `GeneratedQuiz.usage` is a **port return shape**, not a Prisma column.

## Validation summary

| Event | Stored quiz | Trace | HTTP |
| ----- | ----------- | ----- | ---- |
| Rate limited | none | optional root with `REQUEST_RATE_LIMITED` (no fetch stage) | 429 |
| Concurrency limited | none | optional root with `GENERATION_CONCURRENCY_LIMIT` | 503 |
| Fetch failure | none | fetch `error` | existing SOURCE_* |
| Generation retries exhausted | none | three generation `error` stages | 422 `GENERATION_RETRIES_EXHAUSTED` |
| Success | ready quiz | all stages `ok`, `quizId` set | 201 |

Limiter rejections occur **before** `CreateQuizUseCase.execute`, so source and generation ports must not be invoked.
