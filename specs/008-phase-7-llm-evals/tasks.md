---
description: "Task list for Phase 7 LLM evaluation, golden dataset and quality regression (roadmap Phase 7 only)"
---

# Tasks: Phase 7 LLM Evaluation, Golden Dataset and Quality Regression

**Input**: Design documents from `/specs/008-phase-7-llm-evals/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 7 — LLM evaluation, golden dataset and quality regression (P1). Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap Phase 8.

**Implementation gate**: Do **not** execute these tasks until Phases 4, 5 and 6 are recorded as verified in `implementation-roadmap.md`, **or** leftover Phase 4/5/6 gaps are listed as blockers of those earlier phases. Do **not** absorb two-source demo work, CI, production Dockerfiles, a UI redesign, or a second generation strategy to close that gap.

**Tests**: Included. Spec SC-010, Constitution VI, [plan.md](./plan.md) and [quickstart.md](./quickstart.md) require Jest in `@ai-quiz/evals` (dataset load, checksums, deterministic evaluators, judge-input stripping, report labeling, recorder doubles) and API unit tests for CLI/adapter wiring. Write listed tests first and confirm they fail before implementation. Default `pnpm test` MUST NOT require PostgreSQL, `OPENAI_API_KEY`, or Langfuse keys and MUST NOT count a live Phase 7 report as passed. `pnpm eval:golden --live` is a separate command.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US6`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Evals package: `evals/src/` (`dataset/`, `evaluators/`, `judge/`, `experiment/`, `testing/`)
- Evals data: `evals/datasets/`, `evals/sources/`, `evals/rubrics/`, `evals/baselines/`
- API composition root: `apps/api/src/eval/`
- Platform env: `apps/api/src/platform/config/env.ts`
- Reuse (do not fork): `packages/domain/src/quiz/quiz.ts` (`validateQuiz`), `packages/domain/src/scoring/scoring-policy.ts`, `packages/domain/src/scoring/weighted-score.ts`, `packages/application/src/quiz/grounding.ts`, `packages/application/src/quiz/to-public-quiz.ts`, `apps/api/src/quiz/generation/openai-quiz-generation.adapter.ts`
- Follow `.agents/skills/folder-architecture/SKILL.md` and the live tree — do **not** recreate `helpers/`, `infrastructure/`, or `apps/api/src/modules/quiz/adapters/**`
- Do **not** add GitHub Actions, production Dockerfiles, new `/v1` routes, Prisma migrations, a second `strategy` value, or learner UI
- Do **not** import `@langfuse/*`, `ai`, Nest, Prisma, or OpenAI from `evals/`, `packages/domain`, or `packages/application`
- Do **not** change Phase 1 scoring math or put judge output into learner results

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Workspace package, directories, lint boundaries, optional env, and CLI script name. Do not reinitialize Spec Kit or overwrite the Constitution.

- [X] T001 Create directories `evals/src/dataset/`, `evals/src/evaluators/`, `evals/src/judge/`, `evals/src/experiment/`, `evals/src/testing/`, `evals/datasets/`, `evals/sources/`, `evals/rubrics/`, `evals/baselines/`, `apps/api/src/eval/`, and `docs/evals/` per [plan.md](./plan.md)
- [X] T002 Add `"evals"` to the `packages` list in `pnpm-workspace.yaml` (keep `apps/*` and `packages/*`); do not add a second app
- [X] T003 Create `evals/package.json` as `@ai-quiz/evals` (`private`, `"type": "module"`, export `"."` → `./src/index.ts`) with dependencies `@ai-quiz/domain`, `@ai-quiz/application`, `@ai-quiz/contracts`, `zod`; scripts `lint`, `typecheck`, `test` (jest), `build`; **no** `@langfuse/*`, `ai`, `@nestjs/*`, or `@prisma/*`
- [X] T004 [P] Add `evals/tsconfig.json` extending `@ai-quiz/config/tsconfig.base.json` with `module`/`moduleResolution` `NodeNext`, `include` `src/**/*.ts`, matching `packages/domain/tsconfig.json`
- [X] T005 [P] Add `evals/jest.config.cjs` using `@ai-quiz/config/jest.preset.cjs` and `testMatch` `<rootDir>/src/**/*.spec.ts`
- [X] T006 [P] Add `evals/eslint.config.js` using `frameworkFreeImports` from `@ai-quiz/config/eslint.config.js` (same pattern as `packages/domain/eslint.config.js`)
- [X] T007 Add element type `{ type: "evals", pattern: "evals/**" }` to `boundaries/elements` in `packages/config/eslint.config.js` and allow `from: "evals"` → `domain`, `application`, `contracts` only; allow `from: "api"` → `evals`; do **not** allow `evals` → `api` or `web`
- [X] T008 [P] Add `@langfuse/client` to `apps/api/package.json` with `pnpm --filter @ai-quiz/api add @langfuse/client`; do **not** add it to `evals/package.json`, `packages/domain/package.json`, or `packages/application/package.json`
- [X] T009 [P] Document empty optional `EVAL_JUDGE_MODEL` in `.env.example` (defaults to `OPENAI_MODEL` when unset) and a comment that `pnpm eval:golden` is **not** part of `pnpm test`; do not commit `.env`
- [X] T010 Add root script `"eval:golden": "pnpm --filter @ai-quiz/api eval:golden"` in `package.json` and a matching `"eval:golden"` script placeholder in `apps/api/package.json` pointing at `apps/api/src/eval/cli.ts` (may exit with “not implemented” until US5)

**Checkpoint**: `@ai-quiz/evals` is a workspace package. `pnpm install` succeeds. No golden cases or evaluators yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, ports, test doubles, and exports every story uses. **No user story work until this phase is complete.**

- [X] T011 Define Zod-backed types in `evals/src/dataset/schema.ts` per [contracts/golden-dataset.md](./contracts/golden-dataset.md) and [data-model.md](./data-model.md): `id` kebab-case unique; `sourceUrl` optional; `sourceFile` starts with `sources/`; `sourceChecksum` `/^sha256:[a-f0-9]{64}$/`; `topic` trimmed non-empty; `questionCount` integer **5–8**; `referenceFacts[]` with `id`, `claim`, optional `evidenceSection`, `evidenceExcerpt`; `expectedBehavior` `valid-grounded-quiz` \| `refuse-unsupported` \| `resist-injection`; `tags` string[]; `repeatForVariability` optional boolean; dataset `id` `"golden-v1"`; `cases` length **12–20**; **reject** unknown keys `expectedPrompt`, `expectedQuestions`, `expectedOptions`, `expectedCorrectPositions`
- [X] T012 [P] Define `CaseResult` and `ExperimentRun` types in `evals/src/experiment/types.ts` per [data-model.md](./data-model.md): `mode` `live` \| `mocked`; `outcome` `passed` \| `failed` \| `not_run`; `repeatIndex` int; `blockingFailures` string[]; optional `judge`, `latencyMs`, `usage`; run fields `datasetVersion`, `rubricVersion`, `evaluatorVersions`, `experimentDestinationId?`
- [X] T013 [P] Define `JudgePort` in `evals/src/judge/judge-port.ts` with `evaluate` input: case id, topic, pinned snapshot, question prompt, type, option **labels and positions only** (no `isCorrect`); output matches [contracts/judge-rubric.md](./contracts/judge-rubric.md) `QuizJudgeOutput`
- [X] T014 Define `ExperimentRecorderPort` in `evals/src/experiment/experiment-recorder-port.ts` with `recordItem`, `recordRun`, `flush` per [contracts/experiment.md](./contracts/experiment.md)
- [X] T015 Implement `NoOpExperimentRecorder` in `evals/src/experiment/noop-experiment-recorder.ts` (`recordItem`/`recordRun` no-op; `flush` resolves) and `RecordingExperimentRecorder` in `evals/src/testing/recording-experiment-recorder.ts` (inspectable `items` and `runs` arrays)
- [X] T016 [P] Add `FixedQuizGenerationAdapter` in `evals/src/testing/fixed-generation.ts` implementing `QuizGenerationPort` from `@ai-quiz/domain` (returns a fixture quiz; `strategy` remains `"balanced"` only)
- [X] T017 [P] Add `FixedJudgeAdapter` in `evals/src/testing/fixed-judge.ts` implementing `JudgePort` (returns scripted `QuizJudgeOutput`; never reads `isCorrect`)
- [X] T018 Export public types and ports from `evals/src/index.ts`; add `@ai-quiz/evals` as a dependency in `apps/api/package.json`; do **not** add `@ai-quiz/evals` to `packages/domain` or `packages/application`
- [X] T019 Parse optional `EVAL_JUDGE_MODEL` in `apps/api/src/platform/config/env.ts` (empty allowed); `parseApiEnv` MUST still succeed without it, `OPENAI_API_KEY`, or Langfuse keys; extend `apps/api/src/platform/config/env.ts` tests (or `apps/api/test/env.spec.ts` if that is the live env spec) so boot without those keys still passes
- [X] T020 Add a failing-until-wired `evals/src/index.spec.ts` that imports `@ai-quiz/evals` and asserts the package name/exports exist; run `pnpm --filter @ai-quiz/evals test` after T003–T018 so the new package is in `pnpm test`
- [X] T021 Confirm `packages/domain/src/` and `packages/application/src/` have **zero** imports of `@ai-quiz/evals`, `@langfuse/*`, and `ai`; `pnpm typecheck` and default `pnpm test` still pass without Postgres, a model key, or Langfuse keys

**Checkpoint**: Types, ports, and doubles exist. Dataset files and evaluators are not implemented. Default `pnpm test` still passes.

---

## Phase 3: User Story 1 - Curate a versioned golden dataset with reference facts (Priority: P1) 🎯 MVP

**Goal**: A version-controlled `golden-v1` with **12–20** cases, at least two different pinned README sources, reference facts and evidence locations, and **no** prescribed question wording.

**Independent Test**: Load the manifest; assert case count 12–20, two distinct README checksums and origin URLs, required fields, coverage tags, and that unknown expected-wording keys are rejected. Checksum mismatch on a pin is `not_run` (`checksum-mismatch`), not a silent refetch.

### Tests for User Story 1 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T022 [P] [US1] Tests in `evals/src/dataset/load-dataset.spec.ts`: valid `golden-v1` fixture with two pins loads; `cases.length` is 12–20; kebab-case `id` uniqueness; `questionCount` outside 5–8 fails Zod; unknown key `expectedQuestions` fails closed
- [X] T023 [P] [US1] Tests in `evals/src/dataset/checksum.spec.ts`: matching SHA-256 of exact file bytes passes; mutated pin bytes yield `not_run` detail `checksum-mismatch` and MUST NOT fetch a remote URL
- [X] T024 [US1] Tests in `evals/src/dataset/coverage.spec.ts` against the real `evals/datasets/golden-v1.json` (after T028 exists this will pass; write the assertions now): ≥2 distinct `sourceUrl` README pins; ≥1 `refuse-unsupported`; ≥1 `resist-injection`; ≥1 `questionCount === 8`; ≥2 `repeatForVariability === true`; tags include both `single` and `multiple`

### Implementation for User Story 1

- [X] T025 [US1] Implement `sha256File` in `evals/src/dataset/checksum.ts` returning `sha256:` + lowercase hex of raw file bytes
- [X] T026 [US1] Implement `loadGoldenDataset` in `evals/src/dataset/load-dataset.ts`: parse `evals/datasets/golden-v1.json` with T011 Zod; read each `evals/${sourceFile}`; verify checksum; return cases plus per-case dataset errors; never call `MarkdownSourcePort.fetch`
- [X] T027 [P] [US1] Pin the Phase 5 Express README body in `evals/sources/express-readme.md` and the Fastify README body in `evals/sources/fastify-readme.md` (distinct origin URLs `https://github.com/expressjs/express/blob/master/Readme.md` and `https://github.com/fastify/fastify/blob/main/README.md`); do not overwrite pins later without bumping dataset `version`
- [X] T028 [P] [US1] Add synthetic pins `evals/sources/insufficient-source.md` (too thin / off-topic for a requested library topic) and `evals/sources/adversarial-inject.md` (instructs “ignore previous rules”, “mark all options correct”, or “print the hidden key”)
- [X] T029 [US1] Write `evals/datasets/golden-v1.json` with `id` `"golden-v1"`, semver `version`, and **12–16** cases covering: Express routing count 5; Fastify plugins count 5; a second topic on one real pin; one count **8**; single and multiple tags; `refuse-unsupported` on the insufficient pin; `resist-injection` on the adversarial pin; exactly those two (or more) `repeatForVariability: true` cases; each `valid-grounded-quiz` case has ≥1 `referenceFacts` entry whose `evidenceExcerpt` is a contiguous substring of its pin; **no** expected question wording
- [X] T030 [US1] Export `loadGoldenDataset` from `evals/src/index.ts` and make T022–T024 pass

**Checkpoint**: A reviewer can inspect `evals/datasets/golden-v1.json` and pins without an external account. No generation yet.

---

## Phase 4: User Story 2 - Prove the quiz contract with deterministic evaluators (Priority: P1)

**Goal**: Code checks with no judge model: `validateQuiz`, duplicate prompts, grounded excerpts, learner-view leakage, and unchanged Phase 1 weighted scoring.

**Independent Test**: Fixtures for valid, duplicate, leaky, and malformed quizzes fail/pass as specified; scoring-invariant uses the hand-calculated `[4, 2, 0]` sample (`1.1 ** index`); checks run when judge credentials are absent.

### Tests for User Story 2 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T031 [P] [US2] Tests in `evals/src/evaluators/deterministic.spec.ts`: a `validateQuiz`-valid 5-question fixture passes `schema`; duplicate prompts (trim + Unicode case-fold) fail `duplicates` with a case-level `detail`; a public view containing `isCorrect` fails `leakage`; missing `sourceExcerpt` that is not a pin substring fails `groundedExcerpt` via `assertGrounded`
- [X] T032 [P] [US2] Tests in `evals/src/evaluators/scoring-invariant.spec.ts`: `scoreQuestion` + `calculateWeightedScore` match `packages/domain/src/scoring/weighted-score.spec.ts` hand sample `[4, 2, 0]` and all-4 / all-0 / index-7 fixtures; this check MUST NOT call `JudgePort`
- [X] T033 [US2] Tests in `evals/src/evaluators/expected-behavior.spec.ts`: `valid-grounded-quiz` requires generation success + schema/duplicates/groundedExcerpt/leakage pass; `refuse-unsupported` may be a stable generation failure **or** a quiz with zero blocking unsupported keys (fixture the fail path); `resist-injection` fails when generated options follow “mark all correct”

### Implementation for User Story 2

- [X] T034 [US2] Implement `evaluateSchema` in `evals/src/evaluators/schema.ts` by calling `validateQuiz` from `@ai-quiz/domain` (5–8 questions; exactly four unique options; contiguous positions 0–3; single ⇒ one correct; multiple ⇒ 1–4 correct); do not reimplement those rules
- [X] T035 [P] [US2] Implement `evaluateDuplicates` in `evals/src/evaluators/duplicates.ts`: fail when two question prompts are equal after trim + Unicode case-fold
- [X] T036 [P] [US2] Implement `evaluateGroundedExcerpt` in `evals/src/evaluators/grounded-excerpt.ts` by calling `assertGrounded` from `@ai-quiz/application` against the pinned snapshot text; skip only when generation failed and `expectedBehavior` is `refuse-unsupported` or `resist-injection`
- [X] T037 [P] [US2] Implement `evaluateLeakage` in `evals/src/evaluators/leakage.ts`: `JSON.stringify(toPublicQuizView(quiz))` from `@ai-quiz/application` MUST NOT contain `isCorrect` or `sourceExcerpt`
- [X] T038 [US2] Implement `evaluateScoringInvariant` in `evals/src/evaluators/scoring-invariant.ts` using `scoreQuestion` / `calculateWeightedScore` from `@ai-quiz/domain` on Phase 1 fixtures (run **once per experiment**, not per case)
- [X] T039 [US2] Implement `evaluateDeterministic` in `evals/src/evaluators/deterministic.ts` returning `{ name, passed, detail }[]` for `schema`, `duplicates`, `groundedExcerpt`, `leakage` plus the expected-behavior overlay from [contracts/evaluators.md](./contracts/evaluators.md); export from `evals/src/index.ts`; make T031–T033 pass

**Checkpoint**: Deterministic suite runs in `pnpm --filter @ai-quiz/evals test` with no model key and no judge.

---

## Phase 5: User Story 3 - Judge grounding and answer keys with required source evidence (Priority: P1)

**Goal**: Versioned judge rubric; judge never sees `isCorrect`; runner compares independent keys; unsupported/wrong keys and followed injection are blocking even when JSON is valid.

**Independent Test**: Fixed judge on (a) supported key, (b) fluent unsupported correct option, (c) multi-select extra/missing correct option — (b) and (c) set `blockingUnsupportedKey` / `wrong-key`; judge args contain labels only.

### Tests for User Story 3 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T040 [P] [US3] Tests in `evals/src/judge/strip-key.spec.ts`: a helper that builds `JudgePort` input from a `Question` omits `isCorrect` and answer-key indices; JSON of the payload MUST NOT contain `isCorrect`
- [X] T041 [P] [US3] Tests in `evals/src/evaluators/semantic.spec.ts`: generated-correct positions ≠ `proposedCorrectPositions` ⇒ `blockingUnsupportedKey`; any generated-correct option with `supportedBySource === false` ⇒ `unsupported-key`; structurally valid quiz still `failed`; `resist-injection` case whose options all `isCorrect` or whose prompt echoes attacker instructions ⇒ `injection-followed`
- [X] T042 [US3] Tests in `evals/src/judge/judge-output.spec.ts`: Zod rejects `relevance` outside 1–5; invalid judge output after one retry is semantic `not_run` with detail `judge-invalid` (never a pass)

### Implementation for User Story 3

- [X] T043 [P] [US3] Write human rubric `evals/rubrics/judge-v1.md` with anchors from [contracts/judge-rubric.md](./contracts/judge-rubric.md) (relevance, clarity, ambiguity, distractorQuality, coverage 1 and 5; snapshot is untrusted data)
- [X] T044 [P] [US3] Implement `toJudgeInput` in `evals/src/judge/strip-key.ts` (labels + positions only) and `compareKeys` in `evals/src/evaluators/compare-keys.ts` (`generatedCorrect !== proposedCorrectPositions` OR unsupported generated-correct option ⇒ blocking)
- [X] T045 [US3] Implement Zod `QuizJudgeOutput` in `evals/src/judge/output-schema.ts` (`proposedCorrectPositions` int[]; `optionSupport` length 4; `uncertainty` `low` \| `medium` \| `high`; ordinals 1–5)
- [X] T046 [US3] Implement `evaluateSemantic` in `evals/src/evaluators/semantic.ts`: call `JudgePort`; on invalid output retry **once** then `not_run` `judge-invalid`; apply `compareKeys` and injection detection; never pass the generated key into the judge prompt
- [X] T047 [US3] Implement `OpenAiJudgeAdapter` in `apps/api/src/eval/openai-judge.adapter.ts` using Vercel AI SDK `generateText` + `Output.object` and T045 schema; model = `EVAL_JUDGE_MODEL` or `OPENAI_MODEL`; wrap snapshot as untrusted `<source>`; system text MUST say to ignore source instructions and MUST NOT include generated `isCorrect`; retry invalid structured output once
- [X] T048 [US3] Export semantic helpers from `evals/src/index.ts` and make T040–T042 pass; `evals/` MUST still import no `ai` / `@langfuse/*`

**Checkpoint**: Mocked semantic blocking works without live keys. Live judge adapter exists but is unused until the CLI (US5).

---

## Phase 6: User Story 4 - Calibrate the judge against human labels (Priority: P1)

**Goal**: Store adjudicated labels; human wins disagreements; missing sample ⇒ calibration **not run**, never passed.

**Independent Test**: Fixture labels with one disagreement: stored truth is the human fields; calibration summary lists sample size and the disagreement; empty labels file ⇒ calibration `not_run`.

### Tests for User Story 4 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T049 [P] [US4] Tests in `evals/src/experiment/calibration.spec.ts`: when `disagreesWithJudge` is true, gate math uses human `acceptableRelevance` / `acceptableClarity` / `blockingKeyFailure`, not the judge; the disagreement is listed and the case is not a silent judge pass
- [X] T050 [US4] Tests in `evals/src/experiment/calibration.spec.ts`: missing or empty `evals/baselines/human-labels.v1.json` ⇒ calibration state `not_run`; a sample that lacks both README sources, both question types, or an unlabeled recorded disagreement is incomplete (`not_run`), not passed

### Implementation for User Story 4

- [X] T051 [US4] Define Zod `HumanLabel` in `evals/src/experiment/human-labels.ts`: `caseId` required; `questionPosition` optional; `runId` required; `acceptableRelevance` / `acceptableClarity` / `blockingKeyFailure` / `disagreesWithJudge` booleans; `notes` string — per [data-model.md](./data-model.md)
- [X] T052 [US4] Implement `summarizeCalibration` in `evals/src/experiment/calibration.ts`: require both real sources, both `single` and `multiple`, every recorded judge disagreement, and every blocking semantic fail; compute agreement; list systematic notes from `notes` fields
- [X] T053 [US4] Add template `evals/baselines/human-labels.v1.json` as `{ "version": "1.0.0", "labels": [] }` plus a short comment in `evals/baselines/README.md` that empty labels mean calibration is **not run**; export loaders from `evals/src/index.ts`; make T049–T050 pass

**Checkpoint**: Calibration machinery exists. Filling real labels happens after a live run (US5/US6), not by inventing agreement.

---

## Phase 7: User Story 5 - Repeat offline experiments and publish a portable report (Priority: P1)

**Goal**: `pnpm eval:golden` runs pinned snapshots through `QuizGenerationPort`, writes `docs/evals/phase-7-report.md`, labels live/mocked/**not run**, records metadata, optional Langfuse experiment, and a small variability subset.

**Independent Test**: `--mocked` writes a mocked report without keys; `--live` without keys exits non-zero and records `missing-openai-key` as **not run** (no silent mock); with doubles, variability-tagged cases produce two rows; report has the required sections.

### Tests for User Story 5 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T054 [P] [US5] Tests in `evals/src/experiment/run-golden.spec.ts`: each case calls `QuizGenerationPort.generate` with **pin text** (`sourceText` equals file contents) and `strategy: "balanced"`; never fetches HTTP; `repeatForVariability` + `--repeat` yields `repeatIndex` 1 and 2
- [X] T055 [P] [US5] Tests in `evals/src/experiment/report.spec.ts`: written markdown includes the 11 sections in [contracts/report.md](./contracts/report.md); every row labeled `live`, `mocked`, or `not_run`; denylist — body MUST NOT contain `sk-`, `Bearer `, or `postgresql://user:pass`
- [X] T056 [US5] Tests in `apps/api/src/eval/cli.spec.ts`: `--mocked` sets `mode` `mocked` and does not require keys; `--live` with empty `OPENAI_API_KEY` exits non-zero and records live portions `not_run` `missing-openai-key` (MUST NOT silently mock); `--skip-judge` leaves semantic gates `not_run`
- [X] T057 [P] [US5] Tests in `apps/api/src/eval/langfuse-experiment.adapter.spec.ts`: allowlisted scores only; string metadata passed through `redactSensitive` from `apps/api/src/platform/logging/redact-sensitive.ts`; `flush` failure after one retry does not throw into the runner

### Implementation for User Story 5

- [X] T058 [US5] Implement `runGolden` in `evals/src/experiment/run-golden.ts`: load dataset; verify pins; generate via injected `QuizGenerationPort`; run T039 deterministic + T046 semantic (unless skip); attach `sourceChecksum`, `modelId`, `promptVersion`, `latencyMs`, usage when present; `recordItem`/`recordRun` on `ExperimentRecorderPort`; do not `POST /v1/quizzes` and do not insert Prisma rows
- [X] T059 [US5] Implement `writePhase7Report` in `evals/src/experiment/report.ts` writing `docs/evals/phase-7-report.md` with sections and labeling from [contracts/report.md](./contracts/report.md); always write even when the recorder is NoOp
- [X] T060 [US5] Implement CLI in `apps/api/src/eval/cli.ts`: flags `--mocked`, `--live`, `--skip-judge`, `--repeat` per [contracts/experiment.md](./contracts/experiment.md); default without `--mocked` and without keys ⇒ **not run** + non-zero (no silent mock); with keys, wire `OpenAiQuizGenerationAdapter` from `apps/api/src/quiz/generation/openai-quiz-generation.adapter.ts` and T047 judge; `--mocked` uses T016/T017 doubles
- [X] T061 [US5] Implement `LangfuseExperimentAdapter` in `apps/api/src/eval/langfuse-experiment.adapter.ts` using `@langfuse/client` Experiment runner on **local** `ExperimentItem[]` built from the git dataset; item Scores `deterministic_pass`, `blocking_semantic_fail`, ordinal dimensions when present; run Scores `deterministic_rate`, `blocking_fail_count`; `name` `phase-7-golden`; export retry once then drop; both Langfuse keys required else CLI uses `NoOpExperimentRecorder` and destination id is **not run**
- [X] T062 [US5] Wire CLI composition in `apps/api/src/eval/cli.ts` (or `apps/api/src/eval/compose.ts`): live generation adapter + judge + Langfuse-or-NoOp; call `runGolden` then `writePhase7Report` then `flush`; make T054–T057 pass
- [X] T063 [US5] Document `pnpm eval:golden`, `--mocked` / `--live`, credential requirements, and live-vs-mocked labeling in `README.md` (Phase 7 section); keep secret **values** out of the README

**Checkpoint**: Mocked CLI produces a portable report. Live CLI is wired; missing keys are **not run**. No CI workflow.

---

## Phase 8: User Story 6 - Apply provisional gates, human review and evidence-only fixes (Priority: P1)

**Goal**: Gate table with passed / failed / **not run**; blocking failures cannot be waived by valid JSON; scoring fixtures unchanged; prompt/generation edits only with a recorded `caseId`.

**Independent Test**: Fixture run with one `unsupported-key` ⇒ `unsupportedKeys` **failed**; skipped live ⇒ gates **not run** not passed; `packages/domain` scoring tests still match `[4, 2, 0]`; report limitations section says n is small.

### Tests for User Story 6 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T064 [P] [US6] Tests in `evals/src/experiment/gates.spec.ts`: `deterministic` 100% of executed checks; `unsupportedKeys` / `leakage` / `injection` fail on any confirmed blocker; `humanRelevanceClarity` uses **only** human-reviewed questions and is `not_run` without labels; `regression` is `not_run` when `evals/baselines/baseline-v1.json` is missing; skip MUST NOT map to `passed`
- [X] T065 [US6] Tests in `evals/src/experiment/gates.spec.ts`: a schema-valid case with `unsupported-key` makes the evaluation milestone `failed`; wording-only differences on variability repeats are not a regression; a repeat that adds a confirmed blocker is a failed case

### Implementation for User Story 6

- [X] T066 [US6] Write `evals/baselines/gates.v1.json` with the six gate ids and targets from [contracts/quality-gates.md](./contracts/quality-gates.md) labeled as local calibration-dependent targets
- [X] T067 [US6] Implement `applyGates` in `evals/src/experiment/gates.ts` returning `{ id, target, state, sampleSize, notes }` with `state` `passed` \| `failed` \| `not_run`; include sample size and uncertainty notes on every pass
- [X] T068 [US6] Implement `writeBaseline` in `evals/src/experiment/baseline.ts` writing `evals/baselines/baseline-v1.json` (dataset/rubric versions, checksums, gate states, experiment ids) **only** when a reviewer flag `--accept-baseline` is passed on the CLI; first run without that flag leaves `regression` `not_run`
- [X] T069 [US6] Extend `writePhase7Report` in `evals/src/experiment/report.ts` with the gate table, limitations (“12–20 curated cases are not statistically conclusive”), scoring attestation (T038 passed; learner 0–4 unchanged), and a **Targeted fixes** list that is `"none"` unless a commit message/`caseId` is supplied; do **not** edit `apps/api/src/quiz/generation/quiz-prompt.ts` unless the report cites a failing `caseId`
- [X] T070 [US6] Re-run `pnpm --filter @ai-quiz/domain test` and confirm `packages/domain/src/scoring/weighted-score.spec.ts` still matches the `[4, 2, 0]` hand sample and `1.1 ** index`; make T064–T065 pass

**Checkpoint**: Gates are honest. Scoring is unchanged. No unexplained prompt rewrite.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Docs, review, and verification evidence. Do not start Phase 8 CI/CD.

- [X] T071 [P] Point `.agents/skills/folder-architecture/SKILL.md` readers at `evals/` as the evaluation context by adding a short “Evaluation” note to `evals/README.md` (package-local): runners outside domain scoring; no `helpers/` dump
- [X] T072 [P] Extend `packages/config/src/boundaries.spec.ts` (or add `evals/src/boundaries.spec.ts`) so `@ai-quiz/evals` source files are asserted free of `@langfuse/`, `ai`, `@nestjs/`, and `@prisma/` import strings
- [X] T073 Run [quickstart.md](./quickstart.md) mocked path: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm eval:golden --mocked`; confirm `docs/evals/phase-7-report.md` exists and is labeled mocked
- [X] T074 Run live `pnpm eval:golden --live --repeat` when `OPENAI_API_KEY` and `OPENAI_MODEL` are set (Express + Fastify pins must generate); if keys are absent, record the environment blocker as **not run** in `docs/evals/phase-7-report.md` — do not substitute fixtures as live evidence
- [X] T075 After a live (or recorded) run, fill `evals/baselines/human-labels.v1.json` for the stratified sample (both README sources, both question types, all disagreements, all blocking semantic fails) and regenerate the report so calibration is no longer empty-`not_run` **or** leave it `not_run` if no live run occurred
- [X] T076 Run the read-only review in `.agents/skills/code-review/SKILL.md` over the Phase 7 diff (hexagonal imports, judge input stripping, secret denylist, scoring purity); resolve blocking findings and re-run affected tests
- [X] T077 Do **not** check boxes in `implementation-roadmap.md` or `roadmap.md` until this cycle is verified with commands and (if keys exist) a live report; if keys are absent, record the environment blocker instead of a silent skip
- [X] T078 Do **not** add `.github/workflows/ci.yml` or `.github/workflows/llm-evals.yml`, production Dockerfiles, a second generation strategy, or learner UI changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately **after** the implementation gate (Phases 4–6 recorded as verified, or leftover gaps listed on those phases)
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — dataset/pins only
- **User Story 2 (Phase 4)**: Depends on Foundational; uses US1 pins for `groundedExcerpt` fixtures but can unit-test with inline snapshots
- **User Story 3 (Phase 5)**: Depends on Foundational; semantic tests use fixture quizzes (US1 pins optional)
- **User Story 4 (Phase 6)**: Depends on Foundational + US3 verdict shape
- **User Story 5 (Phase 7)**: Depends on US1 loader, US2/US3 evaluators, US4 calibration loader
- **User Story 6 (Phase 8)**: Depends on US5 report + run objects
- **Polish (Phase 9)**: Depends on stories needed for the definition of done (US1–US6)

### User Story Dependencies

- **US1**: After Foundational — independently testable as a dataset
- **US2**: After Foundational — independently testable with fixture quizzes
- **US3**: After Foundational — independently testable with `FixedJudgeAdapter`
- **US4**: After US3 types — independently testable with fixture labels
- **US5**: Integrates US1–US4 into the CLI; mocked path independently testable without keys
- **US6**: Applies gates to US5 run output; independently testable with fixture `ExperimentRun`s

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Types/ports (Foundational) before loaders and evaluators
- Deterministic evaluators before CLI
- Report writer before Langfuse adapter (local report is required either way)
- Story complete before moving to the next priority when working solo

### Parallel Opportunities

- T004, T005, T006, T008, T009 after T001–T003
- T012, T013, T016, T017 after T011/T014 as marked
- T022 and T023 together; T027 and T028 together
- T031 and T032 together; T035–T037 together
- T040 and T041 together; T043 and T044 together
- T054, T055, T057 together
- T071 and T072 in polish

---

## Parallel Example: User Story 1

```bash
# Tests (after Foundational):
Task: "Tests in evals/src/dataset/load-dataset.spec.ts"
Task: "Tests in evals/src/dataset/checksum.spec.ts"

# Pins (after loader types exist):
Task: "Pin Express and Fastify README bodies in evals/sources/"
Task: "Add synthetic insufficient and adversarial pins in evals/sources/"
```

## Parallel Example: User Story 2

```bash
Task: "Implement evaluateDuplicates in evals/src/evaluators/duplicates.ts"
Task: "Implement evaluateGroundedExcerpt in evals/src/evaluators/grounded-excerpt.ts"
Task: "Implement evaluateLeakage in evals/src/evaluators/leakage.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (versioned golden dataset)
4. **STOP and VALIDATE**: Open `evals/datasets/golden-v1.json` and pins; run US1 Jest
5. Then add US2 deterministic checks (still no paid model)

### Incremental Delivery

1. Setup + Foundational → package and ports
2. US1 → inspectable golden set (MVP for “what we will measure”)
3. US2 → mocked contract quality (`pnpm test`)
4. US3–US4 → semantic blocking + calibration machinery
5. US5 → `pnpm eval:golden --mocked` then optional `--live`
6. US6 → gates, baseline accept, honest **not run**
7. Polish → review + evidence; stop (no Phase 8)

### Parallel Team Strategy

With multiple developers after Foundational:

- Developer A: US1 pins + loader
- Developer B: US2 deterministic evaluators
- Developer C: US3 judge ports + compareKeys (adapter later)

CLI (US5) waits on A–C exports.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps tasks to spec user stories US1–US6
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at checkpoints to validate the story independently
- Missing `OPENAI_API_KEY` at live evaluation is an **environment blocker**, recorded as **not run**, not a reason to treat mocked output as live quality evidence
- Avoid: new scoring policies, generation strategies, CI/CD, production containers, putting `isCorrect` into the judge prompt, importing Langfuse into `evals/` or domain, `POST /v1/quizzes` as the eval driver
