# Quickstart: Phase 2 persistence and deterministic REST flow

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [quiz.openapi.yaml](./contracts/quiz.openapi.yaml), [create-quiz.md](./contracts/create-quiz.md), [public-quiz-view.md](./contracts/public-quiz-view.md), [start-attempt.md](./contracts/start-attempt.md), [submit-answers.md](./contracts/submit-answers.md), [public-result.md](./contracts/public-result.md), [error-codes.md](./contracts/error-codes.md)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume Phase 0/1 are present and Phase 2 code described in the plan has been implemented.

## Prerequisites

- Node.js 24 (Active LTS) and pnpm (pinned by root `packageManager`)
- Docker (or compatible) for PostgreSQL
- Phase 0 install: `pnpm install` from the repo root; `.env` copied from `.env.example`
- **No `OPENAI_API_KEY` or Langfuse values**

## Setup

```bash
docker compose up -d db
# wait until the db healthcheck is healthy
pnpm db:generate
pnpm db:migrate
```

Create the isolated test database once (same Postgres instance as `ai_quiz`):

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE ai_quiz_test;"
```

If it already exists, the command may report that; that is fine. Point test runs at:

```text
postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public
```

Apply the same migrations to `ai_quiz_test` (implementation should document the exact `DATABASE_URL=… pnpm db:migrate` invocation). Default `pnpm test` still MUST NOT require this database.

## Quality commands (always)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` MUST still pass **without** PostgreSQL (Phase 0/1 unit and API smoke tests).

## Persistence and API evidence (requires Postgres)

```bash
pnpm test:integration
pnpm test:e2e
```

Both MUST use real PostgreSQL and MUST NOT call a model or fetch remote Markdown.

## Manual `/v1` smoke (optional)

With `pnpm --filter @ai-quiz/api dev` and migrated `ai_quiz`:

```bash
# create
curl -sS -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -d '{"topic":"Hexagonal architecture","sourceUrl":"https://example.com/README.md","questionCount":5}'

# get quiz (expect no isCorrect)
curl -sS http://localhost:3001/v1/quizzes/<quizId>

# start attempt (save token once)
curl -sS -X POST http://localhost:3001/v1/quizzes/<quizId>/attempts

# submit (use option ids from GET quiz; pick a complete legal set)
curl -sS -X POST http://localhost:3001/v1/attempts/<attemptId>/submit \
  -H 'authorization: Bearer <token>' \
  -H 'content-type: application/json' \
  -d '{"answers":[...]}'

# result
curl -sS http://localhost:3001/v1/attempts/<attemptId>/result \
  -H 'authorization: Bearer <token>'
```

Expect create `{ id, status: "ready" }`, get-quiz without correctness flags, submit/result scores matching Phase 1 for that fixture, and a second submit returning the same result.

`GET /health` remains 200 without the quiz module; `GET /ready` still pings Postgres.

## Checks the suites must prove

| Check | Expected |
| ----- | -------- |
| Create → get → start → submit → result | Stored weighted score equals Phase 1 grade for the fixture answers |
| GET quiz | Zero `isCorrect` / score fields |
| Create response | Identity + `ready` only |
| Token | Start returns plaintext once; DB has hash only; missing/wrong token → `UNAUTHORIZED_ATTEMPT` |
| Foreign option / duplicate question | `SELECTION_ILLEGAL`; attempt stays open |
| Second submit (same or different answers) | Original stored result |
| Concurrent submits | One stored total |
| Result before submit | `ATTEMPT_NOT_SCORED`, no keys |
| Unknown ids | `QUIZ_NOT_FOUND` / `ATTEMPT_NOT_FOUND` |

## What not to run as Phase 2 acceptance

- Fetching a live README.md URL
- Configuring `OPENAI_API_KEY` or generating questions from a model
- Opening a quiz player in the browser
- Langfuse, production images, GitHub Actions

## Scope check

Inspect the diff for this cycle:

- Prisma product models and a migration for source, quiz, question, option, attempt, answer, selection
- `apps/api/src/modules/quiz/` REST + Prisma + **fixture** adapters
- Domain/application still list no Nest/Prisma/Next/OpenAI/AI SDK/Langfuse in `package.json`
- No remote Markdown fetcher, no quiz UI routes, no Langfuse SDK
- Scoring still imported from `@ai-quiz/domain` / `gradeAttempt`, not reimplemented in SQL
