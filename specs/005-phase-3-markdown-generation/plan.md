# Implementation Plan: Phase 3 Secure Markdown Ingestion and OpenAI Quiz Generation

**Branch**: `005-phase-3-markdown-generation` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-phase-3-markdown-generation/spec.md`

**Roadmap phase**: Phase 3 — Secure Markdown ingestion and OpenAI quiz generation (P0)

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Replace the Phase 2 fixture source and generation adapters so `POST /v1/quizzes` **fetches** a configurable HTTPS Markdown URL (SSRF-safe, GitHub blob-to-raw) and **generates** a 5–8 question quiz on the server with Vercel AI SDK / OpenAI structured output, then persists the snapshot and a ready quiz that GET can retrieve without answer keys.

Technical approach (from [research.md](./research.md)): keep `MarkdownSourcePort` / `QuizGenerationPort`; wire `HttpsMarkdownSourceAdapter` (pinned-IP HTTPS, 10s, 512 KiB, public DNS/IP only) and `OpenAiQuizGenerationAdapter` (`generateText` + `Output.object`); `CreateQuizUseCase` retries invalid generation up to 3 times, requires excerpt-in-snapshot grounding, and never inserts a partial ready quiz. Default E2E still overrides the ports so CI stays offline; one gated live README proves the definition of done.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse Phase 0.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. NestJS 12 REST adapters. Prisma 7 already in `apps/api`. Zod 4. **Add** `ai` and `@ai-sdk/openai` to `apps/api` only. Node built-ins `dns` / `net` / `https` / `crypto` for fetch and hashing. No Langfuse.

**Storage**: PostgreSQL 16 (Compose `db`). Existing product schema — persist `resolvedUrl`, `contentHash`, `contentSnapshot`, `sourceExcerpt`, `modelId` (columns already exist; **no new migration** unless a defect requires it). Integration/E2E use `ai_quiz_test`.

**Testing**: Jest adapter/policy unit tests with fake transport / mocked `generateText` (in `pnpm test`, no network). Jest application tests with mocked ports. Jest + PostgreSQL integration. Jest + Supertest E2E with **port overrides** (fixtures or doubles, mocked LLM). Optional gated live README when `OPENAI_API_KEY` and `PHASE3_LIVE_README=1` are set.

**Target Platform**: Developer local workspace (Linux/macOS) with Docker PostgreSQL. Not production containers.

**Project Type**: Hexagonal slice in the existing monorepo — new outbound adapters in `apps/api`, small application retry/grounding, domain port return-shape tweak.

**Performance Goals**: Fetch bounded to 10s and 512 KiB; generation 30s per attempt, max 3 attempts. A mocked create→get round-trip stays well under one reviewer sitting. Live create is synchronous and may take tens of seconds.

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse or HTTP clients. Markdown is untrusted data. Pre-submit responses omit keys. API keys stay server-side and unlogged. No quiz UI, two-source demo package, Langfuse, or production delivery. No silent fixture fallback on the product path.

**Scale/Scope**: Two new outbound adapters; fetch transport + IP policy helpers; LLM Zod schema (server-only); create-quiz retry/grounding; nine new error codes; env optional OpenAI fields; test overrides; one gated live path. No new workspace packages. No web quiz routes. No Prisma schema redesign.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | Ports stay in `packages/domain`. Retry/grounding in `packages/application`. HTTPS, `ai`, `@ai-sdk/openai`, Prisma writes in `apps/api`. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | Reuse existing ports. `FetchTransport` is an adapter test seam, not a new package. No `packages/ai`. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Reuse `@ai-quiz/config`; explicit snapshot/generated types; no `any` to bypass SSRF or Zod. |
| IV. Zod-validated contracts | External input and generated quiz parsed with Zod; keys out of public DTOs | **PASS** | Reuse create-quiz request schema. LLM schema is **server-only** in the API adapter (contains `isCorrect`). GET quiz still `publicQuizViewSchema`. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; generation does not grade | **PASS** | Scoring unchanged. `validateQuiz` still pure. Model output is re-validated in process before persist. |
| VI. Jest testing discipline | Jest; API E2E with mocked LLM; persistence vs real PostgreSQL | **PASS** | Adapter unit + application unit in `pnpm test`. Integration/E2E use Postgres. Default E2E overrides generation/source ports (mocked LLM). No Vitest/Playwright. |
| VII. Secure AI integration | SSRF, untrusted Markdown, structured output, secrets server-side | **PASS** | Pinned-IP HTTPS, public DNS/IP, 3 HTTPS redirects, 10s/512 KiB, blob-to-raw, source delimiters, `Output.object`, bounded retries, no fixture fallback, keys not logged. |
| VIII. Roadmap fidelity | Derive from roadmap; Phase 3 exclusions | **PASS** | M2 fetch/generation only. No UI, two-source package, Langfuse, or production delivery. `/v1` create now fetches and generates as the roadmap table describes. |

**Unjustified violations**: none. Complexity table not required. Extending `generate` to return `modelId` is a port evolution, not a new layer.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. Snapshot/excerpt/`modelId` use existing columns; HTTP contracts add fetch/generation error codes without putting keys on GET quiz; the LLM schema is documented as server-only; quickstart separates mocked suites from optional live README. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/005-phase-3-markdown-generation/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # HTTP + fetch/generation error codes and server LLM schema
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 3 **extends** these files. Do not add quiz UI routes, Langfuse, or production Dockerfiles.

```text
packages/
├── domain/src/
│   ├── quiz.ts                      # optional sourceExcerpt on Question
│   └── ports/
│       ├── quiz-generation-port.ts  # generate returns { questions, modelId? }
│       └── quiz-repository-port.ts  # InsertQuizInput.modelId?
├── application/src/
│   ├── errors.ts                    # SOURCE_* and GENERATION_* codes
│   ├── create-quiz.ts               # retry, grounding, no insert on failure
│   ├── grounding.ts                 # excerpt-in-snapshot helper
│   └── create-quiz.spec.ts
└── contracts/src/
    └── error-codes.ts               # nine new codes

apps/api/
├── src/infrastructure/env.ts        # optional OPENAI_API_KEY, OPENAI_MODEL
├── src/modules/quiz/
│   ├── quiz.module.ts               # wire real source + generation adapters
│   └── adapters/out/
│       ├── fixture/                 # keep for Test module overrides only
│       ├── source-fetch/
│       │   ├── public-ip.ts
│       │   ├── github-blob.ts
│       │   ├── fetch-transport.ts
│       │   ├── normalize-markdown.ts
│       │   └── https-markdown-source.adapter.ts
│       └── llm/
│           ├── generated-quiz.schema.ts   # server-only Zod (keys)
│           ├── quiz-prompt.ts             # untrusted <source> wrapping
│           └── openai-quiz-generation.adapter.ts
└── test/
    ├── env.spec.ts                  # still boots without OpenAI key
    ├── integration/                 # snapshot, checksum, modelId, excerpt
    └── e2e/
        ├── create-app.ts            # override source/generation ports
        ├── quiz-flow.spec.ts        # existing flow on doubles
        ├── quiz-source-errors.spec.ts
        ├── quiz-generation-errors.spec.ts
        └── quiz-live-readme.spec.ts # skipped unless PHASE3_LIVE_README=1
```

Existing `apps/web`, `packages/ui`, `/health`, `/ready`, submit/result, and domain scoring stay unchanged aside from the optional `sourceExcerpt` field.

**Structure Decision**: Same monorepo. Real fetch/LLM adapters replace fixtures at the composition root. Fixture adapters remain as E2E/integration doubles. Turbo tasks unchanged (`test` no Postgres/network; `test:integration` / `test:e2e` need `DATABASE_URL`).

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
