# Data Model: Mix Correct Option Order

**Feature**: `011-mix-correct-options`  
**Date**: 2026-10-12

No new persisted entities and no migration. This cycle **reorders** existing options on create and stores the new `position` values. PostgreSQL tables, checksums, and attempt rows stay as in Phases 2–3.

## Existing entities (storage unchanged)

### Option (`QuestionOption`)

| Field | Meaning this cycle |
| ----- | ------------------ |
| `id` | Stable identity. Mix MUST NOT change it. |
| `label` | Wording shown to the learner. Mix MUST NOT change it. |
| `isCorrect` | Server-only answer-key flag. Mix MUST NOT change it for a given `id`/`label`. |
| `position` | Display slot `0`–`3`. **This is what mix rewrites.** After create, this is the frozen order for play and results. |

Exactly four options per question. Unique ids and labels within a question. Contiguous positions 0–3 after mix.

### Question

Unchanged: `id`, `position` (quiz order — **not** mixed), `prompt`, `type` (`single` \| `multiple`), optional `sourceExcerpt`, four options.

### Quiz

Playable set of 5–8 questions, status `ready` on success.

**This cycle**: a newly inserted ready quiz MUST already have mixed option positions. Reads return those positions as stored. Quizzes that already exist in storage are not rewritten.

### Attempt / answers / selections

Unchanged. Selections refer to option **ids**. Scoring uses `isCorrect` on those ids, not `position`.

## Derived value objects (not persisted)

### Mixed option order

The first-to-fourth sequence of a question’s options after `mixQuizOptionOrder`.

| Field | Meaning |
| ----- | ------- |
| `quizId` | Seed material; also the stored quiz identity |
| `questionId` | Combined into the per-question PRNG seed |
| `slots` | Four `(id, label, isCorrect)` tuples in display order |

**Validation after mix**:

- Same four identities and labels as before mix.
- Same `isCorrect` per identity.
- Positions unique, contiguous, `0`–`3`.
- Question order unchanged.

### Always-first sitting

A synthetic submission used in tests and in the mix repair check. Not stored.

| Question type | Selected slots |
| ------------- | -------------- |
| `single` | `{ position: 0 }` only |
| `multiple` | all options with `position < N`, `N` = count of `isCorrect === true` |

**Exempt question**: all four options `isCorrect`. Always-first and true-key both earn full credit; mix MAY still reorder.

**Exploit**: always-first weighted score equals true-key weighted score (every `isCorrect` selected, no distractors), on a quiz that has at least one non-exempt question.

**Required after mix**: always-first weighted score **<** true-key weighted score when any non-exempt question exists.

### True-key sitting

Select every option with `isCorrect === true` (by identity), regardless of `position`. Per-question scores MUST match existing scoring rules.

### Correct-slot set

The set of display `position` values that hold at least one `isCorrect` option in the quiz.

**Validation**: size ≥ 2 on a newly created quiz that has at least one non-exempt question (spec FR-005).

## State transitions

```text
fetch + sufficiency OK
  → generate (≤ 3 attempts)
      → invalid / ungrounded / duplicate prompts
          → retry or existing generation failure (no ready quiz)
      → valid grounded quiz (keys may all be leading-slot)
          → mixQuizOptionOrder (seeded shuffle + repair)
          → validateQuiz
          → persist ready quiz with mixed positions
              → GET / start / results reuse stored positions (no rematch)
```

Failed leftover rows remain not startable (`QUIZ_NOT_PLAYABLE`) as today.

## Validation rules (summary)

- Mix does not change which labels are correct.
- Mix does not change question order or question count.
- Newly created ready quizzes MUST fail the always-first exploit (see Always-first sitting).
- Newly created ready quizzes MUST place correct options in ≥ 2 distinct slots when a non-exempt question exists.
- Multiple-answer questions with 2–3 correct options MUST NOT all keep an unbroken leading correct block.
- Pre-submit public option objects still omit `isCorrect`.
- `validateQuiz` continues to accept any legal key positions so historical unmixed quizzes remain loadable.
- No new tables, statuses, or error codes.
