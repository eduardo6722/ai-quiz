# Quickstart: Phase 6 observability and operational controls

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [error-codes.md](./contracts/error-codes.md), [correlation.md](./contracts/correlation.md), [telemetry.md](./contracts/telemetry.md), [limits.md](./contracts/limits.md), [structured-logs.md](./contracts/structured-logs.md), [error-copy.md](./contracts/error-copy.md), [observability.openapi.yaml](./contracts/observability.openapi.yaml)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume Phases 0–5 code is present and Phase 6 behavior described in the plan has been implemented.

**Do not start implementation** until Phases 4–5 are recorded as verified in `implementation-roadmap.md` (or leftover gaps are listed on those phases).

## Prerequisites

- Node.js 24 (Active LTS) and pnpm (pinned by root `packageManager`)
- Docker (or compatible) for PostgreSQL
- Phase 0 install: `pnpm install` from the repo root; `.env` copied from `.env.example`
- **Default suites do not require `OPENAI_API_KEY` or Langfuse keys**
- Live tracing inspection (optional gated): `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, optional `LANGFUSE_BASE_URL`

## Setup

```bash
docker compose up -d db
pnpm db:generate
pnpm db:migrate
```

Test database (same as Phase 2):

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE ai_quiz_test;"
```

Point integration/E2E at:

```text
postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public
```

## Quality commands (always)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` MUST pass **without** PostgreSQL, **without** a model key, and **without** Langfuse keys. Domain tests MUST NOT import a tracing vendor SDK. Application create-quiz tests MUST assert fetch / preprocessing / generation / validation stages on a recording telemetry double, including retry and fetch-failure paths.

Confirm boot still works with tracing unset (existing `apps/api/test/env.spec.ts` expectation).

## Persistence and API evidence (requires Postgres, mocked model)

```bash
pnpm test:integration
pnpm test:e2e
```

E2E MUST override source/generation ports (offline) and MAY inject a recording telemetry port. Cover:

- `x-request-id` assigned when omitted; echoed when a well-formed value is sent; new id when malformed
- JSON request log includes `requestId`, `method`, `path`, `status`, `durationMs` (and `code` on errors)
- Six create-quiz posts from the same client: the sixth is `REQUEST_RATE_LIMITED` (429); generation/source doubles not called for that request
- Three overlapping creates: the third is `GENERATION_CONCURRENCY_LIMIT` (503) while two are in flight; overflow does not start fetch/generate
- Error bodies and captured logs/traces contain **zero** `sk-`, `Bearer` secrets, `postgres://…:…@` passwords, or selected-option/answer-key fields
- `GET /health` 200 without tracing keys; `GET /ready` still 503 when the database is down (manual or existing unit)

## Health (manual, existing)

With API up and Compose `db` up: `GET /health` → 200; `GET /ready` → 200; both include `x-request-id`.

Stop `db`: `/health` 200, `/ready` 503. Neither call requires Langfuse.

## Configuration documentation

`.env.example` and README MUST list placeholders (empty values, no real secrets):

- `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`
- `PROMPT_VERSION` (optional label)
- Comments stating: fetch timeout **10s**, snapshot **512 KiB**, generation retries **3**, create-quiz rate **5 / 60s**, concurrency **2**

Startup without Langfuse keys MUST still listen. Incomplete keys are treated as unconfigured (no-op telemetry).

## Live Langfuse (definition of done; gated)

With migrated `ai_quiz`, model key, Langfuse keys, and `pnpm --filter @ai-quiz/api dev`:

```bash
curl -sS -D - -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -H 'x-request-id: demo-trace-0001' \
  -d '{"topic":"Express routing","sourceUrl":"https://github.com/expressjs/express/blob/master/Readme.md","questionCount":5}'
```

Expect `201` (or a documented Phase 3 generation error), header `x-request-id: demo-trace-0001`, and **no** questions in the body.

In the Langfuse UI (or compatible), find the trace for `demo-trace-0001` / that quiz id. Confirm stages fetch → preprocessing → generation → validation (retries visible if the model failed once). Confirm **no** API keys, attempt tokens, or answer keys in the trace payload.

Optional automated gate (skipped unless set):

```bash
PHASE6_LIVE_LANGFUSE=1 pnpm --filter @ai-quiz/api exec jest --config jest.e2e.config.cjs test/e2e/quiz-live-langfuse.spec.ts
```

Missing Langfuse keys at this step is an **environment blocker**, not a reason to fail `pnpm test` or to make create-quiz depend on tracing.

## Scope check

A diff review MUST find **zero** `@langfuse/*` or OpenTelemetry imports in `packages/domain` and `packages/application`, **zero** GitHub Actions / production Dockerfiles added this phase, **zero** new create-quiz `strategy` values, and unchanged Phase 3 SSRF / retry / size bounds.
