# Contract: Experiment run, recorder port, and CLI

**Feature**: [spec.md](../spec.md)

## CLI

Root command: `pnpm eval:golden`  
Implementation: `pnpm --filter @ai-quiz/api eval:golden` → `apps/api/src/eval/cli.ts`

| Flag | Meaning |
| ---- | ------- |
| `--mocked` | Use fixture/`QuizGenerationPort` double; label **mocked**; no paid generation |
| `--live` | Require `OPENAI_API_KEY` and `OPENAI_MODEL`; else exit non-zero and record live work **not run** |
| `--skip-judge` | Deterministic only; semantic gates **not run** |
| `--repeat` | Generate variability-tagged cases twice |

Default: if `--mocked` is absent and keys are missing, do **not** silently mock; print the environment blocker and write a report whose live rows are **not run**. If keys are present, run live.

`pnpm test` MUST NOT invoke this CLI.

## `ExperimentRecorderPort` (`@ai-quiz/evals`)

```ts
type ExperimentRecorderPort = {
  recordItem(input: CaseResult): Promise<void>;
  recordRun(input: ExperimentRun): Promise<void>;
  flush(): Promise<void>;
};
```

| Adapter | Package | When |
| ------- | ------- | ---- |
| `NoOpExperimentRecorder` | `@ai-quiz/evals` | Keys absent; tests that ignore export |
| `RecordingExperimentRecorder` | `@ai-quiz/evals` | Jest |
| `LangfuseExperimentAdapter` | `apps/api/src/eval/` | Both Langfuse keys set |

`flush` retries export **once**, then drops. Recorder errors MUST NOT delete the local report.

## Allowlisted item metadata

`caseId`, `datasetVersion`, `sourceChecksum`, `expectedBehavior`, `modelId`, `promptVersion`, `evaluatorVersions`, `mode`, `latencyMs`, `inputTokens`, `outputTokens`, `deterministic_pass` (0/1), `blocking_semantic_fail` (0/1), ordinal dimension scores when present, `uncertainty`.

## Denylist

`OPENAI_API_KEY`, `DATABASE_URL`, Langfuse keys, raw attempt tokens, `Authorization`, learner answers, full system/developer prompts, full snapshot bodies. Short evidence excerpts already stored on the case are allowed.

## Langfuse mapping (keys present)

- SDK: `@langfuse/client` v5 Experiment runner (`langfuse.experiment.run`) plus existing OTEL processor from Phase 6 when already started.
- Data: prefer **local** `ExperimentItem[]` built from the git dataset (source of truth). Optionally upsert hosted dataset `ai-quiz-golden-v1` so the UI can compare later runs; failure to upsert is **not** a quality pass/fail — record destination **not run** for hosting, still finish local experiment + report.
- Item evaluators → Scores with the allowlisted names above.
- Run evaluators → aggregate Scores: `deterministic_rate`, `blocking_fail_count`, `human_accept_rate` when labels exist.
- `name`: `phase-7-golden` ; `runName`: timestamp + git-short-sha if available + `live`/`mocked`.

## Cost / usage

Copy model-reported token counts when present. Approximate cost is optional and MUST be labeled approximate. Do not invent usage.
