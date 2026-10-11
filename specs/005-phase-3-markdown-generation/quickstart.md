# Quickstart: Phase 3 Markdown ingestion and OpenAI generation

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [quiz.openapi.yaml](./contracts/quiz.openapi.yaml), [create-quiz.md](./contracts/create-quiz.md), [source-fetch.md](./contracts/source-fetch.md), [generated-output.md](./contracts/generated-output.md), [public-quiz-view.md](./contracts/public-quiz-view.md), [error-codes.md](./contracts/error-codes.md)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume Phases 0–2 are present and Phase 3 code described in the plan has been implemented.

## Prerequisites

- Node.js 24 (Active LTS) and pnpm (pinned by root `packageManager`)
- Docker (or compatible) for PostgreSQL
- Phase 0 install: `pnpm install` from the repo root; `.env` copied from `.env.example`
- **Default suites do not require `OPENAI_API_KEY`**
- Live definition-of-done (optional gated): a real `OPENAI_API_KEY` and network access

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

`pnpm test` MUST pass **without** PostgreSQL, **without** live DNS/HTTP to arbitrary hosts, and **without** `OPENAI_API_KEY`. Adapter SSRF/blob/schema tests use fakes.

## Persistence and API evidence (requires Postgres, mocked model)

```bash
pnpm test:integration
pnpm test:e2e
```

Both MUST use real PostgreSQL. E2E MUST **override** source/generation ports (fixtures or doubles) so they do not call OpenAI or fetch the public internet. They MUST cover:

- Existing create → get → start → submit → result (no key leakage)
- HTTP mapping for `SOURCE_UNSAFE_DESTINATION`, type/size/timeout/unusable, `GENERATION_INVALID` / retries exhausted / upstream failure
- No ready quiz stored on those failures

## Live README (definition of done; gated)

With migrated `ai_quiz`, `OPENAI_API_KEY` set, `OPENAI_MODEL` set (example `gpt-6-luna`), and `pnpm --filter @ai-quiz/api dev`:

```bash
curl -sS -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -d '{"topic":"Express routing","sourceUrl":"https://github.com/expressjs/express/blob/master/Readme.md","questionCount":5}'
```

Expect `{ "id": "<uuid>", "status": "ready" }` with **no** questions in the body.

```bash
curl -sS http://localhost:3001/v1/quizzes/<quizId>
```

Expect five questions, four labels each, topic present, `sourceUrl` the original GitHub blob URL, and **zero** `isCorrect` / excerpt / model-key fields.

A reviewer confirms prompts are about Express routing and can be tied to the README (not the Phase 2 fixture bank). Starting an attempt must still work.

Automated live file (`quiz-live-readme.spec.ts`) runs only when `PHASE3_LIVE_README=1` **and** `OPENAI_API_KEY` is set; otherwise it is skipped. Missing key on the **product** create path (no override) must fail `GENERATION_UPSTREAM_FAILED`, not serve fixtures.

Unsafe smoke (expect `SOURCE_UNSAFE_DESTINATION`, nothing playable):

```bash
curl -sS -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -d '{"topic":"Nope","sourceUrl":"https://127.0.0.1/README.md"}'
```

`GET /health` remains 200 and MUST NOT fetch Markdown or call the model.

## Checks the suites must prove

| Check | Expected |
| ----- | -------- |
| GitHub blob URL | Retrieved as raw Markdown; stored `resolvedUrl` is the raw host |
| Loopback / private / link-local / metadata / http redirect | `SOURCE_UNSAFE_DESTINATION`; zero ready quizzes |
| Oversize / bad type / timeout / empty | Matching `SOURCE_*`; zero ready quizzes |
| Injected Markdown (“ignore instructions”) | Valid grounded quiz or closed failure; no keys in GET or logs |
| Invalid model JSON then valid on retry | Ready quiz persisted |
| Three invalid generations | `GENERATION_RETRIES_EXHAUSTED`; no start-able quiz |
| Provider / missing key | `GENERATION_UPSTREAM_FAILED`; no fixture fallback |
| GET quiz | Zero `isCorrect`, excerpts, model keys |
| Snapshot | Stored text, SHA-256 checksum, original + resolved URL |
| Scope | No quiz UI, no second README package, no Langfuse, no production images |

## What not to run as Phase 3 acceptance

- Building `/quiz/[id]` player or results UI
- A second live README as the assessment two-source package
- Langfuse, production images, GitHub Actions
- Requiring OpenAI for `pnpm test` / default `pnpm test:e2e`

## Scope check

Inspect the diff for this cycle:

- `apps/api` HTTPS source adapter + OpenAI generation adapter; `QuizModule` wires them
- Fixture adapters remain **only** as test overrides
- Domain/application still list no Nest/Prisma/Next/`ai`/`@ai-sdk/openai`/Langfuse in `package.json`
- Nine new error codes mapped in the HTTP filter
- Scoring still imported from `@ai-quiz/domain` / `gradeAttempt`
- No web quiz routes, no Langfuse SDK, no production Dockerfiles
