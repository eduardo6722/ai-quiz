# Phase 7 Research

**Feature**: Phase 7 LLM Evaluation, Golden Dataset and Quality Regression  
**Date**: 2026-10-11  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution, `roadmap.md`, `implementation-roadmap.md` and the Phase 7 spec bind behavior. Reuse Phases 0–6; do not re-scaffold, re-grade, add a second generation strategy, CI/CD, deployment, or a UI redesign.

---

## 1. Evaluation is a new workspace package, not a domain or scoring module

**Decision**: Add `@ai-quiz/evals` at repo-root `evals/` and list `evals` in `pnpm-workspace.yaml`. That package owns the versioned dataset, pinned snapshots, rubrics, deterministic evaluators, judge **port**, experiment **port**, run orchestration and portable-report writer. It depends on `@ai-quiz/domain`, `@ai-quiz/application` (reuse `validateQuiz`, scoring, `toPublicQuizView`, `assertGrounded`) and Zod. It MUST NOT import NestJS, Prisma, Next.js, OpenAI, Vercel AI SDK, or `@langfuse/*`.

Composition root lives in a new API context `apps/api/src/eval/`: the `pnpm eval:golden` CLI, the live `QuizGenerationPort` wiring (existing `OpenAiQuizGenerationAdapter`), the OpenAI judge adapter, and the Langfuse Datasets/Experiments/Scores adapter. `apps/api` may depend on `@ai-quiz/evals`. Domain and application MUST NOT depend on `@ai-quiz/evals`.

Extend ESLint boundaries: element type `evals` (`evals/**`) may import `domain`, `application` and `contracts`; `api` may import `evals`; `evals` MUST NOT import `api` or `web`. Keep existing hexagonal restrictions (no `@langfuse/*`, `ai`, Nest, Prisma) on the evals package sources.

**Rationale**: Roadmap places `evals/` at the repository root. Constitution I/V require evaluation runners outside pure scoring and forbid Langfuse in domain/application. Folder architecture allows a **new context** rather than dumping files into `helpers/`, `shared/`, or `quiz/`. A workspace package gives Jest, strict TypeScript and Turbo `test`/`lint`/`typecheck` without adding evaluation to `pnpm test`’s paid path.

**Alternatives considered**:

- `packages/evals` plus a second `evals/` data tree — splits the roadmap layout and invites drift.
- Runners only inside `apps/api` — mixes a Nest app with an offline CLI and makes mocked Jest depend on the API package.
- Ports on `@ai-quiz/domain` (`JudgePort`) — pollutes the learner domain with evaluation vocabulary the constitution says to keep out of scoring.
- `@ai-quiz/evals` importing `apps/api` adapters — inverts the workspace (packages must not depend on apps).

---

## 2. Offline runs call `QuizGenerationPort` with pinned snapshot text

**Decision**: The golden runner loads each case’s **pinned Markdown file**, verifies its SHA-256 checksum, and calls the existing `QuizGenerationPort.generate({ topic, sourceText, count, strategy: "balanced" })`. It MUST NOT `POST /v1/quizzes` and MUST NOT fetch the remote URL for regression comparison.

Create-quiz rate/concurrency limits, persistence and attempt tokens stay on the product path. Evaluation does not insert quizzes into PostgreSQL. Optional product traces remain available when the same generation adapter is constructed with the existing telemetry wiring; experiment recording uses a **separate** `ExperimentRecorderPort` so Datasets/Experiments/Scores are not mixed into `CreateQuizUseCase`.

**Rationale**: Spec FR-004 and the Phase 6 limiter (5 creates / 60s, 2 in-flight) would make a 12–20 case live run flaky if it used HTTP. Pinned text is the only way a later public README edit cannot silently invalidate the baseline.

**Alternatives considered**:

- Drive evaluation through HTTP create-quiz — hits Phase 6 limits and writes playable quizzes the learner never asked for.
- Re-fetch live URLs each run — forbidden by FR-004; use checksum mismatch as a dataset error if someone edits a pin without updating the case.
- Duplicate an OpenAI client inside `evals/` — forks the live generation path the spec says to reuse.

---

## 3. Deterministic evaluators wrap existing domain/application functions

**Decision**: Deterministic checks are pure functions in `@ai-quiz/evals`. They do not call a judge model.

| Check | Reuse |
| ----- | ----- |
| Schema / 5–8 / four unique options / type and key cardinality / positions | `validateQuiz` |
| Duplicate question prompts (normalized trim + case-fold) | new small helper in evals |
| Source excerpt is a contiguous snapshot substring | `assertGrounded` |
| Learner-facing view leaks no keys | `toPublicQuizView` + assert `isCorrect` / `sourceExcerpt` absent |
| Weighted scoring invariants | Phase 1 fixtures via `scoreQuestion` + `calculateWeightedScore` (hand-calculated sample unchanged) |

Each check returns `{ name, passed, detail }`. A case’s deterministic outcome is **pass** only if every check passes. These run in mocked Jest (`pnpm --filter @ai-quiz/evals test`) without model keys.

**Rationale**: Spec FR-005. Reusing domain functions is the only way the eval suite cannot silently diverge from learner grading (FR-016). Duplicate-prompt detection is the one new contract check; it stays in evals, not in `validateQuiz`, so product create does not gain a new hard fail this cycle unless a recorded live failure later justifies a targeted product fix.

**Alternatives considered**:

- Re-implement 5–8 / four-options in the eval package — would drift from `validateQuiz`.
- Promote duplicate-prompt into domain this cycle — a product behavior change not requested unless evidence later supports a targeted fix.
- Call the judge for structure — forbidden (FR-005, US2).

---

## 4. Judge never sees `isCorrect`; human labels outrank the judge

**Decision**: Version the rubric as `evals/rubrics/judge-v1.md` plus a machine-readable criteria file. `JudgePort.evaluate` receives: case id, topic, pinned snapshot, question prompt, question type **as generated**, and the four option **labels and positions only**. It MUST NOT receive `isCorrect`, answer-key indices, or a statement that the generated key is correct.

Judge structured output (Zod, Vercel AI SDK `Output.object` in the API adapter):

- Per option: `supportedBySource` (boolean), `evidenceExcerpt` (string, may be empty if unsupported), `uncertain` (boolean)
- Per question: `proposedCorrectPositions` (independent key), `grounding`, `answerKeyCorrect` (judge’s view after comparing its key to the generated key **inside the runner, not inside the judge prompt**), `relevance`, `clarity`, `ambiguity`, `distractorQuality`, `coverageContribution`, `notes`
- Scale: blocking dimensions are pass/fail after the runner compares keys; quality dimensions are anchored **1–5**
- Uncertainty: `low` | `medium` | `high` on the question

The **runner** (not the model) compares `proposedCorrectPositions` to the generated key. Mismatch, or any marked-correct option the judge marked unsupported, is a **blocking** semantic failure (FR-007).

Human labels live in `evals/baselines/human-labels.v1.json`. On disagreement, the stored label wins. Calibration notes live in the portable report. A missing human sample means calibration is **not run**.

Live judge adapter: `apps/api/src/eval/openai-judge.adapter.ts` using the same model-provider stack as generation (env model id, server-side key). Mock judge in `evals` for Jest.

**Rationale**: Spec FR-006/FR-007/FR-008 and US3–US4. If the judge is told the generated key, it will rubber-stamp fluent wrong answers. Comparing keys in process keeps the model from seeing the hypothesis as truth.

**Alternatives considered**:

- Pass `isCorrect` and ask “is this right?” — exactly the bias the spec forbids.
- Judge-only scoring with no human sample — cannot claim calibration (SC-005).
- Separate judge vendor — extra key and SDK; reuse the configured OpenAI adapter stack.

---

## 5. Langfuse Datasets / Experiments / Scores stay behind a port

**Decision**: `@ai-quiz/evals` defines `ExperimentRecorderPort`:

- `recordItem(result)` — per-case scores and metadata
- `recordRun(summary)` — aggregates, versions, experiment identity
- `flush()` — best-effort export

Adapters:

- `NoOpExperimentRecorder` — always available; local report still writes
- `RecordingExperimentRecorder` — Jest
- `LangfuseExperimentAdapter` in `apps/api/src/eval/` — when `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are both set

Langfuse mapping (JS/TS SDK v5, `@langfuse/client` added to `apps/api` only):

- **Source of truth** is the git dataset. The adapter upserts a hosted dataset named `ai-quiz-golden-v1` (versioned with the dataset version) for comparison, **or** runs `langfuse.experiment.run` on **local** `ExperimentItem[]` if upsert is unavailable. Local-data experiments still appear as Experiments in current Langfuse v4/v5.
- `task` = generate via `QuizGenerationPort` + run deterministic + judge evaluators
- Item evaluators emit Scores: `deterministic_pass` (0/1), `blocking_semantic_fail` (0/1), plus 1–5 quality dimensions when the judge ran
- Run evaluators emit aggregates used in the report
- Metadata allowlist: dataset version, rubric version, evaluator versions, source checksum, model id, prompt version, experiment id, duration, token usage, approximate cost when usage exists, case id, expected behavior
- Denylist: env secrets, raw attempt tokens, `Authorization`, learner-submitted answers, full system prompts, full snapshots (hash + optional short evidence excerpts already in the case are enough)

Export failures retry **once** then drop (same rule as Phase 6 traces). Missing keys ⇒ no-op recorder + report still required; live experiment inspection is **not run**.

**Rationale**: Spec FR-012/FR-017. Current Langfuse docs recommend the Experiment runner on local or hosted datasets, with item and run evaluators becoming Scores. Git remains reviewable without an account (SC-006).

**Alternatives considered**:

- Langfuse as the only dataset store — review would require an account (fails SC-006).
- Call `@langfuse/client` from `@ai-quiz/evals` — couples the eval package to a vendor SDK (Constitution I).
- Phase 8 GitHub `llm-evals.yml` now — excluded (FR-021).

---

## 6. Dataset files, pins, and case count

**Decision**:

- Manifest: `evals/datasets/golden-v1.json` (Zod-validated)
- Pins: `evals/sources/<slug>.md` with checksum `sha256:<hex>` on each case
- **12–16** cases in v1 (inside 12–20). Must include:
  - Express README pin (Phase 5 URL / topic “Express routing”, count 5)
  - Fastify README pin (Phase 5 URL / topic “Fastify plugins”, count 5)
  - At least one extra topic on one of those pins
  - At least one count=8 case
  - Single-answer-heavy and multiple-answer-expected cases (tags; wording not prescribed)
  - One insufficient/unsupported-source synthetic pin
  - One adversarial/instruction-injection synthetic pin
- Two cases tagged `repeatForVariability: true` (informed default from the spec)

Checksum algorithm: SHA-256 of the exact file bytes. A mismatch aborts that case as a dataset error, not a quality pass.

**Rationale**: Spec FR-001–FR-003 and assumptions. 12–16 leaves room to add cases after calibration without crossing 20. Phase 5 sources are already demonstrated; synthetic pins cover behaviors a public README will not contain.

**Alternatives considered**:

- 20 cases on day one — more live cost before the harness exists; spec allows 12–20.
- Only live URLs, no files — not repeatable.
- Expected question text in the manifest — forbidden.

---

## 7. Command split: mocked Jest vs `pnpm eval:golden`

**Decision**:

- Root script `pnpm eval:golden` → `pnpm --filter @ai-quiz/api eval:golden` (tsx/node composition root).
- CLI flags: `--mocked` (no live model; label **mocked**), `--live` (require model key; else exit with **not run**), `--skip-judge` (deterministic only), `--repeat` (honor variability tags). Default with a model key is **live**; default without a key is **not run** for live portions and a non-zero exit that tells the reviewer to pass `--mocked` or set credentials. Deterministic Jest in `@ai-quiz/evals` remains part of `pnpm test` and is always **mocked**.
- `pnpm test` / `pnpm test:e2e` MUST NOT call a paid model or write the Phase 7 report as a “live pass”.
- Document credentials in README and `.env.example` (existing model and Langfuse keys; no new secret names required). Optional `EVAL_JUDGE_MODEL` if the judge should differ from `OPENAI_MODEL`; default to the generation model.

**Rationale**: Spec FR-013/FR-014. Roadmap name `pnpm eval:golden`. Skipped live work cannot count as passed.

**Alternatives considered**:

- Put live eval inside `pnpm test` when a key exists — hidden paid runs and flaky CI later.
- Silent mocked fallback on `pnpm eval:golden` without `--mocked` — would look like a live pass.

---

## 8. Portable report, gates, and targeted fixes

**Decision**: After every CLI run, write `docs/evals/phase-7-report.md` from a template: dataset/rubric/evaluator versions, checksums, model/prompt versions, experiment id (or **not run**), live vs mocked labels, per-case table, variability notes, human calibration section, gate table (passed / failed / **not run**), sample size and limitations, and any targeted prompt/generation fixes with the failing case id.

Provisional gates (spec FR-015) stored in `evals/baselines/gates.v1.json`. First accepted live run of `golden-v1` + `judge-v1` becomes the frozen baseline under `evals/baselines/baseline-v1.json` (metadata only, not a wording snapshot).

Targeted product/prompt edits in this cycle are allowed only when the report cites a failing case id. Unexplained prompt rewrites and a second strategy are out of scope.

**Rationale**: Spec US5–US6, SC-006–SC-009.

**Alternatives considered**:

- Report only in Langfuse — not portable.
- Auto-loosen gates to force a pass — forbidden.
- Treat judge mean score as the learner grade — forbidden.

---

## 9. Prerequisite recording gate stays outside this design

**Decision**: Implementation of this plan MUST NOT start until Phases 4, 5 and 6 are recorded as verified in `implementation-roadmap.md`, or leftover gaps are listed on those phases. This research does not absorb two-source demo work, CI, or production images.

**Rationale**: Spec Prerequisites / FR-021.

**Alternatives considered**:

- Fold Phase 5/6 verification into Phase 7 tasks — expands scope, forbidden.
