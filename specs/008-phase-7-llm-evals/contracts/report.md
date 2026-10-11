# Contract: Portable report

**Feature**: [spec.md](../spec.md)  
**Path**: `docs/evals/phase-7-report.md`

The CLI **overwrites** this file each run. Git history holds previous reports. The file MUST remain readable without Langfuse.

## Required sections (in order)

1. **Run identity** — timestamp, `mode` (live / mocked / mixed), dataset version, rubric version, evaluator versions, model id, prompt version, experiment destination id or **not run**, environment blockers.
2. **Sources** — table of case id, origin URL (if any), checksum (short or full), topic, count, expected behavior.
3. **Per-case outcomes** — deterministic pass/fail, semantic pass/fail/**not run**, blocking failure codes, latency, tokens when known. Variability repeats on separate rows (`repeatIndex`).
4. **Aggregates** — counts of passed / failed / not_run; total tokens; approximate cost if computed.
5. **Variability** — the two (or more) repeated cases: whether wording differed and whether any repeat added a blocker.
6. **Model/prompt comparison** — second version or **not run**.
7. **Human calibration** — sample size, agreement, disagreement table, systematic judge errors, or **not run**.
8. **Quality gates** — table of gate id, target, state, sample size, notes.
9. **Limitations** — explicit statement that n is small and not statistically conclusive.
10. **Targeted fixes** — list of product/prompt edits in this cycle with the failing `caseId`, or “none”.
11. **Scoring attestation** — Phase 1 scoring-invariant check passed; learner 0–4 formula unchanged.

## Labeling

Every live row says `live`. Every fixture row says `mocked`. Omitted paid work says `not_run` plus the blocker (`missing-openai-key`, `missing-langfuse-keys`, `judge-skipped`, `aborted`).

## Secrets

The report MUST NOT contain env secret values, Langfuse keys, attempt tokens, or `Authorization` headers. Generated answer keys and short evidence excerpts are allowed (reviewer document).
