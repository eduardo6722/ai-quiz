# Environment, CI, images, and release

## Local development (not production)

```bash
cp .env.example .env
pnpm install --frozen-lockfile
docker compose up -d db
pnpm db:migrate
pnpm dev
```

`compose.yml` and `Dockerfile.dev` are **watch-mode development**. They bind-mount the source tree. Do not present them as production runtimes.

Web: http://localhost:3000 · API liveness: http://localhost:3001/health · readiness: http://localhost:3001/ready

## Environment

| Name | Boot API | Boot web | Live create-quiz | Gated eval | Image build-arg |
| --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | required | forbidden | required | not required | **forbidden** |
| `PORT` | optional (3001) | — | — | — | no |
| `WEB_ORIGIN` | optional | — | CORS | — | no |
| `NEXT_PUBLIC_API_URL` | — | required (public) | — | — | **allowed** (public origin) |
| `OPENAI_API_KEY` | optional | forbidden | required | required for live | **forbidden** |
| `OPENAI_MODEL` | optional | forbidden | required for live | required for live | no |
| `LANGFUSE_*` | optional | forbidden | optional traces | optional destination | **forbidden** |
| `EVAL_JUDGE_MODEL` | — | — | — | optional | **forbidden** |
| `NODE_ENV` | `production` in prod images | `production` | — | — | may set in Dockerfile |

Missing `DATABASE_URL` at API boot: process exits; the message names the **key**, not the value. Missing model key: `/health` still 200; live create uses the existing stable error (no Phase 2 fixture fallback).

Registry and deploy variables (`REGISTRY`, `IMAGE_PREFIX`, `DEPLOY_TARGET`) live in GitHub Environments, not `.env.example`.

## Merge-time CI

`.github/workflows/ci.yml` on pull requests and `main`:

1. `quality` — `pnpm install --frozen-lockfile`, lint, typecheck, `pnpm test` (no Postgres, no model key)
2. `integration` — disposable `postgres:16-alpine` / `ai_quiz_test`, `pnpm db:migrate:deploy`, `pnpm test:integration`, `pnpm test:e2e`
3. `build` — `pnpm build`
4. `images` — `docker build` of both production Dockerfiles, **no push**

Caches: pnpm store and `.turbo` keyed on `pnpm-lock.yaml`. Secrets are not cached. Live `pnpm eval:golden --live` is **not** part of this workflow.

Lockfile drift fails the install (`--frozen-lockfile`). An unhealthy CI database fails `integration`; it does not skip-pass.

### Manual PR checklist

- CI green (deterministic gates)
- Invoke `.agents/skills/code-review/SKILL.md` (or the harness adapter) on the diff
- An LLM review **must not** replace Jest

## Production images

```bash
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
```

Multi-stage, `node:24-bookworm-slim` runtime, `USER node`, health checks. Do not pass `OPENAI_API_KEY`, `DATABASE_URL`, or Langfuse keys as `--build-arg`.

## Production-shaped Compose

```bash
docker compose -f compose.prod.yml up --build
```

- Volume `ai_quiz_prod_pgdata` (not the development volume)
- `api-migrate` runs `prisma migrate deploy` then exits
- API and web have **no** source bind mounts
- `/health` 200 without a model key; `/ready` 200 when the database is up

Stop this stack before mixing ports with `docker compose up` development.

## Gated golden-set evaluation

`.github/workflows/llm-evals.yml` — `workflow_dispatch` and weekly schedule only. GitHub Environment `llm-evals`. **No** `pull_request` trigger.

Missing `OPENAI_API_KEY`: live generation, judge, and destination are **not_run** (`missing-openai-key`); the job succeeds; artifact `golden-eval-report`. A green CI check is not “golden-set passed.”

Do not pass `--accept-baseline`. Do not invent human labels. Phase 7 leftovers stay **not_run** until independently evidenced.

Local:

```bash
pnpm eval:golden --mocked
pnpm eval:golden --live --repeat   # requires OPENAI_API_KEY
```

## Release path

`.github/workflows/release.yml` — Environment `production`. Inputs: `publish_images` (default false), `deploy_target` (default `none`).

- `DEPLOY_TARGET=none` → `scripts/deploy.sh` prints `deploy: not_run` and exits 0 (no push, no SSH)
- `DEPLOY_TARGET=compose` → the workflow prints `docker compose -f compose.prod.yml pull` and `up -d`; deploy stays **not_run** until a host actually ran those commands
- No Fly.io, AWS, or personal VPS hostname is baked into the workflow

When a live database exists: `pnpm db:migrate:deploy` **then** replace API containers. Never `prisma migrate dev` or `db push` against production. The API process does not generate migrations at boot.

## Rollback

Redeploy the previous API and web image tags (`:git-sha`). Prisma migrate is **forward**. This project does not promise automated down-migrations. If a release included a schema change you must reverse, restore the PostgreSQL backup taken before migrate, then start the previous images.

## Backup

PostgreSQL is the durable store (questions, keys, attempts, scores). Local production Compose uses volume `ai_quiz_prod_pgdata`. A real host should use that platform’s managed backup. This cycle does **not** ship a backup product.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| CI install fails | Lockfile drift; run `pnpm install` locally and commit `pnpm-lock.yaml` only after review |
| Integration job red | Postgres health; `DATABASE_URL` points at `ai_quiz_test`; `db:migrate:deploy` not `db:migrate` |
| API exits at boot | `DATABASE_URL` missing/invalid; logs name the key, not the password |
| Create-quiz fails without a model | Expected without `OPENAI_API_KEY`; must **not** return the Phase 2 fixture bank |
| Secret in image | Rebuild without `--build-arg` for keys; inspect history |
| Port already allocated | Stop the other Compose file (`compose.yml` vs `compose.prod.yml`) |
| API image crash `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` | Workspace packages export TypeScript. The API Dockerfile emits JS via `scripts/emit-api-workspace-js.mjs` before `pnpm deploy`. Rebuild the production image; do not run that script on a developer checkout |
