# Implementation Plan: Phase 6 Observability and Operational Controls

**Branch**: `007-phase-6-observability` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-phase-6-observability/spec.md`

**Roadmap phase**: Phase 6 — Langfuse and production-hardening (P1)

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Add **P1 observability and operational controls** to the verified quiz MVP so an operator can diagnose a failed create-quiz (fetch / preprocess / generate / validate / retry), join logs and traces by a correlation identity, enforce create-quiz rate and concurrency limits, and keep secrets out of telemetry — without changing scoring, SSRF, answer-key privacy, or attempt tokens.

Technical approach (from [research.md](./research.md)): `TelemetryPort` in `@ai-quiz/domain`; `CreateQuizUseCase` runs named stages; Langfuse JS v5 (`@langfuse/tracing` + `@langfuse/otel`) only in `apps/api`, no-op when keys are absent. Nest middleware assigns/echoes `x-request-id`. Structured JSON request logs reuse the existing sanitizer (expanded). In-process limiter on `POST /v1/quizzes` (5/60s, 2 in-flight) before the use case. Two new error codes. Second generation strategy **deferred**.

**Implementation must not start** until Phases 4–5 are recorded as verified in `implementation-roadmap.md` (or leftover gaps are listed on those phases). This plan does not absorb demo, CI, or production-image work.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse Phase 0.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. NestJS 12 REST adapters. Zod 4 public contracts. Vercel AI SDK / OpenAI already in `apps/api`. **Add** `@langfuse/tracing`, `@langfuse/otel`, and `@opentelemetry/sdk-node` to `apps/api` only. No Redis, pino, or new workspace packages.

**Storage**: PostgreSQL 16 unchanged. **No new migration.** Rate window and generation slots are in-process memory.

**Testing**: Jest application tests with `RecordingTelemetryPort` (no Langfuse). Jest API unit tests for correlation, limiter, redaction, structured log fields. Jest + Supertest E2E (real PostgreSQL, mocked source/generation **and** recording telemetry) for rate/concurrency, `x-request-id`, secret absence. Optional gated live Langfuse (`PHASE6_LIVE_LANGFUSE=1`) when keys exist. Domain scoring tests stay I/O-free.

**Target Platform**: Developer local workspace (Linux/macOS) with Docker PostgreSQL. Not production containers.

**Project Type**: Hexagonal slice in the existing monorepo — telemetry port + create-quiz staging, inbound limiter/middleware, outbound Langfuse adapter.

**Performance Goals**: Create-quiz still synchronous. Limiter reject is in-process (no I/O). Tracing export must not block the HTTP outcome beyond a single failed retry that is dropped. Health remains a cheap liveness read.

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse, or HTTP clients. Secrets, attempt tokens, submitted answers and keys MUST NOT appear in logs or traces. `/health` and `/ready` MUST NOT require tracing or model keys. No second strategy, CI, production Dockerfiles, P2 evaluations/dashboards. Do not relax Phase 3 fetch/retry/size bounds.

**Scale/Scope**: One new domain port; create-quiz stage wrapping; two error codes; correlation middleware; JSON request logs; in-memory limiter; Langfuse adapter + no-op; env optional tracing fields; README/.env.example documentation; web error-copy two lines. No new tables, routes, or packages.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | `TelemetryPort` in `packages/domain`. Stage orchestration in `packages/application`. Langfuse, OTEL, Nest middleware, Express `req.ip` in `apps/api`. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | No `packages/telemetry`. Limiter is an inbound adapter, not a domain port. No Redis. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Reuse `@ai-quiz/config`. Explicit stage names and attribute types; no `any` to stuff prompts into traces. |
| IV. Zod-validated contracts | External input parsed with Zod; keys out of public DTOs | **PASS** | Create-quiz schema unchanged (`balanced` only). New codes on the existing error body. Incoming `x-request-id` validated by a small parser, not trusted raw. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; generation does not grade | **PASS** | Scoring, tokens, SSRF unchanged. Telemetry must not be required for domain unit tests. |
| VI. Jest testing discipline | Jest; API E2E with mocked LLM; persistence vs real PostgreSQL | **PASS** | Recording telemetry in unit/E2E. Default E2E still overrides source/generation. No Playwright. No live Langfuse in `pnpm test`. |
| VII. Secure AI integration | Secrets never logged; errors do not leak prompts/keys | **PASS** | Shared redaction for logs and traces; no full prompts/source/answers on telemetry; tracing export cannot fail create-quiz; keys still server-side. |
| VIII. Roadmap fidelity | Derive from roadmap; Phase 6 exclusions | **PASS** | M5 observability/limits/health/docs only. Second strategy deferred. No M6 CI/Docker, no M8 evaluations. |

**Unjustified violations**: none. Extending `GeneratedQuiz` with optional `usage` is a port evolution (like Phase 3 `modelId`), not a new layer.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. No Prisma tables; HTTP contracts add two codes and `x-request-id`; telemetry attributes are documented as a denylist for secrets; quickstart separates mocked suites from optional live Langfuse. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/007-phase-6-observability/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Correlation, telemetry, limits, errors, logs
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 6 **extends** these files. Do not add CI workflows, production Dockerfiles, or a second strategy.

```text
packages/
├── domain/src/ports/
│   └── telemetry-port.ts            # TelemetryPort, stage names, attributes
├── application/src/
│   ├── errors.ts                    # REQUEST_RATE_LIMITED, GENERATION_CONCURRENCY_LIMIT
│   ├── use-cases/create-quiz.ts     # runStage around fetch/preprocess/generate/validate
│   ├── use-cases/create-quiz.spec.ts
│   └── testing/recording-telemetry.ts
└── contracts/src/
    └── error-codes.ts               # two new codes

apps/api/
├── src/infrastructure/
│   ├── env.ts                       # optional LANGFUSE_*, PROMPT_VERSION
│   ├── request-context.ts           # AsyncLocalStorage + x-request-id parse
│   ├── request-id.middleware.ts
│   ├── request-logging.interceptor.ts  # JSON fields
│   ├── redact-sensitive.ts          # shared by logs and telemetry
│   └── sanitize-log.ts              # delegates to redact-sensitive
├── src/modules/quiz/
│   ├── quiz.module.ts               # TELEMETRY_PORT, limiter
│   ├── quiz.tokens.ts
│   └── adapters/
│       ├── in/rest/
│       │   ├── quiz.controller.ts   # acquire limiter before execute
│       │   └── http-error.filter.ts # 429 / 503 + requestId on body? header only
│       └── out/telemetry/
│           ├── noop-telemetry.adapter.ts
│           └── langfuse-telemetry.adapter.ts
└── test/
    ├── env.spec.ts
    ├── infrastructure/              # correlation, redact, limiter, JSON logs
    └── e2e/
        ├── create-app.ts            # optional TELEMETRY_PORT override
        ├── quiz-observability.spec.ts
        └── quiz-limits.spec.ts

apps/web/src/features/quiz/shared/
└── error-copy.ts                    # two learner sentences only
```

Existing `packages/ui`, scoring, Prisma schema, `/health`/`/ready` handlers, SSRF adapter, and quiz screens stay unchanged aside from error-copy.

**Structure Decision**: Same monorepo. Telemetry port in domain; Langfuse and HTTP concerns in `apps/api`. Turbo tasks unchanged (`test` no Postgres/network/Langfuse; `test:e2e` needs `DATABASE_URL` and still mocks the model).

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
