# Phase 8 Research

**Feature**: Phase 8 CI/CD, Production Containers and Interview Delivery  
**Date**: 2026-10-11  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution, `roadmap.md`, `implementation-roadmap.md` and the Phase 8 spec bind behavior. Reuse Phases 0–7; do not re-scaffold, re-grade, redesign evaluators, add quiz features, or claim unexecuted deploy/baseline work as done.

---

## 1. Merge-time CI is one workflow with three jobs, mocked model, real PostgreSQL

**Decision**: Add `.github/workflows/ci.yml` triggered on `pull_request` and `push` to `main`. Permissions: `contents: read` only. Concurrency group cancels in-progress runs for the same ref.

Jobs:

| Job | Runs | PostgreSQL | Live model |
| --- | ---- | ---------- | ---------- |
| `quality` | `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` | No | No |
| `integration` | frozen install, `pnpm --filter @ai-quiz/api db:migrate:deploy`, `pnpm test:integration`, `pnpm test:e2e` | Yes — service `postgres:16-alpine`, database `ai_quiz_test` | No (existing E2E port overrides) |
| `build` | frozen install, `pnpm build` | No | No |
| `images` | build `apps/api/Dockerfile` and `apps/web/Dockerfile` from repo root (no push) | No | No |

`quality` and `integration` MAY run in parallel after a shared install pattern (each job installs; pnpm store + Turbo `.turbo` cached). `images` depends on `build` succeeding so broken TypeScript never spends a long Docker compile as the first failure.

Pinned toolchain: Node.js **24** (Active LTS, matches `engines.node`) via `actions/setup-node` with `cache: pnpm`; pnpm via `corepack` / `pnpm/action-setup` matching root `packageManager`. Install **must** use `--frozen-lockfile` (fail on drift; never `pnpm install` that rewrites the lockfile).

Add a root script `db:migrate:deploy` → `pnpm --filter @ai-quiz/api db:migrate:deploy`. CI and production MUST call **deploy**, not `db:migrate` (`prisma migrate dev`).

Cache: pnpm store (setup-node) and `.turbo` (`actions/cache`, key from `pnpm-lock.yaml`). **Do not** cache `.env`, secrets, or `node_modules` as a blob that could embed credentials.

**Rationale**: Spec FR-001–FR-004 and roadmap M7. Split jobs keep unit tests runnable when Postgres is down, while still requiring integration/E2E on every PR. Image builds in CI prove Dockerfiles without publishing.

**Alternatives considered**:

- One monolithic job — simpler, but a type error waits on Postgres health and Docker.
- Live README or `pnpm eval:golden --live` in `ci.yml` — forbidden (FR-004, paid keys on every PR).
- Caching `node_modules` directories — brittle with pnpm isolated linker; store cache is enough.

---

## 2. Golden-set evaluation is a separate, environment-gated workflow

**Decision**: Add `.github/workflows/llm-evals.yml`. Triggers: `workflow_dispatch` and a weekly `schedule`. **No** `pull_request` trigger. Bind GitHub Environment `llm-evals` so secrets (`OPENAI_API_KEY`, `OPENAI_MODEL`, optional `EVAL_JUDGE_MODEL`, Langfuse keys) are environment-protected and unavailable to forks.

Behavior:

1. Frozen install (same as CI).
2. If `OPENAI_API_KEY` is empty: run nothing that calls a model; write/upload a report whose live generation, judge, and destination gates are **not_run** with `missing-openai-key`; job **succeeds** (skipped ≠ failed quality).
3. If the key is present: `pnpm eval:golden --live --repeat` (existing CLI). Blocking quality failures fail the job. Human calibration and regression stay **not_run** unless those Phase 7 files exist (do not invent labels; do not pass `--accept-baseline`).
4. Publish: upload `docs/evals/phase-7-report.md` (and stdout summary) as a workflow **artifact** named `golden-eval-report`. Also write `docs/evals/last-gated-run.md` **into the artifact** as a companion (run id, git sha, live vs not_run, gate table). Do **not** auto-commit to `main` (avoids secret-in-git and noisy bots). Merging a report into the tree is a manual follow-up.

`ci.yml` MUST NOT `workflow_call` this file. A green PR check is never “golden-set passed.”

**Rationale**: Spec FR-005–FR-007 and US3. Artifacts publish without write access to the default branch. Job success on missing secrets matches “not run, never passed” better than a red X that looks like a product regression.

**Alternatives considered**:

- `pull_request` with `if: github.event.pull_request.head.repo.full_name == github.repository` — still invites accidental paid runs; omit PR entirely.
- Auto-commit the report — needs `contents: write`, can leak traces, overwrites Phase 7 evidence (spec edge case).
- Completing human labels in this workflow — Phase 7 leftover; out of scope.

---

## 3. Production images: repo-root context, pnpm deploy, Next.js standalone, non-root

**Decision**:

- `apps/api/Dockerfile` and `apps/web/Dockerfile` (roadmap paths). Build: `docker build -f apps/api/Dockerfile .` from the **repository root**.
- Multi-stage: (1) toolchain + `pnpm install --frozen-lockfile`, (2) `pnpm --filter <app> build` (API: `nest build` + `prisma generate` already via postinstall/build), (3) minimal `node:24-bookworm-slim` runtime with OpenSSL/CA certs, **no** pnpm, **no** Nest CLI, **no** Next dev toolchain.
- Package the runtime with **`pnpm deploy --filter @ai-quiz/api --prod /out`** (and the web equivalent, or Next standalone copy). That is the pnpm-native way to flatten the isolated linker into a deploy directory.
- Enable Next.js `output: 'standalone'` in `apps/web/next.config.ts`. Runtime copies `.next/standalone`, `.next/static`, and `public`. Read `node_modules/next/dist/docs/` at implementation time for this Next 16 tree before changing the config.
- `USER node` (uid 1000 in the official image). No `USER root` in the final stage. Writable dirs only where the process must write (e.g. Next cache if any); prefer read-only app files.
- Health checks: API `GET /health` on `$PORT` (default 3001); web `GET /` on 3000. Use `node -e fetch(...)` (no extra apt wget) as in `Dockerfile.dev`.
- Secrets: `ENV` for non-secret defaults only. `OPENAI_API_KEY`, `DATABASE_URL`, Langfuse keys are **runtime** `environment:` / `--env-file`, never `ARG`. `NEXT_PUBLIC_API_URL` MAY be a build-arg because Next inlines public env; it MUST be a public origin, never a secret.
- Tighten `.dockerignore` so production context excludes `.git`, `.env`, `specs`, coverage, and dev bind-mount noise, while **keeping** `apps/`, `packages/`, `evals/` (API workspace dep), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, Prisma migrations.

Development `Dockerfile.dev` + `compose.yml` stay as **watch-mode DX**. They MUST NOT be labeled production.

**Rationale**: Spec FR-008–FR-010. `pnpm deploy` avoids copying the whole isolated `node_modules` graph by hand. Standalone is the roadmap’s Next.js size lever. Non-root and runtime secrets are constitution VII.

**Alternatives considered**:

- `turbo prune --docker` then a second install — also valid; `pnpm deploy` is fewer stages for two apps.
- Distroless — smaller, but Prisma/OpenSSL and health `fetch` are easier on `bookworm-slim`; slim is enough for this interview app.
- Baking `OPENAI_API_KEY` as ARG “for convenience” — forbidden.

---

## 4. Production Compose is the local reproduction of production images

**Decision**: Add `compose.prod.yml` (name explicit so `compose.yml` remains development). Services:

- `db` — same `postgres:16-alpine` healthcheck/volume pattern as development (separate volume name `ai_quiz_prod_pgdata` so a prod-compose experiment cannot wipe the dev volume by accident).
- `api-migrate` — oneshot: production API image, command `pnpm exec prisma migrate deploy` (or `node` + prisma from the deploy dir), `restart: "no"`, depends on healthy `db`.
- `api` — production API image, `USER` already non-root in the image, `DATABASE_URL` at runtime, no bind mounts, depends on `api-migrate` completing successfully.
- `web` — production web image, `NEXT_PUBLIC_API_URL` already baked or runtime-public as documented, no bind mounts.

Document: `docker compose -f compose.prod.yml up --build`. This is how operators prove images locally. It is **not** a claim that a public host is deployed.

**Rationale**: Spec US2 and FR-010. A second compose file keeps hot-reload volumes out of the production story.

**Alternatives considered**:

- Profiles on the existing `compose.yml` — easy to mix bind mounts with production tags; a separate file is clearer for the interview.
- Only Dockerfiles, no prod compose — harder to verify migrate-then-start and health together.

---

## 5. Release migrations are deploy-only; the API process never generates schema

**Decision**: Production and CI integration use `prisma migrate deploy` against **existing** files in `apps/api/prisma/migrations/`. Root script `db:migrate:deploy` is the documented command. The API `main.ts` startup MUST NOT call `migrate dev`, `db push`, or generate migration files.

`compose.prod.yml` runs migrate in the oneshot `api-migrate` container **before** `api` starts. A GitHub `release.yml` job (see §6) runs the same command against the configured `DATABASE_URL` when a live destination exists.

Rollback docs: restore previous **image tags**; schema reverse is **not** promised (Prisma migrate is forward). Data recovery is restore the PostgreSQL volume/backup. Do not add a backup microservice.

**Rationale**: Spec FR-011–FR-013. `apps/api` already has `db:migrate:deploy`; CI/prod just have to use it.

**Alternatives considered**:

- Migrate on API boot — convenient, can race replicas and hides failed migrations in app logs.
- `prisma db push` in production — no migration history; forbidden.

---

## 6. Gated deploy path is configurable; default destination is “none”

**Decision**: Add `.github/workflows/release.yml`:

- Triggers: `workflow_dispatch` (inputs: `publish_images`, `deploy_target`) and optional `push` to `main` **only** for image **build** (push to registry still gated).
- GitHub Environment `production` (protection rules are operator-configured; the workflow references it).
- Permissions: `contents: read`, `packages: write` when publishing to GHCR.
- Variables (not secrets): `REGISTRY` (default `ghcr.io`), `IMAGE_PREFIX` (default `ghcr.io/<owner>/<repo>`), `DEPLOY_TARGET` (`none` | `compose` | operator-supplied).
- Steps: build API/web images; if `publish_images` and `REGISTRY` credentials exist, push `:git-sha` and `:main` tags; if `DEPLOY_TARGET` is `none` or unset, **stop** and record deploy **not_run**; if `compose`, emit the exact `docker compose -f compose.prod.yml pull && up -d` command as documentation output (the runner does not SSH to a private host unless the operator later adds a secret and script).
- Do **not** hardcode Fly.io, AWS, or a personal registry. A thin `scripts/release-env.md` (or README section) lists the variables. Optional `scripts/deploy.sh` may exist as a stub that exits 0 with “not_run” when `DEPLOY_TARGET=none`.

Live publish/deploy is complete **only** when the workflow log shows a successful push/up. Otherwise delivery-status stays **not_run**.

**Rationale**: Spec FR-012 and roadmap “destination/provider intentionally configurable.” Interview production-ready means a path, not a surprise bill on someone else’s cloud.

**Alternatives considered**:

- Mandate Fly.io or a VPS in the spec — locks a vendor the assessment does not require.
- Always push on every `main` commit without an environment — too easy to leak images; keep publish gated.

---

## 7. Interview docs live under `docs/` with README as the index

**Decision**: Keep `README.md` as the operator index (local startup, quality commands, two-source evidence, eval command). Add:

| File | Content |
| ---- | ------- |
| `docs/architecture.md` | Mermaid data-flow: URL → fetch → generate → persist → attempt → score; hexagonal packages vs `apps/api` adapters vs `apps/web` |
| `docs/data-model.md` | Mermaid ER of existing Prisma models (no new tables); note `isCorrect` server-only |
| `docs/api-examples.md` | Sanitized curl + JSON for `/v1` create, get quiz, start, submit, result, `/health`, `/ready` — **no** keys on get-quiz |
| `docs/deployment.md` | Env table, CI, images, `compose.prod.yml`, migrate deploy, rollback, backup expectations, troubleshooting |
| `docs/walkthrough.md` | Timed 5–10 minute outline (ingestion, generation, quality eval leftovers, boundaries, persistence, scoring) |
| `docs/delivery-status.md` | P0/P1/P2 checklist with passed / failed / **not_run** (human calibration, accepted baseline, live deploy) |

Do not duplicate scoring math; link `roadmap.md` and Phase 1. Do not put real tokens, keys, or `DATABASE_URL` passwords in examples.

**Rationale**: Spec FR-014–FR-017. README is already long; splitting interview artifacts keeps the walkthrough and honesty checklist easy to open in the meeting.

**Alternatives considered**:

- One giant README — harder to time a walkthrough.
- Generated diagram images only — Mermaid renders on GitHub and stays reviewable in git.

---

## 8. Verification for this phase is CI + image build + docs review, not new domain tests

**Decision**: No new `packages/domain` or scoring tests. Existing Jest suites remain the product proof and **must** stay green in `ci.yml`.

Phase 8 evidence:

- Workflow files exist and the documented commands pass (local reproduction of CI steps).
- `docker build` for both production Dockerfiles succeeds (CI `images` job + quickstart).
- `compose.prod.yml` starts `/health` 200 and `/ready` 200 without a model key (local/quickstart; not required on every PR if the `images` job already built).
- Docs files exist; get-quiz examples omit keys; delivery-status lists leftovers as **not_run**.
- Read-only code review of this diff; optional seeded scoring/leak on a **throwaway** change, then revert (FR-018). Never commit the seed.

**Rationale**: Spec SC-001–SC-010. This cycle is operations; inventing domain tests would look like product-scope creep.

**Alternatives considered**:

- Playwright in CI — roadmap optional; Jest remains required; out of scope.
- Snapshot-testing YAML — low value vs actually running the workflow.

---

## 9. Phase 7 leftovers stay status lines

**Decision**: Implementation MUST NOT fill `evals/baselines/human-labels.v1.json`, MUST NOT pass `--accept-baseline`, and MUST NOT treat a mocked or environment-blocked overwrite of `docs/evals/phase-7-report.md` as a live pass. `docs/delivery-status.md` copies the leftover honestly. Gated evals reuse the existing CLI as-is.

**Rationale**: Spec prerequisites and FR-019–FR-020.

**Alternatives considered**:

- “Quickly label a few questions so regression can pass” — fabricates calibration; forbidden.

---

## 10. Folder architecture: operations at repo root, no new product context

**Decision**: Workflows, production Dockerfiles, `compose.prod.yml`, `docs/*`, and optional `scripts/deploy.sh` are **repository operations**. Do not add `packages/infrastructure`, `apps/api/src/helpers`, or a `shared/` dump. Do not add quiz/attempt/eval source files unless a production Dockerfile or Next standalone flag requires a one-line config change (`next.config.ts` standalone). Domain and application stay untouched.

**Rationale**: Folder-architecture skill: new folders only for a genuine new product context. CI/CD is not a quiz context.

**Alternatives considered**:

- `apps/api/infrastructure/docker` — hides images the roadmap places at `apps/api/Dockerfile`.
