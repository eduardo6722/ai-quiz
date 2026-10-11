# Contract: Production images and Compose

**Feature**: [spec.md](../spec.md)

## Dockerfiles

| App | Path | Build context | Runtime user | Health |
| --- | ---- | ------------- | ------------ | ------ |
| API | `apps/api/Dockerfile` | repository root | non-root `node` | `GET /health` on `$PORT` (default 3001) |
| Web | `apps/web/Dockerfile` | repository root | non-root `node` | `GET /` on 3000 |

Stages: dependency install (`pnpm install --frozen-lockfile`) → build → **minimal** runtime (`node:24-bookworm-slim` + OpenSSL/CA). Runtime MUST NOT include Nest CLI, Next `dev`, or a second copy of the full workspace.

Packaging:

- API: `pnpm deploy --filter @ai-quiz/api --prod` (or equivalent flatten) + `dist/` + Prisma client + **migrations directory** (needed by the migrate oneshot, or a dedicated migrate image from the same Dockerfile with a different command).
- Web: Next.js `output: 'standalone'`; copy `.next/standalone`, `.next/static`, `public`.

## Configuration

| Name | When | Secret? |
| ---- | ---- | ------- |
| `DATABASE_URL` | API **runtime** | Yes — never `ARG` |
| `DIRECT_URL` | API runtime, optional | Yes |
| `OPENAI_API_KEY` | API runtime, optional at boot | Yes — never `ARG` |
| `OPENAI_MODEL` | API runtime | No |
| `WEB_ORIGIN` | API runtime | No |
| `PORT` | API runtime | No |
| `LANGFUSE_*` | API runtime, optional | Yes |
| `NEXT_PUBLIC_API_URL` | Web **build-arg** (public origin only) | **No** |
| `NODE_ENV` | runtime `production` | No |

Missing `DATABASE_URL`: API process exits before serving quizzes; error names the **key**, not the value.  
Missing `OPENAI_API_KEY`: `/health` still 200; live create-quiz uses existing stable errors; **no** fixture fallback.

`.dockerignore` MUST exclude `.env`, `.git`, `specs`, coverage; MUST include `apps/`, `packages/`, `evals/` (workspace dep), lockfile, Prisma migrations.

## `compose.prod.yml`

- No source bind mounts.
- Volume `ai_quiz_prod_pgdata` (not the development volume).
- `api-migrate` oneshot: `prisma migrate deploy`, `restart: "no"`, depends on healthy `db`.
- `api` depends on successful migrate; `web` depends on `api` health if practical.
- File is **in addition to** `compose.yml` (development watch). Docs MUST label each.

## Verification commands

```text
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
docker compose -f compose.prod.yml up --build
# GET http://localhost:3001/health → 200 without OPENAI_API_KEY
# GET http://localhost:3001/ready → 200 when db is up
```
