# Implementation Plan: Reject Insufficient Markdown Sources

**Branch**: `010-insufficient-source-reject` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-insufficient-source-reject/spec.md`

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Stop create-quiz from inventing or padding questions when the fetched Markdown cannot support the requested 5–8 **distinct** facts. Empty, heading-only, and thin one-section documents fail as `SOURCE_UNUSABLE` **before** generation. Duplicate prompts after generation fail as `GENERATION_INVALID` (existing retry bound) and never become a ready quiz. Rich multi-section sources still succeed at count 5 and 8.

Technical approach (from [research.md](./research.md)): a pure `assertSourceSufficient(snapshot, questionCount)` helper in `packages/application/src/quiz/` using unique claim-units; extend `validateQuiz` with trim+case-fold prompt uniqueness; clarify setup copy for `SOURCE_UNUSABLE`; expand happy-path snapshots so they contain ≥ 8 unique claims. No new tables, ports, packages, or error codes.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse existing workspace.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. NestJS REST adapters, Zod public contracts, Vercel AI SDK / OpenAI in `apps/api` only. No new runtime libraries.

**Storage**: PostgreSQL 16 unchanged. **No migration.** Failures still persist nothing playable.

**Testing**: Jest domain + application unit tests (no network). Jest adapter unit tests for empty-after-normalize. Jest + Supertest E2E against real PostgreSQL with mocked fetch/generation for empty, one-section-at-8, and duplicate-prompt paths. UI copy test for `SOURCE_UNUSABLE`. No Playwright. No live model required for this cycle’s definition of done.

**Target Platform**: Developer local workspace (Linux/macOS) with Docker PostgreSQL.

**Project Type**: Hexagonal quality slice in the existing monorepo — application sufficiency + domain uniqueness + setup copy.

**Performance Goals**: Sufficiency is in-process string work on an already-bounded snapshot (≤ 512 KiB persist, ≤ 32k generation window). Empty/thin sources skip generation entirely. Duplicate-prompt retries stay within the existing 3-attempt bound.

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse, or HTTP clients. Markdown remains untrusted data. Pre-submit responses omit keys. Do not auto-reduce question count. Do not judge sufficiency with a second model. Do not change scoring, SSRF, attempt tokens, or fetch destination policy.

**Scale/Scope**: One application helper + tests; `validateQuiz` uniqueness; adapter empty-floor cleanup; prompt instruction one line; setup copy one sentence; happy-path fixture expansion (application sample snapshot, API fixture bank, two-source E2E markdown). No new routes, screens, packages, or codes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | Claim-units and create-quiz gating in `packages/application`. Prompt uniqueness in `packages/domain`. HTTPS adapter only keeps empty/binary rejection. Prompt instruction stays in `apps/api` generation adapter. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | No `packages/nlp` or `helpers/`. Sufficiency lives next to grounding in `quiz/`. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Explicit helper signatures; no `any` to skip claim counting. |
| IV. Zod-validated contracts | External input and generated quiz parsed with Zod; keys out of public DTOs | **PASS** | Create-quiz request schema unchanged. Public error body unchanged (`code` + English `message`). No keys on GET quiz. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; generation does not grade; quiz invariants in domain | **PASS** | Scoring unchanged. Duplicate prompts become a `validateQuiz` invariant. Sufficiency is a pure function of snapshot text + count. |
| VI. Jest testing discipline | Jest; API E2E with mocked LLM; persistence vs real PostgreSQL | **PASS** | Unit tests colocated. E2E uses existing port overrides and PostgreSQL. Tests listed in FR-013 must fail before the gate exists. |
| VII. Secure AI integration | Untrusted Markdown; secrets server-side; fail closed | **PASS** | Thin sources fail closed before the model. Duplicate padding never stored. Copy/errors leak no prompts, keys, or traces. |
| VIII. Roadmap fidelity | Derive from roadmap; no invented product rules | **PASS** | Tightens existing unusable-source + generation-validation behavior (graceful failure, 5–8 unique questions from the Markdown). Does not add auth, billing, queues, or a new quiz shape. |

**Unjustified violations**: none. Complexity table not required.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. No Prisma tables; HTTP contracts only expand the meaning of `SOURCE_UNUSABLE` and learner copy; uniqueness is a domain invariant; sufficiency is documented as a derived value object, not a stored table; quickstart is mocked-port evidence plus copy check. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/010-insufficient-source-reject/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Sufficiency, uniqueness, error code/copy deltas
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

This cycle **extends** these files. Do not add `helpers/`, `infrastructure/`, or a fixtures package.

```text
packages/
├── domain/src/quiz/
│   ├── quiz.ts                         # validateQuiz: unique prompts (trim + case-fold)
│   └── quiz.spec.ts
├── application/src/quiz/
│   ├── source-sufficiency.ts           # unique claim-units vs questionCount
│   ├── source-sufficiency.spec.ts
│   ├── create-quiz.ts                  # assertSourceSufficient before generate
│   ├── create-quiz.spec.ts             # empty / thin / one-section-8 / duplicates
│   └── grounding.ts                    # unchanged
├── application/src/testing/
│   └── quiz-fixture.ts                 # SAMPLE_SNAPSHOT ≥ 8 unique claims
└── contracts/                          # unchanged codes; web copy only

apps/api/src/quiz/
├── source/
│   ├── normalize-markdown.ts           # empty-after-normalize only (not 200 chars)
│   ├── normalize-markdown.spec.ts
│   └── https-markdown-source.adapter.ts
├── generation/
│   └── quiz-prompt.ts                  # do not repeat or rephrase the same question
└── fixture/
    └── fixture-bank.ts                 # FIXTURE_SNAPSHOT ≥ 8 unique claims

apps/api/test/
├── e2e/quiz/
│   ├── quiz-source-errors.spec.ts      # empty body; one-section count 8
│   └── quiz-generation-errors.spec.ts  # duplicate prompts
└── e2e/support/
    └── two-source-fixtures.ts          # Express/Nest bodies ≥ 8 unique claims

apps/web/src/features/quiz/errors/
├── error-copy.ts                       # SOURCE_UNUSABLE sentence
└── error-copy.spec.ts
```

**Structure Decision**: Same monorepo and `quiz` context. Application owns sufficiency (needs `questionCount`). Domain owns prompt uniqueness (quiz invariant). Adapters stay fetch/normalize/prompt. Tests follow the live tree in `.agents/skills/folder-architecture/SKILL.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None.
