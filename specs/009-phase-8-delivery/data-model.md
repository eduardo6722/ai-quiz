# Data Model: Phase 8 CI/CD, Production Containers and Interview Delivery

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-11

This phase **does not add PostgreSQL tables or migrations**. Quiz persistence stays as in Phases 2–7 (`SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, `AttemptAnswer`, `AttemptAnswerSelection`). The models below are **delivery artifacts**: pipeline runs, images, release records, and interview documents. The ER diagram published for the interview **documents the existing Prisma schema**; it does not redesign it.

## Product entities (document only)

Published in `docs/data-model.md` as a Mermaid ER. Field lists follow `apps/api/prisma/schema.prisma`.

| Entity | Role in the walkthrough |
| ------ | ----------------------- |
| `SourceDocument` | Pinned snapshot + checksum of fetched Markdown (`originalUrl`, `resolvedUrl`, `contentHash`, `contentSnapshot`) |
| `Quiz` | Topic, strategy (`balanced` only), status, optional `modelId` |
| `Question` | Ordered prompt, type `single` \| `multiple`, optional `sourceExcerpt` |
| `QuestionOption` | Exactly four per question; `isCorrect` is **server-only** |
| `QuizAttempt` | Hash of the one-time public token; `weightedScore` on 0–4 after submit |
| `AttemptAnswer` | Per-question `rawScore`; one row per `(attemptId, questionId)` |
| `AttemptAnswerSelection` | Selected option ids; ownership validated |

**Uniqueness (already enforced)**: `(quizId, position)`, `(questionId, position)`, `(questionId, label)`, `(attemptId, questionId)`, `publicTokenHash`.

**Forbidden in learner-facing docs/examples**: `isCorrect`, raw attempt tokens, environment secrets.

**Relationships**: SourceDocument 1—* Quiz 1—* Question 1—* QuestionOption; Quiz 1—* QuizAttempt 1—* AttemptAnswer *—* QuestionOption via AttemptAnswerSelection.

No state-machine changes: Quiz `generating` \| `ready` \| `failed`; Attempt `open` \| `scored`; resubmit stays idempotent.

## Delivery entities

### Merge-time pipeline run

One GitHub Actions `ci.yml` execution.

| Field | Rules |
| ----- | ----- |
| `ref` | PR or `main` sha |
| `jobs` | `quality`, `integration`, `build`, `images` |
| `install` | `pnpm install --frozen-lockfile` |
| `postgres` | Disposable `ai_quiz_test` for `integration` only |
| `model` | Mocked / absent — never a live key |
| `outcome` | Pipeline fails if any required job fails |

**Relationships**: Does not invoke the evaluation workflow. Does not push images.

### Quality gate (merge-time)

| `id` | Command / check |
| ---- | --------------- |
| `install` | Frozen lockfile |
| `lint` | `pnpm lint` |
| `typecheck` | `pnpm typecheck` |
| `unit` | `pnpm test` (Jest unit + UI) |
| `integration` | `pnpm test:integration` after migrate deploy |
| `e2e` | `pnpm test:e2e` after migrate deploy |
| `build` | `pnpm build` |
| `images` | `docker build` API and web (no push) |

Each gate is `passed` or `failed`. There is no `not_run` for these on a completed pipeline — a skipped integration job is a **failed** pipeline, not a skip-pass.

### Gated evaluation run

One `llm-evals.yml` execution.

| Field | Rules |
| ----- | ----- |
| `trigger` | `workflow_dispatch` or `schedule` — never `pull_request` |
| `environment` | GitHub Environment `llm-evals` |
| `mode` | `live` if `OPENAI_API_KEY` present; otherwise live work `not_run` |
| `command` | Existing `pnpm eval:golden --live --repeat` when keyed |
| `report` | Artifact `golden-eval-report` + companion `last-gated-run.md` in the artifact |
| `humanRelevanceClarity` | `not_run` unless Phase 7 labels file is filled (out of scope to fill) |
| `regression` | `not_run` unless accepted baseline exists (out of scope to accept) |

**Relationships**: Reuses Phase 7 dataset, CLI, and `docs/evals/phase-7-report.md` writer. MUST NOT auto-commit to `main`.

### Production image

| Field | Rules |
| ----- | ----- |
| `app` | `api` \| `web` |
| `dockerfile` | `apps/api/Dockerfile` \| `apps/web/Dockerfile` |
| `stages` | deps → build → minimal runtime |
| `user` | Non-root (`node`) in the final stage |
| `secrets` | Runtime only (except public `NEXT_PUBLIC_API_URL` build-arg) |
| `health` | API `/health`; web `/` |
| `tag` | `:git-sha` when published; untagged local build is enough for CI |

### Release record

| Field | Rules |
| ----- | ----- |
| `migrate` | `prisma migrate deploy` of **existing** files; never migrate-dev |
| `publish` | `passed` \| `not_run` (needs registry credentials + explicit publish) |
| `deploy` | `passed` \| `not_run` (`DEPLOY_TARGET=none` by default) |
| `destination` | Configurable `REGISTRY` / `IMAGE_PREFIX` / `DEPLOY_TARGET` — no hardcoded vendor |
| `rollback` | Previous image tags; schema reverse not promised |
| `backup` | PostgreSQL volume or managed backup; no backup product |

### Delivery-status item

Interview checklist row.

| Field | Rules |
| ----- | ----- |
| `id` | Stable kebab-case (e.g. `p0-two-sources`, `p1-human-calibration`, `p1-live-deploy`) |
| `lane` | `P0` \| `P1` \| `P2` |
| `state` | `passed` \| `failed` \| `not_run` |
| `evidence` | Command, URL, or “unexecuted” |

**Required `not_run` unless evidenced**: human calibration, accepted frozen baseline, live image publish, live host deploy, second generation strategy, P2 extras.

### Walkthrough outline

| Field | Rules |
| ----- | ----- |
| `duration` | 5–10 minutes of **required** material |
| `beats` | Ingestion, generation, grounded quality (incl. leftover **not_run**), adapter boundaries, persistence ER, weighted scoring, eval methodology |
| `scoring` | 0–4; `1.1 ** index`; display-only percentage; judge does not grade learners |

## Validation rules

- Pipeline caches MUST NOT include secret values.
- Get-quiz API examples MUST NOT include `isCorrect`.
- Production API without `DATABASE_URL` MUST fail closed before serving quizzes.
- Production API without `OPENAI_API_KEY` MUST still serve `/health`.
- Overwriting `docs/evals/phase-7-report.md` with an environment-blocked run MUST be described honestly in delivery status; it does not erase prior evidenced sittings in `docs/delivery-status.md`.

## State transitions

```text
PR opened → ci.yml runs → all jobs passed → merge allowed (human review still requested)
llm-evals not triggered → evaluation status remains not_run
llm-evals keyed live run → report artifact; leftover gates stay not_run
release DEPLOY_TARGET=none → publish maybe; deploy not_run
release with evidence → publish/deploy passed
```

No learner-facing attempt/quiz state is introduced or changed.
