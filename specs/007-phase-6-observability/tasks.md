---
description: "Task list for Phase 6 observability and operational controls (roadmap Phase 6 only)"
---

# Tasks: Phase 6 Observability and Operational Controls

**Input**: Design documents from `/specs/007-phase-6-observability/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 6 — Langfuse and production-hardening (P1). Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap Phase 7.

**Implementation gate**: Do **not** execute these tasks until Phases 4 and 5 are recorded as verified in `implementation-roadmap.md`, **or** leftover Phase 4/5 gaps are listed as blockers of those earlier phases. Do **not** absorb two-source demo work, CI, or production Dockerfiles to close that gap.

**Tests**: Included. Spec FR-015, user stories, Constitution VI, and [quickstart.md](./quickstart.md) require Jest application tests with `RecordingTelemetryPort`, API unit tests for correlation/limiter/redaction/JSON logs, and Jest + Supertest E2E (real PostgreSQL, mocked source/generation, recording telemetry). Write listed tests first and confirm they fail before implementation. Default `pnpm test` MUST NOT require PostgreSQL, `OPENAI_API_KEY`, or Langfuse keys. `pnpm test:e2e` requires `ai_quiz_test`. Live Langfuse file runs only when `PHASE6_LIVE_LANGFUSE=1` and tracing keys are set.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US5`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Domain: `packages/domain/src/`
- Application: `packages/application/src/`
- Contracts: `packages/contracts/src/`
- API: `apps/api/src/`
- Quiz module: `apps/api/src/modules/quiz/`
- Telemetry adapters: `apps/api/src/modules/quiz/adapters/out/telemetry/`
- API tests: `apps/api/test/`
- Web error copy: `apps/web/src/features/quiz/shared/`
- Do **not** add GitHub Actions, production Dockerfiles, a second `strategy` value, new `/v1` routes, Prisma migrations, Redis, or Langfuse evaluations
- Do **not** import `@langfuse/*` or `@opentelemetry/*` from `packages/domain` or `packages/application`
- Do **not** require tracing keys to boot, to pass `/health` or `/ready`, or to complete create-quiz

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directories, Langfuse dependencies on the API only, env comments, and placeholders. Do not reinitialize Spec Kit or overwrite the Constitution.

- [X] T001 Create directories `apps/api/src/modules/quiz/adapters/out/telemetry/` and `apps/api/test/infrastructure/` per [plan.md](./plan.md)
- [X] T002 Add `@langfuse/tracing`, `@langfuse/otel`, and `@opentelemetry/sdk-node` to `apps/api/package.json` with `pnpm --filter @ai-quiz/api add @langfuse/tracing @langfuse/otel @opentelemetry/sdk-node`; do **not** add them to `packages/domain/package.json` or `packages/application/package.json`; do not add Redis, pino, or GitHub Actions
- [X] T003 [P] Document in `.env.example` empty placeholders `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, optional `PROMPT_VERSION`, and comments that create-quiz rate is **5** attempted creates per **60 seconds**, concurrency is **2** in-flight, fetch timeout is **10 seconds**, snapshot max is **512 KiB**, generation retries are **3**; tracing keys MUST NOT be required to boot; do not commit `.env`
- [X] T004 [P] Add typed placeholders `packages/domain/src/ports/telemetry-port.ts`, `packages/application/src/testing/recording-telemetry.ts`, `apps/api/src/modules/quiz/adapters/out/telemetry/noop-telemetry.adapter.ts`, `apps/api/src/modules/quiz/adapters/out/telemetry/langfuse-telemetry.adapter.ts`, `apps/api/src/infrastructure/request-context.ts`, `apps/api/src/infrastructure/request-id.middleware.ts`, `apps/api/src/infrastructure/redact-sensitive.ts`, `apps/api/src/modules/quiz/adapters/in/rest/create-quiz-limiter.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Error codes, telemetry port types, NoOp wiring, optional env, redaction helper, and E2E override hook used by every story. **No user story work until this phase is complete.**

- [X] T005 Extend `ErrorCodes` in `packages/contracts/src/error-codes.ts` with `REQUEST_RATE_LIMITED` and `GENERATION_CONCURRENCY_LIMIT` matching [contracts/error-codes.md](./contracts/error-codes.md); keep Phase 2/3 codes; update `packages/contracts/src/error-codes.spec.ts`
- [X] T006 [P] Extend `ApplicationErrorCode` in `packages/application/src/errors.ts` with the same two codes; do not import Nest or Langfuse
- [X] T007 Map `REQUEST_RATE_LIMITED` → HTTP **429** and `GENERATION_CONCURRENCY_LIMIT` → HTTP **503** in `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.ts`; English messages `too many quiz creates, try again shortly` and `generation is busy, try again shortly`; never include stack, Prisma traces, prompts, tokens, hashes, API keys or `isCorrect`; extend `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.spec.ts`
- [X] T008 Define `TelemetryStageName` (`create-quiz` \| `fetch` \| `preprocessing` \| `generation` \| `validation`), `TelemetryAttributes` (optional `correlationId`, `strategy`, `quizId`, `modelId`, `promptVersion`, `attempt`, `errorCode`, `sourceHash`, `topicChars`, `sourceChars`, `inputTokens`, `outputTokens`), and `TelemetryPort` (`runStage`, `recordEvent`) in `packages/domain/src/ports/telemetry-port.ts` per [contracts/telemetry.md](./contracts/telemetry.md)
- [X] T009 [P] Add optional `usage?: { inputTokens?: number; outputTokens?: number }` to `GeneratedQuiz` in `packages/domain/src/ports/quiz-generation-port.ts`; `strategy` remains `"balanced"` only
- [X] T010 Export `TelemetryPort` and related types from `packages/domain/src/index.ts`; domain `package.json` still has no Nest/Prisma/OpenAI/`ai`/Langfuse/OpenTelemetry
- [X] T011 Implement `RecordingTelemetryPort` in `packages/application/src/testing/recording-telemetry.ts`: `runStage` records `name`, attributes, `outcome` `ok` \| `error`, `durationMs`; on throw set `outcome` `error` and `errorCode` when present then rethrow; `stages` array inspectable by tests
- [X] T012 Implement `NoOpTelemetryPort` in `apps/api/src/modules/quiz/adapters/out/telemetry/noop-telemetry.adapter.ts`: `runStage` only awaits `fn`; `recordEvent` is a no-op
- [X] T013 [P] Add `TELEMETRY_PORT` symbol in `apps/api/src/modules/quiz/quiz.tokens.ts`
- [X] T014 Add a `TelemetryPort` constructor parameter to `CreateQuizUseCase` in `packages/application/src/use-cases/create-quiz.ts` (last arg); update `packages/application/src/use-cases/create-quiz.spec.ts` to pass `RecordingTelemetryPort` or NoOp so the workspace typechecks; do **not** wrap stages yet
- [X] T015 Wire `TELEMETRY_PORT` to `NoOpTelemetryPort` and inject it into `CreateQuizUseCase` in `apps/api/src/modules/quiz/quiz.module.ts`; `GET /health` and `GET /ready` MUST NOT inject the tracer
- [X] T016 Parse optional `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, and `PROMPT_VERSION` in `apps/api/src/infrastructure/env.ts` (empty allowed); `parseApiEnv` MUST still succeed without them; never log secret values; keep `apps/api/test/env.spec.ts` asserting boot without OpenAI/Langfuse keys
- [X] T017 [P] Implement `redactSensitive` in `apps/api/src/infrastructure/redact-sensitive.ts`: replace `sk-[A-Za-z0-9_-]{8,}`, `sk-lf-` / `pk-lf-` tokens, `Bearer\s+\S+` with `Bearer [redacted]`, and `postgres(ql)?://[^@]+@` with scheme + `[redacted]@`; cap at **280** characters
- [X] T018 Delegate `sanitizeLogText` in `apps/api/src/infrastructure/sanitize-log.ts` to `redactSensitive`; keep existing `sk-` / `Bearer` tests in `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.spec.ts` green
- [X] T019 Allow overriding `TELEMETRY_PORT` in `apps/api/test/e2e/create-app.ts` (default NoOp or recording); default `pnpm test:e2e` stays offline and key-free
- [X] T020 Re-export new error codes from `packages/application/src/index.ts` as needed; `pnpm typecheck` and default `pnpm test` still pass without Postgres, a model key, or Langfuse keys

**Checkpoint**: Codes, telemetry types, NoOp wiring, optional env, and redaction helper exist. Create-quiz still has no stage spans, limiter, or `x-request-id`. Default `pnpm test` / overridden e2e still pass.

---

## Phase 3: User Story 1 - Diagnose a failed or retried generation (Priority: P1) 🎯 MVP

**Goal**: Create-quiz emits fetch / preprocessing / generation / validation stages (retries as extra `generation` attempts `1..3`) on the telemetry port. Unconfigured tracing is a no-op and does not fail create. Langfuse adapter is used only when both keys are set.

**Independent Test**: Application tests with `RecordingTelemetryPort` plus mocked source/generation: fetch failure records `fetch` `error` and no `generation`; invalid then valid generation records `attempt` 1 `error` and attempt 2 `ok` plus `validation` `ok` and `quizId`; missing Langfuse keys still persist a ready quiz.

### Tests for User Story 1 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T021 [P] [US1] Application tests in `packages/application/src/use-cases/create-quiz.spec.ts`: fetch throw `SOURCE_FETCH_FAILED` → recorded stages include `fetch` `outcome` `error` and **zero** `generation`; first generate `GENERATION_INVALID` then valid → `preprocessing` `ok`, `generation` `attempt` 1 `error` then `attempt` 2 `ok`, `validation` `ok`, `quizId` set; three invalid generates → `GENERATION_RETRIES_EXHAUSTED` and three `generation` errors; success records `create-quiz`, `fetch`, `preprocessing`, `generation`, `validation` all `ok`; NoOp telemetry still persists `ready`
- [X] T022 [P] [US1] Unit tests in `packages/application/src/testing/recording-telemetry.ts` companion `packages/application/src/testing/recording-telemetry.spec.ts`: `runStage` on success stores `outcome` `ok` and `durationMs`; on throw stores `error` and rethrows
- [X] T023 [US1] Supertest in `apps/api/test/e2e/quiz-observability.spec.ts` (port overrides + `RecordingTelemetryPort`): fetch failure maps existing `SOURCE_*` and recorder has `fetch` error without a successful generation; retries-exhausted leaves **zero** `status=ready` rows for that request; successful create recorder includes all four child stages
- [X] T024 [US1] Gated spec `apps/api/test/e2e/quiz-live-langfuse.spec.ts`: `describe` skipped unless `PHASE6_LIVE_LANGFUSE=1` and Langfuse keys are set; send `x-request-id: demo-trace-0001`; do not fail default `pnpm test:e2e` when unset

### Implementation for User Story 1

- [X] T025 [US1] Wrap `CreateQuizUseCase.execute` in `packages/application/src/use-cases/create-quiz.ts` with `telemetry.runStage`: root `create-quiz` (`strategy`); `fetch` around `source.fetch`; `preprocessing` for usable length **200** characters, snapshot max **512 KiB**, generation window first **32,000** characters (`sourceChars` / `topicChars`); each generate as `generation` with `attempt` **1..3** (max **3** total attempts unchanged); `validation` around `assertGrounded` + `validateQuiz`; on persist `recordEvent`/`attributes` with `quizId`; pass `usage` tokens onto the generation stage when `GeneratedQuiz.usage` is present; still no Langfuse/HTTP imports in application
- [X] T026 [P] [US1] Return optional `usage` from `OpenAiQuizGenerationAdapter.generate` in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.ts` when Vercel AI SDK reports `inputTokens` / `outputTokens`; omit rather than invent; never log `apiKey` or full prompts
- [X] T027 [US1] Implement `LangfuseTelemetryAdapter` in `apps/api/src/modules/quiz/adapters/out/telemetry/langfuse-telemetry.adapter.ts`: construct only when `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are both non-empty; map root `create-quiz` and child stages per [contracts/telemetry.md](./contracts/telemetry.md); `generation` as a generation observation with `model` = `modelId` and `usageDetails` when tokens exist; export failure retry **at most once** then drop (never throw into the use case); apply `redactSensitive` to string attributes; **deny** full prompts, snapshots, `isCorrect`, selected option ids, secrets
- [X] T028 [US1] QuizModule factory in `apps/api/src/modules/quiz/quiz.module.ts`: wire `LangfuseTelemetryAdapter` when both keys are non-empty, otherwise `NoOpTelemetryPort`; incomplete keys count as unconfigured; `/health` and `/ready` still MUST NOT call the tracer or the model
- [X] T029 [US1] Enable Nest shutdown flush for the Langfuse adapter in `apps/api/src/main.ts` (or adapter `onModuleDestroy`) without printing keys; log only `tracing enabled` / `tracing disabled`

**Checkpoint**: Recording telemetry proves fetch/retry/exhausted/success stages. Product create still works without Langfuse keys. Gated live file is skipped by default.

---

## Phase 4: User Story 2 - Keep secrets, tokens and answers out of telemetry and logs (Priority: P1)

**Goal**: Traces, structured logs, and client error bodies never contain env secrets, Langfuse keys, `DATABASE_URL`, raw attempt tokens, `Authorization` values, submitted selections, or answer keys.

**Independent Test**: Redaction unit tests plus e2e create/start/submit with a Bearer token and secret-shaped config: captured recorder stages, error filter logs, and JSON bodies contain **zero** of those classes; `quizId` / stable codes MAY appear.

### Tests for User Story 2 ⚠️

- [X] T030 [P] [US2] Unit tests in `apps/api/src/infrastructure/redact-sensitive.spec.ts` for `sk-` OpenAI-shaped keys, `sk-lf-` / `pk-lf-`, `Bearer` tokens, and `postgresql://user:pass@host/db` password redaction; truncated output ≤ **280** characters
- [X] T031 [P] [US2] Extend `packages/application/src/use-cases/create-quiz.spec.ts`: recorded attributes MUST NOT include snapshot Markdown, `isCorrect`, or option ids; `sourceHash` / `topicChars` / `sourceChars` MAY appear
- [X] T032 [US2] Extend `apps/api/test/e2e/quiz-observability.spec.ts` (or `apps/api/test/e2e/quiz-redaction.spec.ts`): `Authorization: Bearer secret-token-value` on submit/result; captured logs and recording telemetry MUST NOT contain `secret-token-value`, `sk-`, or selected option ids; error bodies on generation failure MUST NOT include prompts or keys

### Implementation for User Story 2

- [X] T033 [US2] Apply `redactSensitive` to every string attribute in `apps/api/src/modules/quiz/adapters/out/telemetry/langfuse-telemetry.adapter.ts` before export; never set input/prompt/source body fields
- [X] T034 [US2] Ensure `apps/api/src/infrastructure/request-logging.interceptor.ts` and `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.ts` never log raw `Authorization` headers or attempt tokens; run messages through `sanitizeLogText` / `redactSensitive`
- [X] T035 [US2] Confirm `OpenAiQuizGenerationAdapter` in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.ts` logs only `topicChars` / `sourceChars` / `modelId` / duration — not prompt text, source Markdown, or keys

**Checkpoint**: Documented secret classes are absent from recorder stages, logs, and error bodies. Create/submit still function.

---

## Phase 5: User Story 3 - Enforce rate and concurrency limits (Priority: P1)

**Goal**: `POST /v1/quizzes` rejects a sixth attempt in 60 seconds with `REQUEST_RATE_LIMITED` (429) and a third in-flight create with `GENERATION_CONCURRENCY_LIMIT` (503), without starting fetch or generation. Ordinary start-attempt/submit still succeed.

**Independent Test**: E2E with source/generation doubles: six sequential creates from one client → sixth is 429 and `generate`/`fetch` call counts unchanged; two held in-flight creates + a third → 503; a single create within limits still `201`.

### Tests for User Story 3 ⚠️

- [X] T036 [P] [US3] Unit tests in `apps/api/src/modules/quiz/adapters/in/rest/create-quiz-limiter.spec.ts`: after **5** timestamps in a **60_000** ms window further `tryAcquire` returns `rate`; `inFlight >= 2` returns `concurrency`; `release` decrements; missing client id uses `"unknown"`
- [X] T037 [US3] Supertest in `apps/api/test/e2e/quiz-limits.spec.ts`: sixth `POST /v1/quizzes` after five → **429** `REQUEST_RATE_LIMITED`, source/generation doubles **not** called for that request, **zero** extra ready quizzes; overlapping in-flight overflow → **503** `GENERATION_CONCURRENCY_LIMIT` without fetch/generate; one create within limits → **201**; `POST /v1/quizzes/:id/attempts` still **201**; invalid body `CREATE_QUIZ_INVALID` **400** is **not** charged to the rate window
- [X] T038 [P] [US3] Tests in `apps/web/src/features/quiz/shared/error-copy.spec.ts` for exact learner sentences from [contracts/error-copy.md](./contracts/error-copy.md): `REQUEST_RATE_LIMITED` → `Too many quizzes right now. Wait a minute and try again.`; `GENERATION_CONCURRENCY_LIMIT` → `The quiz service is busy. Try again in a moment.`; copy MUST NOT contain tokens, hashes, or `sk-`

### Implementation for User Story 3

- [X] T039 [US3] Implement `CreateQuizLimiter` in `apps/api/src/modules/quiz/adapters/in/rest/create-quiz-limiter.ts`: per-client sliding window **5** / **60 seconds**; process-global in-flight max **2**; `tryAcquire(clientId)` then `release()` in `finally`; in-memory only (no Redis)
- [X] T040 [US3] In `apps/api/src/modules/quiz/adapters/in/rest/quiz.controller.ts` `create`: `parseCreateQuizRequest` first; then limiter with `req.ip` (missing → `"unknown"`); `rate` → `ApplicationError` `REQUEST_RATE_LIMITED`; `concurrency` → `GENERATION_CONCURRENCY_LIMIT`; `execute` only on `ok`; `release` in `finally`; do not add a spoofable client-id header
- [X] T041 [US3] Add the two learner sentences to `learnerMessageForCode` in `apps/web/src/features/quiz/shared/error-copy.ts`; no new screens or routes
- [X] T042 [US3] Provide `CreateQuizLimiter` from `apps/api/src/modules/quiz/quiz.module.ts` as a singleton so in-flight count is process-global

**Checkpoint**: Burst and overlap e2e pass. Play/submit paths are not under the 5/60 create cap.

---

## Phase 6: User Story 4 - Correlate structured logs across a request (Priority: P1)

**Goal**: Every API response, including errors and health, echoes `x-request-id`. Structured JSON logs include `requestId`, `method`, `path`, `status`, `durationMs`, and `code` on errors. Well-formed incoming ids are reused; malformed ids are replaced.

**Independent Test**: Call `/v1/quizzes` and `/health` with and without `x-request-id`; response header matches log `requestId`; malformed incoming value is not echoed; JSON object is parseable and contains the required fields.

### Tests for User Story 4 ⚠️

- [X] T043 [P] [US4] Unit tests in `apps/api/src/infrastructure/request-context.spec.ts`: absent header → assigned UUID v4; value visible ASCII length **8–128** with no whitespace or control characters → reused; too short, too long, spaces, or newlines → assign a new id (do not echo the unsafe value)
- [X] T044 [US4] Extend `apps/api/test/e2e/quiz-observability.spec.ts`: omit header → response `x-request-id` present and equals JSON log `requestId`; send `demo-trace-0001` → echoed; send `bad id` → new id, not `bad id`; `GET /health` includes `x-request-id`; failed create log includes `code` and `level` `warn` or `error`

### Implementation for User Story 4

- [X] T045 [US4] Implement parse + `AsyncLocalStorage` in `apps/api/src/infrastructure/request-context.ts` per [contracts/correlation.md](./contracts/correlation.md)
- [X] T046 [US4] Implement `RequestIdMiddleware` in `apps/api/src/infrastructure/request-id.middleware.ts`: choose identity, store in ALS, set response header `x-request-id` on every request including `/health` and `/ready`
- [X] T047 [US4] Register the middleware in `apps/api/src/app.module.ts` (`NestModule.configure`) so `createApiApp` e2e receives it; do not rely only on `main.ts`
- [X] T048 [US4] Emit **one JSON object** per request from `apps/api/src/infrastructure/request-logging.interceptor.ts` with fields `timestamp` (ISO-8601), `level` (`info` 2xx, `warn` 4xx, `error` 5xx), `requestId`, `method`, `path`, `status`, `durationMs`, `code` on errors per [contracts/structured-logs.md](./contracts/structured-logs.md); a free-text line alone is not enough; redact via `redactSensitive`
- [X] T049 [US4] Confirm `HttpErrorFilter` in `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.ts` does not clear `x-request-id`; error JSON body stays `{ code, message }` only (no `requestId` field required)
- [X] T050 [US4] Read `correlationId` from request context in `apps/api/src/modules/quiz/adapters/out/telemetry/langfuse-telemetry.adapter.ts` (and recording tests via ALS or explicit attribute) so stages share the HTTP identity

**Checkpoint**: Operators can join header, JSON log, and telemetry by one identity. Health still does not query the database or tracer.

---

## Phase 7: User Story 5 - Keep health, readiness and configuration operable (Priority: P1)

**Goal**: `/health` stays process liveness without DB/model/tracer. `/ready` stays database ping and does not require Langfuse. README and `.env.example` document tracing placeholders and operational bounds with **no** real secrets.

**Independent Test**: Boot without Langfuse keys; `GET /health` 200; with db down `/health` 200 and `/ready` 503; reviewer finds documented 10s / 512 KiB / 3 retries / 5 per 60s / 2 in-flight in `.env.example` comments and `README.md`.

### Tests for User Story 5 ⚠️

- [X] T051 [P] [US5] Extend `apps/api/test/env.spec.ts`: parse succeeds without Langfuse keys; optional keys accepted when present; `JSON.stringify(env)` MUST NOT contain `sk-`; incomplete public-without-secret still boots
- [X] T052 [P] [US5] Keep `apps/api/test/health.spec.ts` asserting `GET /health` returns `status` `"ok"` without querying PostgreSQL; keep `apps/api/test/ready.spec.ts` asserting 503 when the Prisma ping fails; neither file may require Langfuse

### Implementation for User Story 5

- [X] T053 [US5] Leave `apps/api/src/health/health.controller.ts` free of `TelemetryPort`, OpenAI, and URL fetch; liveness MUST NOT include a database check
- [X] T054 [US5] Document in `README.md` empty Langfuse placeholders, `PROMPT_VERSION`, fetch timeout **10 seconds**, snapshot **512 KiB**, generation retries **3**, create-quiz rate **5 / 60s**, concurrency **2**, and gated `PHASE6_LIVE_LANGFUSE=1`; state that missing tracing keys are an environment blocker for live inspection, not a create-quiz failure; include **no** real secret values
- [X] T055 [US5] Align `.env.example` comments with T003 / T054; keep `LANGFUSE_*` values empty
- [X] T056 [US5] Bootstrap log in `apps/api/src/main.ts` reports tracing enabled/disabled without printing `LANGFUSE_SECRET_KEY`, `OPENAI_API_KEY`, or `DATABASE_URL`

**Checkpoint**: Health/readiness behavior matches Phase 0. Configuration docs list bounds and empty placeholders only.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Scope review, quickstart commands, and honest verification. Do not mark roadmap checkboxes until evidence is recorded.

- [X] T057 Scope review: **zero** `@langfuse/*` or `@opentelemetry/*` imports in `packages/domain` and `packages/application`; **zero** new `/v1` routes; **zero** Prisma migrations; **zero** new `strategy` literals beyond `balanced`; **zero** GitHub Actions or production Dockerfiles; Phase 3 fetch timeout **10 seconds**, size **512 KiB**, redirects **3**, generation attempts **3** unchanged
- [X] T058 Run [quickstart.md](./quickstart.md) quality commands: `pnpm lint`, `pnpm typecheck`, `pnpm test` (no Postgres, no model key, no Langfuse), `pnpm build`; with `ai_quiz_test`, `pnpm test:integration` and `pnpm test:e2e`
- [X] T059 [P] Confirm `apps/web/src/features/quiz/shared/error-copy.ts` maps the two new codes and existing Phase 4 sentences still pass `apps/web/src/features/quiz/shared/error-copy.spec.ts`
- [X] T060 Do **not** check boxes in `implementation-roadmap.md` or `roadmap.md` until this cycle is verified with commands and (if keys exist) live Langfuse inspection; if keys are absent, record the environment blocker instead of a silent skip
- [X] T061 Run the read-only review in `.agents/skills/code-review/SKILL.md` over the Phase 6 diff (hexagonal imports, secret handling, limiter-before-fetch, SSRF/token behavior unchanged); resolve blocking findings and re-run affected tests
- [X] T062 Optional gated live inspection per [quickstart.md](./quickstart.md): `curl` create with `x-request-id: demo-trace-0001` and confirm the Langfuse UI shows stages without secrets; skip and record blocker when keys are missing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No code dependencies — but honor the **implementation gate** (Phase 4–5 verification record) before executing
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — MVP (diagnose generation)
- **User Story 2 (Phase 4)**: Depends on Foundational; uses US1 stages/recorder
- **User Story 3 (Phase 5)**: Depends on Foundational error codes; independent of traces
- **User Story 4 (Phase 6)**: Depends on Foundational; joins US1 traces via `correlationId`
- **User Story 5 (Phase 7)**: Depends on Foundational env parse; independent of limiter
- **Polish (Phase 8)**: Depends on US1–US5

### User Story Dependencies

- **US1 (P1)**: After Foundational — no other stories. **MVP.**
- **US2 (P1)**: After US1 stages exist so redaction can be asserted on recorded attributes
- **US3 (P1)**: After Foundational codes/HTTP map — can proceed in parallel with US1 if staffed (different files: limiter/controller vs create-quiz stages)
- **US4 (P1)**: After Foundational request-context placeholder; should follow US1 so telemetry can read ALS
- **US5 (P1)**: After Foundational env parse — parallel with US3 (README vs limiter)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types/helpers before adapters
- Use case stages before Langfuse adapter
- Limiter before controller wiring
- Story complete before moving to the next sequential story when working solo

### Parallel Opportunities

- T003 and T004 after T001
- T006 with T005’s contracts file done (different packages)
- T009 / T013 / T017 in parallel during Foundational once T008 exists for types
- T021 and T022 in parallel
- T030 / T031 in parallel
- T036 / T038 in parallel
- T043 in parallel with limiter work if US3 and US4 are staffed separately
- T051 / T052 in parallel
- T059 with T057

---

## Parallel Example: User Story 1

```bash
# Tests (after Foundational):
Task: "Application stage tests in packages/application/src/use-cases/create-quiz.spec.ts"
Task: "RecordingTelemetryPort tests in packages/application/src/testing/recording-telemetry.spec.ts"

# After tests fail:
Task: "Wrap CreateQuizUseCase stages in packages/application/src/use-cases/create-quiz.ts"
Task: "Return usage from apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Limiter unit tests in apps/api/src/modules/quiz/adapters/in/rest/create-quiz-limiter.spec.ts"
Task: "Learner copy tests in apps/web/src/features/quiz/shared/error-copy.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Honor the Phase 4–5 verification gate
2. Complete Phase 1 Setup
3. Complete Phase 2 Foundational
4. Complete Phase 3 US1 (stages + recording + optional Langfuse)
5. **STOP and VALIDATE**: fetch-fail / retry / exhausted diagnosis without secrets in domain/application

### Incremental Delivery

1. Setup + Foundational → port, codes, NoOp
2. US1 → diagnose failed generation (MVP)
3. US2 → redaction proof
4. US3 → rate/concurrency fail-closed
5. US4 → join logs/traces by `x-request-id`
6. US5 → health + docs
7. Polish → quickstart commands and scope review

### Parallel Team Strategy

1. Together: Setup + Foundational
2. Then:
   - Developer A: US1 + US2 (telemetry)
   - Developer B: US3 (limiter) + US5 docs
   - Developer C: US4 (correlation/JSON logs)
3. Polish together

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps tasks to spec user stories US1–US5
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at checkpoints to validate the story independently
- Missing Langfuse keys at live inspection is an **environment blocker**, not a reason to fail create-quiz or `pnpm test`
- Avoid: new generation strategy, CI/CD, production Dockerfiles, P2 Langfuse evaluations, logging answer keys, coupling domain to Langfuse
