# Quickstart: Phase 8 CI/CD, production containers and interview delivery

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [ci.md](./contracts/ci.md), [llm-evals.md](./contracts/llm-evals.md), [production-images.md](./contracts/production-images.md), [release.md](./contracts/release.md), [environment.md](./contracts/environment.md), [documentation.md](./contracts/documentation.md)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume Phases 0–7 code is present and Phase 8 behavior described in the plan has been implemented.

Do **not** treat this guide as authorization to fill Phase 7 human labels, accept a frozen baseline, or mark a live host deployed without a log.

## Prerequisites

- Node.js 24 (Active LTS) and pnpm (pinned by root `packageManager`)
- Docker (for Compose and production image builds)
- Phase 0 install: `pnpm install` from the repo root
- **Default `pnpm test` does not require PostgreSQL, `OPENAI_API_KEY`, or Langfuse keys**
- Integration/E2E: local or CI Postgres with `ai_quiz_test`
- Live gated eval: Environment secrets (optional; missing ⇒ **not_run**)
- Live publish/deploy: Environment `production` variables (optional; missing ⇒ **not_run**)

## Setup

```bash
pnpm install --frozen-lockfile
cp -n .env.example .env   # never commit real secrets
```

Add root `db:migrate:deploy` if not already present. Do not run `prisma migrate dev` against a production-shaped database.

## Merge-time quality (always, no model key)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

With PostgreSQL (`ai_quiz_test` migrated via **deploy**):

```bash
docker compose up -d db
# create ai_quiz_test once if needed (see README)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public pnpm db:migrate:deploy
pnpm test:integration
pnpm test:e2e
```

Expected: all pass. Confirm `packages/domain` and `packages/application` still have **zero** Nest/Prisma/Next/OpenAI/Langfuse imports. Confirm no new quiz routes or scoring changes.

Hosted: open `.github/workflows/ci.yml` and confirm jobs `quality`, `integration`, `build`, `images`; frozen lockfile; no `eval:golden --live`.

## Production images

```bash
docker build -f apps/api/Dockerfile .
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .
```

Expected: both succeed. Inspect the API image: process user is not root; `OPENAI_API_KEY` was not a build-arg.

```bash
docker compose -f compose.prod.yml up --build
```

Expected:

- `api-migrate` runs `migrate deploy` then exits
- `GET http://localhost:3001/health` → 200 without a model key
- `GET http://localhost:3001/ready` → 200 when db is up
- Development `compose.yml` still documented as watch-mode DX, not this file

Stop prod Compose before mixing with the dev volume (`ai_quiz_prod_pgdata` vs `ai_quiz_pgdata`).

## Gated evaluation (optional)

```bash
pnpm eval:golden --mocked
```

Hosted: `.github/workflows/llm-evals.yml` has **no** `pull_request` trigger and uses Environment `llm-evals`.

Without secrets, a dispatch must upload an artifact whose live gates are **not_run**. Do not pass `--accept-baseline`. Do not fill `human-labels.v1.json` as part of this phase.

## Release path (optional)

Read `.github/workflows/release.yml` and `docs/deployment.md`. With `DEPLOY_TARGET=none`, delivery-status deploy row stays **not_run**. A successful `docker push` log is required before checking publish as passed.

## Documentation and walkthrough

Confirm these exist and README links to them:

- `docs/architecture.md` — data-flow + hexagonal boxes
- `docs/data-model.md` — ER; `isCorrect` server-only
- `docs/api-examples.md` — get-quiz has no keys
- `docs/deployment.md` — rollback + backup caveats
- `docs/walkthrough.md` — 5–10 minute outline
- `docs/delivery-status.md` — calibration, baseline, live deploy **not_run** unless evidenced

Time a dry run of `docs/walkthrough.md`; required beats must land in 5–10 minutes.

## Read-only review

Run `.agents/skills/code-review/SKILL.md` over workflows, Dockerfiles, Compose, Next standalone config, and `docs/`. Blocking findings (secrets in build-args, migrate-dev in prod, evals on every PR, answer keys in examples, leftover gates marked passed) MUST be resolved.

Optional seed: on a throwaway branch, introduce a scoring or pre-submit leak, confirm the checklist flags it, **revert**. Do not merge the seed.

## Scoring attestation

```bash
pnpm --filter @ai-quiz/domain test
```

Phase 1 fixtures MUST still pass. Delivery status MUST say the learner 0–4 formula is unchanged.

## Out of scope here

Filling human labels, accepting `baseline-v1.json`, a second generation strategy, P2 UI, Playwright as a Jest replacement, and claiming a cloud host is live without a workflow or compose log.
