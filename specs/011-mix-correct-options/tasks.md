---
description: "Task list for mixing quiz option order so always-first is not a perfect sitting"
---

# Tasks: Mix Correct Option Order

**Input**: Design documents from `/specs/011-mix-correct-options/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. Spec FR-014 / SC-007, Constitution VI, [plan.md](./plan.md) and [quickstart.md](./quickstart.md) require Jest coverage for always-first vs true-key, label/`isCorrect` pairing, order stability, and slot diversity. Write listed tests first and confirm they **fail** before implementation.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US4`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Domain: `packages/domain/src/quiz/`
- Domain barrel: `packages/domain/src/index.ts`
- Application create-quiz: `packages/application/src/quiz/create-quiz.ts`
- Application fixtures: `packages/application/src/testing/quiz-fixture.ts`
- API prompt/fixture: `apps/api/src/quiz/`
- API E2E: `apps/api/test/e2e/quiz/` and `apps/api/test/e2e/support/`
- Follow `.agents/skills/folder-architecture/SKILL.md` — do **not** add `helpers/`, `infrastructure/`, a shuffle package, Prisma migrations, new error codes, new `/v1` routes, or new screens
- Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse, or HTTP clients
- Do **not** use `Math.random()` for mix; do **not** shuffle question order; do **not** change `packages/domain/src/scoring/`
- Do **not** mix on GET, start attempt, or results; persist mixed `position` 0–3 once at create
- Keep `sampleQuiz` in `packages/application/src/testing/quiz-fixture.ts` as a **leading-key** payload (`isCorrect` at slot 0, or slots 0–1 on the multiple)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the domain mix module without changing create-quiz behavior yet. Do not reinitialize Spec Kit or overwrite the Constitution.

- [X] T001 Add `packages/domain/src/quiz/mix-option-order.ts` exporting `mixQuizOptionOrder(quiz: Quiz): Quiz` as an identity stub (return a shallow copy of the same option order) so later tasks have a stable import path
- [X] T002 [P] Export `mixQuizOptionOrder` from `packages/domain/src/index.ts` next to `validateQuiz`

**Checkpoint**: Module exists. Existing `pnpm test` still passes. Create-quiz still persists generated order unchanged.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement `mixQuizOptionOrder` **in isolation** (not wired into create-quiz yet) and switch E2E key mapping from display slot to **label**. **No user story work until this phase is complete.**

- [X] T003 Write failing tests in `packages/domain/src/quiz/mix-option-order.spec.ts` per [contracts/mix-option-order.md](./contracts/mix-option-order.md), [contracts/always-first-sitting.md](./contracts/always-first-sitting.md), and [data-model.md](./data-model.md): (a) canonical **five single-answer** quiz with `isCorrect` only at original slot 0 → after mix, always-first weighted score **< 4** and true-key weighted score **is 4**; (b) each option’s `id`/`label`/`isCorrect` pairing is unchanged (“Mix MUST NOT change it”); (c) same `quiz.id` twice → identical option arrays; (d) correct flags occupy **at least two** distinct display slots; (e) a quiz of 2–3-correct multiples that were all a leading block is not still all a leading block; (f) an all-four-correct multiple still awards full credit to always-first; (g) question `position` order is unchanged; (h) `validateQuiz(mixed)` succeeds; (i) `validateQuiz` still accepts the unmixed leading-key input (mix is **not** a `validateQuiz` invariant). Use `calculateWeightedScore` / `scoreQuestion` from the domain public API. Stub identity mix MUST fail (a), (d), and (e)
- [X] T004 Implement `mixQuizOptionOrder` in `packages/domain/src/quiz/mix-option-order.ts`: seeded 32-bit PRNG (Mulberry32 or equivalent) from `quiz.id` combined with each question’s `id` and `position`; Fisher–Yates per question; rewrite `position` to contiguous `0`–`3`; do not change `id`, `label`, or `isCorrect` for a given identity; no `Math.random()`; then the repair pass in [research.md](./research.md) section 3 (rotate non-exempt questions until always-first is not full credit; slot-diversity swap so the correct-slot set size ≥ 2; break 2–3-correct leading blocks). Return a new `Quiz`. Do **not** call this from `create-quiz.ts` yet
- [X] T005 [P] In `apps/api/src/quiz/fixture/fixture-bank.ts`, export a lookup `isFixtureOptionCorrect(questionPosition: number, label: string): boolean` that uses fixture **wording** plus `FIXTURE_CORRECT` (do not treat display `position` as the key). Do not change `buildFixtureQuestions` prompts
- [X] T006 Update `correctAnswersFromPublicQuiz`, `quizWithFixtureKeys`, and `answersWithWrongFirstSingle` in `apps/api/test/e2e/support/fixture-answers.ts` to map public options to keys by **label** via `isFixtureOptionCorrect`, not `FIXTURE_CORRECT[questionPosition][option.position]`. Default `apps/api/test/e2e/quiz/quiz-flow.spec.ts` MUST still pass on the unmixed fixture bank

**Checkpoint**: Domain mix unit tests pass. Create-quiz still stores generated order. Default E2E still passes with label mapping.

---

## Phase 3: User Story 1 - Always-first no longer yields a perfect score (Priority: P1) 🎯 MVP

**Goal**: Newly created quizzes persist mixed option order. An always-first sitting scores strictly less than the true-key sitting. Canonical all-single leading-key create yields always-first **below 4.00**.

**Independent Test**: Mock generate with a leading-key quiz; inspect the inserted quiz; always-first grade < true-key grade. E2E create → always-first submit is not the honest full score.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T007 [P] [US1] Extend `packages/application/src/quiz/create-quiz.spec.ts`: mock `generate` returns `sampleQuiz('g', 5).questions` (leading-key). After execute, always-first answers on `ports.store.quizzes.get(result.id)!.quiz` (single: `position === 0`; multiple: `position < N` where `N` is the correct count) MUST grade **strictly less** than true-key (`isCorrect` ids) via `gradeAttempt`. Must fail while mix is not wired
- [X] T008 [P] [US1] Add `apps/api/test/e2e/quiz/quiz-option-order.spec.ts`: mocked generation returns a **five single-answer** leading-key payload; `POST /v1/quizzes` succeeds; GET quiz has no `isCorrect`; submit always-first (`position === 0` on every question) yields display/weighted score **below 4**; body has no `sk-`

### Implementation for User Story 1

- [X] T009 [US1] In `packages/application/src/quiz/create-quiz.ts`, after grounding and `validateQuiz` succeed and **before** `insert`, set `quiz.questions` from `mixQuizOptionOrder(quiz).questions` (or replace the quiz object) and `validateQuiz` again; do not mix inside the retry path for failed generation; do not mix on get/start/submit; keep 512 KiB, sufficiency, grounding, and the 3-attempt bound unchanged

**Checkpoint**: Always-first is no longer a perfect sitting on newly created quizzes. True-key pairing and GET stability stories are not required for this MVP demo.

---

## Phase 4: User Story 2 - Real answers still score correctly after mixing (Priority: P1)

**Goal**: Mixing changes display order only. Selecting the actually correct labels still earns the existing per-question scores. Scoring policy files stay untouched.

**Independent Test**: After mix, select correct labels by identity → same raw scores as today (`sampleQuiz` true-key `[4, 2, 4, 4, 4]`). Select a distractor that is now first → that single question scores 0.

### Tests for User Story 2 ⚠️

- [X] T010 [P] [US2] Extend `packages/application/src/quiz/create-quiz.spec.ts`: stored quiz after mocked `sampleQuiz` generate — true-key `gradeAttempt` raw scores remain `[4, 2, 4, 4, 4]`; on the first single-answer question, selecting the option that **is** `isCorrect` (wherever it sits) scores **4**, and selecting a different displayed option scores **0**. Do not assert that `position === 0` is correct
- [X] T011 [P] [US2] Extend `apps/api/test/e2e/quiz/quiz-option-order.spec.ts`: submit true-key option ids mapped **by label** from the leading-key mock (not by display slot) → existing full credit (canonical five singles → weighted **4**); GET quiz JSON still has no `isCorrect`

### Implementation for User Story 2

- [X] T012 [US2] If T010/T011 fail, fix pairing in `packages/domain/src/quiz/mix-option-order.ts` so each `id`/`label` keeps its `isCorrect`. Do **not** edit `packages/domain/src/scoring/scoring-policy.ts` or `packages/domain/src/scoring/weighted-score.ts`

**Checkpoint**: Honest sittings still grade correctly. Always-first from US1 still loses.

---

## Phase 5: User Story 3 - The same quiz always shows the same mixed order (Priority: P1)

**Goal**: Mix is decided once at create. Player, repeat GET, and results show the same four labels in the same `position` sequence. No rematch on load.

**Independent Test**: Two GETs of the same quiz return identical option labels/positions. Results after submit use that same order.

### Tests for User Story 3 ⚠️

- [X] T013 [P] [US3] Extend `packages/application/src/quiz/create-quiz.spec.ts`: after one execute, the stored quiz’s per-question option `id`/`label`/`position` arrays equal a second read of `ports.store.quizzes.get(result.id)!.quiz` (no second mix)
- [X] T014 [P] [US3] Extend `apps/api/test/e2e/quiz/quiz-option-order.spec.ts`: two `GET /v1/quizzes/:id` bodies have the same option `id`/`label`/`position` sequences; after true-key submit, result options appear in that same order (correctness allowed only on the result)

### Implementation for User Story 3

- [X] T015 [US3] Confirm `packages/application/src/quiz/get-quiz.ts`, `packages/application/src/attempt/start-attempt.ts`, and `packages/application/src/attempt/get-quiz-result.ts` do **not** import or call `mixQuizOptionOrder`; mix remains only in `packages/application/src/quiz/create-quiz.ts` immediately before insert

**Checkpoint**: Order is a stored artifact. US1/US2 scores still hold on that frozen order.

---

## Phase 6: User Story 4 - Creators still get a normal playable quiz (Priority: P2)

**Goal**: Valid sources still yield a ready 5–8 question quiz with four unique options. Rejected creates still store nothing playable. Optional prompt hint is not a substitute for mix. No new setup controls.

**Independent Test**: Expanded `SAMPLE_SNAPSHOT` create at count 5 still persists ready; insufficient-source rejects still do not call mix-success persist; default E2E fixture-bank flow still passes.

### Tests for User Story 4 ⚠️

- [X] T016 [P] [US4] In `packages/application/src/quiz/create-quiz.spec.ts`, keep empty/thin `SOURCE_UNUSABLE` cases (`generate` not called, store empty) and assert a successful `SAMPLE_SNAPSHOT` create still persists `status: 'ready'` with 5 questions × 4 unique labels; `validateQuiz` would accept the stored quiz
- [X] T017 [P] [US4] Extend `apps/api/src/quiz/generation/quiz-prompt.spec.ts`: `messages.system` includes a sentence that the model must not list every correct option first (defense in depth only)
- [X] T018 [P] [US4] Confirm default `apps/api/test/e2e/quiz/quiz-flow.spec.ts` still creates, starts, and submits using label-mapped `correctAnswersFromPublicQuiz` after mix is wired

### Implementation for User Story 4

- [X] T019 [US4] Add one system-prompt sentence in `apps/api/src/quiz/generation/quiz-prompt.ts` (`buildQuizMessages`): do not list every correct option first. Keep `<source>` wrapping, injection, uniqueness, and verbatim-excerpt rules. This MUST NOT replace domain mix tests that feed an all-first payload

**Checkpoint**: Happy path and prior-cycle source rejections still work. Mix remains the acceptance mechanism.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quickstart evidence and guardrails across stories.

- [X] T020 Run the command set in [quickstart.md](./quickstart.md) (`pnpm test --filter=@ai-quiz/domain --filter=@ai-quiz/application`, `pnpm test --filter=api`, `pnpm test --filter=web`, `pnpm test:e2e --filter=api`) and fix failures without adding packages, codes, or screens
- [X] T021 [P] Confirm `packages/contracts/src/` public quiz option shape is still `{ id, position, label }` only; no new error codes in `packages/contracts/src/errors/error-codes.ts`; `packages/domain/src/scoring/scoring-policy.ts` and `weighted-score.ts` are unchanged
- [X] T022 Confirm `packages/domain/src/` and `packages/application/src/` still have zero imports of NestJS, `ai`, `@ai-sdk/openai`, Prisma, Langfuse; mix uses no `Math.random()`
- [X] T023 [P] Confirm GET quiz / player tests still omit `isCorrect` (`packages/contracts/src/quiz/public-quiz.spec.ts` and existing `apps/api/test/e2e/quiz/quiz-keys.spec.ts`); no new web screens or copy
- [X] T024 Do **not** mark `roadmap.md` or `implementation-roadmap.md` checkboxes; this cycle is a fairness fix, not a new numbered roadmap phase
- [X] T025 [P] Extend `packages/domain/src/index.spec.ts` so the public API export of `mixQuizOptionOrder` is referenced (identity-preserving mix on a tiny quiz still returns four positions `0`–`3`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User stories (Phase 3–6)**: Depend on Foundational. Prefer P1 order (US1 → US2 → US3) because T009 (wire mix) is the sequencing point for application/E2E. US4 depends on T006 (label mapping) plus T009
- **Polish (Phase 7)**: Depends on US1–US4 complete

### User Story Dependencies

- **User Story 1 (P1) 🎯 MVP**: After Foundational. Wires `mixQuizOptionOrder`. Independent of prompt hint
- **User Story 2 (P1)**: After US1 T009 (stored quiz must already be mixed for create-quiz/E2E true-key tests). Domain pairing is already proven in T003/T004
- **User Story 3 (P1)**: After US1 T009 (freeze/GET tests need mix on persist). Domain same-id stability is already in T003
- **User Story 4 (P2)**: After T006 and T009; prompt sentence (T017/T019) can proceed in parallel with US2/US3 once T009 is done

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Domain mix (Phase 2) before create-quiz wire (US1)
- Label-mapped E2E helpers (T006) before wiring mix (T009) so default `quiz-flow.spec.ts` does not break
- Story complete before moving to next priority

### Parallel Opportunities

- T002 with nothing else after T001
- T005 in parallel with T003/T004 (different files)
- T007 and T008 after Phase 2
- T010 and T011 after T009
- T013 and T014 after T009
- T016, T017, T018 after T009 (T017/T019 also parallelizable with US2/US3)
- T021, T023, T025 in polish

---

## Parallel Example: User Story 1

```bash
# After Phase 2, launch US1 tests together:
Task: "Extend create-quiz.spec.ts always-first < true-key in packages/application/src/quiz/create-quiz.spec.ts"
Task: "Add always-first E2E in apps/api/test/e2e/quiz/quiz-option-order.spec.ts"

# Then implement the wire:
Task: "Call mixQuizOptionOrder before insert in packages/application/src/quiz/create-quiz.ts"
```

---

## Parallel Example: User Stories 2–3 (after T009)

```bash
Task: "True-key gradeAttempt assertions in packages/application/src/quiz/create-quiz.spec.ts"
Task: "True-key E2E by label in apps/api/test/e2e/quiz/quiz-option-order.spec.ts"
Task: "Frozen store read in packages/application/src/quiz/create-quiz.spec.ts"
Task: "Two GET + results order in apps/api/test/e2e/quiz/quiz-option-order.spec.ts"
```

Note: T010 and T013 share `create-quiz.spec.ts`, and T011/T014 share `quiz-option-order.spec.ts` — do **not** edit the same file in parallel. Pair T010 then T013, and T011 then T014, or do US2 fully before US3.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (mix + E2E label mapping)
3. Complete Phase 3: User Story 1 (wire create-quiz)
4. **STOP and VALIDATE**: Always-first sitting loses on a newly created quiz
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → mix works in unit tests; default E2E still green
2. US1 → persisted quizzes defeat always-first (MVP)
3. US2 → true-key scoring proven after mix
4. US3 → order frozen across GET/results
5. US4 → prompt hint + happy path / reject paths unchanged
6. Polish → quickstart command set

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. After T009:
   - Developer A: US2 (true-key) then polish scoring guards
   - Developer B: US3 (stability) — after A finishes `create-quiz.spec.ts` / `quiz-option-order.spec.ts` slices, or B owns E2E while A owns application tests
   - Developer C: US4 prompt + quiz-flow confirmation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec US1–US4
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Suggested MVP: Phases 1–3 (stub, mix + label mapping, wire create-quiz)
- `/speckit-implement` is the next command; this file is not an implementation license
