# Implementation Plan: Phase 4 Complete Browser Quiz Experience

**Branch**: `006-phase-4-web-experience` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-phase-4-web-experience/spec.md`

**Roadmap phase**: Phase 4 — Complete web experience (P0)

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Replace the Phase 0 placeholder web shell with the full English quiz flow: setup (`/`) → generate → player (`/quiz/{id}`) → persisted results (`/quiz/{id}/results`). The browser consumes verified `/v1` contracts for create, get quiz, start attempt, submit and result. Scoring, fetch and generation stay on the API. Answer keys never appear before submit. The private attempt token lives in `sessionStorage`, never in the URL.

Technical approach (from [research.md](./research.md)): React Hook Form + Zod on setup; Client Components in `apps/web/src/features/quiz`; shared primitives added to `@ai-quiz/ui`; Jest/RTL with a mocked API. The only backend change is CORS allowlisting `WEB_ORIGIN` so the existing API can be called from the web origin.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse Phase 0.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. Next.js 16 App Router, React 19. **Add** `react-hook-form`, `@hookform/resolvers`, `lucide-react` on `apps/web`. Tailwind v4 + `@ai-quiz/ui` primitives. Zod 4 public schemas from `@ai-quiz/contracts`. NestJS 12 only for the CORS blocker fix. No Langfuse, no Playwright.

**Storage**: PostgreSQL 16 unchanged (quiz rows from Phases 2–3). Browser `sessionStorage` for attempt sitting (attempt id, token, selections, index, status). **No new Prisma migration.**

**Testing**: Jest + React Testing Library + jsdom + `@testing-library/user-event` in `apps/web`. `pnpm test` doubles `fetch` / api-client; no PostgreSQL, no model key. Manual phone (~320px) and desktop (≥1024px) pass in a real browser (quickstart). Existing API unit/integration/E2E remain green. Small API unit test for CORS origin helper.

**Target Platform**: Developer local workspace (Linux/macOS) with Docker PostgreSQL. Web at port 3000, API at 3001. Not production containers.

**Project Type**: Hexagonal monorepo — inbound web adapter (Next.js) consuming public REST; shared UI package; one composition-root CORS change in `apps/api`.

**Performance Goals**: Setup validation is instant. Generation wait is bound by the existing API (fetch 10s, generation up to 3×30s). After a quiz is ready, moving between questions is local (no per-click round trip). Results display stored display fields without re-grading in the browser.

**Constraints**: Domain/application MUST NOT import Next/React. Web MUST NOT import domain, application, Prisma, or API source. No pre-submit `isCorrect`. Token never in URL or logs. No new scoring, generation strategy, Langfuse, CI/CD, or production images. Backend diffs limited to CORS/`WEB_ORIGIN`.

**Scale/Scope**: Three routes, one feature module, ~10 shared UI primitives, api-client + session helper + error copy, CORS helper, RTL suites, README/quickstart notes. No new workspace packages. No new HTTP resources.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | No domain/application files for this slice. Web is an inbound adapter. CORS lives in `apps/api` `main.ts`. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | No `packages/web-sdk`. Feature module + api-client only. ESLint already allows web → contracts/ui only. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Reuse `@ai-quiz/config`. Parse every HTTP body with existing Zod schemas. No `any` to hide keys. |
| IV. Zod-validated contracts | External input parsed with Zod; keys out of public DTOs | **PASS** | Setup uses `createQuizRequestSchema`. Client parses create/get/start/submit/result/error with `@ai-quiz/contracts`. Player uses `publicQuizViewSchema` (strict, no `isCorrect`). |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; generation does not grade; web does not grade | **PASS** | Browser displays `weightedScoreDisplay` / `percentageDisplay` from the API. No `calculateWeightedScore` import in web. |
| VI. Jest testing discipline | Jest + RTL for UI; no Playwright substitute | **PASS** | Jest/RTL/user-event. API suites unchanged aside from CORS helper unit test. Playwright excluded. |
| VII. Secure AI integration | Secrets server-side; keys not in client; tokens not logged | **PASS** | No `OPENAI_API_KEY` in web env. Token in sessionStorage + Authorization header only. CORS origin allowlist, not `*`. Markdown still fetched only on the server. |
| VIII. Roadmap fidelity | Phase 4 web experience only | **PASS** | M3 screens and attempt-token lifecycle. Excludes new scoring, strategies, Langfuse, CI/CD, production containers, two-source demo. |

**Unjustified violations**: none. Complexity table not required. CORS is a documented blocker fix, not a new product layer.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. Client sitting state is not a database model. HTTP contracts are referenced, not redesigned. Screen/session/error-copy contracts keep tokens and keys out of the UI. Quickstart separates mocked Jest from optional live generate. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/006-phase-4-web-experience/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # UI screens, sitting, error copy, browser API access
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 4 **extends** these files. Do not add Langfuse, production Dockerfiles, or new `/v1` routes.

```text
packages/ui/src/
├── components/
│   ├── page-shell.tsx          # reuse
│   ├── card.tsx                # reuse
│   ├── button.tsx              # reuse
│   ├── input.tsx
│   ├── label.tsx
│   ├── form-field.tsx
│   ├── radio-group.tsx
│   ├── checkbox.tsx
│   ├── progress.tsx
│   ├── alert.tsx
│   ├── badge.tsx
│   └── skeleton.tsx
└── index.ts                    # export new primitives

apps/web/src/
├── app/
│   ├── page.tsx                # setup (replaces Phase 0 placeholder)
│   ├── page.test.tsx
│   └── quiz/[quizId]/
│       ├── page.tsx            # player
│       └── results/page.tsx    # results
├── features/quiz/
│   ├── api-client.ts
│   ├── api-client.spec.ts
│   ├── attempt-session.ts
│   ├── attempt-session.spec.ts
│   ├── error-copy.ts
│   ├── error-copy.spec.ts
│   ├── setup-form.tsx
│   ├── setup-form.test.tsx
│   ├── generating-status.tsx
│   ├── quiz-player.tsx
│   ├── quiz-player.test.tsx
│   ├── quiz-results.tsx
│   └── quiz-results.test.tsx
└── env.ts                      # still NEXT_PUBLIC_API_URL only

apps/api/src/
├── main.ts                     # enableCors(WEB_ORIGIN)
└── infrastructure/
    ├── env.ts                  # optional WEB_ORIGIN, default http://localhost:3000
    └── cors-options.ts         # pure helper, unit-tested
```

Existing `packages/domain`, `packages/application`, Prisma schema, `/v1` handlers, and scoring stay unchanged except the CORS/env helper.

**Structure Decision**: Same monorepo. Product UI lives in `apps/web` feature modules; visual primitives stay in `@ai-quiz/ui`. The API composition root gains CORS so the already-public REST can be called from port 3000. Turbo tasks unchanged (`test` still needs no Postgres/network).

## Complexity Tracking

> No constitution violations. Table left empty on purpose.
