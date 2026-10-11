# Data Model: Phase 4 Complete Browser Quiz Experience

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-11

This phase **reuses** Phase 2/3 PostgreSQL entities (source snapshot, quiz, question, option, attempt, answer, selection). It does **not** add tables or migrations.

New state lives in the **browser sitting** only. Authoritative scores remain rows written by `SubmitQuizUseCase`.

## Server entities (unchanged)

See `specs/004-phase-2-persistence-api/data-model.md` and `specs/005-phase-3-markdown-generation/data-model.md`.

The web app never reads Prisma models. It only sees:

| Public resource | Schema | Keys? |
| --------------- | ------ | ----- |
| Create response | `createQuizResponseSchema` | No questions, no keys |
| Quiz view | `publicQuizViewSchema` | No `isCorrect` |
| Start-attempt | `startAttemptResponseSchema` | Token shown **once** to the client |
| Submit/result | `publicResultSchema` | `isCorrect` **after** submit only |
| Errors | `errorResponseSchema` | Code + English message |

## Client entities

### Attempt sitting

One tab session’s play of one quiz. Stored in `sessionStorage` key `ai-quiz.attempt.<quizId>`.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `quizId` | string | Key suffix; must match the route param. |
| `attemptId` | string | From start-attempt. |
| `token` | string | Private Bearer secret. Never copied to the URL, DOM text, or logs. |
| `currentIndex` | int | `0 .. N-1` for an `open` sitting. |
| `selections` | map questionId → optionId[] | Only ids from the public quiz view. |
| `status` | `open` \| `scored` | `scored` after successful submit. |

**Validation**:

- Token present before submit/result calls.
- `single`: `selections[id]` length 1.
- `multiple`: length 1–4, unique ids, all belonging to that question.
- Next/submit in the UI requires a legal current (and, for submit, every) selection.

**Lifecycle**:

```text
(no sitting)
    │  POST /v1/quizzes/:id/attempts
    ▼
  open  ←→  previous/next updates currentIndex + selections
    │  POST /v1/attempts/:id/submit (Bearer)
    ▼
  scored  →  results only; player URL redirects here
```

Refresh of `/quiz/{id}` while `open` restores index and selections. Refresh of results while `scored` reloads the stored API result. Missing sitting on results → unauthorized empty state (no keys). Missing sitting on player → start a **new** attempt (new token).

### Setup draft

In-memory (React Hook Form) only. Not persisted across sittings.

| Field | Rules |
| ----- | ----- |
| `topic` | Trim; 1–200 characters (create-quiz contract). |
| `sourceUrl` | `https` URL with host. |
| `questionCount` | Integer 5–8, default 5. |

`strategy` is not a field; API default `balanced`.

### Generation view model

| Field | Rules |
| ----- | ----- |
| `status` | `idle` \| `generating` \| `failed` |
| `errorCode` | Public error code or `NETWORK` |
| `errorCopy` | Mapped English sentence |

On success, navigate to `/quiz/{id}`; this model is discarded.

### Results view model

Composed in memory from two public resources:

| From quiz view | From result |
| -------------- | ----------- |
| `topic`, `sourceUrl`, `questions[].prompt`, labels | `weightedScoreDisplay`, `percentageDisplay`, `rawScore`, `selectedOptionIds`, `options[].isCorrect` |

**Correct** when `rawScore === 4`; **Incorrect** otherwise. Still list correct option labels so partial multiple-answer scores are visible.

Do not keep `token` on this view model beyond the fetch that loaded it.

## Relationships

```text
Learner sitting 1 -- 1 Quiz (public view)
Learner sitting 1 -- 1 Attempt (id + token)
Attempt (scored) 1 -- 1 Public result
Public result     * -- 1 Public quiz view  (join on question id)
```

Server: Quiz 1 -- * Attempt (unchanged). Each sitting that starts attempt without a stored token creates a **new** server attempt.

## State transitions (UI)

| From | Event | To | Notes |
| ---- | ----- | -- | ----- |
| Setup idle | Invalid submit | Setup idle | Field errors; no POST |
| Setup idle | Valid submit | Generating | Form disabled |
| Generating | Create 201 | Player loading | `push /quiz/{id}` |
| Generating | Create error | Setup failed | Alert + retry |
| Player loading | GET quiz + start attempt | Player open | Write sitting |
| Player loading | Quiz not playable | Unavailable | Return to setup |
| Player open | Next/back/select | Player open | Local only |
| Player open | Submit 200 | Results | Sitting `scored` |
| Player open | Submit network error | Player open | Selections kept |
| Player scored | Open player URL | Results | No re-edit |
| Results | Missing token | Unauthorized | No scores |
| Results | `ATTEMPT_NOT_SCORED` | Not ready | No `isCorrect` |
| Any finished | Create another quiz | Setup idle | New generate |

## Integrity rules

- Pre-submit client state MUST be valid against `publicQuizViewSchema` (`.strict()` rejects `isCorrect`).
- Submit payload MUST pass `parseSubmitAnswersRequest` and include every question id.
- Token MUST NOT appear in `location`, `document.title`, visible text, or application logs.
- Official `weightedScore` is never computed in the browser.
- Closing the tab drops `sessionStorage`; that sitting cannot be resumed. The quiz id in the URL may still start a new attempt.
