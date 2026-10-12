# Contract: Mix option order

Create-quiz MUST persist a mixed display order for every newly created ready quiz. Mixing is a product transform, not a generator responsibility.

This cycle does not change `POST /v1/quizzes` request or success shapes, `GET /v1/quizzes/:id` schema, or result schema.

## When

After a generated quiz passes grounding and `validateQuiz`, before `insert`:

```text
candidate (may be leading-key)
  → mixQuizOptionOrder(candidate)
  → validateQuiz(mixed)
  → persist mixed
```

Do not mix on GET, start attempt, submit, or results. Do not mix quizzes that fail create.

## Function

`mixQuizOptionOrder(quiz): Quiz` (pure, `packages/domain`).

- Input: a `validateQuiz`-legal quiz (5–8 questions, four options, contiguous positions).
- Output: a new quiz object with the same question order, same option identities/labels/`isCorrect` pairing, and rewritten option `position` 0–3.
- Seed: derived from `quiz.id` plus each question’s `id` and `position`. Same input → same output. No `Math.random()`.
- Algorithm: seeded Fisher–Yates per question, then the repair pass in [research.md](../research.md) section 3.

## Invariants the result MUST satisfy

1. Correct-label set per question is unchanged.
2. Always-first sitting weighted score **<** true-key weighted score unless every question has all four options correct. Definitions: [always-first-sitting.md](./always-first-sitting.md).
3. Correct flags occupy **at least two** distinct display slots when a non-exempt question exists.
4. Not every 2–3-correct multiple-answer question keeps an unbroken leading correct block.
5. `validateQuiz(mixed)` succeeds.

## Out of contract

- Question shuffle.
- Changing scoring.
- Rewriting rows created before this cycle.
- Adapter-side shuffle or prompt-only order.

## Prompt (optional, insufficient)

Generation system text MAY include one sentence asking not to list every correct option first. Tests MUST still pass when `generate` returns an all-first key.
