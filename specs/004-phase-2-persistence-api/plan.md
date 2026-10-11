# Implementation Plan: Phase 2 Persistence and Deterministic REST Quiz Flow

**Branch**: `004-phase-2-persistence-api` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-phase-2-persistence-api/spec.md`

**Roadmap phase**: Phase 2 — Prisma model, repositories and deterministic API skeleton (P0)

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Add durable PostgreSQL records and a NestJS `/v1` quiz flow so a REST client can create a quiz from **fixed fixtures**, retrieve a sanitized quiz, start an attempt, submit answers, and read the persisted Phase 1 score — with no remote Markdown fetch and no language model.

Technical approach (from [research.md](./research.md)): extend Phase 1 domain with repository/generation ports; application use cases orchestrate create/get/start/submit/result against those ports; Prisma 7 adapters and a fixture generation adapter live in `apps/api`; attempt tokens are minted in the HTTP adapter and stored as SHA-256 hashes only; first submit finalizes answers and scores in one Prisma transaction; later/concurrent submits return the stored result.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse Phase 0.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. NestJS 12 REST adapters. Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`) already in `apps/api`. Zod 4 public contracts. `node:crypto` for attempt tokens. No OpenAI, Vercel AI SDK, Langfuse, or HTTP fetch clients.

**Storage**: PostgreSQL 16 (Compose `db` from Phase 0). Prisma product models and the first quiz migration in `apps/api/prisma/`. Integration/E2E use a separate `ai_quiz_test` database on the same instance.

**Testing**: Jest unit tests in `packages/application` with **mocked ports**. Jest + real PostgreSQL integration tests and Jest + Supertest + real PostgreSQL API tests in `apps/api`. Default `pnpm test` stays free of PostgreSQL (Phase 0/1). `pnpm test:integration` and `pnpm test:e2e` require the test database.

**Target Platform**: Developer local workspace (Linux/macOS) with Docker PostgreSQL. Not production containers.

**Project Type**: Hexagonal slice in the existing pnpm/Turborepo monorepo — domain ports, application use cases, API inbound/outbound adapters.

**Performance Goals**: A complete create → get → start → submit → result round-trip against local PostgreSQL completes in well under one reviewer sitting (spec SC-007). Scoring remains in-process Phase 1 functions (no extra I/O beyond the transaction).

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse or HTTP clients. Pre-submit responses MUST omit answer keys. Persist only token hashes; never log plaintext tokens. No fetch, model calls, quiz UI, Langfuse or production delivery. Playable quizzes are immutable. Repeat submit is idempotent.

**Scale/Scope**: One quiz Nest module; five `/v1` resources; seven Prisma models; five application use cases; one fixture adapter pair; integration + API evidence suites. No new workspace packages. No web quiz routes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | Ports in `packages/domain`. Use cases in `packages/application`. Prisma, Nest REST, fixture adapters and token minting in `apps/api`. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | `QuizRepositoryPort`, `AttemptRepositoryPort`, `UnitOfWorkPort`, `QuizGenerationPort`, `MarkdownSourcePort` each have a Phase 2 consumer. No `packages/database`. Fixture adapters exist so Phase 3 can replace them. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Reuse `@ai-quiz/config` tsconfig; explicit domain/DTO types; no `any` to bypass invariants. |
| IV. Zod-validated contracts | External input parsed with Zod; fail closed; keys out of public quiz DTOs | **PASS** | Reuse Phase 1 schemas; add create response, start-attempt response, optional `strategy`, and new error codes. GET quiz uses the key-free view. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; replaceable multi policy; idempotent resubmit | **PASS** | Submit calls existing `gradeAttempt` / `scoreAttempt`. No scoring in Prisma or HTTP. Duplicate submit returns stored result without re-scoring. |
| VI. Jest testing discipline | Jest; persistence vs real PostgreSQL; API E2E with Supertest | **PASS** | Application tests mock ports. Integration and API suites use real PostgreSQL + Jest. No Vitest. No Playwright this phase. |
| VII. Secure AI integration | Secrets server-side; tokens not logged; no SSRF this phase | **PASS (scoped)** | No fetch/LLM. Fixture source adapter MUST NOT HTTP-get. Attempt token hashed (SHA-256); plaintext only in start-attempt response. `DATABASE_URL` already env-validated. |
| VIII. Roadmap fidelity | Derive from roadmap; Phase 2 exclusions | **PASS** | `/v1` paths, models and use cases from `roadmap.md` / `implementation-roadmap.md` Phase 2. No auth/billing/queues. Fixtures instead of M2 generation. |

**Unjustified violations**: none. Complexity table not required. Repository ports are the hexagonal boundary the Constitution requires, not an extra layer.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. Entities map to Prisma models with uniqueness/FKs; HTTP contracts hide keys on GET quiz and require Bearer tokens on submit/result; quickstart runs integration/E2E against `ai_quiz_test` without a model key; fixture adapters are outbound replacements, not domain logic. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/004-phase-2-persistence-api/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # HTTP + Zod shapes and error codes
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 2 **extends** these files. Do not add Markdown HTTP fetch, OpenAI adapters, quiz UI routes, Langfuse or production Dockerfiles.

```text
packages/
├── domain/src/
│   ├── ports/
│   │   ├── markdown-source-port.ts
│   │   ├── quiz-generation-port.ts
│   │   ├── quiz-repository-port.ts
│   │   ├── attempt-repository-port.ts
│   │   └── unit-of-work-port.ts
│   └── (existing quiz/scoring/attempt modules unchanged except re-exports)
├── application/src/
│   ├── errors.ts                    # QUIZ_NOT_FOUND, ATTEMPT_NOT_FOUND, UNAUTHORIZED_ATTEMPT, QUIZ_NOT_PLAYABLE
│   ├── create-quiz.ts
│   ├── get-quiz.ts
│   ├── start-attempt.ts
│   ├── submit-quiz.ts
│   ├── get-quiz-result.ts
│   ├── create-quiz.spec.ts          # mocked ports
│   ├── get-quiz.spec.ts
│   ├── start-attempt.spec.ts
│   ├── submit-quiz.spec.ts
│   └── get-quiz-result.spec.ts
└── contracts/src/
    ├── error-codes.ts               # add the four new codes
    ├── create-quiz.ts               # optional strategy: balanced
    ├── create-quiz-response.ts      # { id, status }
    ├── start-attempt-response.ts    # { attemptId, token }
    └── error-response.ts            # { code, message }

apps/api/
├── prisma/
│   ├── schema.prisma                # product models
│   └── migrations/                  # first quiz DDL migration
├── src/modules/quiz/
│   ├── quiz.module.ts
│   ├── adapters/in/rest/
│   │   ├── quiz.controller.ts       # POST /v1/quizzes, GET /v1/quizzes/:quizId, POST .../attempts
│   │   ├── attempt.controller.ts    # POST /v1/attempts/:attemptId/submit, GET .../result
│   │   ├── attempt-token.ts         # mint + SHA-256 hash; never log plaintext
│   │   └── http-error.filter.ts
│   └── adapters/out/
│       ├── prisma/
│       │   ├── quiz.prisma-repository.ts
│       │   ├── attempt.prisma-repository.ts
│       │   └── prisma-unit-of-work.ts
│       └── fixture/
│           ├── fixture-bank.ts      # 8 valid mixed questions + snapshot text
│           ├── fixed-source.adapter.ts
│           └── fixed-generation.adapter.ts
└── test/
    ├── health.spec.ts               # unchanged; default `pnpm test`
    ├── integration/
    │   └── ...                      # real PostgreSQL repository/transaction tests
    └── e2e/
        └── ...                      # Supertest full /v1 flow
```

Existing `apps/web`, `packages/ui`, `/health`, `/ready` stay unchanged. Domain scoring functions are not rewritten.

**Structure Decision**: Same monorepo. Ports in domain, use cases in application, Zod extras in contracts, adapters only in `apps/api`. Fixture outbound adapters stand in for Phase 3 fetch/generation. Turbo gains `test:integration` and `test:e2e` (`cache: false`, `env: ["DATABASE_URL"]`) per Turborepo 2.11 task configuration; default `test` remains the no-Postgres suite.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
