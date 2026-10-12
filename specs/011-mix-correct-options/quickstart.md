# Quickstart: Mix Correct Option Order

Validation guide for this cycle. Implementation details live in later `tasks.md`. Contracts: [mix-option-order.md](./contracts/mix-option-order.md), [always-first-sitting.md](./contracts/always-first-sitting.md), [public-quiz-view.md](./contracts/public-quiz-view.md).

## Prerequisites

- Existing local workspace: PostgreSQL via Compose, `pnpm` install, `.env` as today.
- No live model key is required. Default E2E continues to override source/generation ports except where a test supplies a fetch transport.
- Keep `sampleQuiz` as a **leading-key** generated payload (correct options in the first slots) so mix tests have a failing-before-fix input.

## Commands

From the repository root:

```bash
pnpm test --filter=@ai-quiz/domain --filter=@ai-quiz/application
pnpm test --filter=api
pnpm test --filter=web
pnpm test:e2e --filter=api
```

Use the workspace’s usual `DATABASE_URL` for API E2E (`ai_quiz_test`). Do not mark this feature done if only unit tests ran.

## Expected outcomes

### 1. Always-first is not a perfect sitting (P1)

- Domain: canonical 5× single-answer leading-key quiz → after mix, always-first weighted score **< 4**; true-key remains **4**.
- Application: mock `generate` returns `sampleQuiz` questions; stored quiz always-first grade **<** true-key; true-key raw scores stay `[4, 2, 4, 4, 4]`.
- E2E: mocked leading-key generate → create 201; always-first submit is not the honest full score; true-key submit (ids mapped **by label**) still grades as today.

### 2. Keys travel with labels (P1)

- After mix, each label’s `isCorrect` matches the generated key.
- Selecting a label that was correct before mix still earns that question’s existing credit, even if it is no longer first.

### 3. Order is stable (P1)

- Same `quiz.id` into `mixQuizOptionOrder` → same option arrays.
- E2E: two GET quiz responses list the same labels at the same `position`s.
- Results list options in that same order.

### 4. Diversity, not a new cue (P1)

- Correct options occupy at least two distinct display slots on the canonical fixture.
- 2–3-correct multiples are not all an unbroken leading block.

### 5. Unchanged surfaces

- GET quiz JSON has no `isCorrect` before submit.
- No new routes, error codes, or setup copy.
- Failed creates still store nothing playable.
- Scoring weights and multiple-answer policy unchanged.
- Question order unchanged.

### 6. Harness

- `fixture-answers.ts` maps correctness by fixture **label**, not by display `position`.
- Default fixture-bank create/get/start/submit E2E still passes after that mapping.

## Definition of done (this cycle)

FR-014 tests exist and fail if always-first matches true-key, if labels swap correctness, if true-key scoring regresses, or if two reads disagree on option order. No new tables, codes, or screens. `/speckit-tasks` is the next command; this quickstart is not an implementation license.
