# Phase 6 Research

**Feature**: Phase 6 Observability and Operational Controls  
**Date**: 2026-10-11  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution, `roadmap.md`, `implementation-roadmap.md` and the Phase 6 spec bind behavior. Reuse the verified MVP; do not re-scaffold, re-grade, add a second generation strategy, CI/CD, or production containers.

---

## 1. Telemetry sits on a domain port; Langfuse is an API adapter

**Decision**: Add `TelemetryPort` to `@ai-quiz/domain`. `CreateQuizUseCase` orchestrates named stages through that port. The Langfuse SDK (JS/TS v5: `@langfuse/tracing` + `@langfuse/otel` + `@opentelemetry/sdk-node`) lives only in `apps/api`.

Port shape (minimal):

```ts
runStage<T>(input: { name: TelemetryStageName; attributes?: TelemetryAttributes }, fn: () => Promise<T>): Promise<T>
recordEvent(input: { name: string; attributes?: TelemetryAttributes }): void
```

Stages: `create-quiz` (root), `fetch`, `preprocessing`, `generation`, `validation`. Each generation retry is another `generation` stage with `attempt` 1–3. The adapter records outcome, duration, and rethrows. A `NoOpTelemetryPort` (application test helper) just runs `fn`. A `RecordingTelemetryPort` captures stages for assertions. Product composition wires `LangfuseTelemetryAdapter` when public+secret keys are non-empty, otherwise `NoOpTelemetryPort`.

**Rationale**: Constitution I already lists a telemetry port and forbids Langfuse imports in domain/application. Fetch/preprocess/generate/validate/retry currently live in `CreateQuizUseCase`, so wrapping only HTTP adapters would miss stages. DIP keeps Jest application tests free of OTEL.

**Alternatives considered**:

- Trace only in Nest interceptors — cannot see preprocess/validate/retry as distinct stages (FR-001).
- Decorator wrappers on `MarkdownSourcePort` / `QuizGenerationPort` only — misses application validation and retry policy.
- Full OpenTelemetry auto-instrumentation of Nest/pg — leaks SQL and HTTP internals into Langfuse and adds a global SDK the constitution says to omit unless needed. Manual observations from the port adapter are enough.
- Call Langfuse directly from the LLM adapter — couples one vendor to generation and skips fetch/preprocess.

---

## 2. Langfuse v5 observations without failing create-quiz

**Decision**: Initialize the Langfuse OTEL processor **only when** `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are both non-empty. `LANGFUSE_BASE_URL` is optional (vendor default when omitted).

- Root `create-quiz` observation; child spans for fetch/preprocessing/validation; `generation` observations use type `generation` with `model`, `usageDetails` when the model reported tokens.
- Export failures: retry **once**, then log a redacted warning and **drop**. Never throw into the use case.
- Shutdown: `enableShutdownHooks` and flush on process stop.
- Do **not** record full prompts, source Markdown, answer keys, or selected options. Attributes: correlation id, strategy, model id, prompt version label, quiz id (once assigned), attempt index, outcome, duration, source **hash** (already persisted), topic/source **character counts**, usage tokens when present.
- Filter exported spans to Langfuse SDK / this adapter’s observations — no Nest or Prisma auto-instrumentation.

**Rationale**: Spec FR-002/FR-009/FR-004. Constitution: omit Langfuse rather than couple it. v5 is the current JS SDK (rewritten 2026); wrapping it behind the port keeps the vendor replaceable.

**Alternatives considered**:

- Require Langfuse to boot — forbidden (FR-012, SC-005).
- Legacy `langfuse` v3 client — deprecated after v5; not the current docs path.
- Hand-rolled HTTP ingest — extra protocol to maintain for an interview P1.
- Record full generation input in Langfuse — useful for prompt debug, but the spec forbids default logging of source/answers/secrets; hash + counts are enough to diagnose.

---

## 3. Correlation identity via AsyncLocalStorage + `x-request-id`

**Decision**: Nest middleware (API infrastructure) reads `x-request-id`. Reuse when it is visible ASCII, length 8–128, no whitespace or control characters; otherwise assign `randomUUID()`. Store in `AsyncLocalStorage`. Echo on **every** response, including errors and `/health`/`/ready`. `LangfuseTelemetryAdapter` and structured logs read the store; `CreateQuizUseCase` does **not** take a correlation id argument.

Malformed incoming values are ignored (new id assigned), never reflected back as trusted input.

**Rationale**: Spec FR-005 and assumption (`x-request-id`). Keeping HTTP headers out of application preserves hexagonal boundaries. ALS is process-local and enough for one Nest request.

**Alternatives considered**:

- Pass `correlationId` into every use case — pollutes domain orchestration with HTTP.
- `X-Correlation-Id` as the only name — spec’s informed default is `x-request-id`; one name avoids joining two headers.
- Cookie-based identity — unused by the REST client and the web app.

---

## 4. Structured JSON logs; upgrade existing sanitizer

**Decision**: Keep Nest `Logger`. Change `RequestLoggingInterceptor` (and the HTTP error filter) to emit **one JSON object per request** as the log message: `timestamp`, `level`, `requestId`, `method`, `path` (redacted), `status`, `durationMs`, `code` (stable error code or omitted on success). A human-readable companion line is optional, not sufficient.

Expand `sanitize-log` / a shared `redactSensitive` helper used by logs **and** telemetry attributes:

- `sk-…`, `sk-lf-…`, `pk-lf-…`
- `Bearer …`
- PostgreSQL URLs / password userinfo
- Truncate to a documented max length

Do not log `Authorization`, attempt tokens, selected option ids, `isCorrect`, full prompts, or env secret values.

**Rationale**: Spec FR-004/FR-005. Existing interceptor already logs method/url/status/ms but as unstructured text. Adding pino/`nestjs-pino` would be a new logging stack without a boundary (Constitution II).

**Alternatives considered**:

- pino + nestjs-pino — extra packages; JSON via `JSON.stringify` on the existing logger meets the spec.
- Log only errors — operators could not join a successful create to its trace (US1 scenario 4).

---

## 5. Rate and concurrency limits in the inbound adapter

**Decision**: Implement an in-process `CreateQuizLimiter` in `apps/api` (not a domain port). `QuizController.create` acquires **before** `CreateQuizUseCase.execute` and releases in `finally`.

| Policy | Value | Code | HTTP |
| ------ | ----- | ---- | ---- |
| Create-quiz per client identity | 5 attempts / 60s sliding window | `REQUEST_RATE_LIMITED` | 429 |
| In-flight create-quiz | 2 per API process | `GENERATION_CONCURRENCY_LIMIT` | 503 |

Client identity: `req.ip` (Express / Nest default). Tests use the Supertest peer; do **not** add a spoofable `x-client-id` that could bypass the rate window. The concurrency semaphore is process-global, so spoofed identities cannot add extra in-flight generations.

Rate window counts **attempted** creates (including later fetch/generation failures). Overflow must not call source or generation ports.

Other `/v1` routes and `/health`/`/ready` are **not** under the 5/60 create cap. No Redis, no queue.

**Rationale**: Spec FR-007/FR-008. Constitution forbids extra brokers. Limits are HTTP-abuse controls, not quiz invariants — a domain `RateLimitPort` would be an extra layer with one in-memory adapter.

**Alternatives considered**:

- Redis / rate-limit middleware package — extra infrastructure the interview MVP excludes.
- Apply the 5/60 cap to all routes — would block a learner finishing an attempt (US3 scenario 5) and health polls.
- 429 for both codes — concurrency is capacity, not “too many from this client”; 503 matches “busy, retry shortly.”
- Put the limiter inside `CreateQuizUseCase` — would require a clock/identity port and mix HTTP abuse with quiz orchestration.

---

## 6. Two new error codes; existing map upgraded

**Decision**: Add `REQUEST_RATE_LIMITED` and `GENERATION_CONCURRENCY_LIMIT` to `@ai-quiz/contracts` `ErrorCodes`, `@ai-quiz/application` `ApplicationErrorCode`, and `HttpErrorFilter` status map (429 / 503). English messages: “too many quiz creates, try again shortly” and “generation is busy, try again shortly.” Web `learnerMessageForCode` gains matching sentences so setup does not fall through to the generic internal line. No new screens.

**Rationale**: Spec FR-006. Phase 4 already maps every public code to English; leaving the new codes unmapped would show “Something went wrong” on a documented limit.

**Alternatives considered**:

- Generic `INTERNAL_ERROR` for limits — operators and tests could not prove FR-007/FR-008.
- Skip web copy — allowed by spec (“MAY”), but a one-line map is the existing error path, not a new UI.

---

## 7. Generation usage on the existing port; strategy unchanged

**Decision**: Extend `GeneratedQuiz` with optional `usage?: { inputTokens?: number; outputTokens?: number }` so the OpenAI adapter can return Vercel AI SDK `usage` without the use case importing the SDK. `CreateQuizUseCase` passes usage onto the `generation` stage attributes when present. `QuizGenerationPort` input `strategy` remains `"balanced"` only. No second strategy.

**Rationale**: Spec FR-002 (usage when available) and FR-014 (defer second strategy, preserve the port). Same kind of small port evolution as Phase 3 `modelId`.

**Alternatives considered**:

- Record usage only inside the Langfuse adapter by wrapping `generateText` — would skip the recording telemetry double used in application tests.
- Add `comprehension` this cycle — explicitly deferred.

---

## 8. Health, env, and documentation

**Decision**: Do not change `/health` or `/ready` behavior. Parse optional `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, `PROMPT_VERSION` in `parseApiEnv` without requiring them. Rate/concurrency/fetch/retry numbers stay **hardcoded constants** (same style as Phase 3’s 10s / 512 KiB / 3 attempts) and are **documented** in `.env.example` comments and README.

Gated live inspection: `PHASE6_LIVE_LANGFUSE=1` plus keys, analogous to `PHASE3_LIVE_README`. Default `pnpm test` / `test:e2e` never call Langfuse Cloud.

**Rationale**: Spec FR-011/FR-012/FR-015. Making limits env-tunable is unnecessary for the interview demo and could silently disable the cap.

**Alternatives considered**:

- Fail boot when Langfuse keys are half-set — reasonable, but spec says missing tracing must not fail create; treat incomplete keys as unconfigured (no-op) and log a redacted warning once at startup.
- Readiness checks Langfuse — forbidden (FR-011).

---

## 9. Prerequisite recording vs this plan

**Decision**: This plan designs Phase 6 only. **Implementation must not start** until Phases 4 and 5 are recorded as verified in `implementation-roadmap.md` (or leftover gaps are listed on those phases). Planning artifacts are allowed now. This cycle must not absorb two-source demo work, CI, or Dockerfiles to “close” that gap.

**Rationale**: Spec Prerequisites / Blockers. A generated plan is not a verified delivery (`implementation-roadmap.md`).

**Alternatives considered**:

- Block even planning — the user explicitly requested `/speckit-plan`.
- Fold Phase 5 verification into Phase 6 tasks — expands scope, forbidden.
