---
description: "Task list for Phase 3 secure Markdown ingestion and OpenAI quiz generation (roadmap Phase 3 only)"
---

# Tasks: Phase 3 Secure Markdown Ingestion and OpenAI Quiz Generation

**Input**: Design documents from `/specs/005-phase-3-markdown-generation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Roadmap phase**: Phase 3 — Secure Markdown ingestion and OpenAI quiz generation. Spec Kit “Phase 1/2” headings below are setup/foundation for **this** cycle only. Do not start roadmap Phases 4–7.

**Tests**: Included. Spec FR-020, user stories, Constitution VI, and `quickstart.md` require Jest adapter/policy tests (fake transport / mocked `generateText`), application tests with mocked ports, Jest + PostgreSQL integration, Jest + Supertest E2E with **port overrides**, and a gated live README file. Write listed tests first and confirm they fail before implementation. Default `pnpm test` MUST NOT require PostgreSQL, live DNS, or `OPENAI_API_KEY`. `pnpm test:integration` and `pnpm test:e2e` require `ai_quiz_test`. Live file runs only when `PHASE3_LIVE_README=1` and `OPENAI_API_KEY` are set.

**Organization**: Setup → Foundational (blocks stories) → user stories in spec priority → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`–`US6`) on story-phase tasks only
- Every task includes an exact file path

## Path Conventions

- Domain: `packages/domain/src/`
- Application: `packages/application/src/`
- Contracts: `packages/contracts/src/`
- API: `apps/api/src/modules/quiz/`
- Fetch adapter: `apps/api/src/modules/quiz/adapters/out/source-fetch/`
- LLM adapter: `apps/api/src/modules/quiz/adapters/out/llm/`
- Integration tests: `apps/api/test/integration/`
- API tests: `apps/api/test/e2e/`
- Do **not** add quiz UI routes, a second live README package, Langfuse, production Dockerfiles, or GitHub Actions
- Do **not** silently fall back to fixture adapters on the product create path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Directories, AI SDK dependency, env docs, and E2E port overrides so existing suites stay offline after the product module swap. Do not reinitialize Spec Kit or overwrite the Constitution.

- [X] T001 Create directories `apps/api/src/modules/quiz/adapters/out/source-fetch/` and `apps/api/src/modules/quiz/adapters/out/llm/` per plan.md
- [X] T002 Add `ai` and `@ai-sdk/openai` to `apps/api/package.json` with `pnpm --filter @ai-quiz/api add ai @ai-sdk/openai` (Zod 4 compatible); do **not** add them to `packages/domain/package.json` or `packages/application/package.json`; do not add Langfuse
- [X] T003 [P] Set `OPENAI_MODEL=gpt-4o-mini` in `.env.example` and document that `OPENAI_API_KEY` / `OPENAI_MODEL` are required for product create and live evidence but **MUST NOT** be required to boot the API; keep Langfuse placeholders unused; do not commit `.env`
- [X] T004 [P] Add typed placeholders `apps/api/src/modules/quiz/adapters/out/source-fetch/public-ip.ts`, `github-blob.ts`, `fetch-transport.ts`, `normalize-markdown.ts`, `https-markdown-source.adapter.ts` and `apps/api/src/modules/quiz/adapters/out/llm/generated-quiz.schema.ts`, `quiz-prompt.ts`, `openai-quiz-generation.adapter.ts`
- [X] T005 Override `MARKDOWN_SOURCE_PORT` and `QUIZ_GENERATION_PORT` in `apps/api/test/e2e/create-app.ts` (and the integration helper `apps/api/test/integration/create-fixture-quiz.ts` if it boots `AppModule`) with `FixedSourceAdapter` / `FixedGenerationAdapter` so default `pnpm test:e2e` stays offline and key-free **before** `QuizModule` is swapped

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Error codes, domain port/type tweaks, env, Prisma field writes, fetch transport type, and grounding helper used by every story. **No user story work until this phase is complete.**

- [X] T006 Extend `ErrorCodes` in `packages/contracts/src/error-codes.ts` with `SOURCE_UNSAFE_DESTINATION`, `SOURCE_UNSUPPORTED_TYPE`, `SOURCE_TOO_LARGE`, `SOURCE_TIMEOUT`, `SOURCE_UNUSABLE`, `SOURCE_FETCH_FAILED`, `GENERATION_INVALID`, `GENERATION_RETRIES_EXHAUSTED`, `GENERATION_UPSTREAM_FAILED` matching [contracts/error-codes.md](./contracts/error-codes.md); keep Phase 2 codes
- [X] T007 [P] Extend `ApplicationErrorCode` in `packages/application/src/errors.ts` with the same nine codes and English non-secret messages; do not import Nest or `ai`
- [X] T008 Map the nine codes in `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.ts` to HTTP 400 / 413 / 415 / 422 / 502 / 504 per [contracts/error-codes.md](./contracts/error-codes.md); never include stack, Prisma traces, SDK `cause`, prompts, tokens, hashes, API keys or `isCorrect`; extend `apps/api/src/modules/quiz/adapters/in/rest/http-error.filter.spec.ts`
- [X] T009 [P] Add optional `sourceExcerpt?: string` to `Question` in `packages/domain/src/quiz.ts`; `validateQuiz` MUST NOT require excerpts (fixture quizzes remain valid)
- [X] T010 Change `QuizGenerationPort.generate` in `packages/domain/src/ports/quiz-generation-port.ts` to return `{ questions: Question[]; modelId?: string }` (`questions` length `count` 5–8)
- [X] T011 [P] Add optional `modelId?: string | null` to `InsertQuizInput` in `packages/domain/src/ports/quiz-repository-port.ts`; insert/find only — still no update of ready prompts/labels/positions/`isCorrect`
- [X] T012 Export updated types from `packages/domain/src/index.ts`; domain `package.json` still has no Nest/Prisma/Zod/OpenAI/`ai`/Langfuse
- [X] T013 Update `FixedGenerationAdapter` in `apps/api/src/modules/quiz/adapters/out/fixture/fixed-generation.adapter.ts` to return `{ questions }` (omit `modelId`); keep ignoring topic/source for fixture content
- [X] T014 Update `CreateQuizUseCase` in `packages/application/src/create-quiz.ts` and mocks in `packages/application/src/create-quiz.spec.ts`, `apps/api/test/integration/quiz-immutability.spec.ts`, and any other `QuizGenerationPort` stubs to destructure `{ questions }` so the workspace typechecks; do **not** add retry/grounding yet
- [X] T015 Write `modelId` (nullable) and `sourceExcerpt` on insert in `apps/api/src/modules/quiz/adapters/out/prisma/quiz.prisma-repository.ts`; map `sourceExcerpt` in `apps/api/src/modules/quiz/adapters/out/prisma/quiz-mapper.ts` onto domain `Question` (still omit from `toPublicQuizView`); **no new Prisma migration** (columns already exist)
- [X] T016 Parse optional `OPENAI_API_KEY` and `OPENAI_MODEL` in `apps/api/src/infrastructure/env.ts` (empty allowed); `parseApiEnv` MUST still succeed without them; never log values; keep `apps/api/test/env.spec.ts` asserting boot without OpenAI/Langfuse keys
- [X] T017 [P] Define `FetchTransport` (`lookup(host)` → `{ address, family }[]`; pinned `get` with timeout/maxBytes) in `apps/api/src/modules/quiz/adapters/out/source-fetch/fetch-transport.ts` with a Node `dns`/`https` default export; no `fetch` with `redirect: 'follow'`
- [X] T018 [P] Implement `assertGrounded(questions, snapshotText)` in `packages/application/src/grounding.ts`: every question MUST have a non-empty `sourceExcerpt` that is a contiguous substring of the normalized snapshot; throw `ApplicationError` `GENERATION_INVALID` otherwise; add `packages/application/src/grounding.spec.ts`
- [X] T019 Re-export new error codes from `packages/application/src/index.ts` and `packages/contracts/src/index.ts` as needed; `pnpm typecheck` and default `pnpm test` still pass without Postgres or a model key

**Checkpoint**: Codes, ports, env, Prisma field writes, transport type and grounding helper exist. Product `QuizModule` still wires fixtures. Default `pnpm test` / overridden e2e still pass.

---

## Phase 3: User Story 1 - Generate a retrievable quiz from a real README and topic (Priority: P1) 🎯 MVP

**Goal**: Product create fetches Markdown and generates a 5–8 question quiz; GET returns the sanitized view; start/submit still work. Default e2e stays on port overrides; gated live README proves the definition of done.

**Independent Test**: Overridden e2e create→get still `201`/`200` with four options and no keys. With `OPENAI_API_KEY` and `PHASE3_LIVE_README=1`, `POST /v1/quizzes` for `https://github.com/expressjs/express/blob/master/Readme.md` + topic `Express routing` + count 5 returns ready; GET shows five grounded questions and no `isCorrect`.

### Tests for User Story 1 ⚠️

> Write these tests FIRST and ensure they FAIL before implementation.

- [X] T020 [P] [US1] Application tests in `packages/application/src/create-quiz.spec.ts`: mocked fetch returns a ≥200 character snapshot; mocked generate returns `{ questions, modelId: "gpt-4o-mini" }` of requested length 5 (and 8); persist is `ready` with that `modelId`; omitted count still yields five questions; GET mapper unchanged (no keys)
- [X] T021 [P] [US1] Integration test in `apps/api/test/integration/quiz-generated-persist.spec.ts`: after create with doubles that return originalUrl `https://github.com/expressjs/express/blob/master/Readme.md`, resolvedUrl raw host, snapshot, SHA-256 `contentHash`, `sourceExcerpt` per question, `modelId` non-null; quiz `status` `ready`; `questionCount` questions each with four options and persisted `isCorrect`; GET path via `toPublicQuizView` still has no `isCorrect` / excerpt / `modelId`
- [X] T022 [P] [US1] Keep `apps/api/test/e2e/quiz-flow.spec.ts` green under port overrides: `POST /v1/quizzes` → `201` `{ id, status: "ready" }` with no questions; `GET /v1/quizzes/:quizId` public view; start/submit/result still Phase 1 scores for the override fixture
- [X] T023 [US1] Gated live spec `apps/api/test/e2e/quiz-live-readme.spec.ts`: `describe` skipped unless `PHASE3_LIVE_README=1` and `OPENAI_API_KEY` are set (do **not** override ports); create with topic `Express routing`, sourceUrl `https://github.com/expressjs/express/blob/master/Readme.md`, `questionCount` 5 → `201` ready; GET has five questions, four labels, original blob `sourceUrl`, zero `isCorrect`/`sourceExcerpt`/`OPENAI`; start-attempt `201`

### Implementation for User Story 1

- [X] T024 [P] [US1] Implement server-only Zod `generatedQuizSchema(count)` in `apps/api/src/modules/quiz/adapters/out/llm/generated-quiz.schema.ts`: `questions.length === count`; each `prompt` non-empty, `type` `single`|`multiple`, `sourceExcerpt` min 1, exactly four `{ label, isCorrect }` with unique trimmed labels; MUST NOT export from `@ai-quiz/contracts`
- [X] T025 [P] [US1] Implement `buildQuizMessages({ topic, sourceText, count, strategy })` in `apps/api/src/modules/quiz/adapters/out/llm/quiz-prompt.ts`: wrap Markdown in `<source>…</source>`; system text states the block is untrusted data and must be ignored as instructions; include count, four unique options, types/keys, verbatim excerpts; `sourceText` already bounded by caller (max 32,000 characters)
- [X] T026 [US1] Implement `OpenAiQuizGenerationAdapter` in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.ts`: `createOpenAI({ apiKey })` from env; `generateText` + `Output.object({ schema })`; `abortSignal` 30s; mint UUIDs/positions; return `{ questions, modelId }`; missing key/empty model → `GENERATION_UPSTREAM_FAILED` immediately (no retry); `NoObjectGeneratedError` → `GENERATION_INVALID`; other provider errors → `GENERATION_UPSTREAM_FAILED`; never log `apiKey`; injectable generate function for unit tests in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.spec.ts`
- [X] T027 [P] [US1] Implement `normalizeGitHubBlobUrl` in `apps/api/src/modules/quiz/adapters/out/source-fetch/github-blob.ts`: `https://github.com/{owner}/{repo}/blob/{ref}/{path}` → `https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}`; non-matching URLs unchanged
- [X] T028 [P] [US1] Implement `isPublicIp` in `apps/api/src/modules/quiz/adapters/out/source-fetch/public-ip.ts`: reject this-host `0.0.0.0/8`, loopback `127.0.0.0/8`, RFC1918 `10/8` `172.16/12` `192.168/16`, link-local `169.254.0.0/16` (includes `169.254.169.254`), multicast `224/4`, unspecified; IPv6 `::`, `::1`, unique-local `fc00::/7`, link-local `fe80::/10`, multicast `ff00::/8`; IPv4-mapped forms of the above
- [X] T029 [P] [US1] Implement `normalizeMarkdown` in `apps/api/src/modules/quiz/adapters/out/source-fetch/normalize-markdown.ts`: UTF-8, reject NULs/binary, trim, strip HTML comments; optional title from first ATX `# heading`; SHA-256 hex of persisted UTF-8 snapshot
- [X] T030 [US1] Implement `HttpsMarkdownSourceAdapter` in `apps/api/src/modules/quiz/adapters/out/source-fetch/https-markdown-source.adapter.ts`: scheme `https` only; port 443 or omitted; no userinfo; blob rewrite then DNS; all IPs public; TLS to **pinned** IP with SNI/Host; `redirect` manual (follow up to 3 HTTPS hops, re-check policy); wait 10 seconds; max body 512 KiB; allow `text/markdown`, `text/x-markdown`, `text/plain`; `raw.githubusercontent.com` may omit Content-Type if UTF-8; persist originalUrl, resolvedUrl, snapshot, hash, fetchedAt, title?; injectable `FetchTransport`; throw `ApplicationError` `SOURCE_*` codes from [contracts/source-fetch.md](./contracts/source-fetch.md)
- [X] T031 [US1] Extend `CreateQuizUseCase` in `packages/application/src/create-quiz.ts`: after fetch, reject snapshot shorter than **200** characters as `SOURCE_UNUSABLE` (not `QUIZ_INVALID`); pass first **32,000** characters as `sourceText`; call `assertGrounded` then `validateQuiz` before insert; pass `modelId` into `InsertQuizInput`; generation window must not replace the persisted full snapshot; still no `ai`/HTTP imports in application
- [X] T032 [US1] Wire `HttpsMarkdownSourceAdapter` and `OpenAiQuizGenerationAdapter` in `apps/api/src/modules/quiz/quiz.module.ts` replacing `FixedSourceAdapter` / `FixedGenerationAdapter` on the product path; keep fixture classes for test overrides only; `GET /health` and `GET /ready` MUST NOT fetch URLs or call the model

**Checkpoint**: Overridden e2e flow still works. Product module uses real adapters. Gated live README create/get succeeds when the key is present. SSRF matrix, injection, retries, and unusable-source suites may still fail.

---

## Phase 4: User Story 2 - Fetch only safe public Markdown sources (Priority: P1)

**Goal**: Private/loopback/link-local/metadata destinations, unsafe redirects, `http`, timeouts, oversized bodies, and wrong content types fail closed with `SOURCE_*` and no ready quiz. Supported GitHub blob URLs retrieve raw Markdown.

**Independent Test**: Adapter unit tests with fake `FetchTransport` (no real sockets) plus e2e `quiz-source-errors.spec.ts` for HTTP mapping; `https://127.0.0.1/README.md` → `SOURCE_UNSAFE_DESTINATION`.

### Tests for User Story 2 ⚠️

- [X] T033 [P] [US2] Unit tests in `apps/api/src/modules/quiz/adapters/out/source-fetch/public-ip.spec.ts` covering loopback, RFC1918, `169.254.169.254`, IPv6 ULA/link-local/`::1`, IPv4-mapped `::ffff:127.0.0.1`, and a public address that must pass
- [X] T034 [P] [US2] Unit tests in `apps/api/src/modules/quiz/adapters/out/source-fetch/github-blob.spec.ts`: blob → raw; gist/non-blob unchanged; malformed blob-like path unchanged
- [X] T035 [US2] Adapter tests in `apps/api/src/modules/quiz/adapters/out/source-fetch/https-markdown-source.adapter.spec.ts` with fake transport: loopback/private/link-local DNS → `SOURCE_UNSAFE_DESTINATION`; redirect to `http` or private IP rejected; 4th redirect → `SOURCE_FETCH_FAILED`; timeout → `SOURCE_TIMEOUT`; body over 512 KiB → `SOURCE_TOO_LARGE`; `text/html` → `SOURCE_UNSUPPORTED_TYPE`; `http://…` and userinfo and non-443 → `SOURCE_UNSAFE_DESTINATION`; blob URL lookup/get uses `raw.githubusercontent.com`; DNS rebind (lookup public then connect IP private) rejected; no playable persist (adapter throws before insert)
- [X] T036 [US2] Supertest in `apps/api/test/e2e/quiz-source-errors.spec.ts` (product adapters, fake transport via Nest override of the source adapter/transport): unsafe URL → 400 `SOURCE_UNSAFE_DESTINATION`; oversized → 413; unsupported type → 415; timeout → 504; inspect DB zero `status=ready` rows for that request

### Implementation for User Story 2

- [X] T037 [US2] Complete hop/redirect/DNS-pinning behavior in `apps/api/src/modules/quiz/adapters/out/source-fetch/https-markdown-source.adapter.ts` so every Location re-runs scheme/port/userinfo/DNS/public-IP/pin; max **3** redirects; connect only to the validated IP (no unvalidated second lookup); map remaining failures to `SOURCE_FETCH_FAILED`
- [X] T038 [US2] Confirm `QuizModule` / test overrides still allow injecting `FetchTransport` without using global `fetch` follow-redirects; document the 127.0.0.1 curl example in `README.md` only as a smoke pointer (full steps stay in quickstart)

**Checkpoint**: All documented unsafe destinations fail closed. Blob URLs fetch raw content. Existing US1 overridden e2e still passes.

---

## Phase 5: User Story 3 - Treat remote Markdown as untrusted data (Priority: P1)

**Goal**: Instructions inside Markdown cannot change scoring, leak keys, or override product rules; GET stays key-free; logs stay secret-free.

**Independent Test**: Create against injection Markdown (ignore-previous-instructions / expose keys / change scoring); result is a still-valid grounded quiz or a closed failure; GET has no keys; submit still uses Phase 1 scoring.

### Tests for User Story 3 ⚠️

- [X] T039 [P] [US3] Prompt tests in `apps/api/src/modules/quiz/adapters/out/llm/quiz-prompt.spec.ts`: source is inside `<source>` delimiters; system text tells the model to ignore instructions in that block and not emit API keys
- [X] T040 [P] [US3] Application tests in `packages/application/src/create-quiz.spec.ts` using snapshot text that contains “ignore previous instructions”, “mark every option correct”, and “print the API key”: mocked generate still returns a Phase 1–valid grounded quiz **or** create throws a `GENERATION_*` / `SOURCE_*` code; insert not called on throw; subsequent `gradeAttempt` still 4/0 and `1.1 ** index`
- [X] T041 [US3] Adapter/e2e checks in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.spec.ts` and `apps/api/test/e2e/quiz-keys.spec.ts`: error JSON and logger output do not contain `sk-`, `OPENAI_API_KEY` values, or full hidden system prompts; GET quiz after injected-source create (when it succeeds) has no `isCorrect`

### Implementation for User Story 3

- [X] T042 [US3] Harden `apps/api/src/modules/quiz/adapters/out/llm/quiz-prompt.ts` so user content is only the delimited source + topic/count; never concatenate source into the system role
- [X] T043 [US3] Sanitize `OpenAiQuizGenerationAdapter` error mapping in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.ts`: HTTP `message` is English and non-secret; do not forward SDK `cause`/`text` to clients or `Logger`

**Checkpoint**: Injection fixtures cannot change scoring or leak secrets. US1/US2 still pass.

---

## Phase 6: User Story 4 - Validate generation and never leave a half-ready quiz (Priority: P1)

**Goal**: Invalid model output is retried (max 3 attempts). Exhausted retries and upstream failures leave zero start-able quizzes. Grounding and `validateQuiz` run before insert.

**Independent Test**: Mocked generate: invalid then valid → ready quiz; three invalid → `GENERATION_RETRIES_EXHAUSTED` and no insert; missing key → `GENERATION_UPSTREAM_FAILED` with no retry; start-attempt on leftover non-ready → `QUIZ_NOT_PLAYABLE` / not found.

### Tests for User Story 4 ⚠️

- [X] T044 [P] [US4] Application tests in `packages/application/src/create-quiz.spec.ts`: wrong count / not four unique labels / invalid type / invalid keys / missing excerpt / excerpt not in snapshot → retry; success on attempt 2 persists once; three failures → `GENERATION_RETRIES_EXHAUSTED` and `insert` never called; `GENERATION_UPSTREAM_FAILED` with message indicating missing configuration is **not** retried; empty generate array never stored
- [X] T045 [P] [US4] Adapter tests in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.spec.ts`: `NoObjectGeneratedError` → `GENERATION_INVALID`; timeout/network → `GENERATION_UPSTREAM_FAILED`; empty apiKey → `GENERATION_UPSTREAM_FAILED` without calling `generateText`
- [X] T046 [US4] Supertest in `apps/api/test/e2e/quiz-generation-errors.spec.ts` (override generation port): always-invalid generate → 422 `GENERATION_RETRIES_EXHAUSTED`; upstream throw → 502 `GENERATION_UPSTREAM_FAILED`; DB has zero `ready` quizzes for those requests; start-attempt on any `failed` leftover is 409 `QUIZ_NOT_PLAYABLE` without keys

### Implementation for User Story 4

- [X] T047 [US4] Implement the 3-attempt loop in `packages/application/src/create-quiz.ts` per [research.md](./research.md) section 7: retry `GENERATION_INVALID`, grounding failures, and retryable upstream; do not retry fetch or missing-key upstream; after exhaustion throw `GENERATION_RETRIES_EXHAUSTED` (invalid) or `GENERATION_UPSTREAM_FAILED` (upstream); call `insert` only after `assertGrounded` + `validateQuiz`; never persist `status=generating`; prefer no row on failure
- [X] T048 [US4] Guarantee create transaction rollback in `packages/application/src/create-quiz.ts` / Prisma UoW so a thrown error cannot leave a partial question set startable

**Checkpoint**: Invalid generation cannot become a playable quiz. US1 happy path still persists on first valid attempt.

---

## Phase 7: User Story 5 - Keep model secrets server-side and answer keys private before submit (Priority: P1)

**Goal**: Clients never receive API keys, model calls, or pre-submit correctness. Create/get omit keys; result after submit still includes `isCorrect` as in Phase 2.

**Independent Test**: Create/GET bodies have zero `isCorrect`, scores, excerpts, `modelId`, `sk-`; web package has no `ai`/`OPENAI_API_KEY`; failed create error body has a stable code only.

### Tests for User Story 5 ⚠️

- [X] T049 [P] [US5] Assert `publicQuizViewSchema` still rejects `isCorrect`, `sourceExcerpt`, `modelId` in `packages/contracts/src/public-quiz.spec.ts`; `toPublicQuizView` test in `packages/application/src/map-public.spec.ts` or `get-quiz.spec.ts` lists option `{ id, position, label }` only
- [X] T050 [P] [US5] Extend `apps/api/test/e2e/quiz-keys.spec.ts`: create body has no questions/keys/excerpts/modelId; GET options have no `isCorrect`/excerpt even if a token is sent; generation-failure error has no `sk-` / prompt dump; after submit, result still includes `isCorrect` and per-question scores
- [X] T051 [US5] Scan test in `apps/web` (e.g. `apps/web/src/env.spec.ts` or a small `apps/web/src/no-openai.spec.ts`): web env/bundle surface has no `OPENAI_API_KEY` and no import of `ai` / `@ai-sdk/openai`

### Implementation for User Story 5

- [X] T052 [US5] Keep serializers on `toPublicQuizView` in `packages/application/src/map-public.ts` and GET controller; do not add `sourceExcerpt` or `modelId` to public quiz JSON in `apps/api/src/modules/quiz/adapters/in/rest/quiz.controller.ts`
- [X] T053 [US5] Confirm `apps/web` and `packages/ui` `package.json` have no `ai` / `@ai-sdk/openai`; API env values used only in `apps/api/src/modules/quiz/adapters/out/llm/openai-quiz-generation.adapter.ts` and `apps/api/src/infrastructure/env.ts`

**Checkpoint**: Pre-submit privacy matches Phase 2 plus no model secrets. Scoring/result unchanged.

---

## Phase 8: User Story 6 - Persist a bounded snapshot and reject unusable sources (Priority: P2)

**Goal**: Successful fetch stores original URL, resolved URL, snapshot, checksum, fetch time. Empty/short/binary/oversize sources are rejected before generation. Generation uses a 32,000 character window.

**Independent Test**: Valid double-fetch of the same bytes → matching SHA-256; empty/whitespace/binary → `SOURCE_UNUSABLE` and `generate` not called; oversize → `SOURCE_TOO_LARGE`; large-but-allowed snapshot persists in full while generate receives ≤32,000 characters.

### Tests for User Story 6 ⚠️

- [X] T054 [P] [US6] Tests in `apps/api/src/modules/quiz/adapters/out/source-fetch/normalize-markdown.spec.ts`: NUL/binary rejected; HTML comments stripped; title from first `# heading`; identical UTF-8 snapshots share SHA-256 hex; length 199 after normalize is unusable, 200 is usable
- [X] T055 [P] [US6] Application tests in `packages/application/src/create-quiz.spec.ts`: snapshot 201 characters → generate called with `sourceText.length <= 32000`; persisted snapshot passed to insert is the full mocked snapshot; snapshot `"   "` or 199 chars → `SOURCE_UNUSABLE` and `generate` not called; snapshot over 512 KiB → fail before generate (`SOURCE_TOO_LARGE` or existing size check)
- [X] T056 [US6] Integration in `apps/api/test/integration/quiz-generated-persist.spec.ts`: stored `contentHash` equals SHA-256 of `contentSnapshot`; `fetchedAt` set; `originalUrl` ≠ `resolvedUrl` when the double simulates blob→raw

### Implementation for User Story 6

- [X] T057 [US6] Enforce min **200** characters after normalize in `HttpsMarkdownSourceAdapter` (`SOURCE_UNUSABLE`) and keep the 512 KiB abort during stream in `apps/api/src/modules/quiz/adapters/out/source-fetch/https-markdown-source.adapter.ts` (`SOURCE_TOO_LARGE`); do not call the model on those paths
- [X] T058 [US6] Keep generation window slice in `packages/application/src/create-quiz.ts` at most **32,000** characters while `InsertQuizInput.source.contentSnapshot` remains the full accepted snapshot (≤ 512 KiB)

**Checkpoint**: Snapshots are reproducible and bounded. Unusable sources never reach generation.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Docs, quality commands, and scope guardrails after the stories.

- [X] T059 [P] Update `README.md` Phase 3 section: real fetch/generation, `.env` OpenAI fields, overridden tests vs gated live README, 127.0.0.1 smoke; do not claim two-source demo, UI player, Langfuse, or production delivery
- [X] T060 [P] Align `apps/api/test/env.spec.ts` and `.env.example` comments with optional-at-boot / required-at-create behavior; never print secret values in docs
- [X] T061 Run [quickstart.md](./quickstart.md) commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:integration`, `pnpm test:e2e` (overridden, no key). Record live README separately when `OPENAI_API_KEY` is available; if missing, leave live evidence as an environment blocker (do not restore fixtures on the product path)
- [X] T062 Scope review of the diff: zero quiz UI routes, zero second README package, zero Langfuse SDK, zero production Dockerfiles/GitHub Actions; domain/application `package.json` still free of `ai` / `@ai-sdk/openai` / Nest / Prisma; scoring still `gradeAttempt` / `@ai-quiz/domain`; `QuizModule` product providers are the HTTPS and OpenAI adapters

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (T005 overrides must land before the module swap in T032)
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** all user stories
- **User Story 1 (P1) MVP**: Depends on Foundational — happy-path fetch+generate+persist+GET
- **User Story 2 (P1)**: Depends on Foundational; hardens fetch used by US1; can start its unit tests in parallel with US1 LLM files (`llm/` vs `source-fetch/`)
- **User Story 3 (P1)**: Depends on US1 prompt/adapter existing
- **User Story 4 (P1)**: Depends on US1 `CreateQuizUseCase` persist path; retry loop builds on T031
- **User Story 5 (P1)**: Depends on US1 public GET; can overlap with US3
- **User Story 6 (P2)**: Depends on fetch+create-quiz window; can overlap with US2
- **Polish**: Depends on US1–US6

### User Story Dependencies

- **US1**: After Foundational. Uses real adapters; e2e defaults stay overridden (T005)
- **US2**: After Foundational. Completes SSRF/redirect/type/size; does not need a live model
- **US3**: After US1 prompt builder exists
- **US4**: After US1 create-quiz persist exists
- **US5**: After US1 GET/create responses exist
- **US6**: After US1/US2 snapshot path exists

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Policy helpers before the HTTPS adapter
- LLM schema/prompt before the OpenAI adapter
- Adapters before `QuizModule` wiring
- Create-quiz retry only in US4 (do not skip insert guards)

### Parallel Opportunities

- T003/T004 after T001
- T006–T011, T017–T018 after Setup (different packages/files)
- T024/T025/T027/T028/T029 (different files) after Foundational
- T033/T034 while US1 LLM work proceeds
- T039/T049/T054 in parallel once their files exist
- T059/T060 in polish

---

## Parallel Example: User Story 1

```bash
# Tests (after Foundational):
Task: "Application create-quiz happy path in packages/application/src/create-quiz.spec.ts"
Task: "Integration persist modelId/excerpt in apps/api/test/integration/quiz-generated-persist.spec.ts"
Task: "Gated live spec in apps/api/test/e2e/quiz-live-readme.spec.ts"

# Helpers (different files):
Task: "generated-quiz.schema.ts"
Task: "quiz-prompt.ts"
Task: "github-blob.ts"
Task: "public-ip.ts"
Task: "normalize-markdown.ts"
```

---

## Parallel Example: User Story 2

```bash
Task: "public-ip.spec.ts"
Task: "github-blob.spec.ts"
# Then sequential adapter.spec.ts that needs both helpers
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (especially T005 port overrides)
2. Complete Foundational
3. Complete User Story 1 (overridden e2e + gated live README)
4. **STOP and VALIDATE** before SSRF matrix / retries / injection extras
5. Do not ship the API to untrusted networks until US2 lands

### Incremental Delivery

1. Setup + Foundational → existing fixture e2e still pass via overrides
2. US1 → retrievable generated quiz (MVP)
3. US2 → SSRF-safe fetch
4. US3 → untrusted Markdown
5. US4 → retries, no partial quiz
6. US5 → secret/key privacy confirmation
7. US6 → snapshot bounds
8. Polish → quickstart + scope review

### Parallel Team Strategy

After Foundational:

- Developer A: US1 LLM adapter + create-quiz persist + module wire
- Developer B: US2 fetch policy + HTTPS adapter tests
- Merge before gated live README (needs both adapters)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to spec user stories US1–US6
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at checkpoints to validate the story independently
- Missing `OPENAI_API_KEY` at live verification is an **environment blocker**, not a reason to restore product fixtures
- Avoid: quiz UI, second README package, Langfuse, production Dockerfiles, global `fetch` follow-redirects, putting the LLM schema in `@ai-quiz/contracts`
