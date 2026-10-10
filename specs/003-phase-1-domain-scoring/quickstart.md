# Quickstart: Phase 1 domain scoring

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [create-quiz.md](./contracts/create-quiz.md), [submit-answers.md](./contracts/submit-answers.md), [public-quiz-view.md](./contracts/public-quiz-view.md), [public-result.md](./contracts/public-result.md), [error-codes.md](./contracts/error-codes.md)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume the Phase 0 workspace already exists and Phase 1 domain/contracts code described in the plan has been implemented.

## Prerequisites

- Node.js 24 (Active LTS) and pnpm (pinned by root `packageManager`)
- Phase 0 install: `pnpm install` from the repo root
- **PostgreSQL is not required.** Do not start Compose for this phase.
- No `OPENAI_API_KEY` or Langfuse values

## Quality commands

From the repo root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four MUST succeed. `pnpm test` MUST include `@ai-quiz/domain`, `@ai-quiz/application` and `@ai-quiz/contracts`.

Targeted packages:

```bash
pnpm --filter @ai-quiz/domain test
pnpm --filter @ai-quiz/application test
pnpm --filter @ai-quiz/contracts test
```

## Scoring fixtures to confirm

When tests pass, the suite has proven at least:

| Check | Expected |
| ----- | -------- |
| Single-answer correct / wrong | 4 / 0 |
| Multiple-answer `k` correct selected, no extras | score `k` (0–4), not rescaled to 4 |
| Multiple-answer extra wrong options | no penalty |
| Isolated weights `[4, 2, 0]` | unrounded `6.2 / 3.31`, display `1.87` / `46.83` |
| All-correct 5–8 question quiz | weighted score `4` |
| All-wrong 5–8 question quiz | weighted score `0` |
| 8-question quiz index 7 | weight `1.1 ** 7`; swapping positions changes the total |
| Incomplete attempt | `ATTEMPT_INCOMPLETE`, no numeric score |
| Illegal / duplicate selection | `SELECTION_ILLEGAL` |
| Public quiz view | schema rejects `isCorrect` |
| Public result | includes `isCorrect` and scores |
| Second `gradeAttempt` with different answers | original frozen result |

## What not to run as Phase 1 acceptance

- `docker compose up` / `GET /ready` — Phase 0 only; not scoring proof
- `POST /v1/quizzes` — must not exist
- Generating a quiz from a README URL
- Opening a quiz player in the browser

## Scope check

Inspect the diff for this cycle:

- No new Prisma models or migrations for `SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`
- No `apps/api/src/modules/quiz/` REST adapters
- Domain and application `package.json` still list no Nest/Prisma/Next/OpenAI/AI SDK/Langfuse
- `@ai-quiz/contracts` may depend on `zod`; domain must not
