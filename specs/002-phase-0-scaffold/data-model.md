# Data Model: Phase 0 Project Scaffolding

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-10

This phase has **no quiz product tables**. Persistence exists only to connect to PostgreSQL and record Prisma’s own migration history if a baseline is created. The entities below are runtime/configuration concepts, not a product ERD.

## Entities

### Workspace

Represents the installable monorepo.

| Field | Rules |
| ----- | ----- |
| packageManager | pnpm, pinned in root `package.json` |
| apps | `api`, `web` |
| packages | `domain`, `application`, `contracts`, `ui`, `config` |
| scripts | `dev`, `lint`, `typecheck`, `test`, `build` |

**Validation**: All seven workspace members lint, typecheck, test and build. Domain/application declare no framework dependencies.

### EnvironmentConfiguration

Validated at process start. Invalid values fail closed before the app claims to be ready.

#### API (server-only)

| Field | Required | Rules |
| ----- | -------- | ----- |
| `DATABASE_URL` | Yes | Non-empty PostgreSQL URL. Must not be logged. |
| `PORT` | No | Integer, default `3001`. |
| `NODE_ENV` | No | `development` \| `test` \| `production`; default `development`. |
| `DIRECT_URL` | No | Optional Prisma direct URL; local default may equal `DATABASE_URL`. Unused if unset. |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `LANGFUSE_*` | No | Placeholders in `.env.example` only. **Must not** be required. |

#### Web (public)

| Field | Required | Rules |
| ----- | -------- | ----- |
| `NEXT_PUBLIC_API_URL` | Yes | Absolute URL of the API origin (documented default `http://localhost:3001`). |
| Database and provider secrets | Forbidden | MUST NOT appear in the web bundle or web Zod schema. |

**Transitions**: missing/malformed required field → startup abort with a named, non-secret error. Valid parse → boot.

### LocalDatabaseInstance

Compose service `db` (PostgreSQL 16).

| Field | Rules |
| ----- | ----- |
| port | `5432` on localhost |
| volume | Persistent named volume |
| health | `pg_isready` must succeed before API readiness can pass |
| schema | No `SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, or answer tables |

**State**: `stopped` → `starting` → `healthy` → `stopped`. Restart keeps volume data.

### PrismaBaseline

| Field | Rules |
| ----- | ----- |
| models | **Empty** product model set |
| client | Generated into the API app; constructed with `adapter-pg` |
| migrations | Optional `init`/`scaffold` migration with no product DDL |

**Invariant**: Inspecting the database after bootstrap shows no quiz product relations.

### HealthReport (liveness)

| Field | Rules |
| ----- | ----- |
| `status` | Always `"ok"` when the HTTP process handled the request |
| HTTP | `200` on `GET /health` |
| dependencies | **Must not** include a database check |

**State**: exists only while the API process is running. Independent of database state.

### ReadinessReport

| Field | Rules |
| ----- | ----- |
| `status` | `"ok"` if every indicator is up; otherwise not ok |
| `database` | Up when Prisma can ping PostgreSQL; down otherwise |
| HTTP | `200` when ready; `503` when the database ping fails |

**Transitions**:
- DB healthy + valid `DATABASE_URL` → `ready` (200)
- DB stopped or unreachable → `not ready` (503)
- Invalid `DATABASE_URL` at boot → process never becomes ready (startup failure, not a 200)

### SharedPackageShell

| Package | Allowed contents this phase | Forbidden |
| ------- | --------------------------- | --------- |
| `domain` | Typed placeholder export | Nest, Prisma, Next, React, HTTP, OpenAI, Langfuse, scoring |
| `application` | Typed placeholder export | Same as domain, plus concrete adapters |
| `contracts` | Typed placeholder / empty public schema module | Answer keys, env secrets |
| `ui` | Tokens, `cn`, PageShell, Button, Card | Quiz forms, player, results, RadioGroup/Progress for quizzes |
| `config` | ESLint, TS, Jest presets | Runtime secrets |

**Relationships**: `application` may import `domain`. `api` may import domain, application, contracts. `web` may import contracts and ui. `ui` must not import api. Domain imports none of the apps.

### QualityCommandSuite

| Command | Passes when |
| ------- | ----------- |
| `pnpm lint` | No ESLint errors, including boundary violations |
| `pnpm typecheck` | Strict `tsc --noEmit` across the workspace |
| `pnpm test` | Jest suites green without requiring PostgreSQL |
| `pnpm build` | API and web production-style builds succeed |

## Out of model (deferred)

Quiz/question/option/attempt/answer entities, scoring value objects, source snapshots, attempt tokens — Phase 1–2. Do not add them to Prisma or contracts in this cycle.
