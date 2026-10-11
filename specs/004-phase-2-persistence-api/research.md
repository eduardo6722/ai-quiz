# Phase 2 Research

**Feature**: Phase 2 Persistence and Deterministic REST Quiz Flow  
**Date**: 2026-10-10  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution, `roadmap.md`, `implementation-roadmap.md` and the Phase 2 spec bind behavior. Reuse Phase 0 runtime and Phase 1 scoring/contracts; do not re-scaffold or re-grade.

---

## 1. Port placement and use cases

**Decision**: Define ports in `@ai-quiz/domain` and use cases in `@ai-quiz/application`.

Ports:

- `MarkdownSourcePort.fetch(url)` — returns snapshot text, resolved URL, optional title. Phase 2 fixture adapter **does not HTTP-fetch**.
- `QuizGenerationPort.generate({ topic, sourceText, count, strategy })` — returns a Phase 1–valid `Question[]` of length `count`.
- `QuizRepositoryPort` — insert a new quiz graph (source + quiz + questions + options); `findById` returning domain `Quiz` plus persistence metadata (`status`, `sourceDocumentId`, `strategy`).
- `AttemptRepositoryPort` — create open attempt (id, quizId, token hash, startedAt); load by id; finalize scored graph; load scored result parts.
- `UnitOfWorkPort.transaction(fn)` — runs the callback with the same repository ports bound to one transaction.

Use cases (roadmap names): `CreateQuizUseCase`, `GetQuizUseCase`, `StartAttemptUseCase`, `SubmitQuizUseCase`, `GetQuizResultUseCase`.

**Rationale**: Constitution I puts port interfaces in domain and orchestration in application. Each port has a Phase 2 consumer, so they are not unused layers (Phase 1 correctly deferred them). Fixture adapters on the two content ports let Phase 3 replace implementations without changing use cases.

**Alternatives considered**:

- Ports in application — contradicts Constitution I.
- Skip `MarkdownSourcePort` until Phase 3 — Create still needs a snapshot; a one-off fixture in the use case would be replaced later anyway.
- Generic `Repository<T>` — Constitution II forbids extra generic repositories.

---

## 2. Fixture adapters instead of fetch/LLM

**Decision**: Two outbound adapters in `apps/api`:

- `FixedSourceAdapter` implements `MarkdownSourcePort`. Ignores network. Returns canned Markdown, `resolvedUrl = originalUrl` (the requested HTTPS URL), SHA-256 `contentHash` of that text, optional title. MUST NOT call `fetch` or any HTTP client.
- `FixedGenerationAdapter` implements `QuizGenerationPort`. Ignores topic/source text/strategy for content. Returns the first `count` questions (5–8) from an **8-question mixed single/multiple** bank that already satisfies `validateQuiz`. Assigns fresh UUIDs per create so quizzes do not share option identities.

Create persists the snapshot + generated questions in one transaction and sets quiz `status = ready`. If `validateQuiz` fails (should not, if the bank is valid), fail closed and persist nothing playable.

**Rationale**: Spec and Phase 2 checklist require fixed fixtures. Putting canned content behind the same ports Phase 3 will implement keeps hexagonal replaceability.

**Alternatives considered**:

- Hard-code questions inside `CreateQuizUseCase` — couples orchestration to fixture data.
- HTTP-get the requested URL in Phase 2 — excluded; SSRF belongs to Phase 3.
- One combined `QuizFixturePort` — would be thrown away in Phase 3 instead of swapping adapters.

---

## 3. Prisma models, IDs and constraints

**Decision**: Prisma 7 models in `apps/api/prisma/schema.prisma` matching `roadmap.md`: `SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, `AttemptAnswer`, `AttemptAnswerSelection`.

- IDs: `String @id @default(uuid())` (UUID text). Adapters MAY pass explicit UUIDs from `crypto.randomUUID()`.
- Enums: `QuizStatus { generating ready failed }`, `QuestionType { single multiple }`, `AttemptStatus { open scored }`.
- Uniques: `(quizId, position)` on Question; `(questionId, position)` on QuestionOption; `(attemptId, questionId)` on AttemptAnswer; `publicTokenHash` on QuizAttempt; composite id `(answerId, optionId)` on selections.
- FKs: Question → Quiz cascade; Option → Question cascade; Attempt → Quiz restrict (no quiz delete API); Answer → Attempt cascade; Selection → Answer cascade and Option restrict.
- Scores: `AttemptAnswer.rawScore Int`; `QuizAttempt.weightedScore`, `weightedScoreDisplay`, `percentageDisplay` as `Float` (IEEE double, matching Phase 1 `number`).
- `QuestionOption.isCorrect` is persisted and **never** selected in GET-quiz serializers.
- Snapshot cap: reject `contentSnapshot` over **512 KiB** even for fixtures (roadmap size limit).

Happy-path creates never write `generating`. `modelId` stays null this phase.

**Rationale**: Roadmap table and spec FR-010. Float matches unrounded JS numbers used in Phase 1 tests (`6.2 / 3.31`). Cascade on questions/options/answers keeps test teardown simple; restrict on quiz→attempt avoids silently dropping attempts if a future delete appears.

**Alternatives considered**:

- `Decimal` for weighted score — extra mapping, does not match Phase 1 IEEE fixtures.
- CUID — UUID is built-in and enough for the MVP.
- JSON blob for the whole scored result — would skip the required answer/selection tables.

---

## 4. Transactions and idempotent submit

**Decision**: `SubmitQuizUseCase` runs inside `UnitOfWorkPort.transaction`:

1. Load attempt by id. Missing → `ATTEMPT_NOT_FOUND`.
2. Timing-safe compare of provided token hash to `publicTokenHash`. Mismatch → `UNAUTHORIZED_ATTEMPT`.
3. Load the quiz graph (including `isCorrect`). Status not `ready` → `QUIZ_NOT_PLAYABLE`.
4. If attempt `status === scored`, rebuild the Phase 1 public result from stored rows and return it. **Do not** call `gradeAttempt` and **do not** inspect the new answers.
5. If `open`, call existing `gradeAttempt({ quiz, answers, attempt })`. On domain/contract failure, abort the transaction (attempt stays open).
6. Insert answers + selections, set `rawScore` / weighted fields / `submittedAt` / `status = scored` in the same transaction.

Concurrency: finalize with an update conditioned on `status = open`. If that update affects zero rows, reload the scored attempt and return the stored result (the other writer won). Unique `(attemptId, questionId)` is a second line of defense.

Prisma adapter implements `UnitOfWorkPort` with `prisma.$transaction` and interactive transactions so `SELECT …` and the conditional update see the same snapshot. Use a row lock on the attempt (`FOR UPDATE`) inside the transaction.

**Rationale**: Spec FR-011/FR-012 and Constitution (scoring and finalization in one transaction). Conditional status update plus uniqueness avoids double scores without a queue.

**Alternatives considered**:

- Re-score on every submit and overwrite — forbidden by Phase 1 freeze and spec US5.
- Reject a second payload that differs — Phase 1 clarification requires returning the original result.
- Serializable isolation only, no conditional update — harder to map to a single stored result under retries.

---

## 5. Attempt tokens

**Decision**: HTTP adapter owns plaintext.

- Mint: `crypto.randomBytes(32).toString("base64url")` (256-bit).
- Hash: SHA-256 hex (`createHash("sha256")`), stored in `publicTokenHash`.
- Presentation: `Authorization: Bearer <token>` on submit and result. Missing/malformed header → `UNAUTHORIZED_ATTEMPT` (401) without hitting “not found” confusion when the header is absent.
- Start-attempt response is the **only** place the plaintext token appears. Get-quiz does not require a token.
- Compare hashes with `timingSafeEqual`. Never log `Authorization`, the token, or the hash.
- Use cases receive `tokenHash`, not plaintext.

**Rationale**: Spec FR-007/FR-008. SHA-256 is appropriate for high-entropy secrets (not user passwords). Keeping plaintext out of application use-case inputs reduces accidental log leakage. Bearer matches the spec’s informed default.

**Alternatives considered**:

- bcrypt/argon2 — slow and unnecessary for 256-bit random tokens.
- Store plaintext — forbidden.
- Token in query string — leaks via access logs and referrers.

---

## 6. HTTP mapping and Nest surface

**Decision**: No global `/v1` prefix (Phase 0 `/health` and `/ready` stay at the root). Quiz controllers declare full paths.

| Method | Path | Auth | Success body |
| ------ | ---- | ---- | ------------ |
| POST | `/v1/quizzes` | none | `{ id, status: "ready" }` |
| GET | `/v1/quizzes/:quizId` | none | Phase 1 public quiz view |
| POST | `/v1/quizzes/:quizId/attempts` | none | `{ attemptId, token }` |
| POST | `/v1/attempts/:attemptId/submit` | Bearer | Phase 1 public result |
| GET | `/v1/attempts/:attemptId/result` | Bearer | Phase 1 public result |

Parse bodies with existing/extended Zod helpers (no class-validator). A Nest filter maps `{ code, message }` and HTTP status from [error-codes.md](./contracts/error-codes.md). Do not send stack traces, Prisma traces, tokens or keys.

Unknown quiz → `QUIZ_NOT_FOUND` (404). Unknown attempt → `ATTEMPT_NOT_FOUND` (404). Bad/missing token on an existing attempt → `UNAUTHORIZED_ATTEMPT` (401). Token from another attempt → 401. Result while open → `ATTEMPT_NOT_SCORED` (409).

**Rationale**: Roadmap table plus Phase 1 error-code HTTP column. Distinguishing 404 vs 401 matches the spec edge cases; rate-limiting enumeration is Phase 6.

**Alternatives considered**:

- Global prefix `v1` — would move `/health`.
- Cookie session — out of scope; anonymous MVP is the attempt token.

---

## 7. Contract extensions

**Decision**: Keep Phase 1 quiz-view and result schemas (`.strict()`, no keys on the view). Extend create-quiz **request** with optional `strategy` enum `'balanced'` defaulting to `'balanced'`; other values → `CREATE_QUIZ_INVALID`. Add:

- `createQuizResponseSchema` `{ id, status: "ready" | "failed" }` (success path is `ready`).
- `startAttemptResponseSchema` `{ attemptId, token }`.
- `errorResponseSchema` `{ code, message }`.

Public quiz view continues to use `sourceUrl` as the source summary (original requested URL). Do not add `isCorrect`, `status`, or scores to that view this phase (`status` is on create response only).

**Rationale**: Spec FR-015/FR-019. Extending the existing create schema avoids a second create DTO. Keeping the quiz view unchanged preserves Phase 1 tests and key isolation.

**Alternatives considered**:

- Put `strategy` only in persistence with no request field — would ignore the roadmap optional field.
- Add `isCorrect` as optional on the quiz view — easy leak; rejected in Phase 1.

---

## 8. Immutability of playable quizzes

**Decision**: `QuizRepositoryPort` has **insert** and **find** only — no update of prompts, labels, positions or `isCorrect` for a ready quiz. Prisma adapters must not expose those writes. Create is all-or-nothing: validation/persist failure rolls back so no partial playable quiz remains.

There is no PATCH/PUT quiz resource. Direct SQL in an admin tool is outside the product surface; integration tests assert the repository cannot mutate ready keys.

**Rationale**: Spec US6/FR-013. A DB trigger is extra complexity for an MVP with no update API.

**Alternatives considered**:

- Update-in-place of fixture quizzes for “regenerate” — Phase 3 creates new quizzes; it does not rewrite playable ones.
- Triggers — unjustified for Constitution II.

---

## 9. Application errors vs domain errors

**Decision**: Leave Phase 1 `DomainError` codes unchanged (`QUIZ_INVALID`, `SELECTION_ILLEGAL`, `ATTEMPT_INCOMPLETE`, `ATTEMPT_NOT_SCORED`). Add `ApplicationError` in `@ai-quiz/application` for `QUIZ_NOT_FOUND`, `ATTEMPT_NOT_FOUND`, `UNAUTHORIZED_ATTEMPT`, `QUIZ_NOT_PLAYABLE`. Mirror all codes on `@ai-quiz/contracts` `ErrorCodes` for HTTP mapping.

**Rationale**: Not-found and auth are use-case/persistence outcomes, not scoring invariants. Domain stays free of HTTP and storage.

**Alternatives considered**:

- Stuff new codes into `DomainError` — mixes grading with I/O failures.
- Nest `HttpException` thrown from use cases — would import Nest into application.

---

## 10. Tests and Turbo tasks

**Decision**:

- Application: Jest with in-memory/mocked ports (no PostgreSQL).
- `apps/api` default `test`: existing health/env/ready unit tests (no PostgreSQL), unchanged.
- `apps/api` `test:integration`: real PostgreSQL, Prisma repositories, transaction/idempotency/constraints/immutability. Truncate (CASCADE) between cases.
- `apps/api` `test:e2e`: boot `AppModule`, Supertest against `/v1`, real PostgreSQL, fixture adapters (no LLM). Cover the complete flow, key leakage, token auth, ownership, duplicate and concurrent submit.

Test database: same Compose Postgres, database **`ai_quiz_test`**. Global setup creates it if missing and runs migrations. `.env.example` documents `DATABASE_URL` for tests; no new secrets.

Root scripts `test:integration` and `test:e2e` invoke Turbo. In `turbo.json` register those tasks with `cache: false` and `env: ["DATABASE_URL"]` (Turborepo 2.11 configuring-tasks / env hashing; do not cache live-DB results). Default `pnpm test` MUST still pass without Postgres.

**Rationale**: Constitution VI and spec FR-017. Phase 0 promised `pnpm test` without Docker; keep that. Installed Turbo docs: new `tasks` keys must match `package.json` scripts; `env` accounts for `DATABASE_URL`; `cache: false` is appropriate when outputs are not files and the suite mutates a database.

**Alternatives considered**:

- Fold integration into `pnpm test` — would break Phase 0/1 “no Postgres required”.
- Testcontainers — extra dependency; Compose Postgres already exists.
- Vitest — Constitution forbids replacing Jest.

---

## 11. Reconstructing results from rows

**Decision**: Do not store a JSON copy of `PublicResult`. GET result and duplicate submit rebuild it from `QuizAttempt` score fields + `AttemptAnswer` + selections + `QuestionOption.isCorrect` via existing `toPublicResult` after assembling a domain `Attempt` with `status: "scored"` and `result`.

**Rationale**: Roadmap requires normalized answer/selection tables. Reconstruction keeps a single mapper (Phase 1 `map-public.ts`).

**Alternatives considered**:

- Snapshot JSON on the attempt — duplicated truth, can drift from rows.

---

## 12. Dependencies we will not add

**Decision**: Do not add OpenAI, Vercel AI SDK, Langfuse, UUID libraries, bcrypt, class-validator, Playwright, production Dockerfiles, GitHub Actions, or web quiz routes. Do not add `packages/database`. Token and id helpers use `node:crypto` in the API adapter.

**Rationale**: Spec exclusions and Constitution I/II/VII/VIII.

**Alternatives considered**: none in scope.
