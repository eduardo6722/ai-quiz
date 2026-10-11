# Data Model: Phase 2 Persistence and Deterministic REST Quiz Flow

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-10

This phase **persists** the Phase 1 in-memory quiz/attempt values plus source snapshots and attempt-token hashes. Prisma models live in `apps/api`; domain types stay framework-free. Scoring still happens in `@ai-quiz/domain` before rows are written.

## Entities

### Source snapshot (`SourceDocument`)

Fixture (not fetched) copy of source text attached to a quiz.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Generated on insert. |
| `originalUrl` | string | Requested HTTPS URL from create-quiz. |
| `resolvedUrl` | string | Same as `originalUrl` this phase (no redirect/normalize). |
| `contentHash` | string | SHA-256 hex of `contentSnapshot`. |
| `title` | string? | Optional fixture title. |
| `fetchedAt` | datetime | Time the snapshot was recorded (create time). |
| `contentSnapshot` | string | Fixture Markdown/text. Max 512 KiB. |

**Validation**: empty snapshot is rejected; oversized snapshot is rejected. No HTTP is performed.

### Quiz

Playable set of questions. Status on the happy path is `ready`.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Generated on insert. Returned from `POST /v1/quizzes`. |
| `sourceDocumentId` | uuid string | FK to source snapshot. |
| `topic` | string | Non-empty after trim (create-quiz). |
| `strategy` | string | `balanced` this phase (default). |
| `status` | `generating` \| `ready` \| `failed` | Successful create → `ready`. `generating` is unused on the happy path. |
| `modelId` | string? | **null** this phase. |
| `createdAt` | datetime | Insert time. |

Domain mapping: `{ id, topic, sourceUrl: originalUrl, questions }`. Persistence metadata (`status`, `strategy`, `sourceDocumentId`) stays on the application record, not on Phase 1 `Quiz` unless a mapper copies what scoring needs.

**Immutability**: once `status = ready`, prompts, option labels, positions and `isCorrect` MUST NOT change. Repository has no update-keys operation.

### Question

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Unique within the quiz; minted per create. |
| `quizId` | uuid string | FK. |
| `position` | int | `0 .. n-1`, unique per quiz, contiguous. |
| `type` | `single` \| `multiple` | Same as Phase 1. |
| `prompt` | string | Non-empty after trim. |
| `sourceExcerpt` | string? | Optional fixture excerpt. |

Exactly four options. Single: exactly one `isCorrect`. Multiple: one to four `isCorrect`. Enforced by `validateQuiz` before persist, not only by the database.

**Uniqueness**: `(quizId, position)`.

### Option (`QuestionOption`)

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Unique within the question. |
| `questionId` | uuid string | FK. |
| `position` | int | 0–3, unique per question. |
| `label` | string | Non-empty; unique within the question (case-sensitive, trimmed). |
| `isCorrect` | boolean | **Server-only.** Persisted. Omitted from GET quiz. Included on public result after scoring. |

**Uniqueness**: `(questionId, position)`.

### Attempt (`QuizAttempt`)

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Returned as `attemptId`. |
| `quizId` | uuid string | FK to a `ready` quiz. |
| `publicTokenHash` | string | SHA-256 hex of the private token. Unique. **Never** the plaintext token. |
| `status` | `open` \| `scored` | Starts `open`. |
| `startedAt` | datetime | Start-attempt time. |
| `submittedAt` | datetime? | Set only when scored. |
| `weightedScore` | float? | Unrounded 0–4. Set only when scored. |
| `weightedScoreDisplay` | float? | Half-up two decimals. |
| `percentageDisplay` | float? | Half-up two decimals of `(weightedScore / 4) * 100`. |

**Transitions**:

```text
open  --legal complete submit (transaction)--> scored
scored --any later submit with valid token--> scored   # stored result; payload ignored
open  --invalid/illegal/incomplete/unauthorized--> open
```

### Answer (`AttemptAnswer`)

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | |
| `attemptId` | uuid string | FK. |
| `questionId` | uuid string | Must belong to the attempt’s quiz. |
| `rawScore` | int | `0..4`. Written only in the finalize transaction. |

**Uniqueness**: `(attemptId, questionId)` — at most one answer per question.

### Answer selection (`AttemptAnswerSelection`)

| Field | Type | Rules |
| ----- | ---- | ----- |
| `answerId` | uuid string | FK. |
| `optionId` | uuid string | Must belong to that answer’s question. |

Composite identity `(answerId, optionId)`. Duplicate option on one answer is rejected before persist (`SELECTION_ILLEGAL` / contract).

## Relationships

```text
SourceDocument 1 -- * Quiz
Quiz 1 -- 5..8 Question
Question 1 -- 4 QuestionOption
Quiz 1 -- * QuizAttempt
QuizAttempt 1 -- 0..n AttemptAnswer   # 0 while open; n = question count when scored
AttemptAnswer 1 -- 1..4 AttemptAnswerSelection
AttemptAnswer N -- 1 Question
AttemptAnswerSelection N -- 1 QuestionOption
```

## State and ownership rules

- Start-attempt allowed only when the quiz exists and `status = ready`.
- Submit/result: attempt must exist; Bearer token hash must match `publicTokenHash`.
- Selections must reference questions/options of **that** quiz (Phase 1 `applySelections`).
- GET quiz loads questions/options **without** `isCorrect` in the serializer (select-list or map through `toPublicQuizView`).
- GET result / duplicate submit reconstruct `PublicResult` from scored attempt rows + option correctness.

## Validation / error summary

| Rule | Code |
| ---- | ---- |
| Create body topic/URL/count/strategy fail Zod | `CREATE_QUIZ_INVALID` |
| Fixture quiz fails `validateQuiz` | `QUIZ_INVALID` (no playable row) |
| Unknown quiz id | `QUIZ_NOT_FOUND` |
| Quiz not `ready` | `QUIZ_NOT_PLAYABLE` |
| Unknown attempt id | `ATTEMPT_NOT_FOUND` |
| Missing/wrong/foreign token | `UNAUTHORIZED_ATTEMPT` |
| Submit body fail Zod | `SUBMIT_ANSWERS_INVALID` |
| Foreign/duplicate/wrong-arity ids | `SELECTION_ILLEGAL` |
| Missing question in submit | `ATTEMPT_INCOMPLETE` |
| Result while `open` | `ATTEMPT_NOT_SCORED` |

**Not an error**: second submit on `scored` with a valid token. Return the stored result.

## Persistence notes (Prisma)

- First product migration creates all seven models, enums and uniques.
- Integration tests use database `ai_quiz_test` and `TRUNCATE … CASCADE` between cases.
- Serializers for GET quiz MUST NOT read `isCorrect` into the response object (even if the repository loaded it for scoring). Prefer mapping through `toPublicQuizView`.

## Out of model this phase

Remote fetch metadata beyond the fixture snapshot, LLM `modelId` usage, Langfuse traces, human user accounts, and UI session state.
