# Implementation Plan: Phase 1 Domain Scoring and Public Contracts

**Branch**: `003-phase-1-domain-scoring` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-phase-1-domain-scoring/spec.md`

**Roadmap phase**: Phase 1 — Domain, scoring rules and Jest unit tests (P0)

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Fill the Phase 0 `@ai-quiz/domain`, `@ai-quiz/application` and `@ai-quiz/contracts` shells so a reviewer can prove deterministic grading without PostgreSQL or a language model. Domain owns quiz invariants, isolated single/multiple scoring (provisional multi-answer policy from `roadmap.md`), weighted average `Σ(score[i] × 1.1^i) / Σ(1.1^i)`, display rounding and in-memory attempt freeze. Contracts own Zod 4 schemas for create-quiz and submit-answers plus public quiz/result views (keys only after scoring). Application exposes `gradeAttempt` that maps to those views and never performs I/O.

Technical approach (from [research.md](./research.md)): reuse Phase 0 Jest/TS shells; add Zod `^4.1.11` only to contracts; no repository ports, Prisma models, quiz HTTP, fetch or UI.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse Phase 0.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. `@ai-quiz/domain` (no runtime deps). `@ai-quiz/application` depends on domain + contracts. `@ai-quiz/contracts` adds Zod `^4.1.11`. Jest + ts-jest as already configured.

**Storage**: **N/A** for this phase. In-memory attempt values only. Do not add Prisma product models or migrations.

**Testing**: Jest unit tests colocated in `packages/domain`, `packages/application` and `packages/contracts`. `pnpm test` MUST pass without PostgreSQL or model keys.

**Target Platform**: Same developer local workspace as Phase 0. No new processes.

**Project Type**: Hexagonal library slice inside the existing pnpm/Turborepo monorepo (domain/application/contracts packages).

**Performance Goals**: Score a 5–8 question attempt synchronously in well under one second on a developer machine (SC-003 sitting is gated by test runtime, not I/O).

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse or HTTP clients. No quiz REST, fetch, generation or quiz UI. Playable quizzes 5–8 questions; isolated weighting fixture may use a 3-score list. Multi-answer policy replaceable. Round only for display.

**Scale/Scope**: Three packages extended; one application operation (`gradeAttempt`); four public Zod schemas; scoring + freeze + mapping tests. No new workspace packages, apps or Compose services.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | Scoring and `gradeAttempt` stay in packages. No Nest/Prisma/Next in domain or application. No new adapters. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | Isolated `scoreMultipleChoice` + `calculateWeightedScore`. No repository ports (Phase 2). No new packages. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Reuse `@ai-quiz/config` tsconfig; explicit domain and DTO types; no `any` to bypass invariants. |
| IV. Zod-validated contracts | External input parsed with Zod; fail closed; keys out of public quiz DTOs | **PASS** | Zod 4 in `packages/contracts` only. Create/submit fail closed with stable codes. Quiz view has no `isCorrect`; result includes correctness only after scoring. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; replaceable multi policy; 5–8 / four options / 1.1^i; round for display; idempotent resubmit | **PASS** | Domain functions have no I/O. Policy note + isolated multi scorer. Freeze returns original result even if answers differ. |
| VI. Jest testing discipline | Jest; scoring fixtures including hand-calculated weights and duplicate submit | **PASS** | Colocated `*.spec.ts`; isolated `[4,2,0]` → `6.2/3.31`; 5–8 all-correct/all-wrong; freeze tests. No Vitest. |
| VII. Secure AI integration | Secrets server-side; no SSRF/prompt work this phase | **PASS (scoped)** | No fetch/LLM. HTTPS **shape** only. No new secrets. |
| VIII. Roadmap fidelity | Derive from roadmap; Phase 1 exclusions | **PASS** | Follows `implementation-roadmap.md` Phase 1, not whole M1 persistence. No auth/billing/queues. |

**Unjustified violations**: none. Complexity table not required.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. Entities are in-memory only (no Prisma). Contracts are Zod schemas, not REST. Quickstart runs `pnpm test` without Docker. Application `gradeAttempt` has no ports. Display rounding is a domain helper, not an LLM. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/003-phase-1-domain-scoring/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Public Zod/JSON shapes and error codes
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 1 **extends** these files. Do not add `apps/api/src/modules/quiz/`, Prisma product models, or web quiz routes.

```text
packages/
├── domain/
│   ├── package.json                 # still no Nest/Prisma/Zod/OpenAI
│   └── src/
│       ├── index.ts                 # re-export public domain API
│       ├── quiz.ts                  # Quiz, Question, Option, validateQuiz
│       ├── scoring-policy.ts        # scoreSingleChoice, scoreMultipleChoice, policy note
│       ├── weighted-score.ts        # calculateWeightedScore, roundForDisplay, toPercentage
│       ├── attempt.ts               # Attempt, applySelections, freeze
│       ├── errors.ts                # domain error codes
│       ├── quiz.spec.ts
│       ├── scoring-policy.spec.ts
│       ├── weighted-score.spec.ts
│       └── attempt.spec.ts
├── application/
│   ├── package.json                 # deps: domain + contracts
│   └── src/
│       ├── index.ts
│       ├── grade-attempt.ts         # gradeAttempt({ quiz, answers, attempt? })
│       ├── map-public.ts            # toPublicQuizView, toPublicResult
│       ├── grade-attempt.spec.ts
│       └── map-public.spec.ts
└── contracts/
    ├── package.json                 # add zod ^4.1.11
    └── src/
        ├── index.ts
        ├── error-codes.ts
        ├── create-quiz.ts           # createQuizRequestSchema
        ├── submit-answers.ts        # submitAnswersRequestSchema
        ├── public-quiz.ts           # publicQuizViewSchema (no isCorrect)
        ├── public-result.ts         # publicResultSchema (includes correctness)
        ├── create-quiz.spec.ts
        ├── submit-answers.spec.ts
        ├── public-quiz.spec.ts
        └── public-result.spec.ts
```

Phase 0 `domainReady` / `applicationReady` / `contractsReady` placeholders are replaced or re-exported only if tests still need a smoke export; prefer real APIs.

Existing `apps/api`, `apps/web`, `packages/ui`, Compose, Prisma empty schema and `/health` stay unchanged.

**Structure Decision**: Same monorepo as Phase 0. Scoring is domain; orchestration is application; Zod is contracts. No fourth package. Hexagonal ESLint gates already in `@ai-quiz/config` remain the import firewall.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
