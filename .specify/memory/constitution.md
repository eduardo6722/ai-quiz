<!--
Sync Impact Report
==================
Version change: uninitialized template → 1.0.0
Modified principles:
  - [PRINCIPLE_1_NAME] → I. Hexagonal Architecture and Framework Independence
  - [PRINCIPLE_2_NAME] → II. SOLID and Separation of Concerns
  - [PRINCIPLE_3_NAME] → III. Strict TypeScript
  - [PRINCIPLE_4_NAME] → IV. Zod-Validated Contracts
  - [PRINCIPLE_5_NAME] → V. Testable Domain Logic (NON-NEGOTIABLE)
Added principles:
  - VI. Jest Testing Discipline
  - VII. Secure AI Integration
  - VIII. Roadmap Fidelity
Added sections:
  - Technology and Product Constraints (replaced [SECTION_2_NAME])
  - Development Workflow and Quality Gates (replaced [SECTION_3_NAME])
Removed sections: none (template placeholders replaced in place)
Follow-up TODOs: none
-->

# AI Quiz Generator Constitution

## Core Principles

### I. Hexagonal Architecture and Framework Independence

The system MUST be organized as ports and adapters around a pure core.
`packages/domain` MUST contain entities, invariants, scoring policy, and
port interfaces only. `packages/application` MUST contain use cases and
orchestration only. Neither package MAY import NestJS, Prisma, Next.js,
React, OpenAI, Vercel AI SDK, Langfuse, HTTP clients, or other framework
or provider SDKs.

Inbound adapters (REST, web) and outbound adapters (Prisma, Markdown
fetch, LLM, telemetry) MUST depend inward on ports. Concrete providers
MUST be wired at the composition root. Domain and application layers
MUST remain independently testable with in-memory or mocked ports.

Rationale: interview-ready architecture stays replaceable (including an
alternate generation strategy) without rewriting business rules.

### II. SOLID and Separation of Concerns

Code MUST follow SOLID with a preference for small use cases and
replaceable adapters. Each module MUST have one reason to change.
Use cases MUST depend on port abstractions, not concrete adapters
(Dependency Inversion). Extra layers, generic repositories, or
shared "utils" MUST NOT be added without a clear boundary.

AI generation, source fetching, persistence, HTTP transport, and
scoring MUST remain separate concerns. The LLM MAY propose quiz
content. Deterministic TypeScript MUST compute scores. The web app
MUST consume public REST contracts and UI primitives only; it MUST
NOT import server persistence, environment secrets, or answer-key
logic.

Rationale: mixed concerns make scoring, security, and adapters
untestable and hard to explain in the live engineering discussion.

### III. Strict TypeScript

All application TypeScript MUST compile under `strict` compiler
settings across apps and packages. Shared types MUST live in domain
or contracts packages rather than being duplicated across adapters.
`any`, unchecked assertions, and non-null assertions MUST NOT be
used to bypass invariants. Public DTOs and domain models MUST stay
explicitly typed.

Rationale: strict typing is the first line of defense for quiz shape,
scoring, and adapter boundaries in a multi-package monorepo.

### IV. Zod-Validated Contracts

Every external input and every generated quiz payload MUST be parsed
with Zod before use. This includes create-quiz requests, submit-answer
payloads, and LLM structured output. Invalid data MUST fail closed
with stable error codes. `packages/contracts` MUST hold public Zod
schemas and DTOs only.

Correctness flags, answer keys, and grading internals MUST remain in
server-only domain or persistence models. Public quiz responses,
page props, HTML, and client state MUST NEVER include them before
submission.

Rationale: Zod is the shared runtime contract for HTTP and model
output; TypeScript types alone cannot protect the boundary.

### V. Testable Domain Logic (NON-NEGOTIABLE)

Scoring, quiz invariants, and attempt lifecycle rules MUST be pure
functions or domain services with no I/O. Generation MUST NOT decide
the final score. The scoring policy MUST stay isolated so the
multi-select rubric can change without rewriting adapters.

The domain MUST enforce: 5–8 questions; exactly four options per
question; single-answer and multiple-answer types; 4 points for a
correct single-answer and 0 otherwise; multiple-answer scoring per
the documented policy; weighted average with `Math.pow(1.1, index)`
in quiz order. Values MUST be rounded only for display. Repeat
submission MUST be idempotent and MUST NOT re-score.

Rationale: assessment acceptance depends on deterministic, auditable
grading that can be unit-tested without an LLM or database.

### VI. Jest Testing Discipline

Jest is the required test runner. Domain unit tests MUST cover
scoring, weights, invalid selections, and duplicate submits, including
hand-calculated fixtures. Application tests MUST use mocked ports.
Persistence integration tests MUST run against real PostgreSQL.
API E2E tests MUST use Jest, Supertest, real PostgreSQL, and a mocked
LLM. UI tests MUST use Jest and React Testing Library.

Tests for a behavior MUST be written before or with the
implementation of that behavior, and MUST fail for the missing
behavior before the implementation is accepted. A roadmap checkbox
MUST NOT be marked done without verified tests for its exit criterion.
Playwright MAY be added later; it MUST NOT replace the required
Jest suites.

Rationale: the interview MVP is production-ready only when scoring,
persistence, and the REST flow are demonstrably correct in CI.

### VII. Secure AI Integration

Quiz content MUST be generated server-side through the Vercel AI SDK
OpenAI adapter with Zod-backed structured output. Remote Markdown is
untrusted task data, never privileged instructions. Fetching MUST
normalize GitHub blob URLs when appropriate, cap size and time, and
reject private, loopback, and link-local destinations including
redirect and DNS targets (SSRF). Malformed model output MUST be
retried within a bounded limit and MUST fail clearly after exhaustion.

Secrets (`OPENAI_API_KEY`, `DATABASE_URL`, Langfuse credentials, and
attempt tokens) MUST stay server-side and MUST NEVER be logged or
baked into client bundles. Errors MUST NOT leak provider traces,
prompts, or keys. Changes that touch fetching, prompts, tokens, or
Prisma transactions MUST be reviewed for SSRF, prompt injection,
idempotency, and transaction integrity.

Rationale: the product fetches arbitrary URLs and sends them to a
model; security failures are more costly than missing nice-to-haves.

### VIII. Roadmap Fidelity

`roadmap.md` is the source of truth for product scope, assessment
acceptance, scoring contract, milestone order, and the definition of
production-ready for this task. Specs, plans, and tasks MUST derive
from the roadmap. The interview MVP MUST NOT add authentication,
billing, queues, or microservices.

If a feature spec disagrees with the roadmap on behavior, the
roadmap wins until the roadmap is amended. Engineering constraints
in this constitution still apply while implementing roadmap scope.

Rationale: the assessment is a fixed contract; local invention of
product rules undermines interview acceptance.

## Technology and Product Constraints

The chosen stack is binding unless this constitution and the roadmap
are amended together:

- Language/runtime: TypeScript on current supported Node.js LTS.
- Monorepo: Turborepo and pnpm workspaces.
- Backend: NestJS REST adapters and composition root.
- Persistence: PostgreSQL and Prisma, with scoring and finalization
  in one transaction.
- Frontend: Next.js App Router, React Hook Form, Zod resolver.
- UI: English copy; semantic design tokens; Tailwind CSS; shared
  shadcn/ui primitives from the design-system skill.
- AI: Vercel AI SDK `generateText` with `Output.object`; OpenAI as
  the configured provider; model ID from environment.
- Observability: Langfuse is a P1 nice-to-have behind a telemetry
  port; omit it rather than couple it to domain logic.

Production-ready means a small, validated application: controlled
source fetching, graceful failures, durable persistence, predictable
rules, essential tests, environment-driven configuration, repeatable
builds, and a documented deployment path. Unfinished P1/P2 work
MUST be documented as incomplete and MUST NOT be presented as done.

## Development Workflow and Quality Gates

Implement the smallest feature-complete vertical slice that can be
tested, then the next. Follow Spec Kit: constitution → specify →
clarify → plan → tasks → implement. Read `roadmap.md`, this
constitution, and the relevant spec/plan/tasks before changing code.

Required gates for a mergeable change:

- ESLint and strict TypeScript pass.
- Applicable Jest unit, integration, UI, and API E2E tests pass.
- Scoring changes include reference-calculation tests.
- Schema changes include migrations and persistence tests.
- UI changes follow `.agents/skills/design-system/SKILL.md`.
- Meaningful diffs are reviewed with `.agents/skills/code-review/SKILL.md`
  (or the harness adapter that delegates to it). LLM review MUST NOT
  replace tests.
- Roadmap checkboxes change only after the exit criterion is verified.

`AGENTS.md` is the runtime agent guide. Harness adapters under
`.cursor/`, `.claude/`, and `.codex/` MUST stay thin and MUST NOT
fork business rules.

## Governance

This constitution governs engineering practice for AI Quiz Generator.
It supersedes conflicting coding habits, convenience imports, and
ad-hoc architecture. It does not override `roadmap.md` on product
scope or assessment acceptance.

Amendments MUST:

1. State the principle or constraint being added, removed, or redefined.
2. Record rationale and any migration impact on packages or tests.
3. Bump `CONSTITUTION_VERSION` using semantic versioning:
   - MAJOR: incompatible removals or redefinitions of principles.
   - MINOR: new principle or section, or materially expanded guidance.
   - PATCH: clarifications, wording, and non-semantic refinements.
4. Set `Last Amended` to the amendment date (ISO `YYYY-MM-DD`).
5. Keep `Ratified` as the original adoption date.
6. Place a Sync Impact Report HTML comment at the top of this file
   for human review, then remove it before committing the amendment.

Compliance review: every PR and code-review pass MUST check hexagonal
import boundaries, Zod validation, answer-key isolation, scoring
purity, Jest coverage for the changed behavior, and the security
controls in Principle VII. Unjustified complexity or framework leakage
into domain/application layers is a blocking defect.

Runtime development guidance lives in `AGENTS.md`, `roadmap.md`, and
the portable skills under `.agents/skills/`. Those files MUST remain
consistent with this constitution; if they drift, amend the
constitution or correct the guide in the same change.

**Version**: 1.0.0 | **Ratified**: 2026-10-10 | **Last Amended**: 2026-10-10
