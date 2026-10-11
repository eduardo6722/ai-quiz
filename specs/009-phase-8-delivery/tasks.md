---
description: "Task list for Phase 8 CI/CD, production containers and interview delivery (roadmap Phase 8 only)"
---

# Tasks: Phase 8 CI/CD, Production Containers and Interview Delivery

**Input**: Design documents from `/specs/009-phase-8-delivery/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 8 — GitHub Actions, Docker production and interview walkthrough (P1); main-roadmap **M7–M8**. Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap M9 or another product phase.

**Implementation gate**: Reuse Phases 0–7. Do **not** fill `evals/baselines/human-labels.v1.json`, pass `--accept-baseline`, redesign evaluators or scoring, add quiz features, or mark live publish/deploy complete without a workflow or host log. Record those leftovers as **not_run**.

**Tests**: No new domain, scoring, or golden-set Jest suites. Existing `pnpm test` / `test:integration` / `test:e2e` remain the product proof and **must** run in `ci.yml`. Story verification is the Independent Test plus [quickstart.md](./quickstart.md) (frozen install, docker build, Compose health, honest **not_run** labels). Do not add Playwright as a required gate.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec order → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US6`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Workflows: `.github/workflows/ci.yml`, `.github/workflows/llm-evals.yml`, `.github/workflows/release.yml`
- Images: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `compose.prod.yml`, `.dockerignore`
- Web config: `apps/web/next.config.ts` (standalone only)
- Root scripts: `package.json`, `scripts/deploy.sh`
- Docs: `docs/architecture.md`, `docs/data-model.md`, `docs/api-examples.md`, `docs/deployment.md`, `docs/walkthrough.md`, `docs/delivery-status.md`, `README.md`
- Env comments: `.env.example`
- Follow `.agents/skills/folder-architecture/SKILL.md` — do **not** add `packages/infrastructure`, `helpers/`, or quiz/attempt/eval product modules
- Do **not** add Prisma models, `/v1` routes, a second `strategy` value, or learner UI
- Do **not** import Nest/Prisma/Next/OpenAI/Langfuse into `packages/domain` or `packages/application`
- Do **not** change Phase 1 scoring math

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directories, root migrate-deploy script, env comments. Do not reinitialize Spec Kit or overwrite the Constitution.

- [X] T001 Create directories `.github/workflows/`, `docs/`, and `scripts/` per [plan.md](./plan.md); do not add a workspace package or `apps/api/src/helpers/`
- [X] T002 Add root script `"db:migrate:deploy": "pnpm --filter @ai-quiz/api db:migrate:deploy"` in `package.json`; leave `"db:migrate"` as `prisma migrate dev` for local DX only
- [X] T003 [P] Document in `.env.example` (comments only): production Compose file `compose.prod.yml` and volume `ai_quiz_prod_pgdata`; CI database `ai_quiz_test`; use `pnpm db:migrate:deploy` for CI/prod; registry/deploy variables live in GitHub Environments not this file; keep `OPENAI_API_KEY=` empty
- [X] T004 Confirm `pnpm-workspace.yaml` is unchanged (still `apps/*`, `packages/*`, `evals` only); do not add a fourth package glob

**Checkpoint**: Directories exist. `pnpm db:migrate:deploy` is a named root script. No workflows or Dockerfiles yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared image-build constraints every story relies on. **No user story work until this phase is complete.**

- [X] T005 Update `.dockerignore` so the production context **excludes** `.git`, `.env`, `.env.*` (keep `!.env.example`), `specs`, `.specify`, coverage, `.turbo`, and **includes** `apps/`, `packages/`, `evals/`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, and `apps/api/prisma/migrations`; never exclude Prisma migrations
- [X] T006 Enable `output: "standalone"` in `apps/web/next.config.ts` after reading this tree’s Next 16 docs under `node_modules/next/dist/docs/`; keep existing `transpilePackages` and webpack `extensionAlias`; do not add secret env to the config
- [X] T007 Confirm `apps/api/src/main.ts` does not call `prisma migrate dev`, `prisma db push`, or generate migrations on boot (grep; do not add a boot migrate)
- [X] T008 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` — must pass **without** PostgreSQL, `OPENAI_API_KEY`, or Langfuse keys; confirm `packages/domain/src/` and `packages/application/src/` have **zero** Nest/Prisma/Next/`ai`/`@langfuse` imports

**Checkpoint**: Dockerignore and Next standalone are ready. Default unit quality still passes. User stories may start.

---

## Phase 3: User Story 1 - Merge-time quality gates (Priority: P1) 🎯 MVP

**Goal**: Hosted `ci.yml` runs lockfile-faithful install, lint, strict types, Jest unit/UI, real-PostgreSQL integration/E2E with a mocked model, and `pnpm build`. No live evals. No image push.

**Independent Test**: Inspect `.github/workflows/ci.yml` for jobs `quality`, `integration`, `build`; reproduce `quality` locally without a model key; reproduce `integration` against `ai_quiz_test` after `pnpm db:migrate:deploy`. A missing Postgres healthcheck must fail the job, not skip-pass. File must not reference `eval:golden --live` or `OPENAI_API_KEY`.

### Implementation for User Story 1

- [X] T009 [US1] Create `.github/workflows/ci.yml` with `on: pull_request` and `push` to `main`, `permissions.contents: read`, concurrency group that cancels in-progress runs for the same ref, Node.js **24**, pnpm matching root `packageManager`, and `pnpm install --frozen-lockfile` per [contracts/ci.md](./contracts/ci.md)
- [X] T010 [US1] Add job `quality` in `.github/workflows/ci.yml`: frozen install, `pnpm lint`, `pnpm typecheck`, `pnpm test`; no PostgreSQL service; no `OPENAI_API_KEY`
- [X] T011 [US1] Add job `integration` in `.github/workflows/ci.yml`: service `postgres:16-alpine` with `POSTGRES_DB=ai_quiz_test` and health `pg_isready`; `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public`; `pnpm db:migrate:deploy` (**not** `db:migrate`); `pnpm test:integration`; `pnpm test:e2e`; unhealthy database fails the job
- [X] T012 [US1] Add job `build` in `.github/workflows/ci.yml`: frozen install, `pnpm build`
- [X] T013 [US1] Cache the pnpm store via `actions/setup-node` `cache: pnpm` and `.turbo` via `actions/cache` keyed on `pnpm-lock.yaml` in `.github/workflows/ci.yml`; do **not** cache `.env`, credentials, or evaluation reports
- [X] T014 [US1] Assert `.github/workflows/ci.yml` contains no `eval:golden --live`, no `OPENAI_API_KEY`, and no `workflow_call` of `llm-evals.yml`
- [X] T015 [US1] Locally reproduce `quality`: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test` from the repo root
- [X] T016 [US1] Locally reproduce `integration`: ensure `ai_quiz_test` exists, `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public pnpm db:migrate:deploy`, then `pnpm test:integration` and `pnpm test:e2e`

**Checkpoint**: Merge-time product gates are defined and reproducible locally. Image builds are User Story 2.

---

## Phase 4: User Story 2 - Production images and reproducible startup (Priority: P1)

**Goal**: Multi-stage non-root API and web images, `compose.prod.yml` with migrate-deploy oneshot, and a CI `images` job that builds without pushing.

**Independent Test**: `docker build -f apps/api/Dockerfile .` and `docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .` succeed; API image user is not root; `docker compose -f compose.prod.yml up --build` yields `/health` 200 without a model key and `/ready` 200 with db. Development `compose.yml` is unused for this check.

### Implementation for User Story 2

- [X] T017 [P] [US2] Create `apps/api/Dockerfile` (build context repo root): stages install (`pnpm install --frozen-lockfile`) → `nest build` → minimal `node:24-bookworm-slim` + OpenSSL/CA + `pnpm deploy --filter @ai-quiz/api --prod` (or equivalent flatten); copy Prisma client **and** `apps/api/prisma/migrations`; `USER node`; `HEALTHCHECK` `GET /health` on `$PORT` (default 3001); **no** `ARG` for `OPENAI_API_KEY`, `DATABASE_URL`, or Langfuse keys per [contracts/production-images.md](./contracts/production-images.md)
- [X] T018 [P] [US2] Create `apps/web/Dockerfile` (build context repo root): frozen install → `next build` with `ARG NEXT_PUBLIC_API_URL` (public origin only) → copy `.next/standalone`, `.next/static`, `public`; `USER node`; `HEALTHCHECK` `GET /` on 3000; **no** secret `ARG`s
- [X] T019 [US2] Create `compose.prod.yml`: `db` `postgres:16-alpine` volume **`ai_quiz_prod_pgdata`** (not `ai_quiz_pgdata`); `api-migrate` oneshot `prisma migrate deploy`, `restart: "no"`, depends on healthy `db`; `api` production image, no bind mounts, `DATABASE_URL` at runtime, depends on successful migrate; `web` production image, no bind mounts; do not edit `compose.yml` bind mounts
- [X] T020 [US2] Add job `images` to `.github/workflows/ci.yml` (`needs: build`): `docker build -f apps/api/Dockerfile .` and `docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 .`; no `docker push`; no secret build-args
- [X] T021 [US2] Build both production images locally; confirm the API runtime user is not root (for example `docker run --rm --entrypoint id` on the API image)
- [X] T022 [US2] Run `docker compose -f compose.prod.yml up --build`; `GET http://localhost:3001/health` returns 200 without `OPENAI_API_KEY`; `GET http://localhost:3001/ready` returns 200 when db is up; tear down; do not use `Dockerfile.dev` as the production runtime

**Checkpoint**: Production-shaped images and Compose exist. CI builds images on PRs but does not publish them.

---

## Phase 5: User Story 3 - Gated golden-set evaluation (Priority: P1)

**Goal**: Separate `llm-evals.yml` on Environment `llm-evals`. Missing keys ⇒ **not_run** and a successful job. Live blocking failures fail the job. No PR trigger. No auto-commit. Phase 7 leftovers stay **not_run**.

**Independent Test**: Workflow has no `pull_request` trigger; secrets come from Environment `llm-evals`; a dry read of the YAML shows empty-key path uploads artifact `golden-eval-report` with live gates **not_run** and `missing-openai-key`; no `--accept-baseline`; `ci.yml` still does not call this workflow.

### Implementation for User Story 3

- [X] T023 [US3] Create `.github/workflows/llm-evals.yml` with `workflow_dispatch` and weekly `schedule` only, `environment: llm-evals`, `permissions.contents: read`, Node 24, `pnpm install --frozen-lockfile`; **forbidden** `pull_request` per [contracts/llm-evals.md](./contracts/llm-evals.md)
- [X] T024 [US3] In `.github/workflows/llm-evals.yml`, when `OPENAI_API_KEY` is missing or empty: do not invoke a paid model; write companion `docs/evals/last-gated-run.md` with live/judge/destination **not_run** and `missing-openai-key`; upload artifact `golden-eval-report`; job **succeeds**
- [X] T025 [US3] In `.github/workflows/llm-evals.yml`, when the key is present: run `pnpm eval:golden --live --repeat`; do **not** pass `--accept-baseline`; blocking CLI failure fails the job; leftover `humanRelevanceClarity` and `regression` remain whatever the CLI reports (empty labels / missing baseline ⇒ **not_run**)
- [X] T026 [US3] Publish artifact `golden-eval-report` containing `docs/evals/phase-7-report.md` and `docs/evals/last-gated-run.md` (run id, git sha, trigger, live vs **not_run**, gate table); do **not** `git commit` or push to `main`
- [X] T027 [US3] Confirm `.github/workflows/llm-evals.yml` does not write `evals/baselines/human-labels.v1.json` or `evals/baselines/baseline-v1.json` and that `.github/workflows/ci.yml` still does not `workflow_call` this file

**Checkpoint**: Gated evaluation exists as a separate, honest workflow. Merge CI is not “golden-set passed.”

---

## Phase 6: User Story 4 - Controlled release migrations and configurable gated deploy (Priority: P1)

**Goal**: `release.yml` plus `scripts/deploy.sh`. Migrate is `prisma migrate deploy` of existing files. Default `DEPLOY_TARGET=none` ⇒ deploy **not_run**. No hardcoded cloud vendor.

**Independent Test**: Read `.github/workflows/release.yml` and `scripts/deploy.sh`: `publish_images` and `deploy_target` inputs; Environment `production`; `DEPLOY_TARGET` empty/none prints `deploy: not_run` and exits 0 without pushing; no Fly/AWS/VPS hostname in the workflow file.

### Implementation for User Story 4

- [X] T028 [US4] Create `.github/workflows/release.yml` with `workflow_dispatch` inputs `publish_images` (boolean) and `deploy_target` (string, default `none`), Environment `production`, `permissions.contents: read` and `packages: write` only when publishing, per [contracts/release.md](./contracts/release.md)
- [X] T029 [US4] In `.github/workflows/release.yml` use variables `REGISTRY` (default `ghcr.io`), `IMAGE_PREFIX` (default `ghcr.io/<owner>/<repo>`), `DEPLOY_TARGET`; tag images `:git-sha` when publishing; **no** hardcoded Fly.io, AWS, or personal VPS endpoint
- [X] T030 [P] [US4] Create `scripts/deploy.sh` that, when `DEPLOY_TARGET` is empty or `none`, prints `deploy: not_run` and exits 0; it MUST NOT `docker push` or SSH
- [X] T031 [US4] In `.github/workflows/release.yml`, when `DEPLOY_TARGET=compose`, print the exact commands `docker compose -f compose.prod.yml pull` and `docker compose -f compose.prod.yml up -d` and do not SSH; treat deploy as **not_run** until an operator host log exists
- [X] T032 [US4] Document in `.github/workflows/release.yml` (job step or comment) that schema apply is `pnpm db:migrate:deploy` / `prisma migrate deploy` of **existing** files only; never `migrate dev` or `db push`; order is migrate then replace API when a live database URL is configured

**Checkpoint**: A configurable gated path exists. Unexecuted deploy remains **not_run**.

---

## Phase 7: User Story 5 - Interview delivery documentation (Priority: P1)

**Goal**: Architecture/data-flow, Prisma ER, API examples, deployment/rollback/backup, honest P0/P1/P2 status, README index. No secrets or pre-submit keys in examples.

**Independent Test**: Using only `docs/` and `README.md`, a reviewer can order URL → score, name the seven tables, copy a get-quiz example with **no** `isCorrect`, and see calibration/baseline/live deploy as **not_run** unless evidenced.

### Implementation for User Story 5

- [X] T033 [P] [US5] Write `docs/architecture.md` with a Mermaid data-flow covering topic + HTTPS Markdown URL → SSRF-safe fetch (untrusted Markdown) → `QuizGenerationPort` → validate/persist → sanitized GET quiz → start attempt (token once, hash stored) → submit → deterministic weighted score, plus hexagonal boxes `domain` / `application` / `contracts` vs `apps/api` adapters vs `apps/web`, per [contracts/documentation.md](./contracts/documentation.md)
- [X] T034 [P] [US5] Write `docs/data-model.md` with a Mermaid ER of `SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, `AttemptAnswer`, `AttemptAnswerSelection`; annotate `isCorrect` **server-only**; prose uniqueness `(quizId, position)`, `(questionId, position)`, `(questionId, label)`, `(attemptId, questionId)`, `publicTokenHash`
- [X] T035 [P] [US5] Write `docs/api-examples.md` with curl + JSON for `POST /v1/quizzes`, `GET /v1/quizzes/:id` (**no** correctness flags), `POST /v1/quizzes/:id/attempts` (token only in this response), `POST /v1/attempts/:id/submit` with `Authorization: Bearer`, `GET /v1/attempts/:id/result`, `GET /health`, `GET /ready`; no real secrets or raw tokens
- [X] T036 [US5] Write `docs/deployment.md` covering CI (`ci.yml`), images, `compose.prod.yml`, `pnpm db:migrate:deploy`, env table from [contracts/environment.md](./contracts/environment.md), rollback (previous `:git-sha` images; schema reverse **not** promised), backup (PostgreSQL volume / managed backup; **no** backup product), troubleshooting (lockfile drift, unhealthy Postgres, missing model key **must not** fixture-fallback), and a manual PR checklist: invoke `.agents/skills/code-review/SKILL.md` **and** rely on CI; LLM review MUST NOT replace Jest
- [X] T037 [US5] Write `docs/delivery-status.md` with rows for P0 two-source/scoring/REST/web/Jest, P1 Phase 6 observability, P1 Phase 7 harness, P1 human calibration, P1 accepted baseline/regression, P1 merge-time CI, P1 production images, P1 gated eval workflow, P1 live publish/deploy, P2 extras and second strategy; each state is `passed` \| `failed` \| `not_run`; calibration, accepted baseline, live publish/deploy, second strategy, and P2 are **not_run** unless this cycle produced execution evidence
- [X] T038 [US5] Update `README.md` as the index linking the `docs/` files; label `compose.yml` and `Dockerfile.dev` as **development**; reuse existing two-source and Phase 7 evidence; do **not** claim deploy, human calibration, or accepted baseline complete

**Checkpoint**: Interview docs are readable without the source tree. Honesty checklist is explicit.

---

## Phase 8: User Story 6 - Read-only review and 5–10 minute walkthrough (Priority: P1)

**Goal**: Timed walkthrough outline, code-review of this diff, optional seeded scoring/leak demonstration that is fully reverted.

**Independent Test**: Time `docs/walkthrough.md` in 5–10 minutes covering ingestion, generation, quality leftovers, boundaries, persistence, scoring (`0–4`, `1.1 ** index`, display-only percentage, judge does not grade learners). Review report has severity, location, evidence, impact, blocking status. Seed (if used) is absent from the tree.

### Implementation for User Story 6

- [X] T039 [US6] Write `docs/walkthrough.md` with required beats timed to **5–10 minutes**: ingestion; generation; grounded quality including human calibration and accepted baseline **not_run** unless evidenced; adapter boundaries; persistence ER; weighted scoring; evaluation methodology; label Dockerfile/Langfuse limiter deep-dives **optional** after 10 minutes
- [X] T040 [US6] Time a dry run of `docs/walkthrough.md` and tighten required material if it exceeds 10 minutes
- [X] T041 [US6] Run a read-only review using `.agents/skills/code-review/SKILL.md` on this cycle’s diff (`.github/workflows/*.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile`, `compose.prod.yml`, `apps/web/next.config.ts`, `docs/`); record findings with severity, `file:line`, evidence, impact, suggested fix, blocking status; resolve blockers
- [X] T042 [US6] Optional seed on a **throwaway** branch only: introduce a scoring defect or pre-submit `isCorrect` leak; confirm the review checklist flags it as blocking; **revert completely**; the seed MUST NOT remain in `apps/`, `packages/`, or any committed file on the delivery branch

**Checkpoint**: Reviewer can follow the architecture live. Seeded defects are gone.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quickstart sweep, secret/scoring attestations, no roadmap checkbox without evidence.

- [X] T043 Confirm `.github/workflows/ci.yml` job `images` still has no `docker push` and no secret `--build-arg` values
- [X] T044 [P] Confirm final stages of `apps/api/Dockerfile` and `apps/web/Dockerfile` do not use `USER root` and do not declare `ARG OPENAI_API_KEY`, `ARG DATABASE_URL`, or Langfuse `ARG`s
- [X] T045 Run `pnpm --filter @ai-quiz/domain test`; Phase 1 weighted-score fixtures must still pass; no judge or eval code writes `weightedScore`
- [X] T046 Execute remaining steps in `specs/009-phase-8-delivery/quickstart.md` not already proven in US1–US6
- [X] T047 Confirm `docs/delivery-status.md` and `README.md` do not mark unexecuted deploy, human calibration, or accepted baseline as `passed`
- [X] T048 Confirm no new files landed under `packages/domain/`, `packages/application/` (except none), `apps/api/src/quiz/`, `apps/api/src/attempt/`, or `evals/src/` for this cycle
- [X] T049 Do **not** check off `roadmap.md` / `implementation-roadmap.md` Phase 8 boxes until implement verification evidence exists; leave those files unchanged in this task list’s execution unless the implement cycle records commands

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User stories (Phases 3–8)**: Depend on Foundational
  - Sequential default: US1 → US2 (adds `images` job to `ci.yml`) → US3 → US4 → US5 → US6
  - US3 is independent of US1/US2 files except documentation accuracy
  - US4 assumes US2 Dockerfiles exist if the release workflow builds the same tags
  - US5/US6 may be drafted from contracts in parallel, then updated to match landed paths
- **Polish (Phase 9)**: Depends on all desired user stories

### User Story Dependencies

- **US1 (P1)**: After Foundational — MVP merge gates without images
- **US2 (P1)**: After Foundational; edits `.github/workflows/ci.yml` (wait for US1 to finish that file)
- **US3 (P1)**: After Foundational — new file `llm-evals.yml` only
- **US4 (P1)**: After Foundational; prefer after US2 so release builds the same Dockerfiles
- **US5 (P1)**: After Foundational; prefer after US1–US4 so links are real
- **US6 (P1)**: After US5 (`docs/walkthrough.md` plus review of the full diff)

### Within Each User Story

- Same-file edits are sequential (not `[P]`)
- `[P]` only when files differ and prerequisites are done
- Verify Independent Test at each story checkpoint
- Do not fill Phase 7 leftovers to make a gate look passed

### Parallel Opportunities

- T003 with T001/T002 after directories exist
- T017 and T018 (API vs web Dockerfiles)
- T033, T034, T035 (three docs files)
- T030 (`scripts/deploy.sh`) with T028/T029 only after `scripts/` exists
- After Foundational, US3 can proceed in parallel with US1 if a second person is available (different workflow file)

---

## Parallel Example: User Story 2

```text
Task: "Create apps/api/Dockerfile (T017)"
Task: "Create apps/web/Dockerfile (T018)"
```

Then sequentially: `compose.prod.yml` (T019) → `images` job in `ci.yml` (T020) → local builds (T021) → `compose.prod.yml` up (T022).

## Parallel Example: User Story 5

```text
Task: "Write docs/architecture.md (T033)"
Task: "Write docs/data-model.md (T034)"
Task: "Write docs/api-examples.md (T035)"
```

Then sequentially: `docs/deployment.md` (T036) → `docs/delivery-status.md` (T037) → `README.md` (T038).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup
2. Complete Phase 2 Foundational
3. Complete Phase 3 US1 (`ci.yml` quality/integration/build)
4. **STOP and VALIDATE**: Independent Test for US1
5. Do not claim production images or deploy done

### Incremental Delivery

1. Setup + Foundational
2. US1 merge gates → validate
3. US2 images + prod Compose + CI `images` job → validate
4. US3 gated evals (existence; live run **not_run** without secrets) → validate
5. US4 release path (`DEPLOY_TARGET=none`) → validate
6. US5 docs → US6 walkthrough + review → polish/quickstart
7. Each story adds value without new quiz features

### Parallel Team Strategy

1. Team completes Setup + Foundational
2. Then:
   - Developer A: US1 then US2 (`ci.yml` + Dockerfiles)
   - Developer B: US3 (`llm-evals.yml`) then US4 (`release.yml` + `scripts/deploy.sh`) after US2 Dockerfiles exist
   - Developer C: US5 docs from contracts, then US6 after A/B land paths
3. Polish together (T043–T049)

---

## Notes

- `[P]` = different files, no incomplete dependencies
- `[USn]` maps to spec user stories
- Skipped live evals and deploys are **not_run**, never passed
- Do not auto-commit evaluation reports
- Do not use `Dockerfile.dev` as a production runtime
- Commit after each task or logical group during implement
- Stop at any checkpoint to validate the story independently
- This file does **not** authorize implementation until `/speckit-implement` (or an explicit implement request)
