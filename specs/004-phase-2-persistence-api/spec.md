# Feature Specification: Phase 2 Persistence and Deterministic REST Quiz Flow

**Feature Branch**: `004-phase-2-persistence-api`

**Created**: 2026-10-10

**Status**: Draft

**Roadmap phase**: Phase 2 — Prisma model, repositories and deterministic API skeleton (P0)

**Input**: User description: "Create a Phase 2-only specification for PostgreSQL persistence and a deterministic REST quiz flow. Prerequisite: verified Phases 0–1. Reuse the pure domain, scoring and contracts, with fixed source/question fixtures instead of remote fetching or model calls. Cover source snapshots, quizzes, ordered questions/options, attempts, answers and selected options using Prisma migrations, constraints and repository ports with API adapters. Specify create/get quiz, start attempt, submit answers and get result through the /v1 endpoints listed in roadmap.md. Pre-submit quiz responses must omit answer keys. Private attempt tokens must authorize submit and result access; persist only token hashes. Define acceptance scenarios for a complete persisted flow, ownership validation, unique answers, immutable playable quizzes, unauthorized access and duplicate/concurrent submission. Selections, per-question scores and the final weighted score must finalize atomically; repeated submission returns the existing result. Use Jest with real PostgreSQL and Supertest for integration/API evidence. Exclude remote Markdown fetching, OpenAI calls, quiz UI, Langfuse and production delivery."

## Phase Identity and Goal

This specification covers **Roadmap Phase 2 only**. The goal is that a REST client can **save and retrieve quiz state** with durable storage, **without** depending on remote Markdown or a language model.

Success is a complete, independently testable persisted flow: create a quiz from **fixed source and question fixtures**, retrieve a sanitized quiz, start an attempt, submit answers, and fetch the correct stored score. Scoring math, quiz invariants and public shapes **reuse Phase 1**. This cycle does **not** fetch live URLs, call a model, or build a quiz player.

## Prerequisites

This cycle MUST reuse the Phase 0 workspace and the Phase 1 scoring core. It MUST NOT re-scaffold the monorepo, reimplement grading, replace public contracts, or reinitialize Spec Kit or the Constitution.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal ports/adapters, Zod contracts, testable scoring, Jest discipline, secure tokens and roadmap fidelity are binding. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of `/v1` resources, persistence models, token hashing, transactional finalization and this phase’s checklist. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy. |
| Phase 0 scaffolding (`specs/002-phase-0-scaffold/`) | Present; task list fully checked | Monorepo, NestJS API shell, `/health` and `/ready`, local PostgreSQL, Prisma connectivity bootstrap with **no product tables**, Jest harness and quality commands. |
| Phase 1 domain scoring (`specs/003-phase-1-domain-scoring/`) | Present; task list fully checked | Pure quiz/question/option/attempt rules, isolated scoring policy, weighted average, public Zod contracts, in-memory freeze. No repositories, no `/v1` quiz resources. |
| Formal verification record in `implementation-roadmap.md` | Incomplete (status lag) | That file still lists **Verified deliveries: None recorded yet** and selected phase Phase 0. Phase 0 and Phase 1 checklists and task lists are fully checked and their code is on `main`. This cycle reuses those deliveries rather than repeating them. Updating that status file is not Phase 2 product work. |
| Phases 3–7 | Not started | Fetching, model generation, quiz UI, two-source demo, Langfuse and production delivery are out of scope. |

**Blockers:** None that expand this phase’s scope. Missing formal status wording in `implementation-roadmap.md` is a documentation lag, not a reason to rebuild Phases 0–1. If Phase 0 quality commands or Phase 1 unit checks later fail when this spec is implemented, that is a **prerequisite defect to fix in the earlier phase** and MUST NOT pull fetching, generation, quiz UI, telemetry or production delivery into Phase 2.

**Existing whole-product placeholder:** `specs/001-ai-quiz-generator/` remains unused leftover context. This cycle owns `specs/004-phase-2-persistence-api/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

A REST client MUST be able to:

- Create a quiz from a validated topic, HTTPS source URL shape and question count (5–8, default 5). Creation **does not fetch** the URL and **does not call a model**. A **fixed source snapshot** and a **fixed, valid question set** of the requested length are persisted instead.
- Retrieve a playable quiz by identity: topic, source summary and ordered questions with four option labels each. **No correctness flags** or other answer keys appear on this response.
- Start an anonymous attempt on a playable quiz and receive an attempt identity plus a **private attempt token** shown **once**.
- Submit a complete legal answer set for that attempt, authorized by the private token. The server grades with the **Phase 1** rules (single-answer 4/0, provisional multiple-answer policy, position weights `1.1` raised to zero-based index) and returns the public result.
- Retrieve that same result later, still authorized by the private token, including per-question scores, the unrounded weighted score, display rounding, and which options were correct.
- Rely on durable records for source snapshots, quizzes, ordered questions and options (including hidden correctness), attempts, per-question answers, selected options, per-question scores and the final weighted score.

The server MUST:

- Persist product records with uniqueness and relationship rules: unique question position per quiz, unique option position per question, unique answer per attempt/question, and required parent/child links.
- Keep repository **ports** in the core and storage/HTTP **adapters** at the edges. Domain and application remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client dependencies.
- Finalize selections, per-question scores, the weighted score, submission time and scored status **together**. A crash mid-submit MUST NOT leave a half-scored attempt that looks complete.
- Treat any later submit of a scored attempt as **idempotent**: return the existing result; ignore the new payload; do not re-score. Concurrent submits MUST yield one stored result, not two scores.
- Reject selections that name questions or options that do not belong to that attempt’s quiz.
- Refuse to change questions, options or correctness of a quiz once it is playable.
- Store **only a hash** of the attempt token. The plaintext token MUST NOT be written to storage or logs.
- Map failures to stable error codes. Reuse Phase 1 codes where they already apply. Add codes for missing quiz/attempt, unplayable quiz and unauthorized attempt. Do not leak stack traces, tokens, hashes or keys.
- Prove the above with automated checks against a **real** PostgreSQL database (persistence) and against the HTTP interface (create → get → start → submit → result), using Jest and Supertest as required by the Constitution.

Constitution-bound names for this phase (not open design choices): TypeScript strict packages, Zod public contracts, Prisma migrations and adapters, NestJS REST adapters, PostgreSQL, Jest, Supertest, and the `/v1` paths from `roadmap.md`.

## Explicit Exclusions

This phase MUST NOT include:

- Remote Markdown fetching, GitHub blob-to-raw normalization, DNS/IP SSRF checks, timeouts, size caps or treating a live URL as content to retrieve.
- OpenAI / Vercel AI SDK calls, structured model generation, generation retries or prompt handling.
- Quiz setup forms, player, progress, submission screens or results UI (the Phase 0 web shell stays a non-quiz shell).
- Langfuse or other generation telemetry.
- Production Dockerfiles, GitHub Actions, authentication of human users, billing, queues or dashboards.
- Re-scaffolding the monorepo, overwriting the Constitution, or rewriting Phase 1 scoring/contracts except to consume them.
- A `generating` live-wait path: fixtures are local and synchronous. Partial playable quizzes MUST NOT be saved.

HTTPS URL **shape** validation remains in scope (Phase 1 contract). Fetching that URL is not. Scoring policy changes are not; Phase 1’s provisional multiple-answer reading stays in force.

Later-phase requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **REST client** (developer, interviewer, or a later web app). A **learner** is the conceptual quiz-taker whose answers are stored; no browser player is required in this phase.

### User Story 1 - Complete persisted quiz flow (Priority: P1)

A client sends a valid create-quiz request. The server persists a source snapshot and a playable quiz built from **fixed fixtures** of the requested length, then returns the quiz identity and a ready status. The client loads the sanitized quiz, starts an attempt, submits a complete legal answer set, and reads the result. The returned weighted score and per-question scores match Phase 1 grading for those answers. Reloading the result later returns the same stored values. Inspecting storage shows the source, quiz, questions, options, attempt, answers, selections, per-question scores and final score.

**Why this priority**: This is the phase definition of done. Without a durable create → play → score path, later fetching and UI have nothing to attach to.

**Independent Test**: Drive the documented `/v1` sequence against a real database using the fixture quiz and a known answer key held only on the server; confirm the HTTP result and stored rows match the Phase 1 score for that fixture.

**Acceptance Scenarios**:

1. **Given** a valid topic, `https` source URL and question count from 5 through 8, **When** the client creates a quiz, **Then** the response includes a quiz identity and a ready status, and a source snapshot plus that many ordered questions (each with four options) are stored.
2. **Given** that quiz identity, **When** the client retrieves the quiz, **Then** the response includes topic, source summary, prompts, types and option labels in quiz order, and the client can start an attempt on it.
3. **Given** a playable quiz, **When** the client starts an attempt, **Then** the response includes an attempt identity and a private token, and an open attempt is stored for that quiz.
4. **Given** an open attempt and a complete legal answer set, **When** the client submits those answers with the private token, **Then** the response is the public result whose per-question scores and unrounded weighted score equal the Phase 1 grade for that fixture, and those values are stored with the attempt.
5. **Given** a scored attempt, **When** the client requests the result with the same token, **Then** the stored result is returned (same scores, same selected options, same correctness explanation) without grading again.
6. **Given** a successful flow, **When** a reviewer inspects stored records, **Then** they find the source snapshot, quiz, questions, options (including hidden correctness), attempt, one answer per question, selected options, per-question scores and the final weighted score.

---

### User Story 2 - Hide answer keys before submit (Priority: P1)

A client who has not submitted must be able to see questions and choices but must never learn which options are correct from any create or get-quiz response, error payload, or log. After a successful submit, the result **does** include which options were correct, as Phase 1 already requires.

**Why this priority**: Answer-key leakage before submission is an assessment failure even if storage and scoring are correct.

**Independent Test**: Create and retrieve a fixture quiz; assert the payloads have no correctness flags; submit; assert the result includes correctness; inspect stored options and confirm keys exist only in server-side records.

**Acceptance Scenarios**:

1. **Given** a newly created ready quiz, **When** the client retrieves it, **Then** each option has identity, position and label only — no correctness flag, raw score or weighted score.
2. **Given** the create-quiz response, **When** a reviewer inspects it, **Then** it contains quiz identity and status and does **not** contain questions, options or keys.
3. **Given** a scored attempt, **When** the client fetches the result with a valid token, **Then** the result includes per-question scores and which options were correct.
4. **Given** an open attempt, **When** the client requests the result, **Then** the request is rejected as not scored and the response does **not** include correctness flags.

---

### User Story 3 - Authorize submit and result with a private attempt token (Priority: P1)

Starting an attempt issues a secret token once. Submit and result require that token for **that** attempt. Storage keeps only a hash of the token. A missing, wrong or other-attempt token is rejected. The token is not written to logs.

**Why this priority**: Anonymous MVP access control is the attempt token. Storing plaintext tokens would make every database copy a credential leak.

**Independent Test**: Start an attempt, submit with the issued token (success), then repeat submit/result with no token, a wrong token and a token from a different attempt (all rejected); inspect stored attempt records and logs for absence of the plaintext token.

**Acceptance Scenarios**:

1. **Given** a playable quiz, **When** the client starts an attempt, **Then** the response includes a private token **once**, and storage records a hash of that token rather than the token itself.
2. **Given** that token, **When** the client submits legal answers for that attempt, **Then** submit is authorized and grading proceeds.
3. **Given** a scored attempt, **When** the client fetches the result with the same token, **Then** the result is returned.
4. **Given** submit or result on an existing attempt, **When** the token is missing, malformed or does not match that attempt, **Then** the request is rejected as unauthorized and no score or answer keys are returned.
5. **Given** two attempts on the same quiz, **When** the token from attempt A is used on attempt B, **Then** the request is rejected as unauthorized.
6. **Given** a completed flow, **When** a reviewer inspects application logs for the attempt identity, **Then** they do not find the plaintext token.

---

### User Story 4 - Validate ownership and unique answers (Priority: P1)

Answers must name questions and options that belong to the attempt’s quiz. A question may be answered only once on an attempt. Options from another quiz or another question are rejected. Duplicate question identities in one submit are rejected. Wrong-but-legal picks still score (Phase 1); illegal ownership does not.

**Why this priority**: Without ownership checks, a client could attach another quiz’s correct options or write two scores for one question.

**Independent Test**: Submit mixed foreign ids, duplicate question rows and a second answer for the same question; confirm rejection and that stored answers stay at most one per question.

**Acceptance Scenarios**:

1. **Given** an open attempt on quiz A, **When** the client selects an option identity that belongs to quiz B or to a different question on quiz A, **Then** submit is rejected as an illegal selection and the attempt remains open and unscored.
2. **Given** an open attempt, **When** the submit payload repeats a question identity, **Then** it is rejected and no score is stored.
3. **Given** a successful submit, **When** storage is inspected, **Then** there is exactly one stored answer per quiz question for that attempt, and every selected option belongs to that question.
4. **Given** a valid single-answer question, **When** the client selects exactly one belonging option that is incorrect, **Then** the answer is accepted and that question scores 0 (ownership passed; the pick is merely wrong).

---

### User Story 5 - Finalize scores atomically and treat repeat submits as the same result (Priority: P1)

The first successful submit writes selections, per-question scores, the weighted score and scored status together. A second submit — same answers or different — returns that stored result and does not grade again. Two submits at the same time still produce one stored result.

**Why this priority**: Split writes would leave attempts that look scored without a total, or totals without answers. Re-scoring would violate the assessment’s idempotent submit rule.

**Independent Test**: Submit once and confirm stored rows match the result; submit again with different answers and confirm the original result; overlap two submits and confirm a single stored score equal to the first successful grade.

**Acceptance Scenarios**:

1. **Given** an open attempt and a complete legal payload, **When** submit succeeds, **Then** selected options, per-question scores, unrounded weighted score, display fields, scored status and submission time are all stored together.
2. **Given** that scored attempt, **When** the same answers are submitted again with the valid token, **Then** the original result is returned and stored scores are unchanged.
3. **Given** that scored attempt, **When** **different** answers are submitted with the valid token, **Then** those answers are ignored, the original result is returned, and stored selections/scores are unchanged.
4. **Given** an open attempt, **When** two complete legal submits arrive at the same time, **Then** exactly one result is stored, both clients receive that same result, and the attempt is not scored twice with different totals.
5. **Given** a submit that fails validation (incomplete or illegal), **When** the error is returned, **Then** the attempt remains open, no weighted score is stored, and a later legal submit can still succeed.

---

### User Story 6 - Keep playable quizzes immutable (Priority: P2)

Once a quiz is ready to play, its prompts, option labels, order and hidden correctness cannot be changed. New attempts always see the same questions that earlier attempts were graded against. This phase has no quiz-edit resource; immutability is a storage invariant.

**Why this priority**: Changing keys after play would silently invalidate stored scores. It is secondary to the first complete flow, but required for trustworthy persistence.

**Independent Test**: Persist a ready fixture quiz; attempt to alter a stored option’s correctness or a question prompt; confirm the change is refused and subsequent get-quiz/start/submit still match the original fixture.

**Acceptance Scenarios**:

1. **Given** a ready quiz, **When** any process tries to change a question prompt, option label, option order or correctness flag, **Then** the change is refused and stored playable content remains the original fixture.
2. **Given** that quiz and an existing scored attempt, **When** a new attempt is started and submitted with the same answers as a known fixture, **Then** the new result matches the original grading of that fixture.
3. **Given** a create that cannot persist a valid 5–8 question quiz from fixtures, **When** creation fails, **Then** no playable quiz is left in storage (no partial question set that a client could start).

---

### Edge Cases

- **Unknown quiz identity**: get-quiz and start-attempt fail as not found; no empty quiz view.
- **Unknown attempt identity**: submit and result fail as not found (or unauthorized if a token is required to distinguish); no result body.
- **Create with blank topic, non-`https` URL, or count outside 5–8**: rejected with the Phase 1 create-quiz invalid code; nothing playable is stored.
- **Omitted question count**: defaults to 5; five fixture questions are stored.
- **Count 5 and count 8**: both persist a valid quiz of that length; weights use that order.
- **Fixture quiz that would break Phase 1 invariants**: creation fails closed; a playable quiz is not stored.
- **Start attempt on a non-ready quiz**: rejected as not playable (this phase should not normally persist such quizzes).
- **Result before submit**: `ATTEMPT_NOT_SCORED`; no keys.
- **Incomplete submit** (missing a question): `ATTEMPT_INCOMPLETE`; attempt stays open.
- **Illegal arity, duplicates, unknown ids**: `SELECTION_ILLEGAL`; attempt stays open.
- **Token presented on get-quiz**: ignored; get-quiz stays unauthenticated and key-free.
- **Reuse of a token string in storage**: only the hash is stored; a copy of the database MUST NOT reveal a usable token.
- **Concurrent start-attempt**: each start creates a **new** attempt with its own token; they do not share scores.
- **Submit that crashes after writing answers but before the total**: MUST NOT be observable as scored; retry/idempotency still yields one consistent result once a submit succeeds.
- **Database unavailable**: HTTP calls that need storage fail clearly; they MUST NOT skip persistence and pretend to score only in memory.
- **`/health` and `/ready`**: remain the Phase 0 liveness and database-readiness surfaces; they are not quiz resources.
- **Optional create `strategy`**: if sent, only the documented default `balanced` is accepted this phase and is stored as metadata; it MUST NOT change fixture questions. Unknown strategies fail closed. Omitted strategy defaults to `balanced`.
- **Source URL is not fetched**: the stored snapshot is fixture text; `originalUrl` is the requested URL; this phase records the same value as the resolved URL.
- **Percentage**: stored/returned as the Phase 1 display percentage beside the 0–4 weighted score, not as a replacement.
- **Second submit with a bad token**: unauthorized, even if the attempt is already scored; do not return the result without a valid token.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `POST /v1/quizzes` MUST accept the Phase 1 create-quiz public input (non-empty topic, `https` source URL, optional question count 5–8 defaulting to 5). Invalid input MUST fail closed with `CREATE_QUIZ_INVALID` and MUST NOT persist a playable quiz.
- **FR-002**: Successful create MUST persist a source snapshot (requested URL, snapshot text, checksum, recorded time) and a **ready** quiz whose questions come from **fixed fixtures** of the requested length, each with exactly four options and Phase 1–valid keys. It MUST NOT fetch the URL or call a model. The HTTP response MUST include the quiz identity and ready status and MUST NOT include questions or answer keys.
- **FR-003**: `GET /v1/quizzes/:quizId` MUST return the Phase 1 public quiz view (topic, source summary, ordered questions and option labels/types) and MUST NEVER include correctness flags or other keys. Unknown ids MUST fail with `QUIZ_NOT_FOUND`.
- **FR-004**: `POST /v1/quizzes/:quizId/attempts` MUST create an open attempt for a ready quiz, persist `startedAt`, mint an unguessable private token, persist **only a hash** of that token, and return the attempt identity plus the plaintext token **once**. Unknown or non-ready quizzes MUST fail with `QUIZ_NOT_FOUND` or `QUIZ_NOT_PLAYABLE`.
- **FR-005**: `POST /v1/attempts/:attemptId/submit` MUST require the private token for that attempt, accept the Phase 1 submit-answers body, grade with Phase 1 domain rules, and return the Phase 1 public result on first success.
- **FR-006**: `GET /v1/attempts/:attemptId/result` MUST require the same private token and MUST return the stored public result only after a successful submit. An open attempt MUST fail with `ATTEMPT_NOT_SCORED` and MUST NOT include keys.
- **FR-007**: Missing, malformed, or non-matching tokens on submit or result MUST fail with `UNAUTHORIZED_ATTEMPT` and MUST NOT return scores, selections or keys. A token from another attempt MUST NOT authorize this one. Get-quiz MUST NOT require a token.
- **FR-008**: The plaintext attempt token MUST NOT be stored, logged, or returned after the start-attempt response. Only a one-way hash of the token is retained for verification.
- **FR-009**: Selections MUST name questions and options that belong to the attempt’s quiz. Foreign ids, duplicate question rows, duplicate option ids, and wrong arity MUST be rejected (`SELECTION_ILLEGAL` or `SUBMIT_ANSWERS_INVALID`) without scoring. Incomplete sets MUST fail with `ATTEMPT_INCOMPLETE`. Wrong-but-legal picks MUST score under Phase 1 rules.
- **FR-010**: Storage MUST enforce at most one answer per attempt/question, unique question position per quiz, unique option position per question, and parent/child existence for source, quiz, question, option, attempt, answer and selection records.
- **FR-011**: The first successful submit MUST persist, in one atomic unit of work: selected options, per-question scores, unrounded weighted score, display score/percentage, scored status and submission time. Observers MUST NOT see a scored attempt missing any of those parts.
- **FR-012**: Any later submit of a scored attempt with a valid token MUST return the existing result, MUST NOT re-score, and MUST ignore a new payload even when answers differ. Concurrent submits MUST converge on a single stored result.
- **FR-013**: Once a quiz is ready, its prompts, option labels, order and correctness flags MUST be immutable. Create MUST NOT leave a partial playable quiz if fixture validation or persistence fails.
- **FR-014**: Scoring MUST be the Phase 1 implementation (single-answer 4/0, provisional multiple-answer policy, `1.1 ** index` weighted average, round only for display). This cycle MUST NOT change that policy.
- **FR-015**: Public request/response bodies MUST use the Phase 1 Zod contracts for create, submit, quiz view and result. Answer keys MUST stay out of create/get-quiz. Result MAY include post-submit correctness only after scoring.
- **FR-016**: Repository ports MUST live in domain or application. Prisma adapters and NestJS HTTP adapters MUST live in the API app. Domain and application packages MUST remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client dependencies.
- **FR-017**: Product schema changes MUST ship as Prisma migrations applied to PostgreSQL. Persistence integration tests MUST run against real PostgreSQL. API tests MUST use Jest, Supertest and real PostgreSQL. Neither suite MAY call a model or fetch remote Markdown.
- **FR-018**: Stable error codes MUST include Phase 1 codes plus `QUIZ_NOT_FOUND`, `ATTEMPT_NOT_FOUND`, `UNAUTHORIZED_ATTEMPT` and `QUIZ_NOT_PLAYABLE`. Responses MUST be English, non-secret, and MUST NOT include provider traces, tokens, hashes or keys.
- **FR-019**: Optional create field `strategy`, if present, MUST be `balanced` this phase (default `balanced` when omitted), stored as quiz metadata, and MUST NOT alter fixture content. Other values fail closed.
- **FR-020**: This cycle MUST reuse Phase 0 runtime and Phase 1 scoring/contracts and MUST NOT add remote fetch adapters, model adapters, quiz UI flows, Langfuse or production delivery.

### Key Entities

- **Source snapshot**: Durable copy of fixture source text for a quiz, with the requested URL, a checksum, and the time it was recorded. Not obtained by fetching in this phase.
- **Quiz**: A persisted playable set of 5–8 questions about a topic, with status `ready` (this phase), optional strategy metadata, and a link to its source snapshot.
- **Question**: One persisted prompt with type, zero-based position and exactly four options.
- **Option**: One persisted choice with label, position and a **server-only** correctness flag.
- **Attempt**: One sitting of a quiz, identified publicly, authorized by a private token whose **hash** is stored. Status `open` or `scored`. Records start time; records submission time and scores only when scored.
- **Answer**: The stored response to one question on one attempt (exactly one per pair), including the per-question score after a successful submit.
- **Answer selection**: The stored option identities chosen for an answer; every id belongs to that question.
- **Private attempt token**: Unguessable secret issued once at start-attempt; presented by the client on submit and result; never stored in plaintext.
- **Public quiz view**: Pre-submit HTTP shape with no keys (Phase 1).
- **Public result view**: Post-submit HTTP shape with scores and correctness (Phase 1).
- **Fixed fixture bank**: Server-side source text and valid questions used instead of fetch/generation; not a public contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of documented complete flows (create → get quiz → start attempt → submit → get result) return a weighted score and per-question scores that match the Phase 1 grade for that fixture, and a reviewer can find the matching source, questions, options, answers, selections and final score in storage.
- **SC-002**: 100% of documented pre-submit create and get-quiz responses contain **zero** correctness flags or other answer-key fields. 100% of documented post-submit results include which options were correct together with the numeric scores.
- **SC-003**: 100% of documented submit and result calls without a valid token for that attempt are denied and return no scores or keys. 100% of documented stored attempts contain a token hash and not the plaintext token.
- **SC-004**: 100% of documented foreign-id, duplicate-question and cross-question selection cases are rejected; 100% of successful submits store exactly one answer per question with only belonging options.
- **SC-005**: 100% of documented second submits (same answers, different answers, and overlapping concurrent submits) return the original stored result and leave a single scored total. 100% of documented failed submits leave the attempt open with no weighted score.
- **SC-006**: 100% of documented attempts to change a ready quiz’s prompts, labels, order or keys are refused, and a later attempt graded with the original fixture answers still matches the original scores.
- **SC-007**: A reviewer can complete the persisted demonstration (run the storage and HTTP checks and retrieve a correct stored score) in one sitting **without** a model key and **without** the server fetching a live Markdown URL.
- **SC-008**: Invalid create/submit shapes, unknown identities, incomplete attempts, result-before-submit and unplayable quizzes fail closed in 100% of documented cases, with stable codes and no secret leakage.
- **SC-009**: A scope review of this phase’s delivery finds **zero** remote Markdown fetchers, model-provider calls, quiz UI flows, generation telemetry, production images or hosted CI pipelines, and confirms scoring still lives in the Phase 1 core rather than in storage or HTTP adapters.

## Assumptions

- The Constitution’s technology choices remain binding: TypeScript, NestJS REST adapters, PostgreSQL with Prisma migrations, Zod public contracts, Jest, Supertest, hexagonal `domain` / `application` / `contracts` packages. Those names appear here as phase boundaries, not as an invitation to add fetch, generation or UI.
- Phase 0 local PostgreSQL, Prisma bootstrap, `/health`/`/ready` and quality commands are the runtime base. Phase 1 scoring, freeze-on-resubmit and public schemas are the behavior base. This phase adds durable records and HTTP resources on top.
- Create uses **fixtures**: a canned source snapshot and a canned valid question bank. Requested `questionCount` selects how many leading questions (5–8) are persisted. Fixture prompts need not match the client’s topic; topic is stored as requested. This is acceptable because Phase 3 replaces fixtures with grounded generation.
- The requested source URL is stored as metadata and as the snapshot’s original (and, this phase, resolved) URL. Reachability, redirects and SSRF are out of scope.
- Quiz status `generating` is not used on the happy path this phase. Successful creates are `ready`. Failed creates do not leave a playable quiz. Status `failed` MAY exist only if a non-playable row is retained; clients still cannot start attempts on it.
- Optional `strategy` defaults to `balanced` and does not change fixtures. A second generation strategy is Phase 6.
- Attempt access is **Bearer** presentation of the private token (standard `Authorization` header). No human user accounts.
- Anyone who knows a quiz identity may retrieve it (sanitized) and start a new attempt. Each attempt has its own token and scores. There is no shared “resume this person’s quiz” identity.
- Token hashes are one-way and not reversible from a database dump. Token entropy is high enough that guessing is not a realistic Phase 2 threat; rate limiting is Phase 6.
- Concurrent duplicate submit is resolved by transactional uniqueness on the attempt’s scored transition (or equivalent): one writer finalizes; others read the stored result.
- Display rounding remains Phase 1 (two decimals, half-up). Unrounded weighted score is what storage and grading keep.
- Multiple-answer scoring remains the provisional Phase 1 reading; this phase does not reopen that ambiguity.
- HTTP mapping for existing codes follows the Phase 1 contract note (client errors for invalid/illegal/incomplete input; conflict for result-before-submit). New codes: not found for missing quiz/attempt; unauthorized for bad tokens; not playable when a quiz exists but cannot be started.
- `/health` and `/ready` stay as in Phase 0. They are not replaced by quiz routes.
- Concrete file paths, Prisma field types and NestJS module names belong to planning. This specification names durable records, HTTP behavior and evidence requirements only.

## Dependencies

- Existing Constitution, `roadmap.md`, `implementation-roadmap.md`, `AGENTS.md` and Spec Kit installation.
- Phase 0 delivery: API/web shells, Compose PostgreSQL, Prisma connectivity, Jest, quality commands.
- Phase 1 delivery: `packages/domain` scoring and invariants, `packages/application` `gradeAttempt` freeze, `packages/contracts` Zod schemas and error codes.
- A running local PostgreSQL instance for persistence and API evidence (already required by Phase 0).
- No Phase 3–7 code. This phase MUST NOT wait on a model key or a live README.

## Deferred Context (not acceptance)

The following remain future cycles and MUST NOT be implemented or tested as Phase 2 done-when items:

- Phase 3: Markdown ingestion, SSRF controls and model generation replacing fixtures.
- Phase 4: complete quiz web experience.
- Phase 5: two-source demonstration and reliability evidence against live READMEs.
- Phase 6: Langfuse, rate limits and operational hardening.
- Phase 7: GitHub Actions, production images and interview walkthrough kit.
