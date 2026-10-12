# Quickstart: Reject Insufficient Markdown Sources

Validation guide for this cycle. Implementation details live in later `tasks.md`. Contracts: [source-sufficiency.md](./contracts/source-sufficiency.md), [question-uniqueness.md](./contracts/question-uniqueness.md), [error-codes.md](./contracts/error-codes.md), [error-copy.md](./contracts/error-copy.md).

## Prerequisites

- Existing local workspace: PostgreSQL via Compose, `pnpm` install, `.env` as today.
- No live model key is required. Default E2E continues to override source/generation ports except where a test supplies a fetch transport.
- Happy-path snapshots (`SAMPLE_SNAPSHOT`, `FIXTURE_SNAPSHOT`, Express/Nest E2E markdown) MUST already contain **≥ 8** unique keepable claims before count-8 success tests are expected to pass.

## Commands

From the repository root:

```bash
pnpm test --filter=@ai-quiz/domain --filter=@ai-quiz/application
pnpm test --filter=api
pnpm test --filter=web
pnpm test:e2e --filter=api
```

Use the workspace’s usual `DATABASE_URL` for API E2E (`ai_quiz_test`). Do not mark this feature done if only unit tests ran.

## Expected outcomes

### 1. Empty and whitespace Markdown (P1)

- Application: snapshot `""` or `"   \n"` → `SOURCE_UNUSABLE`; `generate` not called; store empty.
- E2E: fetch body empty / whitespace, `content-type: text/plain` → **422** `{ "code": "SOURCE_UNUSABLE" }`; zero `ready` quizzes.
- Setup copy for that code: **That source does not have enough information to generate a quiz.**

### 2. Limited-information Markdown (P1)

- Heading-only, comments-only, and repeated-sentence fixtures → `SOURCE_UNUSABLE`; `generate` not called.
- Character count alone does not pass (repeated sentence of any length still fails).

### 3. One section at 8 questions (P1)

- Canonical one-section fixture + `questionCount: 8` → `SOURCE_UNUSABLE`; nothing playable; no duplicate questions stored.
- Six-claim body + count 8 → `SOURCE_UNUSABLE`; same body + count 5 MAY generate.

### 4. Duplicate prompts from generation (P1)

- Mock `generate` returns unique-count questions with two prompts equal after trim/case-fold.
- Create fails closed after the existing retry bound (`GENERATION_RETRIES_EXHAUSTED` or `GENERATION_INVALID`); zero `ready` quizzes.
- Domain `validateQuiz` rejects the same duplicate-prompt quiz in isolation.

### 5. Rich sources still work (P2)

- Expanded multi-claim snapshot + count 5 and count 8 → ready quiz of that length; prompts unique; grounding still required.
- Default E2E create/get/start/submit path still passes on the fixture bank.

### 6. Unchanged safety

- Unsafe destinations, oversized bodies, unsupported types, and scoring still match earlier phases.
- Error bodies contain no API keys, answer keys, or provider traces.

## Definition of done (this cycle)

All fixtures in FR-013 fail closed or succeed as specified above. Setup shows the clarified `SOURCE_UNUSABLE` sentence. No new tables, codes, or screens. `/speckit-tasks` is the next command; this quickstart is not an implementation license.
