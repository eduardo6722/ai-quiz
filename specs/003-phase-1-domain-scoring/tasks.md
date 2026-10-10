---
description: "Task list for Phase 1 domain scoring and public contracts (roadmap Phase 1 only)"
---

# Tasks: Phase 1 Domain Scoring and Public Contracts

**Input**: Design documents from `/specs/003-phase-1-domain-scoring/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 1 — domain, scoring rules and Jest unit tests. Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap Phases 2–7.

**Tests**: Included. Spec FR-019, user stories, Constitution VI, and `quickstart.md` require Jest unit tests in domain/application/contracts. Write listed tests first and confirm they fail before implementation. `pnpm test` MUST NOT require PostgreSQL or a model key.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US6`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Domain: `packages/domain/src/`
- Application: `packages/application/src/`
- Contracts: `packages/contracts/src/`
- Do **not** create `apps/api/src/modules/quiz/`, Prisma product models/migrations, quiz REST, Markdown fetch, AI adapters, or quiz UI

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire existing Phase 0 shells for scoring packages. Do not reinitialize Spec Kit, overwrite the Constitution, or add workspace packages.

- [X] T001 Add runtime dependency `"zod": "^4.1.11"` in `packages/contracts/package.json` (same major as `apps/api`); keep `@ai-quiz/domain` `package.json` free of `zod`, NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, and Langfuse
- [X] T002 Add `"@ai-quiz/contracts": "workspace:*"` to `dependencies` in `packages/application/package.json` (keep existing `@ai-quiz/domain`)
- [X] T003 [P] Create stub modules `packages/domain/src/quiz.ts`, `packages/domain/src/scoring-policy.ts`, `packages/domain/src/weighted-score.ts`, `packages/domain/src/attempt.ts`, and `packages/domain/src/errors.ts` per plan.md (typed placeholders only)
- [X] T004 [P] Create stub modules `packages/application/src/grade-attempt.ts` and `packages/application/src/map-public.ts` per plan.md (typed placeholders only)
- [X] T005 [P] Create stub modules `packages/contracts/src/error-codes.ts`, `packages/contracts/src/create-quiz.ts`, `packages/contracts/src/submit-answers.ts`, `packages/contracts/src/public-quiz.ts`, and `packages/contracts/src/public-result.ts` per plan.md (typed placeholders only)
- [X] T006 Run `pnpm install` and keep `pnpm-lock.yaml` so `@ai-quiz/contracts` resolves `zod`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, error codes and quiz invariant validation used by every story. **No user story work until this phase is complete.**

- [X] T007 Define domain failure `{ code, message }` with codes `QUIZ_INVALID`, `SELECTION_ILLEGAL`, `ATTEMPT_INCOMPLETE`, `ATTEMPT_NOT_SCORED` in `packages/domain/src/errors.ts`
- [X] T008 [P] Export string codes `CREATE_QUIZ_INVALID`, `SUBMIT_ANSWERS_INVALID`, `QUIZ_INVALID`, `SELECTION_ILLEGAL`, `ATTEMPT_INCOMPLETE`, `ATTEMPT_NOT_SCORED` in `packages/contracts/src/error-codes.ts` matching `contracts/error-codes.md`
- [X] T009 Define `Quiz`, `Question` and `Option` in `packages/domain/src/quiz.ts` with fields: Quiz `id` (string, non-empty), `topic` (string, non-empty after trim), `sourceUrl` (string), `questions` (Question[], length 5–8, identities unique, positions unique contiguous zero-based); Question `id` (non-empty, unique within quiz), `position` (integer `0 .. questions.length-1`), `prompt` (non-empty after trim), `type` (`"single"` \| `"multiple"`), `options` (exactly four); Option `id` (non-empty, unique within question), `position` (0–3 contiguous), `label` (non-empty after trim, unique within question, case-sensitive), `isCorrect` (boolean, server-only on the domain model)
- [X] T010 Implement `validateQuiz` in `packages/domain/src/quiz.ts`: fail `QUIZ_INVALID` when count is not 5–8, positions are non-contiguous or colliding, option sets are not four unique ids/labels, prompt/label empty after trim, `single` does not have exactly one `isCorrect === true`, or `multiple` does not have one to four `isCorrect === true`
- [X] T011 Define `Attempt` in `packages/domain/src/attempt.ts` with `id` (non-empty string), `quizId` (must match the quiz being graded), `status` (`"open"` \| `"scored"`), and `result` present only when `status === "scored"`
- [X] T012 Re-export domain public API from `packages/domain/src/index.ts` (prefer real types over the Phase 0 `domainReady` placeholder; keep a smoke export only if `packages/domain/src/index.spec.ts` still requires it)
- [X] T013 Re-export contracts and application public APIs from `packages/contracts/src/index.ts` and `packages/application/src/index.ts` (replace `contractsReady` / `applicationReady` placeholders the same way)

**Checkpoint**: Types and `validateQuiz` exist. Scoring, Zod schemas, mapping and `gradeAttempt` are still stubs. No Prisma quiz models and no `/v1/quizzes`.

---

## Phase 3: User Story 1 - Prove single-answer scoring (Priority: P1) 🎯 MVP

**Goal**: A valid single-answer selection of the correct option scores 4; a valid wrong option scores 0; no database or model.

**Independent Test**: `pnpm --filter @ai-quiz/domain test` — correct single → 4, wrong single → 0, without Compose or OpenAI.

### Tests for User Story 1 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T014 [US1] Jest cases: given a valid `single` question with exactly one correct option, selecting that option only scores 4; selecting a different belonging option scores 0, in `packages/domain/src/scoring-policy.spec.ts`

### Implementation for User Story 1

- [X] T015 [US1] Implement `scoreSingleChoice` in `packages/domain/src/scoring-policy.ts`: award 4 when the selected option is the correct option and 0 when a legal selection is not the correct option; do not import NestJS, Prisma, fetch or model SDKs
- [X] T016 [US1] Export `scoreSingleChoice` from `packages/domain/src/index.ts` and `packages/domain/src/scoring-policy.ts`

**Checkpoint**: Single-answer 4/0 is proven in domain Jest. Multi-answer, weights, contracts and freeze are still later stories.

---

## Phase 4: User Story 2 - Prove provisional multiple-answer scoring (Priority: P1)

**Goal**: One point per correctly selected option, clamped 0–4, no penalty for extra wrong options, no rescaling a partial set to 4; policy isolated and documented as provisional.

**Independent Test**: Domain tests: `k` correct-only selections → score `k`; extra wrong options do not reduce the score; selecting every correct option on a 3-correct question scores 3 not 4. Reviewer can read the exported policy note.

### Tests for User Story 2 ⚠️

- [X] T017 [US2] Jest cases in `packages/domain/src/scoring-policy.spec.ts`: `k` correctly selected options and no others → score `k` bounded to 0–4; extra incorrect selections add 0 and do not subtract; fewer than four correct options with all correct selected is **not** normalized to 4
- [X] T018 [US2] Jest case that exported policy text in `packages/domain/src/scoring-policy.ts` states the multi-answer reading is provisional, the assessment did not specify penalties or normalization, and the function can be replaced without changing weighting

### Implementation for User Story 2

- [X] T019 [US2] Implement isolated `scoreMultipleChoice` in `packages/domain/src/scoring-policy.ts`: one point per correctly selected option, clamp the result to the inclusive range 0–4, add nothing for incorrect selections, subtract nothing for incorrect selections, MUST NOT rescale a partial correct set to 4
- [X] T020 [US2] Export `MULTIPLE_CHOICE_POLICY_NOTE` (or equivalent string) from `packages/domain/src/scoring-policy.ts` documenting the provisional `roadmap.md` reading; export `scoreMultipleChoice` from `packages/domain/src/index.ts`
- [X] T021 [US2] Optional dispatcher `scoreQuestion` in `packages/domain/src/scoring-policy.ts` that switches on `type` `"single"` \| `"multiple"` without mixing the two rubrics into weighting

**Checkpoint**: Multi-answer policy is replaceable and unit-tested. Weighted average still later.

---

## Phase 5: User Story 3 - Prove position-weighted quiz score (Priority: P1)

**Goal**: `weightedScore = Σ(score[i] × 1.1^i) / Σ(1.1^i)`; round half-up to two decimals only for display; isolated `[4, 2, 0]` sample; playable all-correct/all-wrong and index 0/7 use 5–8 question score lists.

**Independent Test**: Domain tests match unrounded `6.2 / 3.31`, display `1.87` / `46.83`; all-correct 5–8 list equals 4; all-wrong equals 0; eight scores use last weight `1.1 ** 7`; swapping two positions changes the total.

### Tests for User Story 3 ⚠️

- [X] T022 [US3] Isolated weighting fixture in `packages/domain/src/weighted-score.spec.ts`: scores `[4, 2, 0]` at positions 0, 1, 2 → weights 1.0, 1.1, 1.21, weighted sum 6.2, weight sum 3.31, unrounded score `6.2 / 3.31` (not a playable 3-question quiz)
- [X] T023 [US3] Display assertions in `packages/domain/src/weighted-score.spec.ts`: that unrounded value rounds half-up to `weightedScoreDisplay` 1.87 and `percentageDisplay` 46.83 (`(weightedScore / 4) * 100` then half-up two decimals)
- [X] T024 [US3] Playable-length lists in `packages/domain/src/weighted-score.spec.ts`: all 4s on length 5 and 8 → 4; all 0s → 0; eight scores so index 7 uses `1.1 ** 7`; swapping two raw scores’ **positions** changes the weighted total; submission order of the array is quiz position

### Implementation for User Story 3

- [X] T025 [US3] Implement `calculateWeightedScore` in `packages/domain/src/weighted-score.ts` as `sum(questionScore[i] × (1.1 ** i)) / sum(1.1 ** i)` for zero-based `i` on a non-empty ordered score list (isolated from playable-quiz size 5–8)
- [X] T026 [US3] Implement `roundForDisplay` using `Math.round(x * 100) / 100` (ordinary half-up for non-negative 0–4 scores) and `toPercentage` as `(weightedScore / 4) * 100` before display rounding in `packages/domain/src/weighted-score.ts`; retain unrounded `weightedScore`; export from `packages/domain/src/index.ts`

**Checkpoint**: Hand-calculated weights and display rounding pass without a database. A 3-question **quiz** is still invalid (US4).

---

## Phase 6: User Story 4 - Reject invalid quizzes and illegal selections (Priority: P1)

**Goal**: Broken quizzes and illegal/incomplete selections fail closed with stable codes; wrong-but-legal single scores 0; mixed legal quizzes can be scored question-by-question.

**Independent Test**: Domain tests reject count 4 and 9, non-four options, duplicate labels/ids, single with 0 or 2+ selections, unknown/duplicate option ids, missing questions (`ATTEMPT_INCOMPLETE` not score 0); legal wrong single still 0.

### Tests for User Story 4 ⚠️

- [X] T027 [P] [US4] `validateQuiz` rejection cases in `packages/domain/src/quiz.spec.ts`: fewer than 5 or more than 8 questions; not exactly four options; duplicate option labels or identities; `single` with several marked-correct options; `multiple` with zero correct options; non-contiguous or colliding positions; empty prompt/label after trim → `QUIZ_INVALID`
- [X] T028 [P] [US4] Selection cases in `packages/domain/src/attempt.spec.ts`: `single` with no option or more than one option → `SELECTION_ILLEGAL` (not score 0); repeated option or option that does not belong to that question → `SELECTION_ILLEGAL`; legal wrong single → accepted for scoring 0; any quiz question without a legal selection → `ATTEMPT_INCOMPLETE` and no weighted score; extra unknown `questionId` → `SELECTION_ILLEGAL`

### Implementation for User Story 4

- [X] T029 [US4] Finish `validateQuiz` edge coverage in `packages/domain/src/quiz.ts` so T027 cases throw/return `QUIZ_INVALID` with `{ code, message }`
- [X] T030 [US4] Implement `applySelections` (or equivalent) in `packages/domain/src/attempt.ts`: legal `single` is exactly one belonging option; legal `multiple` is one or more unique belonging options; duplicates, unknown ids, wrong arity, or options from another question → `SELECTION_ILLEGAL`; an attempt that lacks a legal selection for every quiz question → `ATTEMPT_INCOMPLETE`; unanswered questions MUST NOT be treated as 0 and MUST NOT be dropped so remaining weights are renormalized
- [X] T031 [US4] Mixed-quiz helper or tests in `packages/domain/src/attempt.spec.ts` / `packages/domain/src/scoring-policy.spec.ts`: a valid 5–8 question mix of `single` and `multiple` with a legal selection per question produces per-question scores via `scoreQuestion` then `calculateWeightedScore`

**Checkpoint**: Illegal states never look like a real score. Freeze/idempotency is US6.

---

## Phase 7: User Story 5 - Public contracts hide keys and validate setup inputs (Priority: P1)

**Goal**: Zod create/submit inputs fail closed; public quiz view has no `isCorrect`; public result (after scoring) includes scores and which options were correct.

**Independent Test**: Contracts tests parse valid create (topic, `https` URL, count 5–8 default 5) and reject blank topic, `http` URL, count outside 5–8. Quiz-view schema rejects `isCorrect`. Result schema requires `isCorrect`. Mapping omits keys on the quiz view.

### Tests for User Story 5 ⚠️

- [X] T032 [P] [US5] Create-quiz contract tests in `packages/contracts/src/create-quiz.spec.ts`: non-empty `topic` (trim, min length 1 after trim, max 200), `sourceUrl` URL with scheme `https` and non-empty host (path/query allowed), `questionCount` integer 5–8 default 5 when omitted → success; missing/blank topic, `http` URL, count 4 or 9 → `CREATE_QUIZ_INVALID`
- [X] T033 [P] [US5] Submit-answers contract tests in `packages/contracts/src/submit-answers.spec.ts`: `answers` array length 5–8, unique `questionId`, non-empty `selectedOptionIds` without duplicates in one answer → success; malformed shape, duplicate option ids in one answer, empty ids → `SUBMIT_ANSWERS_INVALID`
- [X] T034 [P] [US5] Public quiz view tests in `packages/contracts/src/public-quiz.spec.ts`: 5–8 questions, four options with `id`, `position`, `label` only; payload with `options[].isCorrect` or scoring fields **fails** (strict schema)
- [X] T035 [P] [US5] Public result tests in `packages/contracts/src/public-result.spec.ts`: requires `weightedScore`, `weightedScoreDisplay`, `percentageDisplay`, per-question `rawScore` 0–4, `selectedOptionIds`, and `options[].isCorrect`

### Implementation for User Story 5

- [X] T036 [US5] Implement `createQuizRequestSchema` in `packages/contracts/src/create-quiz.ts` per `contracts/create-quiz.md` and T032 rules
- [X] T037 [P] [US5] Implement `submitAnswersRequestSchema` in `packages/contracts/src/submit-answers.ts` per `contracts/submit-answers.md` and T033 rules
- [X] T038 [P] [US5] Implement `publicQuizViewSchema` in `packages/contracts/src/public-quiz.ts` per `contracts/public-quiz-view.md` (no `isCorrect`)
- [X] T039 [P] [US5] Implement `publicResultSchema` in `packages/contracts/src/public-result.ts` per `contracts/public-result.md` (includes `isCorrect`)
- [X] T040 [US5] Tests for `toPublicQuizView` / `toPublicResult` in `packages/application/src/map-public.spec.ts`: quiz view never includes correctness flags; `toPublicResult` on `status === "open"` fails `ATTEMPT_NOT_SCORED`; scored mapping includes per-question scores and which options were correct
- [X] T041 [US5] Implement `toPublicQuizView` and `toPublicResult` in `packages/application/src/map-public.ts`; export schemas and mappers from `packages/contracts/src/index.ts` and `packages/application/src/index.ts`

**Checkpoint**: Public shapes match contracts. `gradeAttempt` freeze is US6.

---

## Phase 8: User Story 6 - Freeze a scored attempt (Priority: P2)

**Goal**: `gradeAttempt` scores a complete legal attempt once; any later submit returns the frozen result and ignores a new payload, including different answers.

**Independent Test**: Application tests: first grade produces public result; second call with same answers returns identical scores; second call with different answers still returns the original result and does not re-score.

### Tests for User Story 6 ⚠️

- [X] T042 [US6] Jest cases in `packages/application/src/grade-attempt.spec.ts`: open attempt + complete legal answers → scored result with unrounded weighted score and correctness; already scored + same answers → original result not recalculated; already scored + different answers → new payload ignored, original result returned; incomplete answers → `ATTEMPT_INCOMPLETE` without a result

### Implementation for User Story 6

- [X] T043 [US6] Implement `gradeAttempt({ quiz, answers, attempt? })` in `packages/application/src/grade-attempt.ts`: `validateQuiz`; if `attempt.status === "scored"` return frozen result without inspecting new answers; else require a legal selection for every question, score via domain policy + `calculateWeightedScore`, set `status` `"scored"`, map with `toPublicResult`
- [X] T044 [US6] Export `gradeAttempt` from `packages/application/src/index.ts`; do not add repository ports, Prisma, HTTP, or fetch

**Checkpoint**: In-memory freeze matches FR-020. Persistence/HTTP idempotency remain Phase 2.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quality commands, hexagonal proof, scope audit, quickstart.

- [X] T045 [P] Replace or retarget Phase 0 smoke tests in `packages/domain/src/index.spec.ts`, `packages/application/src/index.spec.ts`, and `packages/contracts/src/index.spec.ts` so they assert real exports (scoring/schemas/`gradeAttempt`) instead of only `*Ready` flags
- [X] T046 Confirm `@ai-quiz/domain` `package.json` still has no `zod` / Nest / Prisma / Next / OpenAI / `ai` / Langfuse; hexagonal ESLint in `packages/config/hexagonal.cjs` still forbids those imports from domain/application
- [X] T047 Scope audit: `apps/api/prisma/schema.prisma` still has **zero** product models; no `apps/api/src/modules/quiz/`; no quiz UI routes under `apps/web/src/app`
- [X] T048 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the repo root without PostgreSQL or model keys per [quickstart.md](./quickstart.md)
- [X] T049 [P] Add a one-paragraph scoring-policy pointer in root `README.md` (provisional multi-answer, no DB/LLM needed for `pnpm --filter @ai-quiz/domain test`) without claiming Phase 2–7 done

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Reuse Phase 0 workspace — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1–US5 (P1)**: Depend on Foundational. US1, US2 and US3 scoring functions are independent of each other (different functions; US1/US2 share `scoring-policy.ts` so sequence those two). US4 uses types + scoring. US5 contracts/mapping can start after Foundational (schemas) and needs a scored attempt fixture for result mapping (can construct a domain result without `gradeAttempt`)
- **US6 (P2)**: Depends on US1–US5 (`gradeAttempt` composes them)
- **Polish**: Depends on US1–US6

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational — `scoreSingleChoice` only
- **User Story 2 (P1)**: After Foundational — same `scoring-policy.ts` as US1; run after US1 to avoid file conflict
- **User Story 3 (P1)**: After Foundational — `weighted-score.ts` only; can run in parallel with US1/US2
- **User Story 4 (P1)**: After Foundational — `quiz.ts` / `attempt.ts`; scoring assertions use US1/US2 functions
- **User Story 5 (P1)**: After Foundational — contracts files parallel; `map-public.ts` after domain types
- **User Story 6 (P2)**: After US1–US5

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Domain functions before application mapping/`gradeAttempt`
- Story complete before moving to the next sequential story that shares files

### Parallel Opportunities

- T003, T004, T005 (stub trees)
- T008 with T007 (different packages)
- T022 / T023 with US1 tests if US2 is not touching `weighted-score.spec.ts`
- T027 / T028 (quiz.spec vs attempt.spec)
- T032–T035 (four contract spec files)
- T037–T039 after T036 or in parallel once T032–T035 exist (different schema files)

---

## Parallel Example: User Story 5

```bash
# After Foundational, launch contract tests together:
Task: "Create-quiz tests in packages/contracts/src/create-quiz.spec.ts"
Task: "Submit-answers tests in packages/contracts/src/submit-answers.spec.ts"
Task: "Public quiz view tests in packages/contracts/src/public-quiz.spec.ts"
Task: "Public result tests in packages/contracts/src/public-result.spec.ts"
```

## Parallel Example: User Story 3 vs User Story 1

```bash
# Different files after Foundational:
Task: "US1 tests in packages/domain/src/scoring-policy.spec.ts"
Task: "US3 tests in packages/domain/src/weighted-score.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (single-answer 4/0)
4. **STOP and VALIDATE**: `pnpm --filter @ai-quiz/domain test` shows 4/0 without Docker
5. Continue remaining P1 stories before US6

### Incremental Delivery

1. Setup + Foundational → types and `validateQuiz`
2. US1 → single-answer scoring (MVP)
3. US2 → provisional multi-answer
4. US3 → weights + display (can overlap US1 file-wise with US3)
5. US4 → reject illegal/incomplete
6. US5 → Zod public contracts and mapping
7. US6 → `gradeAttempt` freeze
8. Polish → `pnpm lint|typecheck|test|build` and scope audit

### Parallel Team Strategy

1. Together: Setup + Foundational
2. Then: Developer A US1→US2, Developer B US3, Developer C US5 schemas
3. US4 after types; US6 last
4. Polish together

---

## Notes

- [P] = different files, no incomplete dependencies
- Do not implement Prisma product models, `/v1/quizzes`, Markdown fetch, AI SDKs, Langfuse, production Dockerfiles, or GitHub Actions
- Do not treat the `[4, 2, 0]` sample as a 3-question playable quiz
- Second `gradeAttempt` is success (frozen result), not an error code
- Commit after each task or logical group when implementation is requested
- Stop after this roadmap phase; do not generate Phase 2 persistence/API tasks here
