# Implementation Plan: Phase 7 LLM Evaluation, Golden Dataset and Quality Regression

**Branch**: `008-phase-7-llm-evals` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-phase-7-llm-evals/spec.md`

**Roadmap phase**: Phase 7 — LLM evaluation, golden dataset and quality regression (P1)

**Note**: This file is the `/speckit-plan` output. It does not create `tasks.md` and does not authorize implementation by itself.

## Summary

Establish a **repeatable quality baseline** for generated quizzes: a versioned golden dataset (12–20 cases, at least two pinned README sources), deterministic contract evaluators, an evidence-based LLM-as-a-Judge that never sees `isCorrect` as truth, human calibration, Langfuse Datasets/Experiments/Scores behind a port, and a portable report at `docs/evals/phase-7-report.md`. Learner 0–4 scoring stays the Phase 1 deterministic policy.

Technical approach (from [research.md](./research.md)): new workspace package `@ai-quiz/evals` at repo-root `evals/` owns dataset, pins, rubric, runners and report writer. It reuses `QuizGenerationPort`, `validateQuiz`, `assertGrounded`, `toPublicQuizView` and Phase 1 scoring functions. Composition root `apps/api/src/eval/` wires the existing OpenAI generation adapter, a judge adapter, and a Langfuse experiment adapter. `pnpm eval:golden` is explicit and separate from `pnpm test`. Live, mocked and **not run** are labeled. Implementation must not start until Phases 4–6 are recorded as verified in `implementation-roadmap.md` (or leftover gaps are listed on those phases). This plan does not absorb demo, CI, deployment, UI redesign, or a second generation strategy.

## Technical Context

**Language/Version**: TypeScript (strict) on Node.js 24 Active LTS (`engines.node`: `^24`) — reuse Phase 0.

**Primary Dependencies**: Existing pnpm/Turborepo workspace. Zod 4 for dataset and judge output. Vercel AI SDK / OpenAI already in `apps/api` (reuse for generation and judge). **Add** `@langfuse/client` to `apps/api` only (Experiment runner; traces still `@langfuse/tracing` + `@langfuse/otel` from Phase 6). **Add** workspace package `@ai-quiz/evals`. No Redis, no new HTTP routes, no Prisma models.

**Storage**: PostgreSQL 16 unchanged. **No new migration.** Golden cases, pins, rubrics, human labels, gates and the portable report are git files. Optional Langfuse hosted dataset/experiment is a remote copy, not the source of truth.

**Testing**: Jest in `@ai-quiz/evals` for dataset load, checksum mismatch, deterministic evaluators, leakage, scoring-invariant reuse, judge-input stripping of `isCorrect`, report labeling, and recorder doubles. Jest in `apps/api` for CLI flag / adapter wiring with mocked ports. Live `pnpm eval:golden --live` is **not** part of `pnpm test`. Domain scoring tests stay I/O-free and unchanged.

**Target Platform**: Developer local workspace (Linux/macOS). Not production containers. Not GitHub Actions (Phase 8).

**Project Type**: Hexagonal evaluation slice in the existing monorepo — new evals package + API composition-root adapters. Not a learner-facing feature.

**Performance Goals**: Offline batch over 12–20 cases. Variability subset is two cases × two repeats. Do not raise Phase 6 HTTP rate/concurrency limits. Judge invalid-output retry at most once. Experiment export retry at most once then drop.

**Constraints**: Domain/application MUST NOT import NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse, or `@ai-quiz/evals`. `@ai-quiz/evals` MUST NOT import Nest/Prisma/Langfuse/OpenAI SDKs. Judge MUST NOT receive generated keys as truth. Secrets and attempt tokens MUST NOT appear in reports or Scores. Skipped live work is **not run**, never passed. No second strategy, CI, production Dockerfiles, or UI redesign. Targeted prompt/generation fixes only with a recorded failing `caseId`.

**Scale/Scope**: One new workspace package; one API `eval/` context; 12–16 golden cases in v1 (within 12–20); two real README pins (Express, Fastify) plus synthetic insufficient/adversarial pins; one rubric version; one CLI; one portable report; optional Langfuse experiment. No new product tables, routes, or screens.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
| --------- | ---- | ------ | -------------------------- |
| I. Hexagonal / framework independence | Domain and application have no framework/provider imports; adapters only in apps | **PASS** | No new domain ports. `JudgePort` and `ExperimentRecorderPort` live in `@ai-quiz/evals`. Langfuse and OpenAI judge/generation wiring only in `apps/api/src/eval/`. ESLint gains an `evals` element that cannot import `api` or vendor SDKs. |
| II. SOLID / no extra layers | No generic repositories or packages without a boundary | **PASS** | `@ai-quiz/evals` is a dedicated evaluation context (roadmap `evals/`), not a grab-bag `shared/` or `helpers/`. No `packages/infrastructure`. |
| III. Strict TypeScript | `strict` across apps and packages | **PASS** | Reuse `@ai-quiz/config`. Zod for manifest and judge output; no `any` to smuggle keys into the judge. |
| IV. Zod-validated contracts | External input parsed with Zod; keys out of public DTOs | **PASS** | Dataset manifest and judge payload parsed with Zod. Public quiz DTOs unchanged. Learner APIs unchanged. |
| V. Testable domain (NON-NEGOTIABLE) | Pure scoring; generation does not grade | **PASS** | Scoring functions only **asserted** via existing fixtures. Judge scores never write `weightedScore`. No Prisma eval tables. |
| VI. Jest testing discipline | Jest; API E2E with mocked LLM; persistence vs real PostgreSQL | **PASS** | Eval unit tests are Jest + mocked ports. Live eval is a separate command. No Playwright. No paid calls in `pnpm test`. |
| VII. Secure AI integration | Secrets never logged; Markdown untrusted; errors do not leak prompts/keys | **PASS** | Pins stay untrusted task data for generator and judge. Report/Scores denylist matches Phase 6. Judge system prompt ignores source instructions. |
| VIII. Roadmap fidelity | Derive from roadmap; Phase 7 exclusions | **PASS** | M6 golden set, evaluators, judge, human calibration, Langfuse experiments, `pnpm eval:golden`, `docs/evals/phase-7-report.md` only. No M7 CI/Docker, no second strategy, no UI redesign. |

**Unjustified violations**: none. Adding `evals` to the workspace glob is a new product context required by the roadmap, not a 4th ad-hoc app.

**Post-design re-check**: After `data-model.md`, `contracts/` and `quickstart.md`, the same gates hold. No Prisma tables; no new `/v1` routes; evaluation files are git + optional Langfuse; quickstart separates `pnpm test` from `pnpm eval:golden --live`; judge input contract forbids `isCorrect`; scoring attestation is explicit. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/008-phase-7-llm-evals/
├── plan.md              # This file
├── research.md          # Phase 0 research (this command)
├── data-model.md        # Phase 1 design
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Dataset, evaluators, rubric, experiment, gates, report
└── tasks.md             # Created later by /speckit-tasks — not this command
```

### Source Code (repository root)

Phase 7 **adds** the evals package and a thin API composition root. Follow the live tree (`.agents/skills/folder-architecture/SKILL.md`), not historical Spec Kit adapter paths. Do not add CI workflows, production Dockerfiles, quiz screens, or a second strategy.

```text
evals/                                   # @ai-quiz/evals
├── package.json
├── src/
│   ├── dataset/                         # load + Zod-validate golden-v1
│   ├── evaluators/                      # deterministic + semantic blocking
│   ├── judge/                           # JudgePort + rubric loader
│   ├── experiment/                      # ExperimentRecorderPort, runGolden, report writer
│   ├── testing/                         # mock generation, mock judge, recording recorder
│   └── index.ts
├── datasets/golden-v1.json
├── sources/*.md                         # Express, Fastify, synthetic pins
├── rubrics/judge-v1.md
└── baselines/                           # gates.v1, human-labels.v1, baseline-v1 (after accept)

apps/api/src/eval/                       # new API context (composition root only)
├── cli.ts                               # pnpm eval:golden
├── openai-judge.adapter.ts
└── langfuse-experiment.adapter.ts

docs/evals/phase-7-report.md             # written by the CLI

package.json                             # + "eval:golden"
pnpm-workspace.yaml                      # + "evals"
packages/config/eslint.config.js         # + evals boundary element
```

Reuse, do not fork:

```text
packages/domain/src/quiz/quiz-generation-port.ts
packages/domain/src/quiz/quiz.ts                    # validateQuiz
packages/domain/src/scoring/{scoring-policy,weighted-score}.ts
packages/application/src/quiz/{grounding,to-public-quiz}.ts
apps/api/src/quiz/generation/openai-quiz-generation.adapter.ts
apps/api/src/quiz/telemetry/langfuse-telemetry.adapter.ts  # optional process OTEL
```

Existing `packages/ui`, Prisma schema, `/v1` quiz/attempt routes, web screens, SSRF adapter, and Phase 6 limiter stay unchanged.

**Structure Decision**: Same monorepo. Evaluation is a new context at `evals/` (roadmap) plus `apps/api/src/eval/` adapters. Turbo `test`/`lint`/`typecheck` pick up `@ai-quiz/evals` via workspace glob; `eval:golden` is a root script, not a default test task.

## Complexity Tracking

> No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
