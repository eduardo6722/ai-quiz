# Implementation Plan: Mix Correct Option Order

**Branch**: `011-mix-correct-options` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-mix-correct-options/spec.md`

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Stop learners from earning a full quiz score by always picking the first displayed option(s). Generated content still often lists every correct option first. After a valid generate, the product mixes each question’s four options with a seeded, repeatable shuffle plus a repair pass so an always-first sitting scores **strictly less** than selecting the real answers. The mixed order is persisted and reused for every later view. Scoring math, question order, public schemas, and pre-submit key privacy stay as they are.

Technical approach (from [research.md](./research.md)): a pure `mixQuizOptionOrder(quiz)` in `packages/domain/src/quiz/`; `CreateQuizUseCase` applies it after grounding/`validateQuiz` and before insert; GET/results read stored positions (no rematch). E2E answer helpers map correctness by **option label**, not display slot. No new tables, ports, packages, routes, or error codes.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse existing workspace.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. NestJS REST adapters, Zod public contracts, Vercel AI SDK / OpenAI in `apps/api` only. No new runtime libraries. Seeded shuffle is a few dozen lines of pure TypeScript (no extra package).

**Storage**: PostgreSQL 16 unchanged. **No migration.** `QuestionOption.position` already stores display order 0–3; create persists the mixed positions. Historical rows are not rewritten.

**Testing**: Jest domain unit tests for the mix transform (leading-key fixture, key preservation, stability, repair). Jest application tests that mocked all-first generation is mixed before insert and that always-first grades below true-key. Jest + Supertest E2E against real PostgreSQL with mocked generation: always-first submit is not a perfect sitting; true-key submit (by label) still grades as today. No Playwright. No live model required for this cycle’s definition of done.

**Target Platform**: Developer local workspace (Linux/macOS) with Docker PostgreSQL.

**Project Type**: Hexagonal quality slice in the existing monorepo — domain option-order transform + create-quiz orchestration + E2E harness label mapping.

**Performance Goals**: Mix is in-process over 5–8 × 4 options. Negligible vs fetch/generate. No extra model call.

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse, or HTTP clients. Do not use `Math.random()` (non-repeatable). Do not rematch on GET, start, or results. Do not shuffle questions. Do not change scoring, SSRF, attempt tokens, or public DTO fields. Pre-submit responses still omit `isCorrect`. Do not depend on the generator to vary order.

**Scale/Scope**: One domain module + tests; one create-quiz call site; optional one-line prompt hint (not sufficient alone); E2E fixture-answer helper; no new routes, screens, packages, or codes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | Mix is a pure domain function. Create-quiz calls it. The OpenAI adapter still maps model output 1:1; it does not own order. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | No `helpers/` or shuffle package. Mix lives in `packages/domain/src/quiz/` next to the quiz entity. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Explicit `Quiz → Quiz` signature; positions rewritten as 0–3; no `any`. |
| IV. Zod-validated contracts | External input and generated quiz parsed with Zod; keys out of public DTOs | **PASS** | Create/GET/result schemas unchanged. Public quiz view remains `{ id, position, label }` per option. Mix runs after structured-output parse. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; generation does not grade; quiz invariants in domain | **PASS** | Scoring still uses option identity + `isCorrect`, not slot. Mix does not change the correct-label set. `validateQuiz` still allows any legal key positions (historical quizzes). |
| VI. Jest testing discipline | Jest; API E2E with mocked LLM; persistence vs real PostgreSQL | **PASS** | Colocated domain/application tests. E2E uses existing port overrides and PostgreSQL. Tests listed in FR-014 must fail before the mix exists. |
| VII. Secure AI integration | Untrusted Markdown; secrets server-side; fail closed | **PASS** | Mix is deterministic product code, not model output. Pre-submit views still omit keys. Errors unchanged (no new traces). |
| VIII. Roadmap fidelity | Derive from roadmap; no invented product rules | **PASS** | Keeps 5–8 questions, four unique options, stable option IDs, weighted scoring. Fixes a fairness hole (position as cheat code). No auth, billing, queues, or new quiz shape. |

**Unjustified violations**: none. Complexity table not required.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. No Prisma tables; HTTP contracts do not add fields; mix is a derived transform persisted as existing `position`; always-first is a test sitting, not a stored entity; quickstart is mocked-port and E2E evidence. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/011-mix-correct-options/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Mix transform, always-first sitting, public-view delta
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

This cycle **extends** these files. Do not add `helpers/`, `infrastructure/`, or a shuffle package.

```text
packages/
├── domain/src/quiz/
│   ├── mix-option-order.ts             # mixQuizOptionOrder(quiz): Quiz
│   ├── mix-option-order.spec.ts        # leading-key, key preservation, stability, repair
│   └── quiz.ts                         # unchanged validateQuiz (positions 0–3 still required)
├── domain/src/index.ts                 # export mixQuizOptionOrder
├── application/src/quiz/
│   ├── create-quiz.ts                  # mix after validate, before insert
│   └── create-quiz.spec.ts             # mocked all-first generate → stored order mixed
└── application/src/testing/
    └── quiz-fixture.ts                 # keep sampleQuiz as leading-key input for mix tests

apps/api/src/quiz/
├── generation/
│   └── quiz-prompt.ts                  # optional one-line “do not list every correct option first”
└── fixture/
    └── fixture-bank.ts                 # export correct labels for E2E mapping (by wording, not slot)

apps/api/test/e2e/
├── quiz/                               # always-first submit vs true-key submit on mixed stored quiz
└── support/
    └── fixture-answers.ts              # map GET options to keys by label, not position
```

**Structure Decision**: Same monorepo and `quiz` context. Domain owns the pure mix transform. Application owns when it runs (create, once). Adapters do not shuffle. Tests follow the live tree in `.agents/skills/folder-architecture/SKILL.md`. Web player already renders stored `position`; no UI slice in this cycle.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None.
