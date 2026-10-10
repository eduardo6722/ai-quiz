---
description: "Task list for Phase 0 project scaffolding (roadmap Phase 0 only)"
---

# Tasks: Phase 0 Project Scaffolding

**Input**: Design documents from `/specs/002-phase-0-scaffold/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 0 — project scaffolding, monorepo and local runtime. Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap Phases 1–7.

**Tests**: Included. Spec FR-014, US4, Constitution VI, and health/UI contracts require Jest (API/domain) and Jest + React Testing Library (web). Write listed tests first and confirm they fail before implementation.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US6`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- API: `apps/api/`
- Web: `apps/web/`
- Packages: `packages/domain|application|contracts|ui|config/`
- Do **not** create `apps/api/src/modules/quiz/`, app Dockerfiles, or `.github/workflows/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspace files and directory layout. Do not reinitialize Spec Kit or overwrite `.specify/memory/constitution.md`.

- [X] T001 Create workspace directories `apps/api/src`, `apps/api/prisma`, `apps/api/test`, `apps/web/src/app`, `packages/domain/src`, `packages/application/src`, `packages/contracts/src`, `packages/ui/src`, `packages/config` per plan.md
- [X] T002 Create root `package.json` as private workspace with `engines.node` `^24`, `packageManager` pnpm 10.x, and scripts `dev`, `lint`, `typecheck`, `test`, `build` that invoke Turbo
- [X] T003 Create `pnpm-workspace.yaml` listing `apps/*` and `packages/*`
- [X] T004 Create `turbo.json` with tasks `build` (`dependsOn: ["^build"]`, outputs `.next/**` and `dist/**`), `typecheck` (`dependsOn: ["^typecheck"]`), `lint`, `test`, and `dev` (`cache: false`, `persistent: true`)
- [X] T005 [P] Update `.gitignore` to ignore `node_modules`, `.env` (keep `.env.example`), `dist`, `.next`, `.turbo`, coverage, and Prisma generated client; do not ignore `pnpm-lock.yaml`
- [X] T006 [P] Add `.npmrc` with isolated pnpm linker settings so undeclared Nest/Prisma/Next packages cannot resolve inside `packages/domain`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared tooling, empty hexagonal packages, app bootstraps, Compose Postgres, empty Prisma schema, example env. **No user story work until this phase is complete.**

- [X] T007 Create `@ai-quiz/config` package in `packages/config/package.json` exporting shared tooling
- [X] T008 [P] Add strict TypeScript base (`strict: true`, no implicit `any`) in `packages/config/tsconfig.base.json`
- [X] T009 [P] Add ESLint 9 flat config and Prettier in `packages/config/eslint.config.js` and `packages/config/prettier.config.js`
- [X] T010 [P] Add Jest preset (not Vitest) in `packages/config/jest.preset.cjs`
- [X] T011 [P] Create `@ai-quiz/domain` in `packages/domain/package.json` and `packages/domain/src/index.ts` with a typed placeholder export and **no** NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, or Langfuse dependencies
- [X] T012 [P] Create `@ai-quiz/application` in `packages/application/package.json` and `packages/application/src/index.ts` depending only on `@ai-quiz/domain`
- [X] T013 [P] Create `@ai-quiz/contracts` in `packages/contracts/package.json` and `packages/contracts/src/index.ts` as a public-schema shell with **no** answer keys and **no** env secrets
- [X] T014 [P] Create `@ai-quiz/ui` in `packages/ui/package.json` and `packages/ui/src/index.ts` (React allowed; Nest/Prisma forbidden)
- [X] T015 Scaffold NestJS 12 API (Jest, not Vitest) in `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/main.ts`, and `apps/api/src/app.module.ts` listening on `PORT` default `3001`
- [X] T016 Scaffold Next.js 16 App Router in `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/src/app/layout.tsx`, and `apps/web/src/app/page.tsx` with `transpilePackages` for `@ai-quiz/ui`; no React Hook Form
- [X] T017 Create local PostgreSQL 16 Alpine service `db` in `compose.yml` with host port `5432`, named volume, and `pg_isready` healthcheck; **do not** add API/web Compose services
- [X] T018 Create Prisma 7 schema with postgresql datasource and **zero product models** (no `SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, or answer tables) in `apps/api/prisma/schema.prisma`
- [X] T019 Create Prisma 7 datasource config reading `DATABASE_URL` in `apps/api/prisma.config.ts`
- [X] T020 Create `.env.example` with required `DATABASE_URL` (`postgresql://postgres:postgres@localhost:5432/ai_quiz?schema=public`), `PORT` `3001`, `NEXT_PUBLIC_API_URL` `http://localhost:3001`; optional `DIRECT_URL` and `NODE_ENV`; unused placeholders `OPENAI_API_KEY`, `OPENAI_MODEL`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL` that **MUST NOT** be required; **no live credentials**
- [X] T021 Run `pnpm install` and keep `pnpm-lock.yaml` so a lockfile-consistent fresh clone install works

**Checkpoint**: Workspace members exist, tooling is shared, apps compile as empty shells, Compose DB and `.env.example` are defined.

---

## Phase 3: User Story 1 - Fresh clone to running local platform (Priority: P1) 🎯 MVP

**Goal**: From documented steps, install, start PostgreSQL, and reach both app shells without OpenAI or Langfuse keys.

**Independent Test**: On a clean working copy, `pnpm install`, copy `.env.example` to `.env`, `docker compose up -d db`, generate Prisma client, `pnpm dev`, then open `http://localhost:3000` and `http://localhost:3001` (or documented ports) without undocumented fixes.

### Implementation for User Story 1

- [X] T022 [US1] Wire root `pnpm dev` in `package.json` and `turbo.json` so `apps/api` serves on port `3001` and `apps/web` on port `3000`
- [X] T023 [US1] Implement Prisma composition root with `@prisma/adapter-pg` and `pg` (no product models) in `apps/api/src/infrastructure/prisma.service.ts`
- [X] T024 [US1] Add `prisma generate` and `db:migrate` scripts in `apps/api/package.json` and root `package.json`; add a minimal baseline under `apps/api/prisma/migrations/` **only if** required so `_prisma_migrations` can be recorded (still **zero** quiz DDL)
- [X] T025 [US1] Extend `README.md` with clone, `pnpm install`, `cp .env.example .env`, `docker compose up -d db`, Prisma generate/migrate, `pnpm dev`, health verification, and `pnpm lint|typecheck|test|build`; do not wipe planning-kit docs; startup MUST NOT require `OPENAI_API_KEY` or Langfuse keys; do not instruct `specify init --force`

**Checkpoint**: A developer can boot the local platform from README. Health semantics are still US2.

---

## Phase 4: User Story 2 - Health and database connectivity (Priority: P1)

**Goal**: `GET /health` is process liveness; `GET /ready` reports PostgreSQL reachability; no quiz tables.

**Independent Test**: With API and DB up, `curl` `/health` → 200. `curl` `/ready` → 200 with database up. Stop `db`, `/health` still 200, `/ready` 503. Inspect DB: no quiz product tables.

### Tests for User Story 2 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T026 [P] [US2] Contract test: `GET /health` returns HTTP 200 and `status` `"ok"` without querying PostgreSQL in `apps/api/test/health.spec.ts`
- [X] T027 [P] [US2] Contract test: readiness reports database down as HTTP 503 (mock Prisma ping) in `apps/api/test/ready.spec.ts`

### Implementation for User Story 2

- [X] T028 [US2] Implement `GET /health` liveness (`status` always `"ok"` when the process handled the request; **MUST NOT** include a database check) in `apps/api/src/health/health.controller.ts` and `apps/api/src/health/health.module.ts`
- [X] T029 [US2] Implement `GET /ready` with `@nestjs/terminus` `PrismaHealthIndicator` in `apps/api/src/health/` so HTTP 200 when the database is reachable and HTTP 503 when the ping fails (Terminus `info.database.status` envelope is acceptable per `contracts/health.openapi.yaml`)
- [X] T030 [US2] Register `HealthModule` in `apps/api/src/app.module.ts` and confirm `apps/api/prisma/schema.prisma` still has **zero** product models

**Checkpoint**: Liveness vs readiness matches `contracts/health.openapi.yaml`. Live `/ready` against Compose is a quickstart check, not required inside `pnpm test`.

---

## Phase 5: User Story 3 - Valid and invalid configuration (Priority: P1)

**Goal**: Example env starts both apps; missing/malformed required values fail closed without leaking secrets.

**Independent Test**: Start with `.env.example` values (success). Start API with malformed `DATABASE_URL` (non-zero exit naming `DATABASE_URL`, never printing the secret). Confirm unused `OPENAI_*` / `LANGFUSE_*` are not required.

### Tests for User Story 3 ⚠️

- [X] T031 [P] [US3] Tests that missing or malformed `DATABASE_URL` fail closed and name the key without logging the secret value in `apps/api/test/env.spec.ts`
- [X] T032 [P] [US3] Tests that `NEXT_PUBLIC_API_URL` is required as an absolute URL (documented default `http://localhost:3001`) and the web schema **MUST NOT** include `DATABASE_URL` in `apps/web/src/env.test.ts`

### Implementation for User Story 3

- [X] T033 [US3] Implement API Zod env in `apps/api/src/infrastructure/env.ts`: `DATABASE_URL` required non-empty PostgreSQL URL and MUST NOT be logged; `PORT` integer default `3001`; `NODE_ENV` optional `development` \| `test` \| `production` default `development`; `DIRECT_URL` optional; `OPENAI_API_KEY`, `OPENAI_MODEL`, and `LANGFUSE_*` **MUST NOT** be required
- [X] T034 [US3] Parse API env at bootstrap in `apps/api/src/main.ts` so invalid config exits before serving traffic
- [X] T035 [US3] Implement web Zod env in `apps/web/src/env.ts`: `NEXT_PUBLIC_API_URL` required absolute URL; database and provider secrets forbidden; import from `apps/web/src/app/layout.tsx` so missing public URL fails closed
- [X] T036 [US3] Align `.env.example` and `compose.yml` credentials with `contracts/environment.md` (no live secrets; placeholders documented unused)

**Checkpoint**: Valid config boots; invalid required config fails closed.

---

## Phase 6: User Story 4 - Quality commands on the scaffold (Priority: P1)

**Goal**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` succeed without PostgreSQL.

**Independent Test**: After `pnpm install`, run the four root commands and observe success, including at least one API/domain Jest proof and one web RTL proof.

### Tests for User Story 4 ⚠️

- [X] T037 [P] [US4] Domain smoke test in `packages/domain/src/index.spec.ts`
- [X] T038 [P] [US4] Application smoke test in `packages/application/src/index.spec.ts`
- [X] T039 [P] [US4] Web RTL smoke test for the home view in `apps/web/src/app/page.test.tsx` (Jest + React Testing Library + jsdom)

### Implementation for User Story 4

- [X] T040 [US4] Point each workspace `package.json` (`apps/api`, `apps/web`, `packages/domain`, `packages/application`, `packages/contracts`, `packages/ui`, `packages/config`) `lint`, `typecheck`, `test`, and `build` scripts at `@ai-quiz/config` presets and `tsc --noEmit` where applicable
- [X] T041 [US4] Make `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` succeed from the repo root **without** PostgreSQL running

**Checkpoint**: Definition of done quality commands pass on the scaffold.

---

## Phase 7: User Story 5 - Shared workspace shells with hexagonal boundaries (Priority: P2)

**Goal**: Five named packages plus two apps; domain/application stay framework-free; disallowed imports fail lint.

**Independent Test**: List workspace members. Typecheck domain/application with no Nest/Prisma/Next/React/provider deps. A disallowed domain→`@nestjs/core` import fails `pnpm lint`.

### Tests for User Story 5 ⚠️

- [X] T042 [US5] Add a Jest assertion that ESLint boundary config forbids `packages/domain` from importing `@nestjs/core` in `packages/config/src/boundaries.spec.ts`

### Implementation for User Story 5

- [X] T043 [US5] Configure `eslint-plugin-boundaries` in `packages/config/eslint.config.js`: `domain` → no frameworks; `application` → `domain` (and `contracts` if needed); `api` may import domain/application/contracts/prisma/nest; `web` may import contracts/ui and MUST NOT import API source, Prisma, or secrets
- [X] T044 [US5] Verify `packages/domain/package.json` and `packages/application/package.json` list no `@nestjs/*`, `prisma`, `@prisma/*`, `next`, `react`, `openai`, `ai`, or Langfuse dependencies

**Checkpoint**: Hexagonal isolation is an automated error, not a convention.

---

## Phase 8: User Story 6 - Minimal design foundations on the web shell (Priority: P2)

**Goal**: English home shell using shared tokens and PageShell/Card/Button. No quiz routes.

**Independent Test**: Open `/` and see light-green canvas (`#F7FBF7`), white card, dark-green primary (`#23624B`), English copy. No `/quiz` setup, player, or results. RTL test passes. Readable at ~320px and desktop.

### Tests for User Story 6 ⚠️

- [X] T045 [US6] RTL test asserting English heading text and a button/link in `apps/web/src/app/page.test.tsx` per `contracts/ui-shell.md`

### Implementation for User Story 6

- [X] T046 [US6] Install design tokens **once** in `packages/ui/src/styles/globals.css` using skill hex values `background` `#F7FBF7`, `card` `#FFFFFF`, `primary` `#23624B`, `primary-foreground` `#FFFFFF`, `foreground` `#173F32`, `muted-foreground` `#53695D`, `border` `#D4E6D8`, plus remaining skill tokens (`cream`, `mint`, `sage`, `leaf`, `success`, `destructive`, `warning`, `ring`); Tailwind v4 `@theme inline`; system/local `font-sans` / `font-display`; **no** dark theme and **no** remote font requests
- [X] T047 [P] [US6] Implement `cn()` in `packages/ui/src/lib/cn.ts` using literal class maps only (never `` `bg-${tone}` ``)
- [X] T048 [P] [US6] Add shadcn Button in `packages/ui/src/components/button.tsx` with primary forest-green background, white label, minimum 44px height, and visible `ring` focus
- [X] T049 [P] [US6] Add shadcn Card in `packages/ui/src/components/card.tsx` (`rounded-2xl`, `border-border`, `bg-card`, no default heavy shadow)
- [X] T050 [P] [US6] Add PageShell in `packages/ui/src/components/page-shell.tsx` (`min-h-svh bg-background font-sans text-foreground`, max width ~1150px, gutters 16/24/32px)
- [X] T051 [US6] Re-export UI styles from `apps/web/src/app/globals.css` and compose the English home shell in `apps/web/src/app/page.tsx` using PageShell, Card, and Button; optional control linking to `NEXT_PUBLIC_API_URL/health`; **no** `/quiz`, player, or results routes; **no** RadioGroup/Progress quiz controls
- [X] T052 [US6] Export PageShell, Button, Card, and `cn` from `packages/ui/src/index.ts`

**Checkpoint**: Design-system foundations exist without quiz product UI.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quickstart validation and scope freeze for this roadmap phase.

- [X] T053 [P] Confirm `compose.yml` user, password, database name, and port match `.env.example` `DATABASE_URL` in `compose.yml` and `.env.example`
- [X] T054 [P] Confirm `README.md` does not tell developers to reinitialize Spec Kit, regenerate the Constitution, or overwrite `.agents/skills/`
- [X] T055 Run [quickstart.md](./quickstart.md) end to end: install, Compose db, `/health` 200, `/ready` 200, stop db `/health` 200 `/ready` 503, invalid `DATABASE_URL` fail-closed, `pnpm lint|typecheck|test|build`
- [X] T056 Scope audit of `apps/`, `packages/`, `compose.yml`, and `.github/` confirming no quiz modules, scoring, `/v1/quizzes`, Markdown fetch, required OpenAI/Langfuse runtime, production Dockerfiles, or GitHub Actions added by this phase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP
- **US2 (Phase 4)**: Depends on US1 (running API + Prisma service)
- **US3 (Phase 5)**: Depends on US1; can overlap US2 (different files: `env.ts` vs `health/`)
- **US4 (Phase 6)**: Depends on US1–US3 tests/impl being present so quality commands have something to run
- **US5 (Phase 7)**: Depends on Foundational packages; can start after Phase 2 in parallel with US1 if `packages/config` is stable, but lint fixture is most useful after US4 scripts exist
- **US6 (Phase 8)**: Depends on Next shell (US1) and Jest/RTL wiring (US4)
- **Polish (Phase 9)**: Depends on US1–US6

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational only
- **User Story 2 (P1)**: After US1 Prisma composition root
- **User Story 3 (P1)**: After US1 bootstrap; independent of Terminus routes
- **User Story 4 (P1)**: After enough code exists to lint/typecheck/test/build
- **User Story 5 (P2)**: After package shells (Phase 2); strongest after US4
- **User Story 6 (P2)**: After web app + RTL harness

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Config/models before adapters
- Adapters before HTTP routes
- Story complete before the next P1 unless noted parallel

### Parallel Opportunities

- T005/T006 after T001
- T008–T010 after T007; T011–T014 together
- T026/T027 together; T031/T032 together; T037–T039 together
- T047–T050 after T046
- US3 (`env.ts`) and US2 (`health/`) after US1, different files
- T053/T054 during polish

---

## Parallel Example: User Story 2

```bash
# After US1, launch both contract tests together:
Task: "Contract test GET /health in apps/api/test/health.spec.ts"
Task: "Contract test GET /ready 503 on DB down in apps/api/test/ready.spec.ts"
```

## Parallel Example: User Story 6

```bash
# After tokens in packages/ui/src/styles/globals.css:
Task: "cn() in packages/ui/src/lib/cn.ts"
Task: "Button in packages/ui/src/components/button.tsx"
Task: "Card in packages/ui/src/components/card.tsx"
Task: "PageShell in packages/ui/src/components/page-shell.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: install → Compose db → `pnpm dev` → both shells reachable
5. Continue P1 stories (health, env, quality commands) before P2

### Incremental Delivery

1. Setup + Foundational → empty workspace
2. US1 → running local platform (MVP)
3. US2 → `/health` + `/ready`
4. US3 → fail-closed env
5. US4 → `pnpm lint|typecheck|test|build`
6. US5 → hexagonal lint gate
7. US6 → design-system shell
8. Polish → quickstart.md + scope audit

### Parallel Team Strategy

1. Together: Setup + Foundational
2. Then: Developer A US1→US2, Developer B US3 (after US1), Developer C package smoke tests toward US4/US5
3. US6 last on `apps/web` + `packages/ui`

---

## Notes

- [P] = different files, no incomplete dependencies
- Do not implement quiz scoring, `/v1/quizzes`, Markdown fetch, AI SDKs as required runtime, Langfuse, production Dockerfiles, or GitHub Actions
- Do not reinitialize Spec Kit or overwrite the Constitution
- Stop after this roadmap phase; do not generate Phase 1 product tasks here
- Commit after each task or logical group when implementation is requested
