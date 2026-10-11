---
description: "Task list for Phase 4 complete browser quiz experience (roadmap Phase 4 only)"
---

# Tasks: Phase 4 Complete Browser Quiz Experience

**Input**: Design documents from `/specs/006-phase-4-web-experience/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 4 — Complete web experience. Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap Phases 5–7.

**Tests**: Included. Spec FR-017, user stories, Constitution VI, and `quickstart.md` require Jest + React Testing Library (jsdom, mocked API/`fetch`, no PostgreSQL, no `OPENAI_API_KEY`). Write listed tests first and confirm they fail before implementation. Phone/desktop acceptance is a reviewer pass in [quickstart.md](./quickstart.md), not Playwright.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US8`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Shared UI: `packages/ui/src/`
- Web app: `apps/web/src/`
- Quiz feature: `apps/web/src/features/quiz/`
- Routes: `apps/web/src/app/`
- API CORS/env: `apps/api/src/`
- Do **not** add Langfuse, production Dockerfiles, GitHub Actions, Playwright, new `/v1` routes, or scoring in the browser
- Do **not** import `@ai-quiz/domain` or `@ai-quiz/application` from `apps/web`
- Backend diffs limited to CORS / `WEB_ORIGIN` ([contracts/browser-api.md](./contracts/browser-api.md))

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directories, web dependencies, env docs, and placeholder modules. Do not reinitialize Spec Kit or overwrite the Constitution.

- [X] T001 Create directories `apps/web/src/features/quiz/` and `apps/web/src/app/quiz/[quizId]/results/` per plan.md
- [X] T002 Add `react-hook-form`, `@hookform/resolvers`, and `lucide-react` to `apps/web/package.json` with `pnpm --filter @ai-quiz/web add react-hook-form @hookform/resolvers lucide-react`; add `@testing-library/user-event` with `pnpm --filter @ai-quiz/web add -D @testing-library/user-event`; do **not** add them to `packages/domain/package.json` or `packages/application/package.json`; do not add Radix, Playwright, or Langfuse
- [X] T003 [P] Document `WEB_ORIGIN=http://localhost:3000` in `.env.example` as optional (API default matches); keep `NEXT_PUBLIC_API_URL=http://localhost:3001`; do not add public model keys to the web env; do not commit `.env`
- [X] T004 [P] Add typed placeholders `apps/web/src/features/quiz/api-client.ts`, `attempt-session.ts`, `error-copy.ts`, `setup-form.tsx`, `generating-status.tsx`, `quiz-player.tsx`, `quiz-results.tsx` and `packages/ui/src/components/input.tsx`, `label.tsx`, `form-field.tsx`, `radio-group.tsx`, `checkbox.tsx`, `progress.tsx`, `alert.tsx`, `badge.tsx`, `skeleton.tsx`, and `apps/api/src/infrastructure/cors-options.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: CORS blocker fix, sitting/session helper, API client, error copy, and shared primitives used by every story. **No user story work until this phase is complete.**

- [X] T005 Write failing unit tests in `apps/api/src/infrastructure/cors-options.spec.ts` asserting `origin` is the exact `WEB_ORIGIN` string (default `http://localhost:3000`), `methods` are `GET`/`POST`/`OPTIONS`, `allowedHeaders` are `Content-Type`/`Authorization`, `credentials` is `false`, and origin is not `*`
- [X] T006 Implement `corsOptionsForOrigin` in `apps/api/src/infrastructure/cors-options.ts` to match [contracts/browser-api.md](./contracts/browser-api.md); no quiz resources
- [X] T007 Parse optional `WEB_ORIGIN` in `apps/api/src/infrastructure/env.ts` as an absolute URL defaulting to `http://localhost:3000`; invalid value MUST fail closed; omitted MUST use the default; API boot MUST still succeed without `OPENAI_API_KEY`; never log the origin as a secret dump; extend `apps/api/test/env.spec.ts`
- [X] T008 Call `app.enableCors(corsOptionsForOrigin(env.WEB_ORIGIN))` in `apps/api/src/main.ts` after `NestFactory.create`; do not change controllers or scoring
- [X] T009 [P] Write failing tests in `apps/web/src/features/quiz/error-copy.spec.ts` for every code in [contracts/error-copy.md](./contracts/error-copy.md) including client `NETWORK` and unknown/`INTERNAL_ERROR` fallback; mapped copy MUST NOT contain tokens, hashes, or `sk-`
- [X] T010 Implement `learnerMessageForCode` in `apps/web/src/features/quiz/error-copy.ts` with the exact learner sentences from [contracts/error-copy.md](./contracts/error-copy.md); unknown codes MUST use `Something went wrong. Try again.`
- [X] T011 [P] Write failing tests in `apps/web/src/features/quiz/attempt-session.spec.ts`: key is `ai-quiz.attempt.<quizId>`; JSON fields are `attemptId`, `token`, `currentIndex`, `selections` (questionId → optionId[]), `status` `open` \| `scored`; helpers MUST NOT put `token` in a path, query, or hash; missing sitting returns `null`
- [X] T012 Implement sitting load/save/clear in `apps/web/src/features/quiz/attempt-session.ts` using `sessionStorage` only (not `localStorage` or cookies) per [contracts/attempt-session.md](./contracts/attempt-session.md) and [data-model.md](./data-model.md)
- [X] T013 [P] Write failing tests in `apps/web/src/features/quiz/api-client.spec.ts` with mocked `fetch`: `credentials: "omit"`; POST JSON; Bearer header **only** on submit and result; success bodies parsed with `createQuizResponseSchema`, `publicQuizViewSchema`, `startAttemptResponseSchema`, `publicResultSchema`; errors parsed with `errorResponseSchema`; `publicQuizViewSchema` parse MUST reject `isCorrect`
- [X] T014 Implement `createQuiz`, `getQuiz`, `startAttempt`, `submitAttempt`, `getResult` in `apps/web/src/features/quiz/api-client.ts` against `env.NEXT_PUBLIC_API_URL` from `apps/web/src/env.ts`; throw `{ code, message }` on non-OK; do not compute `weightedScore`; do not import domain scoring
- [X] T015 [P] Implement `Input` in `packages/ui/src/components/input.tsx`: `min-h-11 rounded-xl`, `border-input`, `focus-visible:ring-ring`, supports `aria-invalid` ([contracts/ui-primitives.md](./contracts/ui-primitives.md))
- [X] T016 [P] Implement `Label` in `packages/ui/src/components/label.tsx`: `text-sm font-medium text-foreground`; usage requires `htmlFor`
- [X] T017 Implement `FormField` in `packages/ui/src/components/form-field.tsx`: label + control + optional error with `role="alert"` and `aria-describedby`
- [X] T018 [P] Implement native `RadioGroup` / item in `packages/ui/src/components/radio-group.tsx`: labeled option row, entire row clickable, min 44px (`min-h-11` or `min-h-14`), selected `border-primary bg-mint` **not** success/danger
- [X] T019 [P] Implement native `Checkbox` in `packages/ui/src/components/checkbox.tsx` with the same option-row rules as T018
- [X] T020 [P] Implement `Progress` in `packages/ui/src/components/progress.tsx`: `role="progressbar"`, track `bg-sage`; value is **step** completeness, not quiz score
- [X] T021 [P] Implement `Alert` in `packages/ui/src/components/alert.tsx` (default + `destructive`); never used to display answer keys
- [X] T022 [P] Implement `Badge` in `packages/ui/src/components/badge.tsx` for `Correct` / `Incorrect` text companions
- [X] T023 [P] Implement `Skeleton` in `packages/ui/src/components/skeleton.tsx` with `bg-sage`; no flashing animation required
- [X] T024 Export the new primitives from `packages/ui/src/index.ts`; reuse existing `Button`, `Card`, `PageShell`, `cn`; `pnpm typecheck` still passes

**Checkpoint**: CORS helper and env default exist. Sitting, api-client, error copy, and UI primitives compile. Product pages still show the Phase 0 placeholder until US1. Default `pnpm test` still passes except new failing story tests not yet added.

---

## Phase 3: User Story 1 - Complete a quiz from setup through persisted results (Priority: P1) 🎯 MVP

**Goal**: Learner can generate (mocked or live API), play, submit, and see the **persisted** 0–4 weighted score, optional percentage, per-question feedback, source URL, and “Create another quiz”.

**Independent Test**: RTL with a mocked api-client: valid setup → generating → player with five four-option questions → submit → results show `weightedScoreDisplay` from the mock result (e.g. `1.87` / `4.00`), not a client `1.1 ** index` calculation; `Create another quiz` returns to `/`.

### Tests for User Story 1 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T025 [P] [US1] RTL tests in `apps/web/src/features/quiz/setup-form.test.tsx`: English CTA `Generate quiz`; valid topic (`trim` min length 1, max 200), `https` URL, `questionCount` integer 5–8 defaulting to 5 calls `createQuiz`; omitted count still sends 5; no `strategy` or API-key field
- [X] T026 [P] [US1] RTL tests in `apps/web/src/features/quiz/quiz-player.test.tsx`: mocked public quiz view of length 5 (and a case of 8); four options each; answering all and submitting calls `submitAttempt` with every `questionId`; quiz fixture MUST be valid `publicQuizViewSchema` (no `isCorrect`)
- [X] T027 [P] [US1] RTL tests in `apps/web/src/features/quiz/quiz-results.test.tsx`: headline uses `weightedScoreDisplay` `/ 4.00` from mocked `publicResultSchema`; `percentageDisplay` is visible and secondary; `Create another quiz` goes to `/`; do **not** assert a browser-computed weighted average
- [X] T028 [US1] Replace Phase 0 assertions in `apps/web/src/app/page.test.tsx`: heading is the product setup (includes italic `what you know`); primary action is `Generate quiz`; MUST NOT require `View API health`

### Implementation for User Story 1

- [X] T029 [US1] Implement setup form in `apps/web/src/features/quiz/setup-form.tsx` with React Hook Form + `zodResolver` on `createQuizRequestSchema` (coerce `questionCount` to int 5–8 if the select yields a string); `noValidate`; labels `Topic`, `Markdown / README URL`, `Number of questions`; CTA `Generate quiz`; omit `strategy` (API default `balanced`)
- [X] T030 [P] [US1] Implement `GeneratingStatus` in `apps/web/src/features/quiz/generating-status.tsx` with `Skeleton` rows and accessible status `Preparing your questions…` or `Reading source…` per [contracts/screens.md](./contracts/screens.md)
- [X] T031 [US1] Replace the Phase 0 placeholder in `apps/web/src/app/page.tsx` with `PageShell` + setup form; on create `201` `{ id, status: "ready" }` navigate to `/quiz/{id}`; show generating state while POST is in flight; disable the primary action until success or failure
- [X] T032 [US1] Implement `QuizPlayer` in `apps/web/src/features/quiz/quiz-player.tsx`: `GET` quiz then `startAttempt` unless an `open` sitting exists; one question at a time in stored order; four option labels; submit `parseSubmitAnswersRequest` covering **every** question; on `200` save `status: "scored"` and go to `/quiz/{quizId}/results`
- [X] T033 [US1] Add route `apps/web/src/app/quiz/[quizId]/page.tsx` rendering `QuizPlayer`
- [X] T034 [US1] Implement `QuizResults` in `apps/web/src/features/quiz/quiz-results.tsx`: load result with Bearer token + quiz view without token; join on `questions[].id`; show `weightedScoreDisplay` as `{score} out of 4`; caption `Weighted quiz score`; `percentageDisplay`; per-question **Correct** when `rawScore === 4` else **Incorrect**; `sourceUrl` as a link; CTA `Create another quiz` → `/`
- [X] T035 [US1] Add route `apps/web/src/app/quiz/[quizId]/results/page.tsx` rendering `QuizResults`

**Checkpoint**: Mocked happy path works in Jest. Live generate still needs a model key (environment blocker, not fixtures). Validation edge cases, prev/next polish, token refresh, and mapped errors may still fail.

---

## Phase 4: User Story 2 - Validate setup before generation (Priority: P1)

**Goal**: Empty/whitespace topic, non-`https` or malformed URL, and count outside 5–8 are blocked in the form with field-associated English errors and **no** `createQuiz` call. Valid submit disables Generate until the request finishes.

**Independent Test**: RTL: empty topic → topic error, fetch not called; `http://example.com/README.md` → URL error; select only offers 5–8; valid values call `createQuiz` once.

### Tests for User Story 2 ⚠️

- [X] T036 [P] [US2] Extend `apps/web/src/features/quiz/setup-form.test.tsx`: whitespace-only topic shows an English alert on the topic field; non-URL and `http` URL show an error on the URL field; `questionCount` control has options 5–8 only; invalid submit MUST NOT call `createQuiz`; each field has a visible label; no `strategy` / `OPENAI` / API-key inputs

### Implementation for User Story 2

- [X] T037 [US2] Wire `aria-invalid` / `aria-describedby` and `role="alert"` errors in `apps/web/src/features/quiz/setup-form.tsx` via `FormField`; keep topic max 200; URL field wraps long values (`break-all` or equivalent); primary button `disabled` while generating; `min-h-11` / full width on small screens per [contracts/screens.md](./contracts/screens.md)

**Checkpoint**: Invalid setup never hits the API. US1 happy path still passes.

---

## Phase 5: User Story 3 - Answer single and multiple questions with progress and navigation (Priority: P1)

**Goal**: One question at a time; progress `Question {n} of {N}` (1-based n); single = exclusive radio + `Select one answer.`; multiple = checkboxes + `Select all that apply.`; Back/Next keep `selections`; Next blocked without a legal current selection; last complete question uses `Submit answers`.

**Independent Test**: Mixed single/multiple fixture: select, next, back, assert same selection; Next disabled with zero selections; multiple allows 1–4 unique option ids; last step CTA is Submit.

### Tests for User Story 3 ⚠️

- [X] T038 [P] [US3] Extend `apps/web/src/features/quiz/quiz-player.test.tsx`: progress text `Question 1 of 6` (and updates); `single` uses radio semantics (choosing B unchecks A); `multiple` keeps two checks; copy `Select one answer.` / `Select all that apply.`; Next not available until a legal selection (`single`: exactly one id; `multiple`: one to four unique ids); Back from question 2 restores question 1 selection; last question primary is `Submit answers`; optional `Progress` is step completeness not a score

### Implementation for User Story 3

- [X] T039 [US3] Implement previous/next, `currentIndex` `0 .. N-1`, and selection rules in `apps/web/src/features/quiz/quiz-player.tsx` + persist them on the sitting in `apps/web/src/features/quiz/attempt-session.ts`; use `RadioGroup` vs `Checkbox` from `@ai-quiz/ui`; show `Progress` plus the `Question n of N` text; Back hidden/disabled on question 1

**Checkpoint**: Player navigation matches [contracts/screens.md](./contracts/screens.md). US1 submit still sends a complete legal payload.

---

## Phase 6: User Story 4 - Show the persisted weighted result with feedback and source (Priority: P1)

**Goal**: Results lead with stored 0–4 display score; percentage is secondary; each question shows Correct/Incorrect with text (and icon), selected options, and which options were correct; original Markdown URL is a usable link; refresh shows the same stored display fields.

**Independent Test**: Mock result `weightedScoreDisplay: 1.87`, `percentageDisplay: 46.83`; assert those strings; Correct/Incorrect not color-only; source link `href` equals quiz view `sourceUrl`.

### Tests for User Story 4 ⚠️

- [X] T040 [P] [US4] Extend `apps/web/src/features/quiz/quiz-results.test.tsx`: accessible name includes `out of 4`; caption `Weighted quiz score`; percentage in parentheses; `rawScore === 4` → `Correct`, otherwise `Incorrect` (including partial multi `rawScore` 1–3); selected vs `isCorrect` options visible; source link uses original `sourceUrl`; primary score MUST NOT be “X of N correct”

### Implementation for User Story 4

- [X] T041 [US4] Complete join UI in `apps/web/src/features/quiz/quiz-results.tsx` (prompt from quiz view, scores from result); `Badge` + lucide Check/X; cream results hero per design-system recipes; `Create another quiz` remains the primary CTA

**Checkpoint**: Results match [data-model.md](./data-model.md) composition rules. Official numbers still come from the API body.

---

## Phase 7: User Story 5 - Keep the attempt token private across refresh and result access (Priority: P1)

**Goal**: Token stays in `sessionStorage`. Same-sitting player refresh resumes `open` attempt and selections. Same-sitting results refresh reloads stored result. Scored sitting on the player URL redirects to results. Missing token on results → English cannot-show state, no scores/keys. Token never in the address bar.

**Independent Test**: Sitting helpers + RTL: after score, player route redirects; results without sitting show mapped `UNAUTHORIZED_ATTEMPT` copy; `window.location` / links never include `token=`.

### Tests for User Story 5 ⚠️

- [X] T042 [P] [US5] Tests in `apps/web/src/features/quiz/attempt-session.spec.ts` and `apps/web/src/features/quiz/quiz-player.test.tsx` / `quiz-results.test.tsx`: existing `open` sitting skips `startAttempt`; `scored` sitting on player navigates to `/quiz/{quizId}/results`; results with no sitting render [error-copy.md](./contracts/error-copy.md) `UNAUTHORIZED_ATTEMPT` sentence and **zero** `isCorrect`/scores; no `token` in rendered `href`s or `location.search`

### Implementation for User Story 5

- [X] T043 [US5] Enforce [contracts/attempt-session.md](./contracts/attempt-session.md) rules 1–10 in `apps/web/src/app/quiz/[quizId]/page.tsx`, `apps/web/src/app/quiz/[quizId]/results/page.tsx`, `apps/web/src/features/quiz/quiz-player.tsx`, and `apps/web/src/features/quiz/quiz-results.tsx`; Bearer only inside `api-client.ts`; after submit set `status: "scored"` before navigation

**Checkpoint**: Refresh/result access follows the private token lifecycle. US1–US4 still pass.

---

## Phase 8: User Story 6 - Never reveal answer keys before submission (Priority: P1)

**Goal**: Setup, generating, and player never expose `isCorrect`, raw scores, or weighted scores. Selected ≠ correct. Errors contain no keys/tokens. Results may show `isCorrect` only after submit.

**Independent Test**: Player `document.body` and mocked GET quiz have no `isCorrect`; generated error alert has no `sk-` or option correctness; results after mock submit do show `isCorrect`.

### Tests for User Story 6 ⚠️

- [X] T044 [P] [US6] Assertions in `apps/web/src/features/quiz/quiz-player.test.tsx` and `apps/web/src/features/quiz/setup-form.test.tsx`: player HTML has no `isCorrect`, `rawScore`, or `weightedScore`; selected option is not labeled Correct/Incorrect; generating/error `Alert` text has no answer keys, tokens, or API keys
- [X] T045 [US6] Keep `apps/web/src/features/quiz/api-client.spec.ts` rejecting a quiz payload that includes `options[].isCorrect`; GET create/start responses MUST NOT be treated as if they contained questions/keys

### Implementation for User Story 6

- [X] T046 [US6] Audit `apps/web/src/features/quiz/quiz-player.tsx`, `generating-status.tsx`, `setup-form.tsx`, and `error-copy.ts` so pre-submit UI uses only `publicQuizViewSchema` fields; option selected state stays `border-primary bg-mint` without `success`/`destructive`

**Checkpoint**: Pre-submit key leakage tests pass. Post-submit results still show correctness.

---

## Phase 9: User Story 7 - Recover from loading, generation and submission failures (Priority: P1)

**Goal**: Generating skeleton + status; mapped English errors for source/generation codes; Try again restores setup; submit network failure keeps selections; unknown/unplayable quiz and result-before-submit show empty states without keys.

**Independent Test**: Mock `SOURCE_UNUSABLE` / `GENERATION_UPSTREAM_FAILED` → mapped copy + Try again; mock failed `fetch` → `NETWORK` copy; player submit reject keeps checks; results `ATTEMPT_NOT_SCORED` has no `isCorrect`.

### Tests for User Story 7 ⚠️

- [X] T047 [P] [US7] Extend `apps/web/src/features/quiz/setup-form.test.tsx`: in-flight generate shows `GeneratingStatus` and disables CTA; `SOURCE_UNSAFE_DESTINATION`, `SOURCE_TIMEOUT`, `GENERATION_RETRIES_EXHAUSTED`, `GENERATION_UPSTREAM_FAILED` show the mapped sentences from [contracts/error-copy.md](./contracts/error-copy.md) and `Try again`; rejected `fetch` uses `Could not reach the quiz service. Try again.`
- [X] T048 [P] [US7] Extend `apps/web/src/features/quiz/quiz-player.test.tsx`: `QUIZ_NOT_FOUND` / `QUIZ_NOT_PLAYABLE` show `This quiz is not available.` and a setup link, no options; submit `NETWORK` keeps selections so the learner can retry
- [X] T049 [US7] Extend `apps/web/src/features/quiz/quiz-results.test.tsx`: `ATTEMPT_NOT_SCORED` shows `Submit your answers to see the result.` with **no** `isCorrect`; `UNAUTHORIZED_ATTEMPT` remains key-free

### Implementation for User Story 7

- [X] T050 [US7] Map API/network failures through `learnerMessageForCode` in `apps/web/src/features/quiz/setup-form.tsx`, `quiz-player.tsx`, and `quiz-results.tsx` using `Alert`; restore form values on generate failure; do not double-submit generate; do not leave a spinner with no retry

**Checkpoint**: Failure paths are recoverable and secret-free. Happy path still works.

---

## Phase 10: User Story 8 - Use a calm, accessible English interface on phone and desktop (Priority: P2)

**Goal**: Four screens share the light-green design system: serif titles, 44px targets, labeled controls, visible focus, reduced motion, 320px wrap, single-column player, English copy only.

**Independent Test**: RTL: eyebrow `Learn through questions`; CTA `Generate quiz`; controls have accessible names; `min-h-11` on primary actions and option rows; no `View API health` as the landing CTA. Reviewer still does the 320px / ≥1024px pass in quickstart.

### Tests for User Story 8 ⚠️

- [X] T051 [P] [US8] Extend `apps/web/src/app/page.test.tsx` and player/results tests: eyebrow `Learn through questions`; title includes italic `what you know`; `lang` remains `en` on `apps/web/src/app/layout.tsx`; GetByRole finds Topic, URL, Generate quiz, option names, Back/Next/Submit, Create another quiz; no strategy field

### Implementation for User Story 8

- [X] T052 [US8] Apply art-direction layout in `apps/web/src/app/page.tsx`, `apps/web/src/features/quiz/quiz-player.tsx`, and `apps/web/src/features/quiz/quiz-results.tsx`: gutters `px-4 sm:px-6 lg:px-8`; player column `max-w-[720px]`; option rows `min-h-11`+; `motion-reduce:transition-none`; optional botanical SVG `aria-hidden`; desktop setup may show artwork **beside** the form, never beside answers; long URLs wrap
- [X] T053 [US8] Update `apps/web/src/app/layout.tsx` metadata description to the product (quiz from Markdown), still English; keep `NEXT_PUBLIC_API_URL` import for env fail-closed at boot

**Checkpoint**: Automated a11y/copy checks pass. Record the manual 320px and desktop walkthrough using [quickstart.md](./quickstart.md).

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Docs, quality commands, and scope freeze after stories.

- [X] T054 [P] Add a “Run the web quiz” section to `README.md` pointing at `/`, `/quiz/{id}`, `/quiz/{id}/results`, `WEB_ORIGIN`, and the environment blocker for live generate (no fixture fallback)
- [X] T055 [P] Confirm `apps/web` has **zero** imports of `@ai-quiz/domain`, `@ai-quiz/application`, Prisma, or `calculateWeightedScore` (ESLint boundaries + grep); scoring remains server-side
- [X] T056 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the repo root; default `pnpm test` MUST NOT require PostgreSQL or `OPENAI_API_KEY`; `pnpm test:integration` and `pnpm test:e2e` still pass (CORS is `main.ts`-only)
- [X] T057 Scope review: **zero** new `/v1` routes, **zero** Prisma migrations, **zero** Langfuse, **zero** GitHub Actions/production Dockerfiles, **zero** Playwright, CORS origin allowlist only `WEB_ORIGIN`; update nothing in `implementation-roadmap.md` checkboxes until this cycle is verified later
- [X] T058 Follow [quickstart.md](./quickstart.md) for the optional live browser pass (model key + reachable README) and the phone/desktop reviewer checklist; if the key is missing, record an environment blocker and keep Jest evidence

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **US1 (Phase 3)**: Depends on Foundational — MVP complete flow
- **US2–US7 (Phases 4–9)**: Depend on Foundational; practically extend US1 screens (same files). Implement in spec order if sequential
- **US8 (Phase 10)**: Visual/a11y pass over the four screens
- **Polish (Phase 11)**: After desired stories (all of them for this cycle’s definition of done)

### User Story Dependencies

- **US1 (P1)**: After Foundational — MVP
- **US2 (P1)**: Tightens `setup-form.tsx` (can start after T029 exists; independently testable)
- **US3 (P1)**: Tightens `quiz-player.tsx` navigation
- **US4 (P1)**: Tightens `quiz-results.tsx` feedback
- **US5 (P1)**: Sitting/token rules across player + results
- **US6 (P1)**: Cross-cutting assertions on pre-submit UI
- **US7 (P1)**: Error/loading recovery on the same screens
- **US8 (P2)**: Design-system/a11y; does not change scoring

US2–US8 share files with US1; **do not parallelize two stories that edit the same `.tsx` unless split by file**. Helpers (`error-copy.ts`, `attempt-session.ts`, `api-client.ts`) may be extended in parallel with care.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Helpers/primitives before screens
- Screens before route wrappers
- Story complete before the next priority when sequential

### Parallel Opportunities

- T003/T004 after T001
- T009/T011/T013 and T015/T016/T018–T023 after CORS/env (different files)
- T025/T026/T027 after Foundational
- T030 parallel with T029
- T054/T055 in polish

---

## Parallel Example: User Story 1

```bash
# Tests (after Foundational):
Task: "setup-form.test.tsx happy path"
Task: "quiz-player.test.tsx submit all questions"
Task: "quiz-results.test.tsx display score from API"

# Then sequential screens (shared router):
Task: "setup-form.tsx + page.tsx"
Task: "quiz-player.tsx + quiz/[quizId]/page.tsx"
Task: "quiz-results.tsx + results/page.tsx"
```

---

## Parallel Example: Foundational primitives

```bash
Task: "packages/ui/src/components/input.tsx"
Task: "packages/ui/src/components/label.tsx"
Task: "packages/ui/src/components/radio-group.tsx"
Task: "packages/ui/src/components/checkbox.tsx"
Task: "packages/ui/src/components/progress.tsx"
Task: "packages/ui/src/components/alert.tsx"
Task: "packages/ui/src/components/badge.tsx"
Task: "packages/ui/src/components/skeleton.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup
2. Complete Foundational (CORS + client helpers + primitives)
3. Complete User Story 1 (mocked generate → play → persisted result UI)
4. **STOP and VALIDATE** with `pnpm test` web suites
5. Live README generate is optional until a model key exists (environment blocker)

### Incremental Delivery

1. Setup + Foundational → browser can call `/v1` (CORS)
2. US1 → interview-demonstrable happy path (MVP)
3. US2 → form validation
4. US3 → player navigation
5. US4 → result feedback/source
6. US5 → token sitting
7. US6 → key isolation tests
8. US7 → errors/loading
9. US8 → a11y/responsive
10. Polish → README + quality commands + scope review

### Parallel Team Strategy

After Foundational:

- Developer A: US1 setup + generating + page.tsx
- Developer B: US1 player + results (merge before full sitting)
- After US1: US2 vs US3 vs US4 on different files (`setup-form.tsx` / `quiz-player.tsx` / `quiz-results.tsx`)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps tasks to spec user stories US1–US8
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at checkpoints to validate the story independently
- Missing `OPENAI_API_KEY` at live browser verification is an **environment blocker**, not a reason to restore product fixtures in the UI
- Avoid: new scoring policies, generation strategies, Langfuse, CI/CD, production containers, Playwright, putting the attempt token in the URL, importing domain scoring into web

---

## Phase 12: Convergence

Remaining work against Phase 4 evidence gaps and Phase 5 / interview-MVP acceptance (`roadmap.md` assessment must-haves and `implementation-roadmap.md` Phase 5). Do not rewrite earlier tasks.

- [X] T059 CRITICAL Demonstrate live generation and full quiz completion (create → play → submit → persisted result) against two different reachable README.md URLs, not two topics on the same source, and record reviewer evidence that questions are grounded in each corresponding Markdown per roadmap assessment two-README must-have, implementation-roadmap Phase 5, and FR-013 (missing)
- [X] T060 Document the two sources, sample topics, demo steps, scores, source-relevance evidence, and known limitations in `README.md` per implementation-roadmap Phase 5 (missing)
- [X] T061 Add Jest + Supertest E2E (real PostgreSQL, mocked deterministic generator) that runs create → get → start → submit → result against two distinct Markdown bodies, asserts source-specific grounded questions, inspects Prisma rows for questions, `isCorrect`, attempts, selections, `rawScore`, and `weightedScore`, and matches a hand-calculated `1.1 ** index` reference per implementation-roadmap Phase 5 and roadmap M4 (missing)
- [X] T062 Extend API E2E reliability coverage for unusable/bad Markdown (`SOURCE_UNUSABLE`), `http`/malformed source URLs (`CREATE_QUIZ_INVALID`), and incomplete submits (`ATTEMPT_INCOMPLETE`) without regressing existing leakage, idempotency, unauthorized-result, and invalid-option cases per implementation-roadmap Phase 5 (partial)
- [X] T063 Record the Phase 4 phone (~320px) and desktop (≥1024px) reviewer pass of the full browser flow, plus the live sitting or environment blocker, per FR-018, SC-001, SC-007, and SC-008 (partial)
- [X] T064 Run the read-only code-review skill over the completed vertical slice and resolve blocking findings per implementation-roadmap Phase 5 and Constitution VI (missing)
