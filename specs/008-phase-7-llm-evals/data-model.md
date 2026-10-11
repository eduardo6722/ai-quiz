# Data Model: Phase 7 LLM Evaluation, Golden Dataset and Quality Regression

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-10-11

This phase **does not add PostgreSQL tables or migrations**. Quiz, snapshot, attempt, answer and selection entities stay as in Phases 2–6. The models below are **evaluation artifacts**: version-controlled files, in-process run results, optional experiment-destination records, and the portable report.

## Entities

### Golden dataset version

Immutable named collection of cases.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | `golden-v1` for this cycle. |
| `version` | semver string | Manifest version; bump when cases or pins change. |
| `cases` | Golden case[] | Length **12–20** inclusive (v1 target 12–16). |

**Relationships**: Contains golden cases. Referenced by every experiment run and the portable report.

### Golden case

One generation scenario.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | Stable kebab-case identity; unique in the dataset version. |
| `sourceUrl` | string? | Origin URL when the pin is a real README; omit for synthetic pins. |
| `sourceFile` | string | Path relative to `evals/` (e.g. `sources/express-readme.md`). |
| `sourceChecksum` | string | `sha256:` + lowercase hex of the exact file bytes. |
| `topic` | string | Non-empty; requested topic. |
| `questionCount` | int | 5–8. |
| `referenceFacts` | Reference fact[] | At least one for `valid-grounded-quiz` cases; may be empty for refuse/injection cases when the expected behavior is “do not invent”. |
| `expectedBehavior` | `valid-grounded-quiz` \| `refuse-unsupported` \| `resist-injection` | Required. |
| `tags` | string[] | Include coverage tags (`express`, `fastify`, `single`, `multiple`, `insufficient`, `adversarial`, `variability`, …). |
| `repeatForVariability` | boolean | Default false. At least two cases true in v1. |

**Forbidden**: expected question wording, expected option labels, expected answer-key indices as a “correct quiz script”.

**Relationships**: Points at one pinned snapshot. Produces one or more case results per experiment (two when variability is on).

### Pinned source snapshot

Stored Markdown body used as the only generation input for that case.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `path` | string | File under `evals/sources/`. |
| `bytes` | file | Exact pin. |
| `checksum` | string | SHA-256 of bytes; must match the case. |

**Validation**: On load, hash the file; mismatch is a dataset error for that case (not a quality pass). Do not fetch the remote URL to “refresh” the pin during a run.

**Relationships**: Shared by one or more cases (same pin, different topics). At least two distinct README pins in v1 (Express, Fastify).

### Reference fact

Human-verified claim supported by the pin.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | Stable within the case. |
| `claim` | string | Non-empty factual statement. |
| `evidenceSection` | string? | Heading or section name. |
| `evidenceExcerpt` | string | Contiguous substring of the pin (after the same link-unwrap rules as product grounding, or exact file substring). |

**Relationships**: Belongs to one golden case. Used by human adjudicators and as judge context (facts are **hints for reviewers**, not a second answer key fed as truth). The judge prompt receives the snapshot; it MAY receive reference facts labeled as “reviewer notes, not the generated key”. It MUST NOT receive generated `isCorrect` flags.

### Judge rubric version

Named semantic criteria.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | `judge-v1` for this cycle. |
| `dimensions` | see [judge-rubric.md](./contracts/judge-rubric.md) | Grounding and key correctness (blocking); relevance, clarity, ambiguity, distractor quality, coverage (1–5). |
| `anchors` | text | Required for 1 and 5 on each ordinal dimension. |

**Relationships**: Referenced by judge verdicts and the experiment run.

### Deterministic check result

One code evaluator outcome.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `name` | string | `schema`, `duplicates`, `groundedExcerpt`, `leakage`, `scoringInvariant`. |
| `passed` | boolean | Required. |
| `detail` | string | Concrete reason on failure; empty or short note on pass. |

**Relationships**: Several per case result. Case deterministic pass ⇔ all checks passed.

### Judge verdict

Semantic assessment for one generated question (and a roll-up for the quiz).

| Field | Type | Rules |
| ----- | ---- | ----- |
| `questionPosition` | int | 0-based. |
| `proposedCorrectPositions` | int[] | Judge’s independent key (0–3). |
| `optionSupport` | `{ position, supportedBySource, evidenceExcerpt, uncertain }[]` | One per option. |
| `relevance` / `clarity` / `ambiguity` / `distractorQuality` | int 1–5 | Anchored. |
| `uncertainty` | `low` \| `medium` \| `high` | Required. |
| `notes` | string | Non-secret. |

**Derived by the runner (not the model)**:

| Field | Type | Rules |
| ----- | ---- | ----- |
| `answerKeyMatch` | boolean | Generated correct positions equal the proposed set. |
| `blockingUnsupportedKey` | boolean | True if any generated-correct option is unsupported or keys differ. |

**Forbidden inputs to the judge**: `isCorrect`, answer-key indices, “the correct answers are…”.

### Human label

Adjudicated judgment.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `caseId` | string | Required. |
| `questionPosition` | int? | Omit for whole-quiz labels. |
| `runId` | string | Experiment identity the label refers to. |
| `acceptableRelevance` | boolean | Human. |
| `acceptableClarity` | boolean | Human. |
| `blockingKeyFailure` | boolean | Human. |
| `disagreesWithJudge` | boolean | Required when a judge verdict exists. |
| `notes` | string | Why the human won. |

**Rule**: When `disagreesWithJudge` is true, the human fields are the stored truth for gates.

**Relationships**: Stored in `evals/baselines/human-labels.v1.json`. Calibration record summarizes them.

### Case result

One generation + evaluation of one case (one repeat).

| Field | Type | Rules |
| ----- | ---- | ----- |
| `caseId` | string | Required. |
| `repeatIndex` | int | `1` or `2` when variability is on; else `1`. |
| `mode` | `live` \| `mocked` | Required. |
| `sourceChecksum` | string | Echo of the pin actually used. |
| `modelId` / `promptVersion` | string? | When generation ran. |
| `latencyMs` | number? | Generation wall time when measured. |
| `usage` | `{ inputTokens?, outputTokens? }`? | Only if the model reported it. |
| `deterministic` | Deterministic check result[] | Required. |
| `judge` | Judge verdict[] \| omitted | Omitted when judge is **not run**. |
| `blockingFailures` | string[] | e.g. `unsupported-key`, `leakage`, `injection-followed`. |
| `outcome` | `passed` \| `failed` \| `not_run` | `not_run` if generation or judge was skipped. |

### Experiment run

One CLI invocation over the dataset.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | Assigned UUID or destination-provided experiment id. |
| `datasetVersion` | string | Required. |
| `rubricVersion` | string | Required when judge ran; else `not_run`. |
| `evaluatorVersions` | `{ deterministic, judge, report }` | Semver or file hashes. |
| `mode` | `live` \| `mocked` \| `mixed` | Mixed only if some cases not_run. |
| `startedAt` / `finishedAt` | ISO datetime | Required. |
| `experimentDestinationId` | string? | Langfuse experiment/run id when export succeeded. |
| `caseResults` | Case result[] | Required. |
| `aggregates` | see gates | Counts of pass/fail/not_run; token/cost totals when known. |

**State transitions**:

```text
load dataset → verify pins
  ├─ checksum mismatch → case outcome not_run (dataset error) → continue
  └─ ok → generate (QuizGenerationPort + pinned text)
            ├─ skipped / no key → case not_run (live)
            ├─ mocked fixture → label mocked
            └─ live output → deterministic checks
                              ├─ fail → case failed (still may run judge for evidence)
                              └─ pass → judge (unless --skip-judge)
                                        ├─ not run → semantic not_run
                                        └─ verdict → runner key-compare → blocking flags
write report → record experiment (port) → flush
```

### Quality gate

Provisional threshold with an honest state.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `id` | string | `deterministic`, `unsupportedKeys`, `leakage`, `injection`, `humanRelevanceClarity`, `regression`. |
| `target` | text | See [quality-gates.md](./contracts/quality-gates.md). |
| `state` | `passed` \| `failed` \| `not_run` | Required. |
| `sampleSize` | int | Required on passed/failed. |
| `notes` | string | Uncertainty / limitations. |

### Frozen baseline

First accepted metadata snapshot of `golden-v1` + `judge-v1`.

| Field | Type | Rules |
| ----- | ---- | ----- |
| `datasetVersion` | string | Required. |
| `rubricVersion` | string | Required. |
| `experimentId` | string | Local and/or destination id. |
| `gateStates` | Quality gate[] | As recorded. |
| `sourceChecksums` | map caseId → checksum | Required. |

**Not stored**: generated question wording as the expected quiz.

### Portable report

Human-readable file at `docs/evals/phase-7-report.md`. Fields are the experiment run plus calibration notes, variability notes, gate table, and targeted-fix citations. Must be writable without Langfuse.

## Persistence

| Store | What |
| ----- | ---- |
| Git (`evals/`, `docs/evals/`) | Dataset, pins, rubric, human labels, gates, baseline metadata, report |
| Process memory | Case results during a run |
| Langfuse (optional) | Dataset upsert, experiment run, item/run Scores |
| PostgreSQL | **Unchanged. No eval tables.** |

## Forbidden data

Never persist in traces, Scores metadata, logs, or the portable report: `OPENAI_API_KEY`, `DATABASE_URL`, Langfuse keys, raw attempt tokens, `Authorization`, learner-submitted answers. Generated keys and judge notes **may** appear in the reviewer report. They MUST NOT be copied onto learner-facing product surfaces.
