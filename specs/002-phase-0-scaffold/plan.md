# Implementation Plan: Phase 0 Project Scaffolding

**Branch**: `002-phase-0-scaffold` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-phase-0-scaffold/spec.md`

**Roadmap phase**: Phase 0 — Project scaffolding, monorepo and local runtime (P0)

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Stand up a pnpm + Turborepo workspace so a developer can clone, install, start local PostgreSQL, boot a NestJS API shell and a Next.js web shell, prove `/health` plus database readiness, and run lint, strict typecheck, Jest tests and builds. Shared `domain`, `application`, `contracts`, `ui` and `config` packages exist as compilable shells with hexagonal import gates. Prisma is connected with **no quiz models**. The web home view shows design-system tokens and Button/Card/PageShell only. Quiz product behavior, AI, Langfuse, production images and CI are out of scope.

Technical approach (from [research.md](./research.md)): Node.js 24 LTS, NestJS 12 + Terminus (`/health` liveness, `/ready` Prisma ping), Next.js 16 App Router, Prisma 7 in `apps/api` with adapter-pg, Compose PostgreSQL 16 only, Zod env validation per app, Jest (not Vitest), Tailwind v4 tokens once in `@ai-quiz/ui`.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`)

**Primary Dependencies**: pnpm workspaces, Turborepo 2.x, NestJS 12, Next.js 16 App Router, Prisma 7 (`@prisma/adapter-pg`, `pg`), Zod, Tailwind CSS v4, shadcn/ui (Button, Card), ESLint 9, Prettier, `eslint-plugin-boundaries`, `@nestjs/terminus`

**Storage**: Local PostgreSQL 16 via root `compose.yml` (healthcheck + volume). Prisma schema with **zero product models**.

**Testing**: Jest for packages and API (Supertest for `/health`). Jest + React Testing Library + jsdom for the web shell. `pnpm test` does not require PostgreSQL. Live `/ready` is a quickstart check.

**Target Platform**: Developer Linux/macOS local runtime (Docker for PostgreSQL). Not production containers.

**Project Type**: pnpm/Turborepo web + API monorepo (hexagonal package shells)

**Performance Goals**: After dependencies and database are up, a developer confirms liveness and DB connectivity in under one minute (SC-002). Quality commands complete on the empty-but-valid scaffold.

**Constraints**: Domain/application MUST NOT import Nest, Prisma, Next, React, or provider SDKs. Phase 0 startup MUST NOT require OpenAI or Langfuse keys. Do not reinitialize Spec Kit or overwrite the Constitution. No quiz tables, scoring, quiz REST, Markdown fetch, generation, or quiz UI.

**Scale/Scope**: Two app shells, five shared packages, two HTTP routes (`/health`, `/ready`), one web route (`/`), one Compose service, four root quality commands.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | Empty shells + ESLint boundaries + package.json isolation. Prisma and Terminus live in `apps/api` only. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | No `packages/database`, no quiz module, no RHF. Health is a small API adapter. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Shared tsconfig in `@ai-quiz/config`; `pnpm typecheck`. |
| IV. Zod-validated contracts | External input parsed with Zod; fail closed | **PASS** | Env schemas at API/web bootstrap. Public quiz DTOs deferred; `packages/contracts` is a typed shell only. |
| V. Testable domain (NON-NEGOTIABLE) | Scoring stays pure; no LLM scoring | **PASS (N/A product)** | Scoring is **not implemented**. Plan forbids quiz/scoring code in this cycle. |
| VI. Jest testing discipline | Jest (not a substitute runner); tests with behavior | **PASS** | Jest + RTL + Supertest smoke tests. Explicitly reject Nest 12 Vitest default. |
| VII. Secure AI integration | Secrets server-side; no SSRF/prompt work this phase | **PASS (scoped)** | No fetch/LLM. `.env.example` has no live secrets. Unused AI keys not required. DATABASE_URL not logged. |
| VIII. Roadmap fidelity | Derive from roadmap; no auth/billing/queues | **PASS** | Phase 0 checklist only. M6/M7 CI and Dockerfiles deferred. |

**Unjustified violations**: none. Complexity table not required.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. Added `/ready` is a documented readiness contract, not a quiz API. Prisma remains model-free. UI contract is a non-quiz shell. No new packages beyond the five named shells. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/002-phase-0-scaffold/
├── plan.md              # This file
├── research.md          # Phase 0 research
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Health, environment, UI shell
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 0 delivers the following tree. Quiz modules, app Dockerfiles and `.github/workflows` are **not** created.

```text
ai-quiz/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # postgresql, no product models
│   │   │   └── migrations/            # optional scaffold baseline only
│   │   ├── prisma.config.ts           # Prisma 7 datasource URL
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── health/
│   │   │   │   ├── health.module.ts
│   │   │   │   └── health.controller.ts
│   │   │   └── infrastructure/
│   │   │       ├── env.ts             # Zod
│   │   │       └── prisma.service.ts  # adapter-pg composition root
│   │   ├── test/
│   │   │   └── health.spec.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css        # re-export @ai-quiz/ui styles
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx           # English design-system shell
│       │   ├── env.ts                 # Zod public env
│       │   └── app/page.test.tsx
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── domain/src/index.ts
│   ├── application/src/index.ts
│   ├── contracts/src/index.ts
│   ├── ui/
│   │   ├── src/
│   │   │   ├── styles/globals.css     # tokens once
│   │   │   ├── lib/cn.ts
│   │   │   ├── components/button.tsx
│   │   │   ├── components/card.tsx
│   │   │   └── components/page-shell.tsx
│   │   └── package.json
│   └── config/                        # eslint, tsconfig, jest presets
├── compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json
├── .env.example
├── .gitignore
└── README.md                          # Phase 0 setup (do not wipe planning-kit docs)
```

Existing `.specify/`, `.agents/`, `AGENTS.md`, `roadmap.md`, `implementation-roadmap.md` and harness adapters stay as-is.

**Structure Decision**: Constitution/roadmap monorepo (`apps/api`, `apps/web`, five `packages/*`). Prisma stays in the API app (no extra database package). Health is an inbound adapter; Prisma is an outbound adapter at the API composition root. Web consumes `@ai-quiz/ui` and public env only.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
