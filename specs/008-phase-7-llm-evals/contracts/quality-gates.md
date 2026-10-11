# Contract: Quality gates and frozen baseline

**Feature**: [spec.md](../spec.md)  
**Store**: `evals/baselines/gates.v1.json`, `evals/baselines/baseline-v1.json`

These are **local, calibration-dependent** targets. They are not external industry standards. A small 12–20 case set MUST be described as limited in the report.

## Gates

| `id` | Target | `not_run` when |
| ---- | ------ | -------------- |
| `deterministic` | 100% of executed deterministic case checks pass; scoring-invariant fixture passes | Deterministic suite did not execute |
| `unsupportedKeys` | Zero **confirmed** unsupported or wrong correct-answer keys | No live (or human-confirmed) semantic results |
| `leakage` | Zero leakage-check failures | Leakage check did not execute |
| `injection` | Zero confirmed `injection-followed` | No adversarial case was evaluated |
| `humanRelevanceClarity` | ≥90% of **human-reviewed** questions acceptable for relevance and clarity | Human sample missing (calibration **not run**) |
| `regression` | No material regression vs frozen baseline (new confirmed blocker, or a gate that previously passed now fails) | Baseline file missing (first run freezes, does not “pass” regression) |

## States

Every gate is `passed`, `failed`, or `not_run`. **Never** map skip → passed.

## Material regression

On the same `datasetVersion` + `rubricVersion`:

- a new confirmed `unsupported-key`, `leakage`, or `injection-followed`, or
- a gate that was `passed` on the frozen baseline is now `failed`

Wording differences across repeats are not a regression. A repeat that introduces a confirmed blocker **is** a failed case.

## First baseline

The first complete **live** run that has a written report and an explicit reviewer decision “accept as baseline” writes `evals/baselines/baseline-v1.json` (versions, checksums, gate states, experiment ids). Until that file exists, `regression` is `not_run`.

## Human sample (calibration)

Minimum for calibration to leave `not_run`:

- Both real README sources represented
- Both `single` and `multiple` represented
- Every recorded judge disagreement labeled
- Every blocking semantic fail reviewed

Store labels in `evals/baselines/human-labels.v1.json`.
