# Implementation Plan: Phase 8 CI/CD, Production Containers and Interview Delivery

**Branch**: `009-phase-8-delivery` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-phase-8-delivery/spec.md`

**Roadmap phase**: Phase 8 — GitHub Actions, Docker production and interview walkthrough (P1); main-roadmap **M7–M8**

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Make **builds and delivery reproducible** and prepare the **interview walkthrough**, without new quiz features. Merge-time GitHub Actions runs lockfile-faithful install, lint, strict types, Jest unit/UI, real-PostgreSQL integration and Supertest E2E (mocked model), production `pnpm build`, and production **image builds** (no registry push on PRs). A **separate** `llm-evals.yml` workflow, bound to a protected environment, runs `pnpm eval:golden` only when triggered and labels skipped live work **not run**. Multi-stage `apps/api/Dockerfile` and `apps/web/Dockerfile` produce non-root runtimes; `compose.prod.yml` reproduces migrate-deploy then start locally. Release migrations use existing `prisma migrate deploy`. Image publish and deploy are a **configurable gated path** whose default destination is `none` (**not run** until evidenced). Interview docs (`docs/architecture.md`, ER, API examples, deployment/rollback/backup, walkthrough, honest delivery status) plus a read-only review close M8.

Technical approach (from [research.md](./research.md)): three-plus-one CI jobs; pnpm store + Turbo cache without secrets; `pnpm deploy` + Next `output: 'standalone'`; GitHub Environments `llm-evals` and `production`; artifacts for gated eval reports (no auto-commit); Phase 7 leftovers remain **not run**. Domain, scoring, generation, and evaluators are **not** redesigned.

This plan does not absorb human calibration, baseline acceptance, P2 product extensions, or a claimed live host without a workflow log.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse Phase 0. Workflows pin Node 24. Production images: `node:24-bookworm-slim`.

**Primary Dependencies**: Existing pnpm 12 / Turborepo workspace. NestJS 12 API, Next.js 16 web, Prisma 7, PostgreSQL 16. **Add** GitHub Actions workflows, production Dockerfiles, `compose.prod.yml`, interview `docs/*`. Enable Next.js `standalone` output. **No** new workspace packages, no Redis, no Playwright as a required gate.

**Storage**: PostgreSQL 16 **unchanged**. **No new migration.** Release/CI apply existing migrations with `prisma migrate deploy`. Prod Compose uses a **separate** volume name so it cannot wipe the development volume.

**Testing**: Existing Jest unit/UI (`pnpm test`), integration and API E2E (`pnpm test:integration`, `pnpm test:e2e`) against real PostgreSQL with mocked LLM. CI must run those commands. Phase 8 proof is green workflows, successful `docker build` of both production images, documented `compose.prod.yml` health, and docs/review. `pnpm eval:golden --live` stays **out** of `pnpm test` and `ci.yml`. Domain scoring tests stay I/O-free and unchanged.

**Target Platform**: GitHub-hosted Ubuntu runners for CI; local Linux/macOS Docker for production-image verification; operator-chosen registry/host for optional gated publish/deploy.

**Project Type**: Operations and delivery slice in the existing hexagonal monorepo — workflows, images, Compose, documentation. Not a learner-facing feature.

**Performance Goals**: CI should complete on a typical PR without paid LLM calls. Image builds are allowed to be slower than unit tests (separate job). Create-quiz remains synchronous; this cycle MUST NOT raise Phase 6 rate/concurrency limits.

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse, or HTTP clients. Secrets MUST NOT appear in logs, image build-args, client bundles, or committed examples. Skipped live evals and deploys are **not run**, never passed. No new quiz screens, no second generation strategy, no evaluator redesign, no filling human labels. LLM code review MUST NOT replace Jest gates.

**Scale/Scope**: Four workflow files/jobs area (ci, llm-evals, release), two production Dockerfiles, one prod Compose file, root `db:migrate:deploy` script, Next standalone flag, six `docs/` pages plus README links, delivery-status checklist. Zero new Prisma models, `/v1` routes, or packages.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | No new domain/application files. Docker, Actions, and docs sit at repo root / `apps/*/Dockerfile`. Next standalone is a web-app config only. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | No `packages/infrastructure` or grab-bag `shared/`. Operations stay in `.github/`, `docs/`, Compose, and app Dockerfiles. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | CI runs existing `pnpm typecheck`. Standalone/config changes stay typed. No `any` to smuggle secrets into workflows. |
| IV. Zod-validated contracts | External input parsed with Zod; keys out of public DTOs | **PASS** | Public `/v1` contracts unchanged. Docs examples omit pre-submit keys. Production env reuses existing Zod boot validation; missing `DATABASE_URL` still fails closed. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; generation does not grade | **PASS** | Scoring and evaluators untouched. Judge still cannot write `weightedScore`. |
| VI. Jest testing discipline | Jest; API E2E with mocked LLM; persistence vs real PostgreSQL | **PASS** | `ci.yml` runs those suites. Live eval is a separate workflow. No Playwright replacement. |
| VII. Secure AI integration | Secrets never logged; Markdown untrusted; errors do not leak prompts/keys | **PASS** | Frozen install; no secrets in caches/build-args; eval secrets only on Environment `llm-evals`; fork PRs never see them; report artifacts not auto-committed. |
| VIII. Roadmap fidelity | Derive from roadmap; Phase 8 exclusions | **PASS** | M7 CI/Docker/migrate/gated deploy + M8 review/walkthrough/docs. M9 and Phase 7 leftovers excluded. Unexecuted deploy is **not run**. |

**Unjustified violations**: none. Adding GitHub Actions and production Dockerfiles is the roadmap’s Phase 8 boundary, not a 4th ad-hoc app.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. No Prisma tables; HTTP `/v1` unchanged; CI/eval/release/image/docs contracts are operational; quickstart separates merge-time suites from gated eval and optional deploy. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/009-phase-8-delivery/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # CI, evals, images, release, env, docs
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 8 **adds** operations files and **does not** add quiz/attempt/eval product modules. Follow `.agents/skills/folder-architecture/SKILL.md`. Do not add `helpers/` or `infrastructure/` packages.

```text
.github/workflows/
├── ci.yml                 # merge-time gates + image builds (no push, no live eval)
├── llm-evals.yml          # Environment llm-evals; dispatch/schedule only
└── release.yml            # Environment production; configurable publish/deploy

apps/api/Dockerfile        # multi-stage NestJS production image
apps/web/Dockerfile        # multi-stage Next.js standalone production image
apps/web/next.config.ts    # enable output: "standalone" (only product-file touch)

compose.yml                # unchanged development (label as DX)
compose.prod.yml           # db + api-migrate oneshot + api + web (no bind mounts)
.dockerignore              # keep apps/packages/evals/lockfile; exclude .env/.git/specs

package.json               # add db:migrate:deploy (and optional docker helper scripts)

docs/
├── architecture.md
├── data-model.md
├── api-examples.md
├── deployment.md
├── walkthrough.md
└── delivery-status.md

README.md                  # index links; do not claim unexecuted deploy/baseline
.env.example               # production notes only; still no real secrets

scripts/                   # optional deploy stub that exits not_run when DEPLOY_TARGET=none
```

**Structure Decision**: Operations at repository root and `apps/*/Dockerfile` as the roadmap layout. The only application source change expected is Next.js standalone configuration. Prisma schema, `/v1` handlers, scoring, and `@ai-quiz/evals` stay as Phase 7 left them.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None. All constitution gates **PASS**.
