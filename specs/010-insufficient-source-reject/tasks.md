---
description: "Task list for rejecting insufficient Markdown sources and duplicate-padded quizzes"
---

# Tasks: Reject Insufficient Markdown Sources

**Input**: Design documents from `/specs/010-insufficient-source-reject/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. Spec FR-013 / SC-007, Constitution VI, [plan.md](./plan.md) and [quickstart.md](./quickstart.md) require Jest coverage for empty, limited-information, one-section-at-8, duplicate prompts, and rich count 5/8. Write listed tests first and confirm they **fail** before implementation.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US4`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Domain: `packages/domain/src/quiz/`
- Application: `packages/application/src/quiz/`
- Application fixtures: `packages/application/src/testing/quiz-fixture.ts`
- API source/generation/fixture: `apps/api/src/quiz/`
- API E2E: `apps/api/test/e2e/quiz/`
- Web copy: `apps/web/src/features/quiz/errors/`
- Follow `.agents/skills/folder-architecture/SKILL.md` — do **not** add `helpers/`, `infrastructure/`, a fixtures package, Prisma migrations, new error codes, new `/v1` routes, or new screens
- Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse, or HTTP clients
- Do **not** auto-reduce `questionCount`; do **not** require unique `sourceExcerpt` values
- Copy-only UI change: follow `.agents/skills/design-system/SKILL.md` only if a visual layout change appears (it should not)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the application helper module without changing create-quiz behavior yet. Do not reinitialize Spec Kit or overwrite the Constitution.

- [X] T001 Add `packages/application/src/quiz/source-sufficiency.ts` exporting `countUniqueClaims(text: string): number` and `assertSourceSufficient(text: string, questionCount: number): void` as stubs (`countUniqueClaims` may return `0`; `assertSourceSufficient` may no-op) so later tasks have a stable import path
- [X] T002 [P] Export `assertSourceSufficient` and `countUniqueClaims` from `packages/application/src/index.ts` next to `assertGrounded`

**Checkpoint**: Module exists. Existing `pnpm test` still passes. Create-quiz behavior is unchanged.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Expand happy-path snapshots so they have **≥ 8** unique keepable claims, and implement the claim-unit helper **in isolation** (not wired into create-quiz yet). **No user story work until this phase is complete.**

- [X] T003 Expand `SAMPLE_SNAPSHOT` in `packages/application/src/testing/quiz-fixture.ts` to at least **eight** distinct keepable sentences (`wordCount >= 4` and `charCount >= 24` each after NFKC/trim); keep `SAMPLE_EXCERPT` (`"Ports are interfaces the core depends on"`) as a contiguous substring so `packages/application/src/quiz/grounding.spec.ts` still passes
- [X] T004 [P] Expand `FIXTURE_SNAPSHOT` in `apps/api/src/quiz/fixture/fixture-bank.ts` to at least **eight** distinct keepable sentences; keep `FIXTURE_EXCERPT` as a contiguous substring; do not change `buildFixtureQuestions` prompts or shared excerpts
- [X] T005 [P] Expand `EXPRESS_MARKDOWN` and `NEST_MARKDOWN` in `apps/api/test/e2e/support/two-source-fixtures.ts` to at least **eight** distinct keepable sentences each (do not rely on `.repeat(2)` of the same paragraph); keep `EXPRESS_EXCERPT` and `NEST_EXCERPT` as substrings
- [X] T006 Write failing tests in `packages/application/src/quiz/source-sufficiency.spec.ts` per [contracts/source-sufficiency.md](./contracts/source-sufficiency.md) and [data-model.md](./data-model.md): empty and whitespace-only → `uniqueClaimCount = 0`; heading-only `# Notes` → `0`; `<!-- chrome -->` only → `0`; repeated identical sentence of any length → `1`; canonical one-section body → `1`; six distinct keepable sentences → `6`; expanded `SAMPLE_SNAPSHOT` → `>= 8`; `assertSourceSufficient(text, n)` throws `ApplicationError` `SOURCE_UNUSABLE` when `uniqueClaimCount < n` and does not throw when `uniqueClaimCount >= n`
- [X] T007 Implement `countUniqueClaims` and `assertSourceSufficient` in `packages/application/src/quiz/source-sufficiency.ts`: drop ATX heading lines (`/^#{1,6}\s/`); drop empty lines; split on `.`/`?`/`!` followed by whitespace or end, treating `- `/`* ` list items as units; normalize NFKC, trim, collapse whitespace, `toLocaleLowerCase('en-US')`; keep units with `wordCount >= 4` and `charCount >= 24`; unique by `normalizedKey`; throw `SOURCE_UNUSABLE` when `uniqueClaimCount < questionCount`. Do **not** call this from `create-quiz.ts` yet

**Checkpoint**: Helper unit tests pass. Create-quiz still uses the old length check. Default E2E/create tests still pass on expanded fixtures.

---

## Phase 3: User Story 1 - Reject empty Markdown (Priority: P1) 🎯 MVP

**Goal**: Empty and whitespace-only Markdown fail as `SOURCE_UNUSABLE` before generation, nothing playable is stored, and setup copy says the source does not have enough information.

**Independent Test**: Create against empty and whitespace-only snapshots; `generate` is not called; HTTP 422 `SOURCE_UNUSABLE`; learner copy is the new sentence; zero ready quizzes.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [P] [US1] Update `apps/web/src/features/quiz/errors/error-copy.spec.ts` so `SOURCE_UNUSABLE` expects **That source does not have enough information to generate a quiz.** (must fail against current copy)
- [X] T009 [P] [US1] Extend `packages/application/src/quiz/create-quiz.spec.ts`: snapshot `""` and `"   \n\t  "` throw `SOURCE_UNUSABLE`, `generation.generate` is not called, and `ports.store.quizzes.size` is `0` (keep the existing whitespace case; add the empty-string case if missing)
- [X] T010 [P] [US1] Extend `apps/api/test/e2e/quiz/quiz-source-errors.spec.ts`: fetch `text/plain` body `""` (and whitespace-only) → **422** `{ "code": "SOURCE_UNUSABLE" }`, body has no `sk-` / keys, and `testPrisma().quiz.count({ where: { status: "ready" } })` is `0`

### Implementation for User Story 1

- [X] T011 [US1] Set `SOURCE_UNUSABLE` in `apps/web/src/features/quiz/errors/error-copy.ts` to **That source does not have enough information to generate a quiz.**; do not change other codes; do not add a new screen
- [X] T012 [US1] In `packages/application/src/quiz/create-quiz.ts` preprocessing, replace the `MIN_USABLE_CHARS` length check with `assertSourceSufficient(snapshot.contentSnapshot, request.questionCount)` **before** `generation.generate`; do **not** catch/retry `SOURCE_UNUSABLE` in the generation retry loop; keep the 512 KiB and 32,000-character window checks
- [X] T013 [US1] Confirm `packages/application/src/quiz/create-quiz.spec.ts` still rejects `'a'.repeat(199)` as `SOURCE_UNUSABLE` with `generate` not called (one blob is not `wordCount >= 4`)

**Checkpoint**: Empty/whitespace create-quiz is refused before generation. Setup copy is updated. Limited-information and uniqueness stories are not required for this MVP demo.

---

## Phase 4: User Story 2 - Reject limited-information Markdown (Priority: P1)

**Goal**: Heading-only, comments-only, and repeated-sentence Markdown fail as insufficient even when the file is long. Character count alone is not enough. Adapter no longer uses a 200-character floor.

**Independent Test**: Heading-only, `<!-- chrome -->` only, and a long repeated sentence all return `SOURCE_UNUSABLE` with `generate` not called and zero ready quizzes.

### Tests for User Story 2 ⚠️

- [X] T014 [P] [US2] Add cases in `packages/application/src/quiz/create-quiz.spec.ts`: heading-only `# Notes\n`; comments-only `<!-- badge chrome only -->`; repeated-sentence body from [contracts/source-sufficiency.md](./contracts/source-sufficiency.md) — each throws `SOURCE_UNUSABLE`, `generate` not called, store empty
- [X] T015 [P] [US2] Replace the 199-vs-200 assertion in `apps/api/src/quiz/source/normalize-markdown.spec.ts` with: empty-after-normalize / comments-stripped-empty is unusable at the adapter; `# Notes` alone **normalizes** to non-empty text (application, not adapter, rejects it); `MIN_USABLE_CHARS` is `1`
- [X] T016 [P] [US2] Add E2E in `apps/api/test/e2e/quiz/quiz-source-errors.spec.ts`: `text/plain` body that is the repeated-sentence fixture (length well above 200) → **422** `SOURCE_UNUSABLE` and zero ready quizzes

### Implementation for User Story 2

- [X] T017 [US2] If T014 fails after T012, extend heading-drop / comment-empty / dedupe in `packages/application/src/quiz/source-sufficiency.ts` until those create-quiz cases pass; do not add a character-length floor as the sufficiency definition
- [X] T018 [US2] Set `MIN_USABLE_CHARS` to `1` in `apps/api/src/quiz/source/normalize-markdown.ts` and keep binary/NUL/`decodeUtf8` → `SOURCE_UNUSABLE`; `https-markdown-source.adapter.ts` continues to reject `normalized.text.length < MIN_USABLE_CHARS` as empty-after-normalize only. Do this **after** T012 so heading-only cannot reach the model

**Checkpoint**: Long repeated sentences and heading-only sources fail closed. Adapter empty check is empty-only.

---

## Phase 5: User Story 3 - Do not pad thin sources with duplicate questions (Priority: P1)

**Goal**: One short section at count **8** is `SOURCE_UNUSABLE` (count is never lowered). Duplicate prompts after generation are `QUIZ_INVALID` / `GENERATION_INVALID`, retried at most 3 times, then `GENERATION_RETRIES_EXHAUSTED`, never stored as ready.

**Independent Test**: Canonical one-section fixture + `questionCount: 8` → `SOURCE_UNUSABLE`, generate not called. Mocked duplicate prompts → exhausted generation error, zero ready quizzes. `validateQuiz` rejects case/space duplicate prompts.

### Tests for User Story 3 ⚠️

- [X] T019 [P] [US3] Extend `packages/domain/src/quiz/quiz.spec.ts`: two prompts equal, equal after extra spaces, or equal after letter-case difference throw `QUIZ_INVALID`; two different prompts still pass
- [X] T020 [P] [US3] Extend `packages/application/src/quiz/create-quiz.spec.ts`: canonical one-section fixture at `questionCount: 8` → `SOURCE_UNUSABLE`, `generate` not called, store empty; a **six**-claim body at count `8` → `SOURCE_UNUSABLE` and `generate` not called; the same six-claim body at count `5` → `generate` **is** called
- [X] T021 [US3] Extend `packages/application/src/quiz/create-quiz.spec.ts`: mocked `generate` returns a `validateQuiz`-shaped quiz whose two prompts match after trim/case-fold → `GENERATION_RETRIES_EXHAUSTED` (or `GENERATION_INVALID` if mapped with no retries left), `generate` called **3** times, store empty (same file as T020 — run after T020)
- [X] T022 [P] [US3] Extend `apps/api/src/quiz/generation/quiz-prompt.spec.ts`: `messages.system` requires each question to ask a different fact and not repeat or rephrase the same question
- [X] T023 [P] [US3] Add E2E in `apps/api/test/e2e/quiz/quiz-source-errors.spec.ts`: one-section body + `questionCount: 8` → **422** `SOURCE_UNUSABLE`, zero ready quizzes
- [X] T024 [P] [US3] Add E2E in `apps/api/test/e2e/quiz/quiz-generation-errors.spec.ts`: generation port returns duplicate prompts → **422** `GENERATION_RETRIES_EXHAUSTED`, zero ready quizzes, no `sk-` in the body

### Implementation for User Story 3

- [X] T025 [US3] In `packages/domain/src/quiz/quiz.ts` `validateQuiz`, reject duplicate prompts using trim + `toLocaleLowerCase('en-US')` with `DomainError` `QUIZ_INVALID`; do not require unique `sourceExcerpt`
- [X] T026 [US3] Confirm `packages/application/src/quiz/create-quiz.ts` still maps `DomainError` `QUIZ_INVALID` to `GENERATION_INVALID` inside the existing 3-attempt loop and does **not** map `SOURCE_UNUSABLE` into that retry path; do not persist on uniqueness failure
- [X] T027 [US3] Add the uniqueness instruction to `apps/api/src/quiz/generation/quiz-prompt.ts` (`buildQuizMessages` system text): each question must ask a different fact; do not repeat or rephrase the same question. Keep `<source>` wrapping and existing injection/verbatim-excerpt rules

**Checkpoint**: Thin one-section + 8 is refused before generate. Duplicate prompts cannot become a ready quiz.

---

## Phase 6: User Story 4 - Keep rich sources working (Priority: P2)

**Goal**: Multi-section Markdown with ≥ 8 unique claims still creates a ready quiz at count 5 and count 8 with unique prompts. This cycle must not become a blunt length filter.

**Independent Test**: Expanded `SAMPLE_SNAPSHOT` / fixture bank at count 5 and 8 persist a ready quiz of that length; prompts unique after trim/case-fold; default E2E create/get still succeeds.

### Tests for User Story 4 ⚠️

- [X] T028 [P] [US4] In `packages/application/src/quiz/create-quiz.spec.ts`, assert count `5` and count `8` against expanded `SAMPLE_SNAPSHOT` persist `ready` quizzes of that length whose prompts are unique after trim + `toLocaleLowerCase('en-US')` and do **not** throw `SOURCE_UNUSABLE`
- [X] T029 [P] [US4] Confirm default `apps/api/test/e2e/quiz/quiz-flow.spec.ts` (fixture source/generation) still creates a ready quiz; if it fails, fix only `apps/api/src/quiz/fixture/fixture-bank.ts` snapshot text — do **not** weaken `uniqueClaimCount >= questionCount`

### Implementation for User Story 4

- [X] T030 [US4] If T028 fails, add more **distinct** keepable sentences to `packages/application/src/testing/quiz-fixture.ts` (and matching `FIXTURE_SNAPSHOT` if needed) without collapsing uniqueness rules or lowering requested count

**Checkpoint**: Rich sources at 5 and 8 still work. Thin-source rejections from US1–US3 still hold.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quickstart evidence and guardrails across stories.

- [X] T031 Run the command set in [quickstart.md](./quickstart.md) (`pnpm test --filter=@ai-quiz/domain --filter=@ai-quiz/application`, `pnpm test --filter=api`, `pnpm test --filter=web`, `pnpm test:e2e --filter=api`) and fix failures without adding packages, codes, or screens
- [X] T032 [P] Confirm `packages/contracts/src/errors/error-codes.ts` has **no** new code; `SOURCE_UNUSABLE` / `GENERATION_INVALID` / `GENERATION_RETRIES_EXHAUSTED` HTTP mapping in `apps/api/src/platform/http/http-error.filter.ts` is unchanged
- [X] T033 Confirm `packages/domain/src/` and `packages/application/src/` still have zero imports of NestJS, `ai`, `@ai-sdk/openai`, Prisma, Langfuse; `packages/domain/src/scoring/` is untouched
- [X] T034 [P] Grep learner copy: `apps/web/src/features/quiz/errors/error-copy.ts` is the only product UI string change; messages contain no tokens, hashes, or `sk-`
- [X] T035 Do **not** mark `roadmap.md` or `implementation-roadmap.md` checkboxes; this cycle is a quality gate, not a new numbered roadmap phase

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User stories (Phase 3–6)**: Depend on Foundational. Prefer P1 order (US1 → US2 → US3) because T012 (wire helper) and T018 (drop 200-char floor) are sequencing points. US4 depends on expanded fixtures (Phase 2) plus the wired helper (US1)
- **Polish (Phase 7)**: Depends on US1–US4 complete

### User Story Dependencies

- **User Story 1 (P1) 🎯 MVP**: After Foundational. Wires `assertSourceSufficient`. No dependency on uniqueness
- **User Story 2 (P1)**: After US1 T012 (helper must be wired before dropping the adapter 200-character floor)
- **User Story 3 (P1)**: After Foundational (and practically after T012 so count-relative create-quiz tests hit the helper). Domain uniqueness is independent of US2
- **User Story 4 (P2)**: After Phase 2 fixture expansion and US1 wiring; verifies happy path still works

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Helper before create-quiz wiring
- Application gate before removing the adapter 200-character floor
- Domain uniqueness before relying on create-quiz duplicate-prompt E2E
- Story complete before the next priority when files overlap (`create-quiz.ts`, `create-quiz.spec.ts`, `quiz-source-errors.spec.ts`)

### Parallel Opportunities

- T002 with T001 once the stub file exists
- T004 and T005 with T003 (three fixture files)
- US1 tests T008, T009, T010 in parallel
- US2 tests T014, T015, T016 in parallel
- US3 tests T019–T024 in parallel (six files)
- US4 tests T028 and T029 in parallel
- T032 and T034 in polish

---

## Parallel Example: User Story 1

```bash
# Launch US1 tests together (must fail first):
Task: "error-copy.spec.ts SOURCE_UNUSABLE sentence in apps/web/src/features/quiz/errors/error-copy.spec.ts"
Task: "create-quiz.spec.ts empty/whitespace in packages/application/src/quiz/create-quiz.spec.ts"
Task: "E2E empty body in apps/api/test/e2e/quiz/quiz-source-errors.spec.ts"

# Then implement (same-file conflicts — sequential):
Task: "error-copy.ts new sentence"
Task: "create-quiz.ts assertSourceSufficient before generate"
```

## Parallel Example: User Story 3

```bash
Task: "quiz.spec.ts duplicate prompts in packages/domain/src/quiz/quiz.spec.ts"
Task: "create-quiz.spec.ts one-section count 8 and six-claim 5 vs 8"
Task: "create-quiz.spec.ts mocked duplicate prompts"
Task: "quiz-prompt.spec.ts uniqueness instruction"
Task: "E2E one-section count 8 in quiz-source-errors.spec.ts"
Task: "E2E duplicate prompts in quiz-generation-errors.spec.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (helper + fixture expansion)
3. Complete Phase 3: User Story 1 (wire helper, empty/whitespace, setup copy)
4. **STOP and VALIDATE**: empty Markdown never calls generate

### Incremental Delivery

1. Setup + Foundational → helper ready, rich fixtures ≥ 8 claims
2. US1 → empty/whitespace refused + new copy (MVP)
3. US2 → heading-only / repeated sentence refused; drop 200-char floor
4. US3 → one-section-at-8 refused; duplicate prompts cannot persist
5. US4 → count 5 and 8 still succeed on rich sources
6. Polish → quickstart commands green

### Parallel Team Strategy

- After Foundational: copy (T008/T011) can proceed in parallel with domain uniqueness (T019/T025)
- `create-quiz.ts` / `create-quiz.spec.ts` should stay on one owner (US1 → US2 → US3 → US4)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec user stories US1–US4
- Verify tests fail before implementing
- Commit after each task or logical group only if the user asks
- Stop at any checkpoint to validate the story independently
- Avoid weakening `uniqueClaimCount >= questionCount` to make a fixture pass — add distinct sentences instead
