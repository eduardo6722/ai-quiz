# Contract: Interview documentation, review, and walkthrough

**Feature**: [spec.md](../spec.md)

## Files

| Path | Must contain |
| ---- | ------------ |
| `README.md` | Index + local DX startup; links to the docs below; no claim that deploy/baseline/calibration is done without evidence |
| `docs/architecture.md` | Mermaid (or equivalent) data-flow: topic+HTTPS Markdown URL → SSRF-safe fetch (untrusted Markdown) → `QuizGenerationPort` → validate/persist → sanitized GET quiz → start attempt (token once, hash stored) → submit → deterministic weighted score. Hexagonal boxes: `domain` / `application` / `contracts` vs `apps/api` adapters vs `apps/web` |
| `docs/data-model.md` | Mermaid ER of the seven Prisma models; `isCorrect` annotated server-only; uniqueness called out in prose |
| `docs/api-examples.md` | curl + JSON for `POST /v1/quizzes`, `GET /v1/quizzes/:id` (**no** correctness flags), `POST .../attempts` (token only here), `POST /v1/attempts/:id/submit` with `Authorization: Bearer`, `GET .../result`, `GET /health`, `GET /ready` |
| `docs/deployment.md` | CI, images, `compose.prod.yml`, migrate deploy, env table, rollback, backup, troubleshooting (lockfile drift, unhealthy Postgres, missing key ≠ fixture fallback) |
| `docs/walkthrough.md` | 5–10 minute timed beats (see below) |
| `docs/delivery-status.md` | P0 / P1 / P2 rows with `passed` \| `failed` \| `not_run` |

## Walkthrough beats (required, 5–10 minutes)

1. Ingestion: configurable URL, GitHub blob→raw, SSRF, size/timeout, snapshot+checksum  
2. Generation: structured output, 5–8 × four options, Markdown as data not instructions  
3. Quality: golden set exists; human calibration and accepted baseline **not_run** (unless evidenced); judges do not grade learners  
4. Boundaries: domain/application vs adapters; web never sees keys pre-submit  
5. Persistence: ER + transactional submit + idempotent resubmit  
6. Scoring: single 4/0; multi one point per correct option 0–4; `weight = 1.1 ** index`; store 0–4; percentage display-only  

Optional deep-dives after 10 minutes: Langfuse fields, limiter numbers, Dockerfile stages.

## Delivery-status required rows

Must appear, with honest state:

- P0 two-source demo, scoring, REST, web flow, Jest suites  
- P1 Langfuse/limits (Phase 6)  
- P1 golden harness (Phase 7)  
- P1 human calibration — **not_run** unless labels exist  
- P1 accepted baseline / regression — **not_run** unless `--accept-baseline` was used  
- P1 merge-time CI  
- P1 production images  
- P1 gated eval workflow (existence vs last live artifact)  
- P1 live publish/deploy — **not_run** without a log  
- P2 extras and second strategy — **not_run** / deferred  

## Read-only review

- Invoke `.agents/skills/code-review/SKILL.md` on this cycle’s diff.  
- Manual PR checklist in `docs/deployment.md` or README: tests in CI **plus** review; LLM review does not replace Jest.  
- Seeded scoring or pre-submit leak demonstration: throwaway change, confirm the checklist flags it, **revert**. The seed MUST NOT remain on the delivered branch.

## Forbidden in published docs

Real API keys, database passwords, raw attempt tokens, `isCorrect` on get-quiz examples, “deployed to production” without a workflow/host log, “baseline passed” while regression is **not_run**.
