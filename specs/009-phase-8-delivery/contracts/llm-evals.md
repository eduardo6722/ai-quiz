# Contract: Gated golden-set workflow (`.github/workflows/llm-evals.yml`)

**Feature**: [spec.md](../spec.md)  
**Reuses**: Phase 7 CLI `pnpm eval:golden`, dataset, portable report writer

## Triggers

- `workflow_dispatch`
- `schedule` (weekly is enough)
- **Forbidden**: `pull_request`

## Environment and secrets

GitHub Environment name: `llm-evals`.

| Secret / var | Required for live generation |
| ------------ | ---------------------------- |
| `OPENAI_API_KEY` | Yes |
| `OPENAI_MODEL` | Yes (may default in env to `gpt-6-luna` if documented) |
| `EVAL_JUDGE_MODEL` | No (falls back to `OPENAI_MODEL`) |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` | No — destination **not_run** if missing |
| `LANGFUSE_BASE_URL` | No |

Forks and ordinary PRs never receive these secrets because they never trigger this workflow.

## Behavior

| Condition | Live generation / judge | Job conclusion | Report labels |
| --------- | ----------------------- | -------------- | ------------- |
| Key missing or empty | Do not call a paid model | **success** | live + judge + destination **not_run**, `missing-openai-key` |
| Key present, CLI blocking fail | Ran | **failure** | failed gates as failed, leftovers still **not_run** if files empty |
| Key present, CLI success | Ran | **success** | executed gates as reported by CLI |

Never pass `--accept-baseline`. Never write human labels. Never silently run `--mocked` and call it live.

## Publication

- Upload artifact `golden-eval-report` containing `docs/evals/phase-7-report.md` (whatever the CLI wrote) and `docs/evals/last-gated-run.md` (run id, git sha, trigger, live vs **not_run**, gate table).
- Do **not** `git commit` or push to `main`.
- Permissions: `contents: read`; `actions: write` only if required for artifacts (default `GITHUB_TOKEN` artifact upload is enough).

## Honesty vs merge CI

A green `ci.yml` check MUST NOT be described as “golden-set passed.” Delivery status treats this workflow as **not_run** until an artifact from a real dispatch/schedule exists.
