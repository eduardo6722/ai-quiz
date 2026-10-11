# Data Model: Phase 3 Secure Markdown Ingestion and OpenAI Quiz Generation

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-10

This phase **reuses** the Phase 2 PostgreSQL models. It fills fields that fixtures left unused (`resolvedUrl` after redirects/normalize, `sourceExcerpt`, `modelId`) and treats the snapshot as **fetched** Markdown instead of canned text. Scoring entities (attempt, answer, selection) are unchanged.

No new tables. No new Prisma migration unless implementation discovers a missing constraint (none expected).

## Entities

### Source snapshot (`SourceDocument`)

Fetched, normalized Markdown attached to a quiz.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Generated on insert. |
| `originalUrl` | string | Client-supplied HTTPS URL (create-quiz). May be a GitHub blob URL. |
| `resolvedUrl` | string | Final URL actually retrieved (raw GitHub after blob rewrite and safe redirects). |
| `contentHash` | string | SHA-256 hex of `contentSnapshot` UTF-8 bytes. Identical snapshots ⇒ identical hash. |
| `title` | string? | Optional first ATX heading after normalize. |
| `fetchedAt` | datetime | Time the snapshot was recorded. |
| `contentSnapshot` | string | Normalized Markdown. Max **512 KiB**. Min **200** characters after normalize. |

**Validation**: empty/whitespace/binary/short → `SOURCE_UNUSABLE`. Oversize during fetch → `SOURCE_TOO_LARGE`. Unsafe destination → `SOURCE_UNSAFE_DESTINATION`. Nothing playable is stored on those failures.

Generation receives at most the first **32,000** characters of this snapshot; storage keeps the full accepted document.

### Quiz

Playable generated set. Happy-path status is `ready`.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Returned from `POST /v1/quizzes`. |
| `sourceDocumentId` | uuid string | FK to snapshot. |
| `topic` | string | Non-empty after trim. |
| `strategy` | string | `balanced` this phase. |
| `status` | `generating` \| `ready` \| `failed` | Successful create → `ready`. Do **not** persist `generating` on the HTTP success path. Prefer **no row** on failure rather than `failed`. |
| `modelId` | string? | Configured OpenAI model id when generation succeeds. **Not** an answer key; omit from GET quiz. |
| `createdAt` | datetime | Insert time. |

**Immutability**: once `ready`, prompts, labels, positions, `isCorrect`, and excerpts MUST NOT change (Phase 2 repository still has insert/find only).

### Question

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | uuid string | Minted in the generation adapter, not supplied by the model. |
| `quizId` | uuid string | FK. |
| `position` | int | `0 .. n-1`, unique per quiz, contiguous. |
| `type` | `single` \| `multiple` | Phase 1. |
| `prompt` | string | Non-empty after trim. |
| `sourceExcerpt` | string? | **Required on the product create path**: contiguous substring of `contentSnapshot`. Optional for fixture-overridden tests. Omit from GET quiz. |

Exactly four unique option labels. Single: exactly one `isCorrect`. Multiple: one to four. Enforced by `validateQuiz` before persist.

Domain `Question` gains optional `sourceExcerpt?: string`. `validateQuiz` does not require it.

### Option (`QuestionOption`)

Unchanged from Phase 2: four positions, unique labels, server-only `isCorrect`. GET quiz omits `isCorrect`.

### Attempt, Answer, Answer selection

Unchanged from Phase 2 (token hash, open/scored, atomic finalize, idempotent resubmit).

## Relationships

Same as Phase 2:

```text
SourceDocument 1 -- * Quiz
Quiz 1 -- 5..8 Question
Question 1 -- 4 QuestionOption
Quiz 1 -- * QuizAttempt
...
```

## Create-quiz lifecycle

```text
parse create body
  --invalid--> CREATE_QUIZ_INVALID (no fetch)

fetch (HTTPS, public IP, blob rewrite, type/size/time)
  --fail--> SOURCE_* (no generate, no ready row)

loop up to 3 generation attempts
  --invalid/un grounded / validateQuiz fail--> retry
  --missing key/model--> GENERATION_UPSTREAM_FAILED (no retry)
  --exhausted--> GENERATION_RETRIES_EXHAUSTED or GENERATION_UPSTREAM_FAILED
  --success--> insert snapshot + ready quiz + questions/options + excerpts + modelId
```

Observers MUST NOT see a `ready` quiz with fewer than 5 valid questions.

## Validation / error summary

| Rule | Code |
| ---- | ---- |
| Create body topic/URL/count/strategy fail Zod | `CREATE_QUIZ_INVALID` |
| Loopback/private/link-local/metadata/http/non-443/userinfo/unsafe redirect | `SOURCE_UNSAFE_DESTINATION` |
| Content-Type not allowed | `SOURCE_UNSUPPORTED_TYPE` |
| Body over 512 KiB | `SOURCE_TOO_LARGE` |
| Fetch exceeds 10s | `SOURCE_TIMEOUT` |
| Empty, binary, or < 200 characters after normalize | `SOURCE_UNUSABLE` |
| DNS failure, non-2xx, too many redirects, connect error | `SOURCE_FETCH_FAILED` |
| Structured output / grounding / `validateQuiz` fail (retryable) | `GENERATION_INVALID` |
| Three failed generation attempts (invalid) | `GENERATION_RETRIES_EXHAUSTED` |
| Provider timeout/error or missing key/model | `GENERATION_UPSTREAM_FAILED` |
| Fixture/playable quiz breaks domain invariants after retries | `QUIZ_INVALID` (should be mapped through retries; not stored) |
| Unknown quiz / not ready / attempt / token | Phase 2 codes unchanged |

## Persistence notes

- Write `modelId` and `sourceExcerpt` on insert (Phase 2 left them null/omitted).
- GET quiz continues to map through `toPublicQuizView` — no `isCorrect`, no excerpt, no `modelId`.
- Checksum is of the **persisted normalized** snapshot.
- Integration tests may still truncate `ai_quiz_test` between cases.

## Out of model this phase

Langfuse traces, a second live README package, quiz UI session state, human user accounts, `generating` polling records, and a second generation strategy.
