# Quickstart: Phase 7 LLM evaluation, golden dataset and quality regression

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [golden-dataset.md](./contracts/golden-dataset.md), [evaluators.md](./contracts/evaluators.md), [judge-rubric.md](./contracts/judge-rubric.md), [experiment.md](./contracts/experiment.md), [quality-gates.md](./contracts/quality-gates.md), [report.md](./contracts/report.md)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume Phases 0–6 code is present and Phase 7 behavior described in the plan has been implemented.

**Do not start implementation** until Phases 4–6 are recorded as verified in `implementation-roadmap.md` (or leftover gaps are listed on those phases).

## Prerequisites

- Node.js 24 (Active LTS) and pnpm (pinned by root `packageManager`)
- Phase 0 install: `pnpm install` from the repo root
- **Default `pnpm test` does not require `OPENAI_API_KEY` or Langfuse keys**
- Live golden evaluation: `OPENAI_API_KEY`, `OPENAI_MODEL` (optional `EVAL_JUDGE_MODEL`, `PROMPT_VERSION`)
- Live experiment-destination inspection: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, optional `LANGFUSE_BASE_URL`
- PostgreSQL is **not** required for evaluation (runs call `QuizGenerationPort` with pinned text)

## Setup

```bash
pnpm install
```

No new database migration. Do not use `POST /v1/quizzes` to drive the golden set (Phase 6 rate/concurrency limits).

## Quality commands (always)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` MUST pass **without** PostgreSQL, **without** a model key, and **without** Langfuse keys. It MUST include `@ai-quiz/evals` deterministic/mocked Jest. It MUST NOT write a live Phase 7 report counted as a live pass.

Confirm `packages/domain` and `packages/application` still have **zero** `@langfuse/*` and `ai` imports. Confirm `@ai-quiz/evals` has **zero** Nest/Prisma/Langfuse/OpenAI SDK imports.

## Mocked evaluation (no paid model)

```bash
pnpm eval:golden --mocked
```

Expected:

- Dataset loads 12–20 cases; Express and Fastify pins have distinct checksums
- Deterministic checks run on fixtures / mocked generation
- Report at `docs/evals/phase-7-report.md` labels the run **mocked**
- Live semantic gates are **not run** (or mocked-only, never cited as live evidence)
- Exit may be zero if mocked contract checks pass

## Live evaluation (model key required)

```bash
pnpm eval:golden --live
```

Expected:

- Each case uses **pinned** snapshot text (checksum verified), not a fresh GitHub download
- At least the Express and Fastify cases produce live generation + deterministic results
- Judge runs unless `--skip-judge`; judge input has option labels and **no** `isCorrect`
- Unsupported/wrong keys are blocking failures even when JSON is valid
- Report lists versions, checksums, latency, tokens/cost when reported, per-case failures
- Variability-tagged cases appear twice when `--repeat` is passed
- If Langfuse keys are set, an experiment id appears; if not, destination is **not run** and the report still exists

Missing model key:

```bash
pnpm eval:golden --live
```

Expected: non-zero exit, report (or stdout) records live work **not run** with `missing-openai-key`. Do not silently fall back to mocked and call it passed.

## Calibration and gates

1. Review the stratified sample (both sources, both question types, all disagreements, all blocking semantic fails).
2. Write `evals/baselines/human-labels.v1.json`.
3. Confirm the report gate table uses passed / failed / **not run** and states sample size and limitations.
4. Accept the first complete live run as `evals/baselines/baseline-v1.json` only after that review.

## Scoring attestation

```bash
pnpm --filter @ai-quiz/domain test
```

Phase 1 weighted-score fixtures MUST still pass. The report’s scoring attestation section MUST say the learner 0–4 formula is unchanged.

## Read-only review

Run `.agents/skills/code-review/SKILL.md` over the eval harness, golden cases, adapters and report writer. Blocking findings (secret leakage, judge seeing `isCorrect`, scoring coupled to judge, domain importing Langfuse) MUST be resolved before the cycle is claimed done.

## Out of scope here

GitHub Actions, production Dockerfiles, a second generation strategy, UI redesign, and raising Phase 6 rate limits to “make eval pass”.
