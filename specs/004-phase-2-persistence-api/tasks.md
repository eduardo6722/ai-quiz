---
description: "Task list for Phase 2 persistence and deterministic REST quiz flow (roadmap Phase 2 only)"
---

# Tasks: Phase 2 Persistence and Deterministic REST Quiz Flow

**Input**: Design documents from `/specs/004-phase-2-persistence-api/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 2 — Prisma model, repositories and deterministic API skeleton. Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap Phases 3–7.

**Tests**: Included. Spec FR-017, user stories, Constitution VI, and `quickstart.md` require Jest application tests (mocked ports), Jest + real PostgreSQL integration tests, and Jest + Supertest API tests. Write listed tests first and confirm they fail before implementation. Default `pnpm test` MUST NOT require PostgreSQL or a model key. `pnpm test:integration` and `pnpm test:e2e` require `ai_quiz_test`.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US6`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Domain: `packages/domain/src/`
- Application: `packages/application/src/`
- Contracts: `packages/contracts/src/`
- API: `apps/api/src/modules/quiz/`
- Prisma: `apps/api/prisma/`
- Integration tests: `apps/api/test/integration/`
- API tests: `apps/api/test/e2e/`
- Do **not** add remote Markdown HTTP fetch, OpenAI/Vercel AI SDK adapters, quiz UI routes, Langfuse, production Dockerfiles, or GitHub Actions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire test scripts, Jest configs and quiz module directories. Do not reinitialize Spec Kit, overwrite the Constitution, or add workspace packages.

- [X] T001 Create directories `packages/domain/src/ports/`, `apps/api/src/modules/quiz/adapters/in/rest/`, `apps/api/src/modules/quiz/adapters/out/prisma/`, `apps/api/src/modules/quiz/adapters/out/fixture/`, `apps/api/test/integration/`, and `apps/api/test/e2e/` per plan.md
- [X] T002 Register Turbo tasks `test:integration` and `test:e2e` in root `turbo.json` with `cache: false` and `env: ["DATABASE_URL"]` following the installed Turborepo 2.11 configuring-tasks docs; do not change default `test`
- [X] T003 [P] Add scripts `test:integration` and `test:e2e` in `apps/api/package.json` (Jest configs below) and matching root scripts in `package.json` that invoke `turbo run test:integration` / `turbo run test:e2e`
- [X] T004 [P] Add `apps/api/jest.integration.config.cjs` (`testMatch` `test/integration/**/*.spec.ts`) and `apps/api/jest.e2e.config.cjs` (`testMatch` `test/e2e/**/*.spec.ts`) cloning SWC/moduleNameMapper from `apps/api/jest.config.cjs`; keep default `apps/api/jest.config.cjs` on `test/**/*.spec.ts` excluding `integration` and `e2e`
- [X] T005 Document `ai_quiz_test` in `.env.example` as a comment-only test URL `postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public`; do not require `OPENAI_API_KEY` or Langfuse; do not commit `.env`
- [X] T006 [P] Create typed placeholder `apps/api/src/modules/quiz/quiz.module.ts` (empty `QuizModule`) and stub files `apps/api/src/modules/quiz/adapters/in/rest/quiz.controller.ts`, `apps/api/src/modules/quiz/adapters/in/rest/attempt.controller.ts`, `apps/api/src/modules/quiz/adapters/in/rest/attempt-token.ts`, `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.ts`
- [X] T007 [P] Create typed placeholders `packages/domain/src/ports/markdown-source-port.ts`, `packages/domain/src/ports/quiz-generation-port.ts`, `packages/domain/src/ports/quiz-repository-port.ts`, `packages/domain/src/ports/attempt-repository-port.ts`, and `packages/domain/src/ports/unit-of-work-port.ts`
- [X] T008 [P] Create typed placeholders `packages/application/src/errors.ts`, `packages/application/src/create-quiz.ts`, `packages/application/src/get-quiz.ts`, `packages/application/src/start-attempt.ts`, `packages/application/src/submit-quiz.ts`, and `packages/application/src/get-quiz-result.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Product schema, ports, contracts, fixture bank, token hashing, Prisma adapters and HTTP error mapping used by every story. **No user story work until this phase is complete.**

- [X] T009 Add Prisma models to `apps/api/prisma/schema.prisma`: `SourceDocument` (`id` uuid string, `originalUrl` string, `resolvedUrl` string, `contentHash` string, `title` string?, `fetchedAt` datetime, `contentSnapshot` string max 512 KiB at application layer); `Quiz` (`id` uuid string, `sourceDocumentId` uuid FK, `topic` string non-empty after trim, `strategy` string default `"balanced"`, `status` enum `generating` \| `ready` \| `failed`, `modelId` string? null this phase, `createdAt` datetime); `Question` (`id` uuid string, `quizId` uuid FK cascade, `position` int `0 .. n-1` unique per quiz contiguous, `type` enum `single` \| `multiple`, `prompt` string non-empty after trim, `sourceExcerpt` string?); `QuestionOption` (`id` uuid string, `questionId` uuid FK cascade, `position` int 0–3 unique per question, `label` string non-empty unique within the question case-sensitive trimmed, `isCorrect` boolean server-only); `QuizAttempt` (`id` uuid string, `quizId` uuid FK restrict, `publicTokenHash` string unique SHA-256 hex never plaintext, `status` enum `open` \| `scored`, `startedAt` datetime, `submittedAt` datetime?, `weightedScore` float? unrounded 0–4, `weightedScoreDisplay` float?, `percentageDisplay` float?); `AttemptAnswer` (`id` uuid string, `attemptId` uuid FK cascade, `questionId` uuid FK, `rawScore` int `0..4`, unique `(attemptId, questionId)`); `AttemptAnswerSelection` composite id `(answerId, optionId)` with FKs cascade/restrict per [data-model.md](./data-model.md)
- [X] T010 Create the first product migration under `apps/api/prisma/migrations/` for T009 (uniques `(quizId, position)`, `(questionId, position)`, `(attemptId, questionId)`, unique `publicTokenHash`) and run it against local Postgres; keep Phase 0 connectivity working
- [X] T011 Define `MarkdownSourcePort.fetch(url)` in `packages/domain/src/ports/markdown-source-port.ts` returning `{ originalUrl, resolvedUrl, contentSnapshot, contentHash, title?, fetchedAt }` with **no** Nest/Prisma/HTTP types
- [X] T012 [P] Define `QuizGenerationPort.generate({ topic, sourceText, count, strategy })` in `packages/domain/src/ports/quiz-generation-port.ts` returning Phase 1 `Question[]` of length `count` (5–8)
- [X] T013 [P] Define `QuizRepositoryPort` insert (source + quiz + questions + options) and `findById` (domain `Quiz` plus `status`, `sourceDocumentId`, `strategy`) with **no** update of ready prompts/labels/positions/`isCorrect` in `packages/domain/src/ports/quiz-repository-port.ts`
- [X] T014 [P] Define `AttemptRepositoryPort` create open attempt (id, quizId, token hash, startedAt), load by id, finalize scored graph, load scored result parts in `packages/domain/src/ports/attempt-repository-port.ts`
- [X] T015 Define `UnitOfWorkPort.transaction(fn)` in `packages/domain/src/ports/unit-of-work-port.ts` supplying the same quiz/attempt repository ports bound to one transaction
- [X] T016 Export ports from `packages/domain/src/index.ts`; keep Phase 1 scoring exports; domain `package.json` still has no Nest/Prisma/Zod/OpenAI/`ai`/Langfuse
- [X] T017 Add `ApplicationError` in `packages/application/src/errors.ts` with codes `QUIZ_NOT_FOUND`, `ATTEMPT_NOT_FOUND`, `UNAUTHORIZED_ATTEMPT`, `QUIZ_NOT_PLAYABLE` and English non-secret messages; do not import Nest
- [X] T018 Extend `ErrorCodes` in `packages/contracts/src/error-codes.ts` with `QUIZ_NOT_FOUND`, `ATTEMPT_NOT_FOUND`, `UNAUTHORIZED_ATTEMPT`, `QUIZ_NOT_PLAYABLE` matching [contracts/error-codes.md](./contracts/error-codes.md); keep Phase 1 codes
- [X] T019 [P] Add optional `strategy` enum `"balanced"` default `"balanced"` to `packages/contracts/src/create-quiz.ts`; other values → `CREATE_QUIZ_INVALID`; do not fetch `sourceUrl`
- [X] T020 [P] Add `createQuizResponseSchema` `{ id, status: "ready" | "failed" }` in `packages/contracts/src/create-quiz-response.ts` (no questions or keys) and `startAttemptResponseSchema` `{ attemptId, token }` in `packages/contracts/src/start-attempt-response.ts`
- [X] T021 [P] Add `errorResponseSchema` `{ code, message }` in `packages/contracts/src/error-response.ts`; re-export new schemas/codes from `packages/contracts/src/index.ts`
- [X] T022 Implement 8-question mixed `single`/`multiple` fixture bank (exactly four options, Phase 1–valid keys, canned snapshot text, optional title) in `apps/api/src/modules/quiz/adapters/out/fixture/fixture-bank.ts`; assign fresh UUIDs per create; snapshot max 512 KiB; MUST NOT HTTP-fetch
- [X] T023 Implement `FixedSourceAdapter` in `apps/api/src/modules/quiz/adapters/out/fixture/fixed-source.adapter.ts`: `resolvedUrl` same as `originalUrl`, SHA-256 hex `contentHash` of snapshot, no `fetch`/HTTP client
- [X] T024 Implement `FixedGenerationAdapter` in `apps/api/src/modules/quiz/adapters/out/fixture/fixed-generation.adapter.ts`: return first `count` questions from the bank; ignore topic/source text/strategy for content; `validateQuiz` must pass
- [X] T025 Implement `mintAttemptToken` (`crypto.randomBytes(32).toString("base64url")`) and `hashAttemptToken` (SHA-256 hex) plus `timingSafeEqual` compare in `apps/api/src/modules/quiz/adapters/in/rest/attempt-token.ts`; never log plaintext, `Authorization`, or hash
- [X] T026 Implement Prisma adapters `apps/api/src/modules/quiz/adapters/out/prisma/quiz.prisma-repository.ts`, `apps/api/src/modules/quiz/adapters/out/prisma/attempt.prisma-repository.ts`, and `apps/api/src/modules/quiz/adapters/out/prisma/prisma-unit-of-work.ts` (`prisma.$transaction` + attempt row lock `FOR UPDATE`); insert/find/finalize only — no ready-quiz key updates
- [X] T027 Map HTTP `{ code, message }` in `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.ts` per [contracts/error-codes.md](./contracts/error-codes.md) (400/401/404/409/422); never include stack, Prisma traces, tokens, hashes or `isCorrect`
- [X] T028 Add `apps/api/test/integration/postgres.setup.ts` that ensures database `ai_quiz_test` exists, applies migrations, and `TRUNCATE … CASCADE` between tests; do not use the dev `ai_quiz` data volume as the test target
- [X] T029 Wire `QuizModule` in `apps/api/src/modules/quiz/quiz.module.ts` and import it from `apps/api/src/app.module.ts`; keep `GET /health` and `GET /ready` at the root (no global `/v1` prefix)

**Checkpoint**: Schema, ports, fixtures, Prisma adapters and error mapping exist. `/v1` create/get/start/submit/result still fail or 404 until user stories. Default `pnpm test` still passes without Postgres.

---

## Phase 3: User Story 1 - Complete persisted quiz flow (Priority: P1) 🎯 MVP

**Goal**: REST client creates a fixture quiz, gets the sanitized quiz, starts an attempt, submits a complete legal set with the token, and reads a stored Phase 1 score; storage has source, questions, options, answers, selections and final score.

**Independent Test**: `pnpm test:e2e` happy-path file — create → get → start → submit → result against `ai_quiz_test` without `OPENAI_API_KEY`; scores match Phase 1 for the fixture; Postgres rows exist.

### Tests for User Story 1 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T030 [P] [US1] Contract/schema tests in `packages/contracts/src/create-quiz.spec.ts` and `packages/contracts/src/create-quiz-response.spec.ts`: valid topic/`https` URL/count 5–8/`strategy` balanced accepted; omitted count defaults to 5; omitted strategy defaults to `balanced`; create response has `id` + `status` and rejects questions/`isCorrect`
- [X] T031 [P] [US1] Application tests with mocked ports in `packages/application/src/create-quiz.spec.ts`, `packages/application/src/get-quiz.spec.ts`, `packages/application/src/start-attempt.spec.ts`, `packages/application/src/submit-quiz.spec.ts`, and `packages/application/src/get-quiz-result.spec.ts` covering the happy path (ready quiz of requested length, open attempt, first submit grades via `gradeAttempt`, get result returns stored scores)
- [X] T032 [P] [US1] Integration tests in `apps/api/test/integration/quiz-persist.spec.ts`: after create, `SourceDocument` has requested URL, `resolvedUrl` same as `originalUrl`, SHA-256 `contentHash`, recorded `fetchedAt`, snapshot text; quiz `status` `ready`, `strategy` `balanced`, `modelId` null; `questionCount` questions each with four options including persisted `isCorrect`
- [X] T033 [US1] Supertest e2e in `apps/api/test/e2e/quiz-flow.spec.ts`: `POST /v1/quizzes` → `201` `{ id, status: "ready" }`; `GET /v1/quizzes/:quizId` public view; `POST /v1/quizzes/:quizId/attempts` `{ attemptId, token }`; `POST /v1/attempts/:attemptId/submit` with Bearer and complete legal answers → public result whose per-question scores and unrounded weighted score equal Phase 1 `gradeAttempt` for that fixture; `GET /v1/attempts/:attemptId/result` returns the same stored values; helper `apps/api/test/e2e/fixture-answers.ts` maps GET option ids to fixture correctness by position (do not put keys in HTTP)

### Implementation for User Story 1

- [X] T034 [US1] Implement `CreateQuizUseCase` in `packages/application/src/create-quiz.ts`: parse create input; `MarkdownSourcePort.fetch` then `QuizGenerationPort.generate`; `validateQuiz`; persist source+quiz+questions+options in `UnitOfWorkPort.transaction`; status `ready`; nothing playable on failure; no HTTP fetch or model SDK in application
- [X] T035 [P] [US1] Implement `GetQuizUseCase` in `packages/application/src/get-quiz.ts`: `findById` or `QUIZ_NOT_FOUND`; not `ready` → `QUIZ_NOT_PLAYABLE`; map with existing `toPublicQuizView` (no `isCorrect`)
- [X] T036 [P] [US1] Implement `StartAttemptUseCase` in `packages/application/src/start-attempt.ts`: ready quiz only; persist open attempt with `startedAt` and **token hash only** (plaintext minted in the HTTP adapter)
- [X] T037 [US1] Implement `SubmitQuizUseCase` in `packages/application/src/submit-quiz.ts` for **first** successful submit: load attempt+quiz in a transaction; call existing `gradeAttempt`; persist selected options, `rawScore` 0–4, unrounded `weightedScore`, `weightedScoreDisplay`, `percentageDisplay`, `status` `scored`, `submittedAt` together; reuse Phase 1 scoring (`1.1 ** index`); do not reimplement scoring in SQL
- [X] T038 [US1] Implement `GetQuizResultUseCase` in `packages/application/src/get-quiz-result.ts`: reconstruct Phase 1 `PublicResult` from stored rows via `toPublicResult`; open attempt → `ATTEMPT_NOT_SCORED`; export all five use cases from `packages/application/src/index.ts`
- [X] T039 [US1] Implement `POST /v1/quizzes`, `GET /v1/quizzes/:quizId`, `POST /v1/quizzes/:quizId/attempts` in `apps/api/src/modules/quiz/adapters/in/rest/quiz.controller.ts` using Zod parse helpers; create/start `201`; mint token in adapter with `attempt-token.ts` and pass hash into `StartAttemptUseCase`; return plaintext token **once**
- [X] T040 [US1] Implement `POST /v1/attempts/:attemptId/submit` and `GET /v1/attempts/:attemptId/result` in `apps/api/src/modules/quiz/adapters/in/rest/attempt.controller.ts` with `Authorization: Bearer`; hash incoming token before the use case; unknown quiz/attempt map to `QUIZ_NOT_FOUND` / `ATTEMPT_NOT_FOUND`

**Checkpoint**: Fixture-backed create → get → start → submit → result works on real PostgreSQL. Key-leak, auth-failure, ownership, duplicate-submit and immutability suites may still fail.

---

## Phase 4: User Story 2 - Hide answer keys before submit (Priority: P1)

**Goal**: Create and GET quiz never include correctness flags or scores; result after submit does include which options were correct; result-before-submit has no keys.

**Independent Test**: `apps/api/test/e2e/quiz-keys.spec.ts` plus public-quiz schema: create/get bodies have zero `isCorrect`/`rawScore`/`weightedScore`; scored result includes `isCorrect`; open result is `ATTEMPT_NOT_SCORED` without keys.

### Tests for User Story 2 ⚠️

- [X] T041 [P] [US2] Assert `publicQuizViewSchema` still rejects `isCorrect` and scoring fields in `packages/contracts/src/public-quiz.spec.ts`; GET mapper test in `packages/application/src/get-quiz.spec.ts` that `toPublicQuizView` output has option `{ id, position, label }` only
- [X] T042 [US2] Supertest in `apps/api/test/e2e/quiz-keys.spec.ts`: `POST /v1/quizzes` body has no questions/keys; `GET /v1/quizzes/:quizId` options have no `isCorrect`/scores even if a token is sent; `GET .../result` on open attempt `409` `ATTEMPT_NOT_SCORED` without `isCorrect`; after submit, result includes `isCorrect` and per-question scores; error bodies have no keys

### Implementation for User Story 2

- [X] T043 [US2] Ensure GET quiz in `apps/api/src/modules/quiz/adapters/in/rest/quiz.controller.ts` serializes only through `toPublicQuizView` / `publicQuizViewSchema` (never spread Prisma `QuestionOption`)
- [X] T044 [US2] Ensure `http-error.filter.ts` and `ATTEMPT_NOT_SCORED` responses in `apps/api/src/modules/quiz/adapters/in/rest/attempt.controller.ts` omit options/correctness; ignore Bearer on GET quiz

**Checkpoint**: Pre-submit HTTP is key-free. Token mismatch cases still belong to US3.

---

## Phase 5: User Story 3 - Authorize submit and result with a private attempt token (Priority: P1)

**Goal**: Submit and result require the start-attempt Bearer token for that attempt; storage has only the SHA-256 hash; missing/wrong/foreign tokens are `UNAUTHORIZED_ATTEMPT` with no scores or keys.

**Independent Test**: `apps/api/test/e2e/quiz-auth.spec.ts` plus integration hash inspection; logs for the attempt id contain no plaintext token.

### Tests for User Story 3 ⚠️

- [X] T045 [P] [US3] Application tests in `packages/application/src/submit-quiz.spec.ts` and `packages/application/src/get-quiz-result.spec.ts`: hash mismatch → `UNAUTHORIZED_ATTEMPT`; missing attempt → `ATTEMPT_NOT_FOUND`; use cases never receive plaintext
- [X] T046 [P] [US3] Integration test in `apps/api/test/integration/attempt-token.spec.ts`: after start-attempt, `QuizAttempt.publicTokenHash` equals SHA-256 hex of the returned token and the plaintext token column does not exist / is not stored
- [X] T047 [US3] Supertest in `apps/api/test/e2e/quiz-auth.spec.ts`: valid token submit/result succeed; missing, malformed, wrong, and other-attempt tokens → `401` `UNAUTHORIZED_ATTEMPT` with no scores/keys; scored attempt + bad token still 401 (does not return result); two starts on one quiz get distinct tokens/attempts

### Implementation for User Story 3

- [X] T048 [US3] Reject missing/malformed `Authorization` as `UNAUTHORIZED_ATTEMPT` (401) in `apps/api/src/modules/quiz/adapters/in/rest/attempt.controller.ts` before lookup confusion; pass only `tokenHash` into use cases
- [X] T049 [US3] Compare hashes with `timingSafeEqual` in `apps/api/src/modules/quiz/adapters/in/rest/attempt-token.ts` / `SubmitQuizUseCase` / `GetQuizResultUseCase`; foreign attempt token must not authorize this `attemptId`
- [X] T050 [US3] Confirm Nest logger / quiz adapters in `apps/api/src/modules/quiz/` never log `Authorization`, plaintext token, or `publicTokenHash`; add a regression assertion in `apps/api/src/modules/quiz/adapters/in/rest/attempt-token.spec.ts` if logging helpers exist

**Checkpoint**: Attempt access is token-hash based. Ownership of option ids is US4.

---

## Phase 6: User Story 4 - Validate ownership and unique answers (Priority: P1)

**Goal**: Selections must belong to the attempt’s quiz; one stored answer per question; duplicate question rows and foreign option ids fail closed; wrong-but-legal single picks score 0.

**Independent Test**: `apps/api/test/e2e/quiz-ownership.spec.ts` and unique-answer integration: foreign/cross-question ids → `SELECTION_ILLEGAL`, attempt stays `open`; duplicate `questionId` → `SUBMIT_ANSWERS_INVALID`; successful submit has exactly one `AttemptAnswer` per question.

### Tests for User Story 4 ⚠️

- [X] T051 [P] [US4] Application tests in `packages/application/src/submit-quiz.spec.ts`: option from another quiz or another question → `SELECTION_ILLEGAL`; incomplete set → `ATTEMPT_INCOMPLETE`; wrong-but-legal single option scores 0 via `gradeAttempt`
- [X] T052 [P] [US4] Integration test in `apps/api/test/integration/answer-uniqueness.spec.ts`: unique `(attemptId, questionId)` enforced; after success, every `AttemptAnswerSelection.optionId` belongs to that answer’s question
- [X] T053 [US4] Supertest in `apps/api/test/e2e/quiz-ownership.spec.ts`: repeat `questionId` in one body → `SUBMIT_ANSWERS_INVALID`; foreign option id → `SELECTION_ILLEGAL` and attempt remains open with no `weightedScore`; legal incorrect single → `rawScore` 0

### Implementation for User Story 4

- [X] T054 [US4] Map Phase 1 `SELECTION_ILLEGAL` / `ATTEMPT_INCOMPLETE` / `SUBMIT_ANSWERS_INVALID` through `SubmitQuizUseCase` and `http-error.filter.ts` without scoring or writing answers
- [X] T055 [US4] Keep Prisma unique `(attemptId, questionId)` as the persistence backstop in `apps/api/prisma/schema.prisma`; do not upsert a second answer row on first submit

**Checkpoint**: Illegal ownership never stores a score. Duplicate/concurrent submit is US5.

---

## Phase 7: User Story 5 - Finalize scores atomically and treat repeat submits as the same result (Priority: P1)

**Goal**: First success writes selections, per-question scores, weighted score, display fields, scored status and `submittedAt` together. Later submits (same or different answers) return that result. Concurrent submits converge on one stored total. Failed validation leaves the attempt open.

**Independent Test**: `apps/api/test/integration/attempt-finalize.spec.ts` and `apps/api/test/e2e/quiz-idempotency.spec.ts`.

### Tests for User Story 5 ⚠️

- [X] T056 [P] [US5] Application tests in `packages/application/src/submit-quiz.spec.ts`: already `scored` + same answers → original result, `gradeAttempt` not used to overwrite; already `scored` + different answers → payload ignored; incomplete/illegal submit does not call finalize
- [X] T057 [P] [US5] Integration tests in `apps/api/test/integration/attempt-finalize.spec.ts`: after success, answers/selections/`rawScore`/`weightedScore`/`weightedScoreDisplay`/`percentageDisplay`/`status` `scored`/`submittedAt` exist together (no scored row missing parts); failed submit leaves `open` and null weighted score; overlapping two legal submits store exactly one result
- [X] T058 [US5] Supertest in `apps/api/test/e2e/quiz-idempotency.spec.ts`: second submit same answers → identical public result; second submit different answers → original scores/selections unchanged; concurrent submits both HTTP 200 with the same stored total

### Implementation for User Story 5

- [X] T059 [US5] In `packages/application/src/submit-quiz.ts` inside `UnitOfWorkPort.transaction`: if `status === scored`, rebuild `PublicResult` from rows and return without inspecting new answers and without calling `gradeAttempt`
- [X] T060 [US5] Finalize with an update conditioned on `status = open` (zero rows → reload stored result) in `apps/api/src/modules/quiz/adapters/out/prisma/attempt.prisma-repository.ts` / `prisma-unit-of-work.ts`; keep `FOR UPDATE` on the attempt row
- [X] T061 [US5] Abort the transaction on domain/contract failure so the attempt stays `open` in `packages/application/src/submit-quiz.ts`; a later legal submit can still succeed

**Checkpoint**: Idempotent durable submit matches Phase 1 freeze. Playable-quiz mutation is US6.

---

## Phase 8: User Story 6 - Keep playable quizzes immutable (Priority: P2)

**Goal**: Ready quiz prompts, option labels, order and `isCorrect` cannot be changed through the repository; failed create leaves no partial playable quiz; a new attempt on the original fixture still matches original scores.

**Independent Test**: `apps/api/test/integration/quiz-immutability.spec.ts` — repository refuses key updates; failed create has no start-able quiz; second attempt with fixture answers matches first grade.

### Tests for User Story 6 ⚠️

- [X] T062 [P] [US6] Application test in `packages/application/src/create-quiz.spec.ts`: `validateQuiz` / persist failure → transaction aborted, `QuizRepositoryPort.insert` not left half-applied (mock UoW rollback)
- [X] T063 [US6] Integration tests in `apps/api/test/integration/quiz-immutability.spec.ts`: `QuizRepositoryPort` has no update of prompt/label/position/`isCorrect` for `status` `ready` (calling any such helper throws or is absent); create failure leaves zero playable quizzes for that request; new attempt + same fixture answers matches original weighted score

### Implementation for User Story 6

- [X] T064 [US6] Keep `QuizRepositoryPort` / `quiz.prisma-repository.ts` insert+find only; do not add PATCH/PUT quiz routes under `apps/api/src/modules/quiz/adapters/in/rest/`
- [X] T065 [US6] Create-quiz transaction in `packages/application/src/create-quiz.ts` rolls back if fixture output fails `validateQuiz` or snapshot is empty/over 512 KiB so no partial question set can be started

**Checkpoint**: Playable content is immutable. Polish next.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quality commands, hexagonal proof, scope audit, quickstart, README.

- [X] T066 [P] Contract tests for `errorResponseSchema` and new error codes in `packages/contracts/src/error-response.spec.ts` and `packages/contracts/src/error-codes.ts` (codes match [contracts/error-codes.md](./contracts/error-codes.md))
- [X] T067 [P] Jest cases in `packages/contracts/src/create-quiz.spec.ts`: blank topic, `http` URL, count 4 and 9, unknown `strategy` → `CREATE_QUIZ_INVALID`; e2e create invalid body persists nothing playable in `apps/api/test/e2e/quiz-flow.spec.ts`
- [X] T068 Confirm `@ai-quiz/domain` and `@ai-quiz/application` `package.json` still have no Nest/Prisma/Next/React/OpenAI/`ai`/Langfuse; `packages/config/hexagonal.cjs` still forbids those imports
- [X] T069 Scope audit: no remote Markdown fetcher, no OpenAI/Vercel AI SDK quiz adapter, no quiz UI under `apps/web/src/app`, no Langfuse, no production Dockerfiles/GitHub Actions added by this phase; scoring still imported from `@ai-quiz/domain` / `gradeAttempt`
- [X] T070 Default `pnpm test` still passes **without** PostgreSQL; with `docker compose up -d db` and `ai_quiz_test` migrated, run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build` per [quickstart.md](./quickstart.md)
- [X] T071 [P] Extend root `README.md` with Phase 2 `/v1` smoke, `ai_quiz_test`, and `pnpm test:integration` / `pnpm test:e2e`; do not claim Phase 3–7 or live README generation done

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Reuse Phase 0/1 workspace — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (P1)**: After Foundational — MVP happy path
- **US2–US5 (P1)**: After US1 HTTP surface exists (they assert on the same `/v1` resources). US2–US4 touch different test files and can proceed in parallel after US1; US5 hardens `submit-quiz.ts` / Prisma finalize already introduced in US1
- **US6 (P2)**: After US1 create/persist; can overlap US2–US5 (different integration file)
- **Polish**: Depends on US1–US6

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — full create/get/start/submit/result
- **User Story 2 (P1)**: After US1 GET/create/result exist
- **User Story 3 (P1)**: After US1 start/submit/result exist
- **User Story 4 (P1)**: After US1 submit exists
- **User Story 5 (P1)**: After US1 first-submit persist exists (extends `submit-quiz.ts`)
- **User Story 6 (P2)**: After US1 create persist exists

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Use cases before REST adapters
- REST before e2e green
- Story complete before moving to the next sequential story that shares the same production file (`submit-quiz.ts` for US1 then US5)

### Parallel Opportunities

- T003–T008 (scripts, jest configs, stub trees)
- T011–T014 (port files)
- T019–T021 (contract schema files)
- T030–T032 (US1 tests in different packages)
- T035–T036 (get vs start use cases)
- T041 vs T045 vs T051 vs T056 vs T062 (story tests in different files after US1)
- T066 / T071 (docs vs error-schema tests)

---

## Parallel Example: User Story 1 tests

```bash
# After Foundational, different packages:
Task: "Create-quiz contract tests in packages/contracts/src/create-quiz.spec.ts"
Task: "Use-case mocks in packages/application/src/create-quiz.spec.ts"
Task: "Persist integration in apps/api/test/integration/quiz-persist.spec.ts"
```

## Parallel Example: US2 / US3 / US4 tests after US1

```bash
Task: "Key leakage e2e in apps/api/test/e2e/quiz-keys.spec.ts"
Task: "Auth e2e in apps/api/test/e2e/quiz-auth.spec.ts"
Task: "Ownership e2e in apps/api/test/e2e/quiz-ownership.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (persisted REST flow)
4. **STOP and VALIDATE**: `pnpm test:e2e` happy path on `ai_quiz_test` without a model key
5. Continue US2–US6 before claiming the phase done

### Incremental Delivery

1. Setup + Foundational → schema, ports, fixtures, Prisma adapters
2. US1 → create/get/start/submit/result (MVP)
3. US2 → key privacy
4. US3 → token hash authorization
5. US4 → ownership / unique answers
6. US5 → atomic + idempotent + concurrent submit
7. US6 → immutable playable quizzes
8. Polish → quality commands and scope audit

### Parallel Team Strategy

1. Together: Setup + Foundational
2. Together: US1 (shared HTTP module)
3. Then: Developer A US2, B US3, C US4 (separate test files)
4. US5 after US1 submit (shared `submit-quiz.ts`)
5. US6 + polish

---

## Notes

- [P] = different files, no incomplete dependencies
- Do not implement remote Markdown fetch, OpenAI calls, quiz UI, Langfuse, production Dockerfiles, or GitHub Actions
- Second submit with a valid token is success (stored result), not an error code
- Default `pnpm test` must stay Postgres-free; integration/e2e are separate Turbo tasks
- Commit after each task or logical group when implementation is requested
- Stop after this roadmap phase; do not generate Phase 3 fetch/generation tasks here
