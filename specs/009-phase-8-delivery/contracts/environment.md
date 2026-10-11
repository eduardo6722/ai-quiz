# Contract: Production environment and secrets

**Feature**: [spec.md](../spec.md)  
**Extends**: Phase 0 `.env.example` — still no real secret **values** in git

## Boot vs live vs evaluation

| Name | Boot API | Boot web | Live create-quiz | Gated eval | Image build-arg |
| ---- | -------- | -------- | ---------------- | ---------- | --------------- |
| `DATABASE_URL` | required | forbidden | required | not required | **forbidden** |
| `PORT` | optional (3001) | — | — | — | no |
| `WEB_ORIGIN` | optional | — | CORS | — | no |
| `NEXT_PUBLIC_API_URL` | — | required (public) | — | — | **allowed** (public origin) |
| `OPENAI_API_KEY` | optional | forbidden | required | required for live | **forbidden** |
| `OPENAI_MODEL` | optional | forbidden | required for live | required for live | no |
| `LANGFUSE_*` | optional | forbidden | optional traces | optional destination | **forbidden** |
| `EVAL_JUDGE_MODEL` | — | — | — | optional | **forbidden** |
| `NODE_ENV` | `production` in prod images | `production` | — | — | may set in Dockerfile |

## Failure mapping (unchanged product codes)

- Missing/invalid `DATABASE_URL` at API boot: process exit; message names the key.
- Missing model key on create-quiz: existing generation error, **not** Phase 2 fixtures.
- `/health`: no DB, no model, no tracing.
- `/ready`: DB only.

## Logging and images

Redaction from Phase 6 still applies. Workflow logs, `docker build` logs, and `compose.prod.yml` MUST NOT echo secret values. Do not use `docker build --build-arg OPENAI_API_KEY=...`.

## `.env.example` additions this phase

Comments only, for example:

- Production Compose uses `compose.prod.yml` and volume `ai_quiz_prod_pgdata`
- CI integration URL is `ai_quiz_test`
- `pnpm db:migrate:deploy` for CI/prod
- Registry/deploy variables live in GitHub Environments, not this file

Still leave `OPENAI_API_KEY=` empty.
