# Interview walkthrough (5–10 minutes)

Required beats only. Optional deep-dives are listed at the end — skip them if the clock hits 10 minutes.

## 1. Ingestion (~1.5 min)

A learner submits a topic and an HTTPS Markdown URL. GitHub `blob` links become raw. The API fetches with a timeout and size cap, allows public destinations only (SSRF), and treats the body as untrusted task data. A snapshot and SHA-256 checksum land on `SourceDocument`.

## 2. Generation (~1.5 min)

`QuizGenerationPort` produces structured output: 5–8 questions, exactly four options, single or multiple. Invalid JSON is retried a bounded number of times; failure does not persist a playable quiz. Keys stay on the server.

## 3. Quality evaluation (~1 min)

A versioned golden set and `pnpm eval:golden` exist. Live runs are **not** merge-time CI. Human calibration and an accepted frozen baseline are **not_run**. Judges never write the learner score.

## 4. Boundaries (~1.5 min)

`packages/domain` and `packages/application` have no Nest, Prisma, Next, or OpenAI types. `apps/web` consumes public DTOs only — no `isCorrect` before submit. Adapters live in `apps/api` under `quiz/`, `attempt/`, and `platform/`.

## 5. Persistence (~1.5 min)

Seven tables: source, quiz, question, option, attempt, answer, selection. Uniqueness on positions, labels, and one answer per question. The attempt token is shown once; only a hash is stored. Submit scores and finalizes in one transaction; a second submit is idempotent.

See [data-model.md](./data-model.md).

## 6. Scoring (~1.5 min)

- Single: 4 if the exact correct option, else 0
- Multiple: one point per correctly selected option, clamped to 0–4 (provisional; no invented penalty)
- `weight(i) = 1.1 ** i` in quiz order; weighted average stored on 0–4
- Percentage is display-only; rounding is display-only

## Optional after 10 minutes

- Phase 6 limiter numbers and Langfuse stages
- Dockerfile stages and `compose.prod.yml` migrate oneshot
- Gated `llm-evals.yml` vs green `ci.yml`
