# Quickstart: Phase 0 local platform

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [health.openapi.yaml](./contracts/health.openapi.yaml), [environment.md](./contracts/environment.md), [ui-shell.md](./contracts/ui-shell.md)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume the scaffold described in the plan already exists.

## Prerequisites

- Node.js 24 (Active LTS)
- pnpm (version pinned by root `packageManager`)
- Docker (or compatible) for PostgreSQL
- This repository cloned; Constitution and Spec Kit **already present** — do not run `specify init`

## Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d db
# wait until the db healthcheck is healthy
pnpm --filter api exec prisma generate
pnpm db:migrate   # or the documented API equivalent; skip if no baseline migration exists
pnpm dev
```

Expected local addresses (see environment contract):

- Web: `http://localhost:3000`
- API: `http://localhost:3001`

Startup MUST succeed without `OPENAI_API_KEY` or Langfuse values.

## Health and database

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3001/health
# expect 200

curl -sS http://localhost:3001/ready
# expect HTTP 200 and a database-up indicator (see health contract)
```

Stop the database, then:

```bash
docker compose stop db
curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3001/health
# expect 200 (liveness)

curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3001/ready
# expect 503 (not ready)
```

Restart `db` before continuing.

## Invalid configuration

With the API stopped, put a malformed `DATABASE_URL` in `.env` and start the API. Expect a non-zero exit and an error that names `DATABASE_URL` without printing the secret. Restore `.env` from `.env.example` afterward.

## Quality commands

From the repo root, with dependencies installed (PostgreSQL not required):

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four MUST complete successfully.

## Web shell

Open `http://localhost:3000`. Expect an English placeholder/status page on a light-green canvas, a white card, and a dark-green primary control. There MUST be no quiz form, player, or results route.

## Scope check

Confirm absence of quiz Prisma models, `/v1/quizzes` routes, Markdown fetch adapters, OpenAI/Langfuse SDKs as required runtime, production Dockerfiles, and GitHub Actions workflows added by this phase.

## Done when

SC-001–SC-008 in the spec can be checked off from the steps above. Then stop; do not start Phase 1 in this cycle.
