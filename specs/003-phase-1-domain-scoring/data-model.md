# Data Model: Phase 1 Domain Scoring and Public Contracts

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-10

This phase has **no persistence**. Entities are in-memory domain values used by validation, scoring and public mapping. Do not add Prisma models or migrations.

## Entities

### Quiz

Playable set of questions. Source URL is metadata only (not fetched).

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | Non-empty; unique among fixtures in a test. |
| `topic` | string | Non-empty after trim. |
| `sourceUrl` | string | HTTPS URL shape (see contracts). |
| `questions` | Question[] | Length 5–8. Identities unique. Positions unique, contiguous, zero-based in list order. |

**Validation**: `validateQuiz` fails with `QUIZ_INVALID` when any rule breaks.

### Question

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | Non-empty; unique within the quiz. |
| `position` | integer | `0 .. questions.length-1`, matches array order used for weights. |
| `prompt` | string | Non-empty after trim. |
| `type` | `"single"` \| `"multiple"` | Discriminator for scoring and legal selections. |
| `options` | Option[] | Exactly four. Identities unique. Labels unique (case-sensitive, trimmed). Positions 0–3 contiguous. |

**Type-specific correctness**:

- `single`: exactly one option with `isCorrect === true`.
- `multiple`: one to four options with `isCorrect === true`.

### Option (choice)

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | Non-empty; unique within the question. |
| `position` | integer | 0–3. |
| `label` | string | Non-empty after trim; unique within the question. |
| `isCorrect` | boolean | **Server-only.** Present on the domain model. Omitted from the public quiz view. Included on the public result after scoring. |

### Attempt

One in-memory sitting of a quiz.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | Non-empty. |
| `quizId` | string | Must match the quiz being graded. |
| `status` | `"open"` \| `"scored"` | Starts `open`. |
| `result` | ScoredResult \| absent | Present only when `status === "scored"`. Frozen thereafter. |

**Transitions**:

```text
open --gradeAttempt (legal complete answers)--> scored
scored --gradeAttempt (any payload)--> scored   # same frozen result; payload ignored
open --invalid quiz / illegal / incomplete--> open   # error, no result
```

There is no `abandoned` state this phase.

### Answer selection

One question’s chosen options on a submit.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `questionId` | string | Must be a question on the quiz. Each quiz question appears **exactly once** in a complete submit. |
| `selectedOptionIds` | string[] | Unique ids; every id belongs to that question. |

**Legal selection**:

- `single`: exactly one id.
- `multiple`: one or more ids.

Illegal → `SELECTION_ILLEGAL`. Missing any question → `ATTEMPT_INCOMPLETE` (not a score of 0).

### Question score

| Field | Type | Rules |
| ----- | ---- | ----- |
| `questionId` | string | |
| `rawScore` | integer | `0..4` inclusive. |

**Single**: 4 if the one selected option is the correct option, else 0.  
**Multiple (provisional)**: count of selected options that are correct, clamped to `0..4`. Incorrect selections add 0 and subtract 0. Do not rescale a partial correct set to 4.

### Scored result (domain)

| Field | Type | Rules |
| ----- | ---- | ----- |
| `questionScores` | Question score[] | One per quiz question, quiz order. |
| `weightedScore` | number | Unrounded `Σ(raw[i] × 1.1^i) / Σ(1.1^i)`. |
| `weightedScoreDisplay` | number | Half-up two decimals of `weightedScore`. |
| `percentageDisplay` | number | Half-up two decimals of `(weightedScore / 4) * 100`. |
| `optionsWithCorrectness` | per question, the four options including `isCorrect` plus selected ids | Used only after scoring. |

`calculateWeightedScore(scores: number[])` is defined on **any non-empty** ordered score list so the `[4, 2, 0]` fixture can run without a playable quiz.

## Relationships

```text
Quiz 1 -- * Question 1 -- 4 Option
Quiz 1 -- * Attempt
Attempt 1 -- 0..1 ScoredResult
ScoredResult 1 -- * Question score (one per Question)
```

## Validation summary

| Rule | Error |
| ---- | ----- |
| Quiz not 5–8 questions, bad positions, bad option sets, bad type/correct-arity, empty prompt/label | `QUIZ_INVALID` |
| Create-quiz topic/URL/count fail Zod | `CREATE_QUIZ_INVALID` |
| Submit payload shape fail Zod | `SUBMIT_ANSWERS_INVALID` |
| Duplicate / unknown / wrong-arity / cross-question selection | `SELECTION_ILLEGAL` |
| Any question unanswered | `ATTEMPT_INCOMPLETE` |
| Public result mapping while `open` | `ATTEMPT_NOT_SCORED` |

## Out of model this phase

`SourceDocument` snapshots, Prisma tables, attempt tokens/hashes, `startedAt`/`submittedAt` timestamps as persistence columns, and HTTP resources. Timestamps are not required for in-memory freeze.
