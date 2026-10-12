# Research: Mix Correct Option Order

**Feature**: `011-mix-correct-options`  
**Date**: 2026-10-12

Phase 0 research. All Technical Context unknowns are resolved here. No `NEEDS CLARIFICATION` remains.

## 1. Where mixing runs

**Decision**: Pure `mixQuizOptionOrder(quiz: Quiz): Quiz` in `packages/domain/src/quiz/mix-option-order.ts`. `CreateQuizUseCase` calls it **after** grounding and `validateQuiz` succeed, **before** `insert`. GET, start attempt, and results **do not** mix again; they present stored `position` 0–3.

**Rationale**: Spec FR-003/FR-007. Option order is a quiz-entity transform (domain), but only newly created quizzes must mix (application timing). Historical rows stay valid under `validateQuiz`, which must **not** require mixed order. Mocked generation in create-quiz tests proves the product mix even when the port returns all-first keys. The OpenAI adapter keeps a 1:1 map of parsed output so generation tests stay about schema/prompt, not shuffle.

**Alternatives considered**:

- Shuffle in the OpenAI adapter — create-quiz unit tests with a mocked port would never mix; the defect would return if the adapter were replaced.
- Prompt-only (“vary correct positions”) — spec FR-003 forbids depending on the generator; models still list correct options first.
- Mix on every GET — violates FR-007 (unstable order, stored selections vs display disagree).
- Put mix only in application — workable, but the function has no ports or request DTO; domain matches Constitution V and folder architecture (`quiz/` entity).

## 2. Determinism and seed

**Decision**: Seed a tiny 32-bit PRNG (Mulberry32 or equivalent, implemented in-file) from `quiz.id` combined with each question’s `id` and `position`. Fisher–Yates shuffle that question’s four options, then rewrite `position` to `0..3` in the new array order. Do **not** call `Math.random()`. Do **not** change option `id`, `label`, or `isCorrect`.

The stored quiz **is** the source of truth after insert. Repeat views are deterministic because positions are persisted, not because GET re-seeds.

**Rationale**: Spec “deterministically mix” = one frozen order per stored quiz. Seeding makes unit tests repeatable for the same quiz id. Pairing id/label/correctness satisfies FR-002.

**Alternatives considered**:

- Unseeded `Math.random()` — not repeatable in tests; could flaky-pass FR-004.
- Rotate every question by `(index + 1)` — if the generator always puts correct first, every quiz has “correct = (questionNumber) mod 4”, which FR-011 treats as an order-only cue.
- Recompute mix from seed on every read — extra moving parts; persist already has `position`.

## 3. Guaranteeing always-first fails (repair pass)

**Decision**: After the seeded shuffle, apply a **deterministic repair** so the quiz-level rules hold even when shuffle luck would leave a leading-key quiz:

1. **Question repair** — For each question that is not “all four options correct”, if an always-first sitting would still earn that question’s **full existing credit**, rotate the option array left by one slot (rewrite positions) until it would not, at most three times.
2. **Slot diversity (FR-005)** — If every correct flag in the quiz sits in a single display slot, swap on the first question that is not all-four-correct so a correct option occupies a different slot (swap that option with the item two slots away, wrapping 0–3).
3. **Multi leading-block (FR-006)** — If every multiple-answer question with two or three correct options still has those correct options as an unbroken leading block, break the block on the first such question by swapping the last leading correct option with the first trailing distractor.

**Always-first sitting** (spec FR-004, operationalized):

- Single-answer: select only the option whose `position === 0`.
- Multiple-answer: let `N` = number of correct options; select the options with `position < N`.
- Skip using “all four correct” questions as proof that always-first is defeated (mixing cannot change that question’s score).

**Score comparison** (clarifies spec “perfect 4.00”):

Roadmap multiple-answer policy awards one point per correctly selected option, so a quiz that includes a two-correct multiple **never** has true-key weighted score 4.00. The exploit is “always-first equals the honest sitting,” not “always-first equals 4.00 on every quiz shape.”

- **Exploit succeeds** when always-first weighted score **equals** true-key weighted score (selecting every `isCorrect` option, no distractors).
- **Exploit fails** (required) when always-first weighted score is **strictly less** than true-key weighted score, unless every question is all-four-correct.
- **Canonical 4.00 fixture**: five (or more) **single-answer** questions whose generated key is entirely `position === 0`. True-key weighted score is 4.00; after mix, always-first MUST be below 4.00 (SC-001).

**Rationale**: A probabilistic shuffle alone can leave all singles first-correct (`1/4` per question). Spec FR-004/FR-005/FR-006 are MUSTS, so repair is in-product, not a test retry.

**Alternatives considered**:

- Reject generation and retry the model if order is leading-key — wastes a generation attempt; mix is cheaper and certain.
- Force “never first” on every question — creates the opposite cue (FR-011).
- Compare always-first only to 4.00 on mixed-type quizzes — would pass without mixing whenever a two-correct multiple exists.

## 4. Scoring and identities

**Decision**: No changes to `scoreQuestion`, weights, or attempt lifecycle. Grading already keys off option **id** and `isCorrect`. Mix only reorders the array and rewrites `position`. True-key sittings after mix MUST produce the same per-question raw scores as before mix for the same labels.

**Rationale**: Spec FR-008/FR-010. Constitution V: generation (and mix) MUST NOT decide the score.

**Alternatives considered**: Score by slot number — would break the product and is out of spec.

## 5. Prompt hint vs product mix

**Decision**: Product mix is mandatory. A **single** system-prompt sentence MAY ask the model not to list every correct option first. That sentence is **not** the acceptance mechanism and MUST NOT replace domain tests that feed an all-first payload.

**Rationale**: Cheap defense in depth; live models remain unreliable. Spec FR-003.

**Alternatives considered**: Prompt-only — rejected. No prompt change — acceptable; mix alone meets the spec. Keep the one line so live demos are less obviously leading-key before mix.

## 6. Tests and fixture mapping

**Decision**: Colocate unit tests with source. Do not add a fixtures package.

| Layer | Coverage |
| ----- | -------- |
| `packages/domain/src/quiz/mix-option-order.spec.ts` | Same quiz id → same order; labels/`isCorrect` pairing unchanged; leading-key 5× single → always-first score `<` 4.00; true-key still 4.00; ≥2 distinct correct slots; 2–3-correct multiples not all leading-blocks; all-four-correct question still full credit from always-first; question order unchanged. |
| `packages/application/src/quiz/create-quiz.spec.ts` | Mock `generate` returns `sampleQuiz` (leading-key). Inserted quiz is mixed. Always-first answers on the **stored** quiz grade below true-key. True-key `gradeAttempt` still `[4, 2, 4, 4, 4]` on the sample shape. Failed creates still do not insert. |
| `apps/api/test/e2e/support/fixture-answers.ts` | Map public options to keys by **label** using fixture-bank wording, **not** `FIXTURE_CORRECT[question][displayPosition]`. |
| `apps/api/test/e2e/quiz/` | Create via mocked generation with leading-key payload; GET twice → same option order; submit always-first → not equal to true-key score; submit true-key (by label) → existing full credit; GET quiz JSON has no `isCorrect`. |

`sampleQuiz` stays leading-key on purpose so mix tests have a failing-before-fix input. Fixture-bank may already scatter `FIXTURE_CORRECT`; E2E still needs a **leading-key generate mock** for this cycle’s exploit proof, plus label-based mapping so default fixture-bank E2E still submits the right ids after mix.

**Rationale**: Spec FR-013/FR-014 / SC-007. Current `correctAnswersFromPublicQuiz` assumes display position **is** the generated key. After mix that assumption is the bug under test.

**Alternatives considered**: Read keys from PostgreSQL in every E2E — works but couples HTTP tests to persistence internals more than label maps from the same fixture that built the mock. Leave position mapping — default E2E true-key submits would fail after mix.

## 7. Scope that stays unchanged

**Decision**: No Prisma migration, no new ports, no new workspace packages, no scoring/token/SSRF changes, no question shuffle, no historical backfill, no new UI copy or screens, no new error codes.

**Rationale**: Spec exclusions and Constitution VIII. Public option shape stays `{ id, position, label }` before submit.

## 8. Algorithm sketch (implement in domain)

Not copied into tasks as production code; this is the research contract for the function:

1. Copy the quiz; do not mutate the caller’s arrays in place unless tests prefer a fresh object (return a new `Quiz`).
2. For each question in existing order, seeded Fisher–Yates on the four options; set `position` to the new index.
3. Apply question repair, then quiz-level slot-diversity and multi-block repair (section 3).
4. Return the quiz. `validateQuiz` on the result MUST still pass.
