# AI Quiz Generator — Phase-by-Phase Spec-Driven Implementation Roadmap

> **Status:** Ready for the Phase 0 specification cycle; implementation is not authorized by this document alone.  
> **Audience:** Cursor Agent, Codex or Claude Code  
> **Product source of truth:** `roadmap.md` and the supplied AI Engineer assessment  
> **Engineering policy:** `AGENTS.md` and `.specify/memory/constitution.md`  
> **Delivery strategy:** One phase = one spec-driven cycle = one independently verified delivery.

## Current cycle and starting point

**Selected phase:** Phase 0 — project scaffolding.  
**Next action:** Use the specify prompt in Phase 0 below.  
**Verified deliveries:** None recorded yet.  
**Phases 1–7:** Backlog for separate future cycles.

Reading this file or asking to update it does not start implementation. When
starting a cycle, select one phase and use its specify prompt. If no phase is named
and no delivery has been verified, start with the Phase 0 specification. After
a cycle ends, wait for an explicit request to start the next phase; do not infer
authorization from the remaining unchecked items.

Update this status when a new cycle is explicitly selected or its verification
evidence is recorded. A generated spec, plan or task list is not a verified
delivery.

## Execution contract — one phase per cycle

This file divides the product roadmap into sequential delivery phases. It is a
backlog and execution guide, not a request to specify or implement the entire
application. **Start with Phase 0 (project scaffolding).** Each following phase
starts with its own specification. You run the remaining Spec Kit steps from
that specification; this file does not predefine those commands or prompts.

1. Read `roadmap.md` for the complete assessment contract, then select exactly
   one phase from this file. The remaining phases are future context only.
2. Use the existing Constitution across cycles. Do not regenerate it for every
   phase; amend it only when an engineering principle actually changes.
3. Create a separate `specs/<feature-id>/` directory and feature branch for the
   selected phase using the installed Spec Kit integration. Each directory owns
   its own `spec.md`, `plan.md` and `tasks.md`, plus supporting artifacts as needed.
4. Every artifact must name the selected phase, its goal, prerequisites,
   in-scope work, explicit exclusions and verifiable acceptance criteria.
   **Do not generate a shared Phase 0–7 task list or a whole-product spec for
   implementation.** Spec Kit's internal task sections may use their own phase
   labels; they all belong to the single roadmap phase selected for this cycle.
5. Plan against the verified output of previous cycles. Reuse their code and
   decisions; do not reimplement completed phases. If a missing prerequisite
   blocks the selected phase, record it and resolve the prerequisite before
   expanding the current phase's scope.
6. Implement only tasks that belong to the selected phase. Requirements for
   later phases can be recorded as deferred context, never as current acceptance
   criteria or implementation tasks.
7. Verify the phase's definition of done, perform a read-only review, address
   blocking findings, rerun affected checks and record the evidence. Mark only
   verified work complete and commit a coherent phase delivery.
8. **Stop after the selected phase.** Do not automatically create the next spec
   or implement the next phase. Start the next cycle when explicitly requested.

`roadmap.md` remains authoritative for product scope and acceptance. Its broader
milestones are split into the phases below: bootstrap → domain/persistence →
ingestion/generation → web → reliability → operations. These phase numbers are
not a renumbering of its milestones; completing a phase does not automatically
complete an entire `roadmap.md` milestone.

### Cycle map

Feature directory names below are examples. Let Spec Kit allocate the next
available feature ID; the ID is separate from the roadmap phase number.

| Roadmap phase | Example feature directory                | Prerequisite                                   | This cycle delivers                                     |
| ------------- | ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| 0             | `specs/001-phase-0-scaffold/`            | Existing Constitution and planning kit         | Monorepo, local runtime, tooling and minimal app shells |
| 1             | `specs/002-phase-1-domain-scoring/`      | Phase 0 verified                               | Pure domain, scoring and public contracts               |
| 2             | `specs/003-phase-2-persistence-api/`     | Phase 1 verified                               | PostgreSQL persistence and deterministic REST flow      |
| 3             | `specs/004-phase-3-markdown-generation/` | Phase 2 verified                               | Secure fetching and real AI generation                  |
| 4             | `specs/005-phase-4-web-experience/`      | Phase 3 verified                               | Complete browser quiz flow                              |
| 5             | `specs/006-phase-5-demo-reliability/`    | Phase 4 verified                               | Two-source demonstration and acceptance evidence        |
| 6             | `specs/007-phase-6-observability/`       | Phase 5 verified                               | P1 observability and operational controls               |
| 7             | `specs/008-phase-7-delivery/`            | Phase 6 verified, or explicitly deferred as P1 | P1 CI, production containers and walkthrough            |

### Existing whole-product artifacts

If a broad `specs/001-ai-quiz-generator/` or similar specification already exists,
retain it as product context. Do not execute its entire task list as the current
cycle. Create phase-specific artifacts and carry over only the requirements and
decisions needed for the selected phase. Existing full data models and API
contracts describe the target product; they do not require implementing all
models or endpoints during Phase 0.

## How to use the phase prompts

Invoke the specify command or skill installed for your harness with the prompt
under the selected phase. This repository's Cursor integration names it
`/speckit-specify`; use the equivalent name in other integrations.

Each prompt creates one phase-specific specification and stops there. Continue
with the remaining Spec Kit steps yourself, using that specification. The scope
checklists below describe the roadmap requirements; they are not generated
implementation task lists. Keep all later artifacts scoped to the same phase.

---

## Phase 0 — Project scaffolding, monorepo and local runtime (P0)

**Goal:** Both minimal app shells start, PostgreSQL runs, and quality commands work.

**Scope boundary:** Tooling, shared package shells, local infrastructure and design
foundations only. Quiz business behavior and the complete product schema belong
to later cycles. Do not create quiz endpoints, scoring or generation adapters.

### Scope checklist

- [x] Create pnpm workspaces and configure Turborepo scripts (`dev`, `build`, `lint`, `typecheck`, `test`).
- [x] Create `apps/api` (NestJS) and `apps/web` (Next.js App Router).
- [x] Create `packages/domain`, `application`, `contracts`, `ui` and `config`.
- [x] Enable strict TS, ESLint, Prettier, project import boundaries and environment validation.
- [x] Add Docker Compose for **local PostgreSQL** with health check and persistent volume.
- [x] Bootstrap Prisma configuration and database connectivity; add only a minimal baseline migration if needed for the scaffold, a simple health endpoint and `.env.example`. Defer full quiz models and their migrations to Phase 2.
- [x] Configure Jest for domain/API and Jest + React Testing Library for web components.
- [x] Install Tailwind/shadcn/ui, load design tokens from `.agents/skills/design-system/SKILL.md`.

**Definition of done:** A fresh clone can install dependencies, start PostgreSQL and both apps; Prisma connectivity and any scaffold migration are verified; `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 0 only: project scaffolding, monorepo
and local runtime. The existing Constitution and planning kit are prerequisites;
reuse them without reinitializing or overwriting them.

Describe a developer installing dependencies from a fresh clone, starting local
PostgreSQL and minimal NestJS API/Next.js web shells, verifying /health and
database connectivity, and running lint, strict typecheck, Jest tests and builds.
Cover pnpm/Turborepo, shared domain/application/contracts/ui/config package
shells, environment validation, .env.example, local PostgreSQL Compose, Prisma
bootstrap, and Jest/RTL setup. Include minimal shared Tailwind/shadcn design
foundations using the design-system skill and its references.

Define acceptance scenarios for valid/invalid configuration, app startup,
database connectivity and the quality commands. Exclude quiz entities and full
product tables, scoring, quiz REST endpoints, Markdown fetching, AI generation,
quiz forms/player/results, Langfuse, production Dockerfiles and GitHub Actions.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

## Phase 1 — Domain, scoring rules and Jest unit tests (P0)

**Goal:** Explain and prove grading without invoking any LLM or database.

**Excluded from this cycle:** Prisma product models/migrations, repository
adapters, quiz REST endpoints, Markdown fetching, AI generation and quiz UI.

### Scope checklist

- [ ] Define quiz/question/choice/attempt domain types and invariants.
- [ ] Implement `scoreSingleChoice()` and isolated `scoreMultipleChoice()` policy.
- [ ] Implement `calculateWeightedScore(scores)` with `weight(i) = 1.1 ** i`.
- [ ] Add Zod contracts for topic, URL, count (5–8), answers and public result DTOs.
- [ ] Keep answer keys out of public DTOs.
- [ ] Add Jest cases for correct/wrong answers, multi-select boundaries, all-correct/all-wrong, floating-point weights, invalid choices and ordering.

**Formula:** `weightedScore = Σ(questionScore[i] × 1.1^i) / Σ(1.1^i)`; calculate a percentage only for display with `(weightedScore / 4) × 100`.

**Definition of done:** Pure unit tests pass, the domain has no NestJS/Prisma/OpenAI dependencies, and the scoring assumptions are documented.

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 1 only: pure quiz domain, deterministic
scoring and public Zod contracts. Prerequisite: verified Phase 0 scaffolding.
Reuse that delivery; this cycle must be testable without a database or LLM.

Define quiz/question/choice/attempt invariants: 5–8 questions, exactly four
unique options, single/multiple types and valid selections. Single-answer
scoring is 4 for correct and 0 otherwise. Preserve roadmap.md's provisional
multi-answer policy: one point per correctly selected option, bounded to 0–4,
without invented penalties or normalization. Record the ambiguity and keep the
policy replaceable. Weight by zero-based quiz position using 1.1 ** index;
divide the weighted sum by the sum of weights. Round only for display.

Cover Zod inputs for topic, HTTPS source URL, count and answers, plus public
result contracts that keep answer keys private before submission. Define Jest
acceptance cases for correct/wrong answers, mixed single/multiple questions,
invalid/duplicate selections, ordering, boundaries and hand-calculated weights.
Keep domain/application pure. Exclude Prisma product models/migrations,
repositories, quiz REST endpoints, source fetching, AI generation and quiz UI.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

## Phase 2 — Prisma model, repositories and deterministic API skeleton (P0)

**Goal:** Save and retrieve quiz state with real PostgreSQL, without AI dependency.

**Excluded from this cycle:** Remote Markdown fetching, OpenAI/model calls, quiz
UI, Langfuse and production delivery. Fixed source/question fixtures provide
the inputs needed to verify persistence and the REST flow.

### Scope checklist

- [ ] Model `SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, `AttemptAnswer` and selected options with migrations and constraints.
- [ ] Implement repository **ports** in application/domain and Prisma **adapters** in API.
- [ ] Implement use cases: `CreateQuiz`, `GetQuiz`, `StartAttempt`, `SubmitAttempt`, `GetResult`.
- [ ] Add `POST /v1/quizzes`, `GET /v1/quizzes/:id`, `POST /v1/quizzes/:id/attempts`, `POST /v1/attempts/:id/submit`, `GET /v1/attempts/:id/result`.
- [ ] First use an **in-memory/fixed question-generation adapter** to complete the grading flow.
- [ ] Ensure transactions, question/choice ownership validation, unique answers, private attempt tokens and repeat-submission idempotency.
- [ ] Add Jest + PostgreSQL integration tests and Jest + Supertest API tests.

**Definition of done:** Using fixed questions, REST clients can create a quiz, start an attempt, submit answers and fetch the correct persisted score. `GET quiz` never leaks answer keys.

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 2 only: PostgreSQL persistence and a
deterministic REST quiz flow. Prerequisite: verified Phases 0–1. Reuse the pure
domain, scoring and contracts, with fixed source/question fixtures instead of
remote fetching or model calls.

Cover source snapshots, quizzes, ordered questions/options, attempts, answers
and selected options using Prisma migrations, constraints and repository ports
with API adapters. Specify create/get quiz, start attempt, submit answers and
get result through the /v1 endpoints listed in roadmap.md. Pre-submit quiz
responses must omit answer keys. Private attempt tokens must authorize submit
and result access; persist only token hashes.

Define acceptance scenarios for a complete persisted flow, ownership validation,
unique answers, immutable playable quizzes, unauthorized access and duplicate/
concurrent submission. Selections, per-question scores and the final weighted
score must finalize atomically; repeated submission returns the existing result.
Use Jest with real PostgreSQL and Supertest for integration/API evidence.
Exclude remote Markdown fetching, OpenAI calls, quiz UI, Langfuse and production
delivery.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

## Phase 3 — Secure Markdown ingestion and OpenAI quiz generation (P0)

**Goal:** Replace the fixture adapter with generation grounded in a remote README.

**Excluded from this cycle:** Quiz forms/player/results UI, the two-source demo
acceptance package, Langfuse and production delivery. Reuse the verified scoring,
persistence and REST flow from earlier cycles.

### Scope checklist

- [ ] Fetch configurable HTTPS Markdown URLs; normalize supported GitHub `blob` URLs to raw content.
- [ ] Add timeouts, max-size policy, controlled redirects and SSRF protection (public DNS/IP targets only).
- [ ] Treat Markdown as **untrusted content**, not instructions to the agent.
- [ ] Normalize/truncate source, store the snapshot and checksum, and reject empty/unusable content.
- [ ] Create an OpenAI-backed `QuizGenerationPort` adapter via Vercel AI SDK structured output and Zod.
- [ ] Validate 5–8 questions, exactly four unique choices per question, valid answer-key indices, and topic/source relevance; retry malformed output within limits.
- [ ] Handle upstream timeouts, invalid model output and generation failure without saving a partially playable quiz.
- [ ] Add mocked-LLM tests. Keep model calls and keys strictly server-side.

**Definition of done:** A real README URL + topic generates a valid quiz via REST, and the sanitized retrieval endpoint returns it safely.

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 3 only: secure remote Markdown ingestion
and OpenAI quiz generation. Prerequisite: verified Phases 0–2. Reuse the REST,
persistence and deterministic scoring flow; replace the fixture generation
adapter through its port.

Specify configurable HTTPS Markdown URL and topic inputs, GitHub blob-to-raw
normalization, public DNS/IP targets, safe redirects, timeouts, content-type and
size limits, and rejection of private/loopback/link-local destinations. Markdown
is untrusted data, never privileged instructions. Normalize and bound content,
reject unusable sources, and persist the snapshot and checksum.

Generate server-side via Vercel AI SDK/OpenAI with Zod-backed structured output.
Require the requested 5–8 questions, exactly four unique choices, valid question
types/answer keys and relevance to the topic and source. Define acceptance for a
real README generating a retrievable quiz, mocked-model validation/error paths,
SSRF and prompt-injection defenses, bounded retries, upstream failures and no
partially playable quiz. Keep keys/model calls server-side and pre-submit keys
private. Exclude quiz UI, the two-source demo package, Langfuse and production
delivery.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

## Phase 4 — Complete web experience (P0)

**Goal:** An interviewer can complete the full quiz in the browser.

**Excluded from this cycle:** New scoring policies, generation strategies,
Langfuse, CI/CD and production containers. Use the verified API; record any
backend defect needed to complete this flow and keep fixes limited to that
acceptance blocker.

### Scope checklist

- [ ] Build an English-language landing/create form for topic, Markdown URL and count (5–8).
- [ ] Build a loading/generation/error state.
- [ ] Build quiz player: progress indicator, single choice (`RadioGroup`), multiple choice (`Checkbox`), previous/next, and submit.
- [ ] Build results view: weighted score (0–4), optional percentage, per-question feedback and source reference.
- [ ] Use React Hook Form + Zod, Tailwind + shadcn/ui, and `.agents/skills/design-system/SKILL.md` + its references.
- [ ] Apply light green palette, responsive layout, focus states, usable touch targets and accessible labels.
- [ ] Protect private attempt token lifecycle and never send correct answers to the browser before submission.
- [ ] Test form validation, choice selection, loading/error and submit behavior with Jest + React Testing Library.

**Definition of done:** In the browser: enter README URL/topic → generate quiz → answer → submit → view persisted result. Layout works at phone and desktop widths.

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 4 only: the complete browser quiz
experience. Prerequisite: verified Phases 0–3. Consume the verified API and public
contracts; reuse its generation, persistence and scoring behavior.

Describe entering a topic, Markdown URL and count (5–8), generating a quiz,
answering single/multiple questions with progress and previous/next navigation,
submitting, and viewing the persisted weighted result on the 0–4 scale with
optional percentage, per-question feedback and source reference. Cover loading,
validation, generation/submission errors and safe refresh/result access through
the private attempt-token lifecycle. Never expose answer keys before submission.

Use English UI copy, React Hook Form/Zod, Tailwind and shared shadcn/ui primitives.
Read the design-system skill and references for semantic tokens, light greens,
responsive layouts, labels, keyboard navigation, focus and usable touch targets.
Define Jest/RTL scenarios for validation, selection, progress, errors and submit,
plus phone/desktop acceptance of the full flow. Exclude new scoring policies,
generation strategies, Langfuse, CI/CD and production containers; limit backend
fixes to documented blockers of this existing flow.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

## Phase 5 — Demonstration with two README sources and reliability (P0)

**Goal:** Meet every functional criterion from the assessment with evidence.

**Excluded from this cycle:** New product features, optional generation
strategies, Langfuse and production delivery. Limit implementation changes to
defects exposed by the assessment acceptance and reliability checks.

### Scope checklist

- [ ] Test generation from **two different, reachable README.md URLs**, not two topics on the same source.
- [ ] Manually verify the questions reference the corresponding Markdown content.
- [ ] Check DB persistence for questions, correct choices, attempts, selected answers, individual scores and weighted final score.
- [ ] Run Jest + Supertest end-to-end flows using real PostgreSQL and a mocked deterministic model.
- [ ] Test malformed URL, bad Markdown, upstream failure, invalid option IDs, answer leakage, duplicate submission and unauthorized result access.
- [ ] Document the two sources, sample topics, demo steps, scores and known limitations in `README.md`.
- [ ] Run the **read-only code-review agent** over the completed vertical slice; fix high-severity findings.

**Definition of done — INTERVIEW MVP:** Both README demonstrations work; API, web UI, database and scoring are demonstrably correct; all core tests pass. **At this point the assessment's must-haves are delivered.**

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 5 only: assessment demonstrations and
reliability evidence. Prerequisite: verified Phases 0–4 and the working browser
flow. This cycle verifies the MVP and fixes acceptance defects.

Require successful live generation and quiz completion using two different,
reachable README.md URLs, with questions grounded in each corresponding source.
Record the actual URLs, topics, demo steps, scores, source relevance evidence
and limitations in README.md. Verify PostgreSQL records for questions, keys,
attempts, selections, individual scores and the weighted final result.

Define repeatable Jest/Supertest E2E acceptance with real PostgreSQL and a mocked
deterministic model, separately from the live demonstrations. Cover malformed
URLs, unusable Markdown, upstream/model failures, incomplete/invalid answers,
answer leakage, duplicate/concurrent submission and unauthorized result access.
Include reference-calculation checks and a read-only review under the canonical
code-review checklist, with blocking findings resolved before completion.
Exclude new product features, optional generation strategies, Langfuse and
production delivery. Require evidence before claiming the interview MVP done.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

---

## Phase 6 — Langfuse and production-hardening (P1)

**Goal:** Add observability and operational controls to the verified MVP.

**Excluded from this cycle:** CI/CD, production Dockerfiles, deployment
automation and P2 product extensions. Essential fetch security and safe attempt
handling must already be verified in the P0 cycles.

### Scope checklist

- [ ] Add Langfuse traces around fetch → preprocessing → generation → validation (redact secrets and private tokens).
- [ ] Add structured logs, consistent errors, correlation IDs, rate limits and bounded retry behavior.
- [ ] Add a second question-generation strategy behind the same generation port (optional assessment bonus).
- [ ] Add health/readiness checks and configuration documentation.

**Definition of done:** You can diagnose a failed generation and explain model behavior without exposing secrets.

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 6 only: P1 observability and operational
controls. Prerequisite: verified Phases 0–5. Reuse the MVP; essential SSRF,
prompt-injection, answer privacy and attempt protections must already work.

Specify Langfuse tracing across fetching, preprocessing, generation, validation
and failures/retries, with useful model/request/quiz context and latency/usage
where available. Keep telemetry behind a replaceable boundary and redact secrets,
private tokens and sensitive answers. Cover structured logs, correlation IDs,
consistent safe errors, rate/concurrency limits, bounded retries, health/readiness
and configuration documentation.

Define acceptance scenarios proving a failed generation can be diagnosed, limits
are enforced and telemetry/logs do not expose secrets. Keep domain/application
independent of telemetry SDKs. Treat a second generation strategy as optional;
record whether it is included or deferred and preserve the generation port.
Exclude CI/CD, production Dockerfiles, deployment automation and P2 extensions.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

## Phase 7 — GitHub Actions, Docker production and interview walkthrough (P1)

**Goal:** Make builds and delivery reproducible and prepare the walkthrough.

**Excluded from this cycle:** New quiz features and P2 extensions. Deferred
Phase 6 work remains explicitly deferred; it is not absorbed into this cycle.

### Scope checklist

- [ ] Build GitHub Actions pipeline for pnpm install, lint, typecheck, Jest unit, PostgreSQL integration/API E2E, and production builds.
- [ ] Create multi-stage Dockerfiles for NestJS and Next.js; use minimal, non-root runtime stages.
- [ ] Confirm local Compose and production build instructions are reproducible.
- [ ] Add architecture/data-flow diagram, Prisma ER model, API examples, environment documentation and known trade-offs.
- [ ] Run code-review agent after meaningful changes and do a 5–10 minute mock walkthrough.

**Definition of done:** CI is green, Docker images build, and you can explain source ingestion, generation, adapter boundaries, database design and weighted scoring live.

### Specify prompt

```text
Read roadmap.md, implementation-roadmap.md, AGENTS.md and the existing
.specify/memory/constitution.md. Read verified artifacts from prerequisite
cycles and the selected phase's scope checklist and definition of done.

Create a new specification for Phase 7 only: P1 CI/CD, production containers
and interview delivery documentation. Prerequisite: verified Phases 0–5, plus
Phase 6 verified or explicitly deferred as P1. Reuse earlier deliveries and keep
any deferred Phase 6 work deferred.

Specify GitHub Actions gates for reproducible dependency installation, lint,
strict types, Jest unit/UI tests, real-PostgreSQL integration/Supertest E2E and
production builds. Cover multi-stage NestJS/Next.js Dockerfiles, minimal non-root
runtime images, runtime configuration, controlled release migrations and a
configurable gated deployment path following roadmap.md.

Define acceptance for passing CI, production image builds and reproducible
local/container startup. Include architecture/data-flow and Prisma ER diagrams,
API examples, environment/setup/deployment documentation, rollback and backup
expectations, known trade-offs and honest delivery status. Include read-only
review and a 5–10 minute walkthrough covering ingestion, generation, boundaries,
persistence and scoring. Exclude new quiz features and P2 extensions; do not
claim deployment or optional work complete without execution evidence.

State this phase's prerequisites, in-scope behavior, exclusions and testable
acceptance criteria. If a prerequisite is incomplete, record the blocker without
expanding scope. Create a separate phase-specific specification using the
installed Spec Kit integration. Stop after the specification; do not generate a
plan or implementation task list, implement code or start another phase.
```

---

## Completion evidence and handoff

Record the following in the selected phase's artifacts before marking the
cycle complete:

- Phase number, feature directory and delivered scope.
- Acceptance criteria checked, commands run and their results; include manual
  evidence when required. Distinguish passing, failed and unrun checks.
- Review outcome, resolved blocking findings and any remaining blockers.
- Deferred requirements and the prerequisite status for the next phase.

Update the current-cycle status with a reference to that evidence. If acceptance
is blocked, keep the phase incomplete. When it passes, stop with a verified
handoff; the next specification belongs to a new, explicitly requested cycle.

## What not to start with

- Authentication, roles, billing, Redis, event queues, microservices or analytics dashboards.
- Multiple agent swarms. One replaceable quiz-generation adapter is sufficient initially.
- Elaborate branding before the page can complete a quiz.
- CI/CD and deployment optimizations **before** the core UI/API/scoring flow exists.

**First implementation checkpoint:** Complete **Phase 0** in its own cycle.
**First product checkpoint:** Complete **Phase 2** with deterministic fixtures.
**First interview-ready checkpoint:** Complete **Phase 5** with real OpenAI
generation and two separate Markdown sources. Each checkpoint depends on
separately verified preceding phase cycles.
