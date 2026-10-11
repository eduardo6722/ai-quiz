# Feature Specification: Phase 3 Secure Markdown Ingestion and OpenAI Quiz Generation

**Feature Branch**: `005-phase-3-markdown-generation`

**Created**: 2026-10-10

**Status**: Draft

**Roadmap phase**: Phase 3 — Secure Markdown ingestion and OpenAI quiz generation (P0)

**Input**: User description: "Create a Phase 3-only specification for secure remote Markdown ingestion and OpenAI quiz generation. Prerequisite: verified Phases 0–2. Reuse the REST, persistence and deterministic scoring flow; replace the fixture generation adapter through its port. Specify configurable HTTPS Markdown URL and topic inputs, GitHub blob-to-raw normalization, public DNS/IP targets, safe redirects, timeouts, content-type and size limits, and rejection of private/loopback/link-local destinations. Markdown is untrusted data, never privileged instructions. Normalize and bound content, reject unusable sources, and persist the snapshot and checksum. Generate server-side via Vercel AI SDK/OpenAI with Zod-backed structured output. Require the requested 5–8 questions, exactly four unique choices, valid question types/answer keys and relevance to the topic and source. Define acceptance for a real README generating a retrievable quiz, mocked-model validation/error paths, SSRF and prompt-injection defenses, bounded retries, upstream failures and no partially playable quiz. Keep keys/model calls server-side and pre-submit keys private. Exclude quiz UI, the two-source demo package, Langfuse and production delivery."

## Phase Identity and Goal

This specification covers **Roadmap Phase 3 only**. The goal is to **replace the Phase 2 fixture adapters** so a REST client can create a quiz from a **configurable HTTPS Markdown URL and topic**, with questions **grounded in the fetched source**.

Success is a complete, independently testable ingestion-and-generation slice: the server fetches a public Markdown document safely, treats it as untrusted data, generates a valid 5–8 question quiz on the server, persists the source snapshot and checksum, and returns a retrievable sanitized quiz. Scoring, persistence, attempt tokens and the existing `/v1` play flow **reuse Phase 2**. This cycle does **not** build a quiz player, prove two README sources as an assessment package, add generation telemetry, or ship production delivery.

## Prerequisites

This cycle MUST reuse the Phase 0 workspace, the Phase 1 scoring core, and the Phase 2 persisted REST flow. It MUST NOT re-scaffold the monorepo, reimplement grading, replace public quiz/attempt contracts, reinitialize Spec Kit or the Constitution, or rebuild product tables.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal ports/adapters, Zod contracts, testable scoring, Jest discipline, **secure AI integration** (SSRF, untrusted Markdown, structured generation, secret handling) and roadmap fidelity are binding. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of fetch safeguards, generation rules, error codes and this phase’s checklist and definition of done. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy, including never treating remote Markdown as trusted instructions. |
| Phase 0 scaffolding (`specs/002-phase-0-scaffold/`) | Verified | Monorepo, API/web shells, local PostgreSQL, Prisma bootstrap, Jest harness and quality commands. |
| Phase 1 domain scoring (`specs/003-phase-1-domain-scoring/`) | Verified | Pure quiz invariants, deterministic scoring, public Zod contracts, answer keys omitted from pre-submit views. |
| Phase 2 persistence and REST (`specs/004-phase-2-persistence-api/`) | Verified (2026-10-10) | Product tables, repository ports, create/get/start/submit/result, fixture-backed source and generation adapters, transactional scoring, no pre-submit key leakage. Evidence: tasks T001–T071 complete; lint, typecheck, unit, integration, API E2E and build passed. |
| Formal verification record in `implementation-roadmap.md` | Complete for Phases 0–2 | Status: Phase 2 verified; Phases 3–7 backlog. This cycle is the requested Phase 3 specification only. |
| Phases 4–7 | Not started | Quiz UI, two-source demo package, Langfuse and production delivery are out of scope. |

**Blockers:** None that expand this phase’s scope. Phases 0–2 are recorded as verified. If those quality commands later fail when this spec is implemented, that is a **prerequisite defect to fix in the earlier phase** and MUST NOT pull quiz UI, a second live README demonstration package, telemetry or production delivery into Phase 3.

Live generation acceptance (User Story 1) needs a configured server-side model key and one publicly reachable README. Missing credentials or an unreachable sample URL at verification time is an **environment blocker**, not a reason to keep fixtures as the product create path or to expand into Phase 5’s two-source package.

**Existing whole-product placeholder:** `specs/001-ai-quiz-generator/` remains unused leftover context. This cycle owns `specs/005-phase-3-markdown-generation/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

A REST client MUST be able to:

- Create a quiz by sending a **topic** and a **configurable HTTPS Markdown URL**, with optional question count 5–8 (default 5) and the existing optional strategy (default `balanced`).
- Receive a ready quiz identity when fetch, generation and persistence succeed, then **retrieve** the sanitized quiz (topic, source summary, ordered questions and four option labels each) **without** answer keys.
- Continue to start an attempt, submit answers and read the Phase 1/2 stored score on that generated quiz. This cycle does not change grading math.

The server MUST:

- Fetch the Markdown **on the server**. Normalize supported **GitHub blob** URLs to the corresponding raw-content URL before retrieving.
- Allow only **HTTPS** sources whose DNS and IP targets are **public**. Reject private, loopback and link-local destinations, including those reached after redirect or DNS resolution.
- Follow a **small, documented number of safe redirects**: HTTPS only, re-check public DNS/IP on every hop, stop when the hop limit is exceeded.
- Enforce a **documented wait limit**, **content-type allowlist**, and **size limit**. Reject slow, oversized, empty, non-text, or otherwise unusable sources with stable error codes.
- Treat fetched Markdown strictly as **untrusted task data**. Text in the source MUST NOT be obeyed as privileged instructions (prompt injection).
- Normalize and bound the content (decode as text, strip unusable bytes, trim boilerplate that would break generation, cap length). Persist the **snapshot**, **checksum**, original URL, resolved URL and fetch time. Do not persist a playable quiz when the source is unusable.
- Generate questions **server-side** through the existing generation boundary, using the constitution-bound structured-output path (Vercel AI SDK / OpenAI with schema-validated structured output). Model identity and keys stay on the server.
- Accept a generated quiz only when it has the **requested count** (5–8), **exactly four unique choices** per question, valid single/multiple types and answer keys, and questions **relevant to the requested topic and fetched source**.
- Re-validate generated output on the server. Retry **malformed or invalid** model output within a **documented bound**. After exhaustion, fail clearly. Upstream timeouts and provider failures MUST fail clearly after the same kind of bound.
- Persist the validated quiz **only when complete**. A fetch or generation failure MUST NOT leave a partially playable quiz (no start-able quiz with fewer than 5 valid questions, missing options, or missing keys).
- Keep repository **ports** in the core. The Phase 2 fixture source and generation adapters MUST be **replaced on the product create path** through those ports. Domain and application remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client dependencies.
- Prove fetch/SSRF, injection, validation, retry and failure behavior with **mocked** remote and model collaborators. Prove the definition of done with **one real public README** creating a retrievable quiz through REST, when the environment blocker above is not present.
- Map new fetch/generation failures to **stable error codes** (unsafe URL/destination, unsupported type, oversized source, fetch timeout, unusable source, malformed generation, retries exhausted, upstream generation failure). Do not leak stack traces, prompts, API keys or answer keys.

Constitution-bound names for this phase (not open design choices): TypeScript strict packages, Zod for inputs and generated quiz output, Vercel AI SDK `generateText` with `Output.object`, OpenAI as the server-configured provider, NestJS REST adapters, PostgreSQL/Prisma persistence from Phase 2, Jest with mocked model/fetch plus the existing real-database API flow, and the `/v1` paths from `roadmap.md`.

## Explicit Exclusions

This phase MUST NOT include:

- Quiz setup forms, player, progress, submission screens or results UI (the Phase 0 web shell stays a non-quiz shell).
- The **two-source demo package**: a second live README, screenshots, interview README evidence kit, or claiming the assessment’s “at least two different README.md URLs” item done. One real README is enough for this cycle’s definition of done.
- Langfuse or other generation telemetry.
- Production Dockerfiles, GitHub Actions, authentication of human users, billing, queues or dashboards.
- Re-scaffolding the monorepo, overwriting the Constitution, rewriting Phase 1 scoring, or replacing Phase 2 persistence/attempt/token behavior except to consume them.
- A new public quiz-edit API, a second generation strategy, or client-side model calls.
- Changing create-quiz to skip persistence or to return questions/keys on the create response.

Later-phase requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **REST client** (developer, interviewer, or a later web app). A **learner** is the conceptual quiz-taker; no browser player is required in this phase. A **reviewer** confirms security and the live README path.

### User Story 1 - Generate a retrievable quiz from a real README and topic (Priority: P1)

A client sends a topic, a publicly reachable HTTPS README URL, and a question count from 5 through 8. The server fetches that Markdown, generates a quiz about the topic from that source, stores the snapshot and the quiz, and returns a quiz identity with ready status. The client then retrieves the sanitized quiz and sees that many questions, each with four choices, with no answer keys. Starting an attempt and submitting still works as in Phase 2.

**Why this priority**: This is the phase definition of done. Fixtures are no longer an acceptable product create path.

**Independent Test**: Create a quiz from one real public README and a matching topic; GET the quiz; confirm 5–8 grounded questions and four labels each; confirm keys are absent; confirm an attempt can be started.

**Acceptance Scenarios**:

1. **Given** a valid topic, a publicly reachable HTTPS README URL, and a question count from 5 through 8, **When** the client creates a quiz, **Then** the response includes a quiz identity and a ready status, and a source snapshot plus that many ordered questions (each with four unique options) are stored.
2. **Given** that quiz identity, **When** the client retrieves the quiz, **Then** the response includes the topic, a source summary for the requested URL, prompts and option labels in quiz order, and does **not** include correctness flags.
3. **Given** that retrieved quiz, **When** a reviewer reads the prompts and choices, **Then** they are about the requested topic and can be tied to content in the fetched README (not an unrelated canned fixture bank).
4. **Given** that ready quiz, **When** the client starts an attempt and submits a complete legal answer set with the private token, **Then** scoring and stored results still follow the Phase 1/2 rules.
5. **Given** omitted question count, **When** the client creates from a valid README and topic, **Then** five questions are generated and stored.

---

### User Story 2 - Fetch only safe public Markdown sources (Priority: P1)

The server retrieves Markdown only from HTTPS addresses that resolve to public destinations. Private, loopback and link-local targets are rejected, including when they appear after DNS lookup or redirects. Slow, oversized, wrong-type and non-HTTPS sources fail closed. A GitHub blob URL that the product supports is fetched from the equivalent raw-content URL instead of the HTML blob page.

**Why this priority**: Arbitrary URL fetch without these controls is an SSRF and assessment failure even if generation works on a friendly README.

**Independent Test**: Drive create-quiz with documented unsafe destinations, redirect chains, oversized/wrong-type bodies and a supported GitHub blob URL; assert rejection or raw-content fetch as specified, with no playable quiz on failure.

**Acceptance Scenarios**:

1. **Given** a source URL whose host resolves to a loopback, private, or link-local address, **When** the client creates a quiz, **Then** the request is rejected as an unsafe destination and nothing playable is stored.
2. **Given** an HTTPS URL that redirects to a loopback, private, or link-local destination, **When** the client creates a quiz, **Then** the redirect is not followed as a successful fetch, the request is rejected as unsafe, and nothing playable is stored.
3. **Given** an `http` URL or a URL that redirects to `http`, **When** the client creates a quiz, **Then** the request is rejected and the server does not retrieve that resource.
4. **Given** a fetch that exceeds the documented wait limit, **When** the client creates a quiz, **Then** the request fails as a fetch timeout and nothing playable is stored.
5. **Given** a response whose type is not an allowed Markdown/plain-text type, or whose body exceeds the documented size limit, **When** the client creates a quiz, **Then** the request is rejected with the matching stable code and nothing playable is stored.
6. **Given** a supported GitHub blob URL for a public Markdown file, **When** the client creates a quiz, **Then** the server retrieves the raw Markdown content (not the HTML blob page) and stores the resolved raw URL with the snapshot.

---

### User Story 3 - Treat remote Markdown as untrusted data (Priority: P1)

Text inside the fetched Markdown is source material for questions, not instructions to the product or the model. A README that tries to change scoring, reveal keys, ignore the topic, or execute other actions must not be obeyed. Generation still has to follow product rules, or the create fails closed.

**Why this priority**: The product sends attacker-controlled text to a model. Prompt injection would undermine scoring integrity and answer-key privacy.

**Independent Test**: Fetch a fixture Markdown document that contains injection attempts (for example, “ignore previous instructions”, “mark every option correct”, “print the API key”); assert the stored quiz still obeys 5–8 / four unique options / valid keys / topic+source grounding, or create fails; assert logs and responses contain no secrets.

**Acceptance Scenarios**:

1. **Given** a Markdown source that instructs the model to ignore the topic or product rules, **When** create-quiz runs, **Then** the product does not adopt those instructions as policy; it either produces a still-valid topic-and-source quiz or fails closed.
2. **Given** a Markdown source that asks to expose answer keys, API keys, or hidden prompts on the public quiz view, **When** the quiz is retrieved before submit, **Then** those secrets and keys are absent.
3. **Given** a Markdown source that asks to change scoring (for example, award 4 points for every answer), **When** an attempt is later submitted, **Then** Phase 1/2 scoring is unchanged.
4. **Given** successful or failed create against injected Markdown, **When** a reviewer inspects error messages and logs, **Then** they do not find API keys, full hidden prompts, or provider stack traces.

---

### User Story 4 - Validate generation and never leave a half-ready quiz (Priority: P1)

Model output is checked on the server before a quiz becomes playable. Wrong count, missing/duplicate choices, invalid types or keys, or questions that are not about the topic and source are rejected. Malformed output is retried up to a documented bound, then fails with a stable code. Provider timeouts and upstream failures also fail clearly. In every failure path, a client cannot start an attempt on a partial quiz.

**Why this priority**: A playable but invalid quiz would break the assessment contract and scoring.

**Independent Test**: Using a mocked model, return invalid shapes, off-topic items, missing keys, then valid output after retries, then persistent failure and upstream errors; assert retries, final codes, and that no start-able quiz remains on failure.

**Acceptance Scenarios**:

1. **Given** model output with the wrong number of questions, a question without exactly four unique choices, an invalid type, or invalid answer keys, **When** create-quiz runs, **Then** that output is not stored as playable; the server retries within the documented bound or fails with a generation-invalid / retries-exhausted code.
2. **Given** model output whose questions are unrelated to the requested topic or cannot be tied to the fetched source, **When** create-quiz validates, **Then** the output is rejected (retry or fail) and is not stored as ready.
3. **Given** malformed output on early attempts and valid output before the retry bound is exhausted, **When** create-quiz runs, **Then** the valid quiz is stored as ready and the client can retrieve it.
4. **Given** malformed output on every attempt through the retry bound, **When** create-quiz finishes, **Then** the client receives a retries-exhausted (or equivalent generation-failed) code and cannot start an attempt for that request.
5. **Given** an upstream model timeout or provider failure that is not recovered within the bound, **When** create-quiz finishes, **Then** the client receives a stable upstream-failure code, responses do not include provider traces or keys, and nothing playable is stored.
6. **Given** any fetch or generation failure above, **When** storage is inspected, **Then** there is no ready quiz with a partial question set from that request; start-attempt for any leftover non-ready row is rejected as not playable.

---

### User Story 5 - Keep model secrets server-side and answer keys private before submit (Priority: P1)

The client never calls the model and never receives the model key. Create and get-quiz still omit correctness flags. After a successful submit, the existing result view may show which options were correct, as Phase 1/2 already require.

**Why this priority**: Client-side keys or pre-submit leakage would fail both security review and the assessment.

**Independent Test**: Create and GET a generated quiz; assert no keys in payloads; inspect configuration and logs for absence of the model key in client artifacts and log lines; submit and confirm post-submit correctness still appears only on the result.

**Acceptance Scenarios**:

1. **Given** a newly created ready quiz, **When** the client reads the create response and the get-quiz response, **Then** neither contains correctness flags, raw scores, model keys, or hidden prompts.
2. **Given** the running API, **When** a reviewer inspects the web shell and public contracts, **Then** they find no model key and no client-side model call.
3. **Given** a scored attempt on a generated quiz, **When** the client fetches the result with a valid token, **Then** the result includes per-question scores and which options were correct (Phase 2 behavior unchanged).
4. **Given** a generation failure, **When** the error body is inspected, **Then** it uses a stable code and English message and does not include the API key, prompt text that would leak secrets, or provider stack traces.

---

### User Story 6 - Persist a bounded snapshot and reject unusable sources (Priority: P2)

Successful fetch stores a reproducible snapshot and checksum (and resolved URL / fetch time). Empty, whitespace-only, binary, or otherwise unusable documents are rejected before generation. Oversized documents are rejected rather than silently truncated into a misleading quiz unless they first pass the size policy; accepted documents are normalized and bounded before they are sent to generation.

**Why this priority**: Without a stored snapshot, later scoring explanations and interview walkthroughs cannot show what the quiz was generated from. Unusable sources must not reach the model as if they were valid READMEs.

**Independent Test**: Fetch a valid README and confirm stored snapshot, checksum and resolved URL; fetch empty, tiny, binary and oversized bodies and confirm rejection with no generation and no playable quiz.

**Acceptance Scenarios**:

1. **Given** a successful fetch of usable Markdown, **When** the quiz is stored, **Then** storage includes the original URL, resolved URL, snapshot text, checksum of that snapshot, and fetch time.
2. **Given** two successful fetches of the same bytes, **When** checksums are compared, **Then** they match.
3. **Given** an empty, whitespace-only, or non-text body, **When** the client creates a quiz, **Then** the request is rejected as an unusable source, generation is not treated as successful, and nothing playable is stored.
4. **Given** Markdown larger than the documented size limit, **When** the client creates a quiz, **Then** the request is rejected as oversized and nothing playable is stored.
5. **Given** usable Markdown that is still large, **When** generation runs, **Then** only a documented bounded window of the normalized snapshot is used as model input, while the persisted snapshot remains the accepted fetched document (within the size limit).

---

### Edge Cases

- **Unknown host / DNS failure**: create fails as a fetch failure; nothing playable is stored.
- **DNS rebinding**: an address that looks public on first look but resolves to a private/loopback/link-local target before the connection is used MUST still be rejected (re-check at connect/redirect time).
- **IPv6 unique-local, unspecified, multicast, and metadata addresses** (including the well-known cloud metadata range): rejected as unsafe destinations, same as private IPv4.
- **Redirect hop limit exceeded**: rejected; do not follow an unbounded chain.
- **Redirect to a different public HTTPS host**: allowed only if that hop also passes public DNS/IP, HTTPS, type and size checks.
- **GitHub blob URL that is not a supported pattern** (malformed path, non-blob page): treated as an ordinary HTTPS URL; if the body is HTML rather than Markdown/plain text, reject as unsupported type rather than generating from page chrome.
- **Gist or other non-blob GitHub URLs**: not required to have special normalization this phase; they succeed only if they already serve allowed Markdown/plain text from a public destination.
- **Internationalized or percent-encoded paths**: still HTTPS-only; host/IP policy still applies.
- **Content-type with parameters** (for example `text/plain; charset=utf-8`): allowed when the type itself is on the allowlist.
- **Missing content-type on a known raw GitHub host after blob normalization**: MAY be accepted if the body is valid UTF-8 text within size limits; other missing types fail closed.
- **Compressed / binary bodies**: rejected as unusable or unsupported type.
- **Source that is valid Markdown but too short to support five questions**: rejected as unusable (documented minimum usable length after normalize).
- **Topic unrelated to the README**: the model must still produce questions about **that topic as it appears in the source**. If the source cannot support the topic, create fails closed rather than inventing an off-source quiz.
- **Count 5 and count 8**: both valid; generated length MUST equal the requested count.
- **Optional `strategy`**: only `balanced` this phase; unknown values still fail `CREATE_QUIZ_INVALID`. Strategy MUST NOT disable fetch safety or validation.
- **Model key missing in the environment** on the product create path: fail closed with a stable configuration/upstream code; do **not** silently fall back to the Phase 2 fixture bank.
- **Fixture adapters in tests**: allowed as mocks behind the same ports. Product composition for create-quiz MUST use the real fetch and model adapters.
- **Create still does not return questions**: 201/ready identity and status only, as in Phase 2.
- **Non-ready leftover rows**: GET and start-attempt remain `QUIZ_NOT_PLAYABLE` / not found as in Phase 2; they MUST NOT leak keys.
- **Concurrent creates** of the same URL: each create is independent; each stores its own snapshot and quiz.
- **Provider rate limit**: treated as upstream failure after bounded retries; stable code; no partial quiz.
- **Unicode / Markdown that contains HTML comments or badge-only boilerplate**: normalize may drop unusable chrome; remaining body must still meet the usable-length rule.
- **Answer-key indices that point off the four choices**: invalid generation; retry or fail; never persist.
- **Duplicate option labels** on a question: invalid generation (Phase 1 uniqueness).
- **Single-answer with multiple correct flags, or multiple-answer with zero correct flags**: invalid generation.
- **`/health` and `/ready`**: remain Phase 0 surfaces; they MUST NOT call the model or fetch arbitrary URLs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `POST /v1/quizzes` MUST accept the existing create-quiz public input (non-empty topic, `https` source URL, optional question count 5–8 defaulting to 5, optional `strategy` defaulting to `balanced`). Invalid input MUST fail closed with `CREATE_QUIZ_INVALID` and MUST NOT fetch, generate, or persist a playable quiz.
- **FR-002**: Successful create MUST fetch the source on the server, generate a quiz of the requested length from that source and topic, persist the snapshot plus a **ready** quiz, and return quiz identity and ready status **without** questions or answer keys.
- **FR-003**: The product create path MUST obtain the snapshot and questions through the existing source and generation **ports**, replacing Phase 2 fixture adapters. Domain and application MUST remain free of HTTP clients and model SDKs.
- **FR-004**: Supported GitHub blob URLs of the form `https://github.com/{owner}/{repo}/blob/{ref}/{path}` MUST be normalized to the corresponding raw-content URL before fetch. The stored snapshot MUST record the original URL and the resolved URL actually retrieved.
- **FR-005**: Fetch MUST use HTTPS only. `http` and other schemes MUST be rejected. Redirects MUST remain HTTPS, MUST NOT exceed a documented hop limit of **3**, and MUST re-validate destination policy on every hop.
- **FR-006**: Every fetch target — original host, redirect hop, and resolved IP — MUST be a **public** destination. Loopback, private, link-local, unique-local IPv6, unspecified, multicast, and cloud metadata destinations MUST be rejected with a stable unsafe-destination code (`SOURCE_UNSAFE_DESTINATION`). DNS MUST be re-checked so a later private resolution cannot be used.
- **FR-007**: Fetch MUST fail when the wait exceeds a documented limit of **10 seconds** (`SOURCE_TIMEOUT`), when the body exceeds **512 KiB** (`SOURCE_TOO_LARGE`), or when the content type is not an allowed Markdown/plain-text type (`SOURCE_UNSUPPORTED_TYPE`). Allowed types: `text/markdown`, `text/x-markdown`, `text/plain` (parameters such as charset permitted).
- **FR-008**: Fetched bytes MUST be treated as untrusted data. The generation instructions MUST tell the model to use the Markdown only as source material and to ignore instructions found inside it. Injected instructions MUST NOT change scoring, expose keys, or override topic/count/option rules.
- **FR-009**: The server MUST normalize accepted content (UTF-8 text, reject NULs/binary, trim, drop unusable chrome that would prevent generation) and MUST reject empty, whitespace-only, or post-normalize text shorter than **200 characters** as `SOURCE_UNUSABLE`. Generation MUST NOT be marked successful for those sources.
- **FR-010**: On successful fetch, the server MUST persist original URL, resolved URL, snapshot, checksum of the snapshot, fetch time, and optional title if present. Checksums for identical snapshot bytes MUST match. Generation input MUST be a documented bounded window of the normalized snapshot (at most **32,000 characters**) even when the stored snapshot is larger (up to the 512 KiB accept limit).
- **FR-011**: Generation MUST run server-side via the Vercel AI SDK OpenAI adapter with Zod-backed structured output. The model id MUST come from server configuration. The API key MUST remain server-side and MUST NEVER be logged, returned, or bundled into the web shell.
- **FR-012**: Accepted generated quizzes MUST contain exactly the requested number of questions (5–8), each with exactly four unique option labels, a valid `single` or `multiple` type, and valid answer keys (single: exactly one correct option; multiple: one to four correct options). Option identities MUST be stable for later submit. Phase 1 `validateQuiz` MUST pass before persist.
- **FR-013**: Each accepted question MUST be relevant to the requested topic and the fetched source. Relevance MUST be enforced by: (a) instructing generation to use only the snapshot and topic; (b) requiring a source excerpt per question that is a contiguous substring of the normalized snapshot; (c) rejecting output whose excerpts are missing or not found in the snapshot. The live README path additionally requires a reviewer to confirm the questions are about the topic and that source.
- **FR-014**: Invalid or malformed generation output MUST be retried, at most **2** retries (**3** total generation attempts) per create. Exhaustion MUST fail with `GENERATION_RETRIES_EXHAUSTED` (or `GENERATION_INVALID` when rejected without remaining retries). Transient provider timeouts/errors MAY use the same bound and then MUST fail with `GENERATION_UPSTREAM_FAILED`.
- **FR-015**: Fetch and generation failures MUST NOT persist a **ready** quiz. Any stored non-ready row MUST NOT be startable (`QUIZ_NOT_PLAYABLE`). Partial question sets MUST NOT be visible as playable.
- **FR-016**: `GET /v1/quizzes/:quizId` MUST continue to return the Phase 1/2 public quiz view with **no** correctness flags. Create, get-quiz, and error bodies MUST NEVER include answer keys, API keys, or provider traces.
- **FR-017**: Start-attempt, submit, result, token hashing, ownership, immutability of a ready quiz, and Phase 1 scoring MUST remain as specified in Phase 2. This cycle MUST NOT change the grading policy.
- **FR-018**: Product composition MUST NOT fall back to the Phase 2 fixture bank when the model key is missing or generation fails. Tests MAY inject mocked source/generation ports, including canned Markdown, to prove validation and error paths without a live provider.
- **FR-019**: Stable error codes MUST include Phase 2 codes plus `SOURCE_UNSAFE_DESTINATION`, `SOURCE_UNSUPPORTED_TYPE`, `SOURCE_TOO_LARGE`, `SOURCE_TIMEOUT`, `SOURCE_UNUSABLE`, `SOURCE_FETCH_FAILED`, `GENERATION_INVALID`, `GENERATION_RETRIES_EXHAUSTED`, and `GENERATION_UPSTREAM_FAILED`. Messages MUST be English, non-secret, and safe for clients.
- **FR-020**: Automated evidence MUST cover mocked SSRF/injection/validation/retry/upstream-failure paths. Definition-of-done evidence MUST include one real public README URL creating a retrievable ready quiz through REST when a model key is configured. This cycle MUST NOT require a second live source, quiz UI, Langfuse, or production delivery.

### Key Entities

- **Source snapshot**: Durable copy of the fetched, normalized Markdown, with original URL, resolved URL, checksum, fetch time and optional title. Replaces the Phase 2 fixture snapshot on the product path.
- **Remote Markdown URL**: Client-supplied HTTPS locator. May be a GitHub blob URL that the server rewrites to raw content.
- **Fetch destination policy**: Rules that allow only public HTTPS DNS/IP targets and safe redirects, and that reject private, loopback, link-local and related unsafe destinations.
- **Quiz**: A persisted playable set of 5–8 generated questions about a topic, status `ready` on success, linked to its snapshot. May record the server-side model identity; MUST NOT expose it as an answer key.
- **Generated question**: Prompt, type, four unique options, server-only correctness, and a source excerpt used to prove grounding.
- **Generation attempt**: One bounded try to obtain schema-valid, policy-valid questions from the model for a create request.
- **Public quiz view**: Pre-submit HTTP shape with no keys (Phase 1/2).
- **Untrusted source text**: The Markdown payload enclosed as data for generation; never privileged configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Using one publicly reachable README URL and a topic, a reviewer can create a quiz and retrieve a ready public quiz with the requested 5–8 questions and four choices each, with questions about that topic and source, in a single sitting **without** a quiz UI.
- **SC-002**: 100% of documented loopback, private, link-local, metadata and unsafe-redirect destinations are rejected, with **zero** playable quizzes stored for those requests.
- **SC-003**: 100% of documented timeout, oversized, unsupported-type, empty and unusable-source cases fail closed with the matching stable code and **zero** ready quizzes.
- **SC-004**: 100% of documented prompt-injection fixtures fail to change scoring, fail to put keys or secrets on pre-submit responses or logs, and still yield either a policy-valid quiz or a closed failure.
- **SC-005**: 100% of documented invalid model outputs are either retried into a valid ready quiz within the bound or fail with a generation error. 100% of documented exhausted-retry and upstream-failure cases leave **zero** start-able quizzes for that request.
- **SC-006**: 100% of documented pre-submit create and get-quiz responses contain **zero** correctness flags, model keys, or hidden prompts. Post-submit results on a generated quiz still include correctness as in Phase 2.
- **SC-007**: 100% of successful documented fetches store a snapshot, checksum, original URL and resolved URL; identical snapshot bytes produce the same checksum.
- **SC-008**: A supported GitHub blob README is retrieved as raw Markdown (not the HTML blob page) in 100% of documented blob-normalization cases.
- **SC-009**: A scope review of this phase’s delivery finds **zero** quiz UI flows, **zero** two-source demo packages, **zero** Langfuse instrumentation, **zero** production images or hosted CI pipelines, and confirms scoring still lives in the Phase 1 core and persistence/attempt behavior still matches Phase 2 except for replacing fixture source/generation on the product path.

## Assumptions

- The Constitution’s technology choices remain binding: TypeScript, NestJS REST adapters, PostgreSQL with Prisma, Zod public contracts **and** generated-output schemas, Vercel AI SDK structured output with OpenAI, Jest, hexagonal `domain` / `application` / `contracts` packages. Those names appear here as phase boundaries, not as an invitation to add UI, telemetry or delivery.
- Phase 2 `/v1` resources, token hashing, transactional submit and public shapes are reused. Create becomes a **synchronous** fetch-then-generate-then-persist operation: the client waits until the quiz is `ready` or the request fails. No polling API is added this phase. Status `generating` is not required on the HTTP success path.
- Size, time and retry numbers above are informed defaults from the Phase 2 snapshot cap (512 KiB), common HTTPS client practice (10 seconds, 3 redirects), and a small generation retry budget (3 attempts). They may be tuned in planning only if the observable policy stays: fail closed, bound work, no partial playable quiz.
- Allowed content types listed in FR-007 match typical README serving. GitHub raw may omit type; that exception is limited to the raw host after blob normalization.
- Minimum usable length (200 characters) and generation window (32,000 characters) are defaults so empty READMEs and huge files cannot stall or overflow generation. Planning may adjust the window downward to fit the configured model’s context as long as typical public READMEs still succeed.
- GitHub blob normalization is limited to `github.com/.../blob/...` as in the assessment. Other hosts are fetched as-is if they pass HTTPS and destination policy.
- Relevance uses excerpt-in-snapshot as the automated gate; a human reviewer confirms the live README path. No second model is used to judge quality this phase.
- Prompt-injection defense is packaging untrusted text as data plus server-side schema/policy validation, not a perfect guarantee that every injected README yields a high-quality quiz.
- Missing `OPENAI_API_KEY` or model id is an environment/configuration failure on the product path, not a silent fixture fallback. Mocked ports remain the CI path for SSRF and malformed-output tests.
- One live README is sufficient for this phase. Choosing which public README is an implementation/verification detail; it MUST be a real, reachable Markdown document, not the Phase 2 canned bank.
- Optional `strategy` stays `balanced` only. A second strategy is Phase 6.
- Rate limiting, concurrency caps, and Langfuse traces are Phase 6 even though this phase already bounds retries and fetch time.
- Concrete HTTP client libraries, DNS APIs, Prisma field tweaks and NestJS module names belong to planning. This specification names observable fetch/generation behavior, error outcomes and evidence requirements.

## Dependencies

- Existing Constitution, `roadmap.md`, `implementation-roadmap.md`, `AGENTS.md` and Spec Kit installation.
- Verified Phase 0 runtime, Phase 1 scoring/contracts, Phase 2 persistence and `/v1` flow, including `MarkdownSourcePort` and `QuizGenerationPort`.
- A running local PostgreSQL instance for persistence and API evidence (already required by Phase 2).
- For mocked tests: no live model key required.
- For definition-of-done live evidence: a configured server-side model key, network access to one public README, and the existing REST client flow.
- No Phase 4–7 code. This phase MUST NOT wait on a web player, a second README package, Langfuse or production pipelines.

## Deferred Context (not acceptance)

The following remain future cycles and MUST NOT be implemented or tested as Phase 3 done-when items:

- Phase 4: complete quiz web experience.
- Phase 5: two-source demonstration, interview evidence kit, and full reliability package against two live READMEs.
- Phase 6: Langfuse, rate limits, concurrency limits and operational hardening.
- Phase 7: GitHub Actions, production images and interview walkthrough kit.
