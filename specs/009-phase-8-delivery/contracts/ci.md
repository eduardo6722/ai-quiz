# Contract: Merge-time CI (`.github/workflows/ci.yml`)

**Feature**: [spec.md](../spec.md)

## Triggers

- `pull_request` (all branches)
- `push` to `main`
- **Not** `workflow_dispatch` for live evals (that is `llm-evals.yml`)

## Permissions

`contents: read` only. No `packages: write`. No evaluation secrets.

## Concurrency

One in-flight run per workflow + ref; cancel previous PR runs.

## Jobs

### `quality`

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
```

No PostgreSQL. No `OPENAI_API_KEY`. Failure of any command fails the job.

### `integration`

Service: `postgres:16-alpine` with `POSTGRES_DB=ai_quiz_test`, healthcheck `pg_isready`.

```text
pnpm install --frozen-lockfile
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public
pnpm db:migrate:deploy    # prisma migrate deploy — NOT migrate dev
pnpm test:integration
pnpm test:e2e
```

If the database never becomes healthy, the job **fails** (must not skip-pass).

### `build`

```text
pnpm install --frozen-lockfile
pnpm build
```

### `images`

Depends on `build`. From repository root:

```text
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
```

No `docker push`. Build-args MUST NOT include `OPENAI_API_KEY`, `DATABASE_URL`, or Langfuse secrets.

## Cache

Allowed: pnpm store (`actions/setup-node` `cache: pnpm`), `.turbo` keyed on `pnpm-lock.yaml`.  
Forbidden: caching `.env`, credential files, or evaluation reports that might contain secrets.

## Toolchain

Node.js 24, pnpm matching root `packageManager`, `ubuntu-latest`.

## Relationship to evaluation

This workflow MUST NOT call `pnpm eval:golden --live`, MUST NOT `workflow_call` `llm-evals.yml`, and MUST NOT set `OPENAI_API_KEY`.
