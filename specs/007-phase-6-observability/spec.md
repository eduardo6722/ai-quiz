# Feature Specification: Phase 6 Observability and Operational Controls

**Feature Branch**: `007-phase-6-observability`

**Created**: 2026-10-11

**Status**: Draft

**Roadmap phase**: Phase 6 — Langfuse and production-hardening (P1)

**Input**: User description: "Create a Phase 6-only specification for P1 observability and operational controls. Prerequisite: verified Phases 0–5. Reuse the MVP; essential SSRF, prompt-injection, answer privacy and attempt protections must already work. Specify Langfuse tracing across fetching, preprocessing, generation, validation and failures/retries, with useful model/request/quiz context and latency/usage where available. Keep telemetry behind a replaceable boundary and redact secrets, private tokens and sensitive answers. Cover structured logs, correlation IDs, consistent safe errors, rate/concurrency limits, bounded retries, health/readiness and configuration documentation. Define acceptance scenarios proving a failed generation can be diagnosed, limits are enforced and telemetry/logs do not expose secrets. Keep domain/application independent of telemetry SDKs. Treat a second generation strategy as optional; record whether it is included or deferred and preserve the generation port. Exclude CI/CD, production Dockerfiles, deployment automation and P2 extensions."

## Phase Identity and Goal

This specification covers **Roadmap Phase 6 only**. The goal is to add **P1 observability and operational controls** to the verified interview MVP so an operator can **diagnose a failed generation**, **explain model behavior**, and **bound misuse** **without exposing secrets**.

Success is a complete, independently testable operations slice on top of the existing quiz product: traces for fetch, source preparation, generation, validation and retry/failure; structured logs with a correlation identity; consistent safe errors; rate and concurrency limits; documented health/readiness and configuration. Scoring, persistence, SSRF, prompt-injection defenses, answer-key privacy and attempt-token handling **reuse Phases 0–5**. This cycle does **not** ship CI/CD, production images, deployment automation, P2 product extensions, or a second generation strategy.

## Prerequisites

This cycle MUST reuse the Phase 0 workspace, Phase 1 scoring and public contracts, Phase 2 persistence and attempt-token lifecycle, Phase 3 secure fetch and generation, Phase 4 browser flow, and Phase 5 two-source demonstration evidence. It MUST NOT re-scaffold the monorepo, reimplement grading, replace public quiz/attempt contracts, reinitialize Spec Kit or the Constitution, or rebuild product tables.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal ports/adapters, Zod contracts, Jest discipline, **secure AI integration** (secrets never logged), and observability as a **replaceable telemetry boundary** (omit Langfuse rather than couple it to domain logic) are binding. Domain and application MUST remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client SDKs. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of Langfuse tracing fields, structured logs, correlation identity, health, rate/concurrency/retry bounds, secret handling and this phase’s checklist and definition of done. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy, including never logging secrets. |
| Phase 0 scaffolding (`specs/002-phase-0-scaffold/`) | Verified | Monorepo, API/web shells, local PostgreSQL, `GET /health` liveness, `GET /ready` database ping, `.env.example` with Langfuse placeholders, Jest harness. |
| Phase 1 domain scoring (`specs/003-phase-1-domain-scoring/`) | Verified | Pure quiz invariants, deterministic scoring, public Zod contracts, keys omitted from pre-submit views. |
| Phase 2 persistence and REST (`specs/004-phase-2-persistence-api/`) | Verified (2026-10-10) | `/v1` create/get/start/submit/result, private attempt token issued once, hash-only storage, transactional scoring, idempotent resubmit. Evidence: tasks T001–T071 complete; lint, typecheck, unit, integration, API E2E and build passed. |
| Phase 3 Markdown ingestion and generation (`specs/005-phase-3-markdown-generation/`) | Verified (2026-10-10) | Product create fetches a public Markdown URL and generates a grounded quiz. SSRF, untrusted Markdown, bounded generation retries (3 attempts), stable fetch/generation error codes. Evidence: tasks T001–T062 complete. Gated live README remains an **environment blocker**, not a fixture fallback. |
| Phase 4 complete browser quiz experience (`specs/006-phase-4-web-experience/`) | Delivery present; **formal verification record incomplete** | Spec, plan and tasks exist and are marked complete, including the browser setup → play → submit → results flow. `implementation-roadmap.md` still records **Phase 3 as the last verified cycle** and has no Phase 4 verification-evidence block. |
| Phase 5 two-source demonstration and reliability | Delivery present under Phase 4; **no separate spec cycle; formal verification record incomplete** | README records a two-source live sitting (Express and Fastify READMEs, 2026-10-11) and offline `quiz-two-sources` API evidence. There is **no** `specs/…-phase-5-demo-reliability/` directory. `implementation-roadmap.md` does not record Phase 5 as verified. Essential SSRF, prompt-injection, answer privacy and attempt protections are already specified and implemented in Phases 2–3; this cycle MUST reuse them, not re-threat-model them as new product features. |
| Formal verification record in `implementation-roadmap.md` | Complete for Phases 0–3 only | Status header: Phase 3 verified; Phases 4–7 described as backlog. This cycle is the requested **Phase 6 specification only**. |
| Phase 7 | Not started | CI/CD, production Dockerfiles, deployment automation and interview walkthrough kit are out of scope. |

**Blockers:** Phases 4 and 5 are **not formally recorded as verified** in `implementation-roadmap.md`. That is a **prerequisite recording gap**. It MUST NOT expand this phase into a second browser rewrite, a new two-source demo package, CI/CD or production containers.

- **Implementation of this specification MUST NOT start** until Phases 4 and 5 are recorded as verified in `implementation-roadmap.md`, **or** any remaining Phase 4/5 acceptance gaps are listed as explicit blockers of those earlier phases. Missing formal checkboxes MUST NOT be “fixed” by absorbing demo or delivery work into Phase 6.
- If Phase 0–5 quality commands later fail when this spec is implemented, that is a **prerequisite defect to fix in the earlier phase**.
- Missing Langfuse credentials at verification time is an **environment blocker for live tracing inspection**, not a reason to couple telemetry into domain logic or to fail quiz create. Automated evidence MUST use a replaceable telemetry double.
- Missing model key or unreachable sample README at **live** generation-diagnosis time is the same **environment blocker** as in Phases 3–5. Automated diagnosis evidence MAY use mocked fetch/generation with recorded stages.
- Essential SSRF, prompt-injection, answer-key privacy and attempt-token protections are **prerequisite behavior**. If any of those later fail, repair them as earlier-phase defects. This cycle only **bounds abuse** (rate/concurrency) and **observes** those paths; it MUST NOT redesign fetch policy, scoring or token hashing.

**Existing whole-product placeholder:** `specs/001-ai-quiz-generator/` remains unused leftover context. This cycle owns `specs/007-phase-6-observability/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

An **operator** (developer or interviewer investigating the running API) MUST be able to:

- After a failed or retried create-quiz, identify **which stage failed** (fetch, source preparation, generation, validation) and whether **retries** ran, using traces and structured logs that share one **correlation identity**.
- See useful generation context when it is available: **model identity**, **prompt version**, **strategy**, **quiz identity** (once assigned), **outcome**, **duration**, and **usage/cost** when the model reports it.
- Confirm that traces, logs and client error bodies **do not contain** environment secrets, private attempt tokens, submitted answers, or answer keys.
- Confirm that **too-frequent** or **overlapping** create-quiz work is rejected with a stable, non-secret error instead of unbounded load.
- Confirm **liveness** and **database readiness** without requiring a model key or tracing credentials, and read **configuration documentation** for timeouts, size limits, retries, rate/concurrency and optional tracing keys.

The product MUST:

- Keep the verified MVP: create, retrieve, attempt, submit and result behavior, including SSRF, untrusted Markdown, answer-key isolation and attempt-token hashing, **unchanged** except for adding observation, safe errors, limits and documentation.
- Record traces for **fetch → preprocessing → generation → validation** and for **failure and retry** paths of create-quiz. When tracing is unconfigured, create-quiz MUST still succeed or fail for product reasons only (a missing tracer is a no-op, not a create failure).
- Keep telemetry behind a **replaceable boundary**. Domain and application MUST NOT import a tracing vendor SDK. A no-op or in-memory double MUST be enough to prove stages, redaction and independence in tests.
- Emit **structured** application logs (machine-readable fields, not only a free-text line) that include the correlation identity, route, outcome or stable error code, and duration. Accept an incoming request identity when present; otherwise assign one. Echo that identity on **every** API response, including errors.
- Map failures to the **existing stable error codes** plus new codes for rate and concurrency limits. Client bodies MUST stay English, non-secret, and free of provider traces, prompts that would leak secrets, keys and tokens.
- Enforce a **documented create-quiz rate limit** per client identity and a **documented in-process concurrency cap** on in-flight generations. Excess MUST fail closed with a stable code and MUST NOT start another model call or source fetch for that rejected request.
- Preserve the Phase 3 **bounded generation retry** (at most **3** generation attempts per create). Tracing failures MUST use a **stricter** bound (retry at most once, then drop) and MUST NOT fail the quiz request.
- Preserve `GET /health` as process liveness (no database, model or tracing dependency) and `GET /ready` as database readiness (no model or tracing dependency).
- Document operational configuration in the example environment file and developer documentation: optional tracing public/secret/base values, model key, timeouts, size cap, generation retry bound, rate limit, concurrency cap. Real secret **values** MUST NOT appear in that documentation or in logs.

**Second generation strategy:** **Deferred.** This cycle MUST preserve the existing generation port (topic, source text, count, strategy). Create-quiz continues to accept only the current `balanced` strategy. A second strategy (for example `comprehension`) is an optional assessment bonus and is **not** required for this phase’s definition of done.

Constitution-bound names for this phase (not open design choices): TypeScript strict packages, hexagonal `domain` / `application` / `contracts`, NestJS REST adapters as the composition root, Langfuse as the configured tracing destination behind a telemetry port, Zod public contracts, Jest with mocked ports plus existing real-database API suites, and the `/v1` and `/health`/`/ready` paths from `roadmap.md`.

## Explicit Exclusions

This phase MUST NOT include:

- GitHub Actions or other hosted CI pipelines.
- Production Dockerfiles, multi-stage images, non-root production runtimes, image publish or gated deploy automation.
- P2 extensions: Markdown preview, grounded-excerpt UI, difficulty picker, Langfuse **evaluations** / quality sampling / golden-set benchmarks, usage dashboards, historical quiz lists, admin moderation, authenticated workspaces, queued jobs or streaming.
- A second question-generation strategy, prompt redesign, or new public create-quiz strategy values.
- Re-scaffolding the monorepo, overwriting the Constitution, rewriting Phase 1 scoring, replacing Phase 2/3 persistence, tokens, SSRF or generation **except** to observe, limit and document them.
- Changing grading math, public pre-submit DTOs, or putting answer keys on traces, logs or client errors.
- Requiring tracing credentials to boot the API, to pass `/health` or `/ready`, or to complete a create-quiz when the product path is otherwise valid.
- Authentication of human users, billing, Redis, extra brokers or analytics product UIs.
- Playwright or other browser-driver suites as a required gate.

Later-phase requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is an **operator** inspecting the API after create-quiz runs. A **REST client** (or the existing web app) is the collaborator that triggers traffic. A **learner** is unchanged from Phases 4–5. A **reviewer** confirms redaction, limits and that domain/application stay free of tracing vendor SDKs.

### User Story 1 - Diagnose a failed or retried generation (Priority: P1)

An operator triggers create-quiz. Fetch, source preparation, generation and validation each appear as distinct stages on one correlated trace. When the model returns malformed output, retries appear as additional generation stages on the same correlation identity. When retries are exhausted or fetch fails, the operator can see the failing stage, the stable outcome, and duration — without opening the database or reading a provider email.

**Why this priority**: This is the phase definition of done. Unexplained generation failures are not production-ready for the interview operations bar.

**Independent Test**: Drive create-quiz with a mocked source/model that fails at fetch, then at validation, then succeeds after one retry, then exhausts retries; inspect traces (or the telemetry double) and structured logs for stages, correlation identity, outcome and duration.

**Acceptance Scenarios**:

1. **Given** a create-quiz that fails during source fetch, **When** the operator inspects the correlated trace and logs, **Then** they see a fetch stage with a failed outcome, no successful generation stage for that request, and the client received the existing fetch error code.
2. **Given** a create-quiz whose first generation output is invalid and whose second attempt is valid, **When** the operator inspects the trace, **Then** they see a preprocessing stage, more than one generation attempt, a validation outcome, a ready quiz identity, and a single correlation identity shared by those stages and the HTTP logs.
3. **Given** a create-quiz that exhausts the generation retry bound, **When** the operator inspects the trace and the client response, **Then** they see each bounded attempt, a final retries-exhausted (or equivalent generation-failed) outcome, and the client cannot start an attempt on a partial quiz.
4. **Given** a successful create-quiz, **When** the operator inspects the trace, **Then** they see fetch, preprocessing, generation and validation stages, the configured model identity, the strategy, the quiz identity, duration, and usage/cost **when the model reported it**.
5. **Given** tracing credentials are not configured, **When** create-quiz otherwise succeeds or fails, **Then** the product outcome is unchanged (no-op tracing) and the request is not rejected for missing tracing configuration.

---

### User Story 2 - Keep secrets, tokens and answers out of telemetry and logs (Priority: P1)

Operators need enough context to debug, and must not copy secrets out of traces. Environment keys, Langfuse credentials, database URLs, private attempt tokens, `Authorization` values, submitted answers and answer keys are absent from traces, structured logs and client error bodies. Source Markdown may be truncated for generation context but MUST NOT be a vehicle for logging secrets.

**Why this priority**: Logging keys or attempt tokens would fail the constitution’s security bar even if traces are rich.

**Independent Test**: Run create, start-attempt, submit and a generation failure with realistic secret-shaped values in configuration and headers; assert traces, log payloads and error bodies contain none of the forbidden classes; assert quiz identity / correlation identity / stable codes **are** present.

**Acceptance Scenarios**:

1. **Given** configured model and tracing secrets and a database URL, **When** create-quiz runs (success or failure), **Then** traces and logs do not contain those secret values.
2. **Given** a client that sends an `Authorization` bearer attempt token, **When** submit or result runs, **Then** traces and logs do not contain the raw token (a hash or redacted marker is acceptable; the raw secret is not).
3. **Given** a scored submit, **When** traces and default logs are inspected, **Then** they do not contain the learner’s selected option identities or answer keys. Quiz identity and correlation identity MAY appear.
4. **Given** a generation failure, **When** the client error body is inspected, **Then** it uses a stable code and English message and does not include keys, full hidden prompts, provider stack traces or attempt tokens.
5. **Given** remote Markdown that contains a secret-shaped string, **When** traces record generation context, **Then** that secret-shaped string is redacted or omitted; the product still does not treat the Markdown as instructions (Phase 3 behavior unchanged).

---

### User Story 3 - Enforce rate and concurrency limits (Priority: P1)

Create-quiz is expensive. A client that sends too many create requests in a short window is rejected with a stable rate-limit code and no extra fetch or model call for the rejected request. When the documented number of generations is already in flight, a further create is rejected with a stable concurrency code until a slot is free. Ordinary single-user demo traffic stays within the limits.

**Why this priority**: Unbounded generation is an abuse and cost failure even when tracing works.

**Independent Test**: Send documented bursts of create-quiz from one client identity; assert later requests receive the rate-limit code and do not invoke source/generation doubles. Overlap documented in-flight creates; assert the overflow receives the concurrency code and does not start another generation.

**Acceptance Scenarios**:

1. **Given** a client identity that has already used the documented create-quiz allowance in the current window, **When** it sends another create-quiz, **Then** the response is the rate-limit code, no source fetch and no model call start for that rejected request, and a correlation identity is still present.
2. **Given** the documented number of generations already in flight, **When** another create-quiz arrives, **Then** the response is the concurrency-limit code and that overflow request does not start fetch or generation.
3. **Given** a single create-quiz within the limits, **When** the request is otherwise valid, **Then** it is not rejected for rate or concurrency reasons.
4. **Given** a rate- or concurrency-limited create, **When** storage is inspected, **Then** nothing playable was stored for that rejected request.
5. **Given** start-attempt, submit or get-quiz within ordinary demo volume, **When** those routes are called, **Then** they still succeed; this cycle’s strict generation cap applies to **create-quiz**, not to finishing an in-progress attempt.

---

### User Story 4 - Correlate structured logs across a request (Priority: P1)

Every API request, success or failure, carries one correlation identity. If the client sent a request identity, that value is reused when it is a well-formed token; otherwise the server assigns one. Structured logs for that request include the identity, route, outcome or stable code, and duration. The same identity is returned on the HTTP response so an operator can join client, logs and traces.

**Why this priority**: Traces without a join key to the HTTP sitting cannot diagnose a specific interviewer demo failure.

**Independent Test**: Call `/v1` and `/health` with and without an incoming identity header; assert the response echoes an identity; assert structured log records for the same request include that identity and do not include secrets.

**Acceptance Scenarios**:

1. **Given** a create-quiz without an incoming request identity, **When** the response and logs are inspected, **Then** both include the same server-assigned correlation identity.
2. **Given** a client that sends a well-formed incoming request identity, **When** any `/v1` or health route responds, **Then** that identity is echoed on the response and in the structured logs for the request.
3. **Given** a malformed incoming request identity, **When** the server handles the request, **Then** it assigns a new identity rather than trusting unsafe input, and still logs and echoes the assigned value.
4. **Given** a failed request (validation, fetch, generation or rate limit), **When** logs are inspected, **Then** they are structured (named fields, not only an unstructured sentence), include the correlation identity and stable code, and omit secrets.
5. **Given** `GET /health`, **When** logs are inspected, **Then** a correlation identity is present and the handler still does not query the database, the model or the tracer.

---

### User Story 5 - Keep health, readiness and configuration operable (Priority: P1)

A developer can tell process liveness from database readiness without tracing or model credentials. Missing tracing keys do not prevent boot. Example environment and README document optional tracing keys, existing fetch/generation bounds, and this phase’s rate/concurrency/retry policy. Real secret values never appear in those files.

**Why this priority**: Observability that makes the API unable to start, or that is undocumented, fails the production-ready bar for a small app.

**Independent Test**: Boot without tracing keys; `GET /health` 200; with database up `GET /ready` 200; with database down `GET /health` 200 and `GET /ready` 503; read `.env.example` and README for the documented settings and confirm no live secrets.

**Acceptance Scenarios**:

1. **Given** the API process is running and tracing keys are absent, **When** a client calls `GET /health`, **Then** the response is successful liveness and the call did not ping the database, the model or the tracer.
2. **Given** the database is unreachable, **When** a client calls `GET /ready` and `GET /health`, **Then** readiness reports not-ready and liveness remains successful.
3. **Given** tracing keys are present or absent, **When** `GET /ready` runs against a reachable database, **Then** readiness does not fail because of tracing configuration.
4. **Given** the example environment file and developer documentation, **When** a reviewer reads them, **Then** they find named placeholders for tracing public/secret/base values, model key, fetch timeout, size cap, generation retry bound, rate limit and concurrency cap, and they find **no** real secret values.
5. **Given** existing Phase 3 fetch timeout, size cap and generation retry bound, **When** documentation is compared with running behavior, **Then** those bounds are still in force and are stated in the same documentation as the new rate and concurrency limits.

---

### Edge Cases

- **Tracing backend unreachable or slow**: quiz create MUST still complete its product path; tracing export retries at most once and then drops. The operator MAY see a local log that tracing export failed, without secrets.
- **Partial traces**: a failure before quiz identity exists still records fetch/preprocess/generation stages and correlation identity; quiz identity is omitted until assigned.
- **Usage/cost unavailable**: omit those fields rather than invent numbers.
- **Prompt version unset**: traces still include model identity and strategy; prompt version is omitted or recorded as the documented default label, not as a blank secret.
- **Concurrent creates from different client identities**: each identity has its own rate window; the in-process generation cap is global to the API process.
- **Client identity**: informed default is the network peer address (or an equivalent documented identity in tests). Spoofed identities MUST NOT disable the in-process concurrency cap.
- **Incoming correlation identity that is too long or contains whitespace/control characters**: reject as incoming identity and assign a new one.
- **Rate-limit window rolling**: after the documented window elapses, create-quiz is allowed again for that identity.
- **In-flight create that finishes**: concurrency slot is released whether the create succeeded or failed.
- **Submit/result with invalid token**: existing unauthorized behavior unchanged; logs still redact the presented secret; rate limiting MAY apply as ordinary request volume but MUST NOT become a new enumeration oracle.
- **`/health` and `/ready` under rate limits**: liveness MUST remain observable for operators; these two routes MUST NOT be blocked by the create-quiz generation cap. A very high generic request flood MAY still receive a generic rate-limit, but a single health poll MUST succeed under demo conditions.
- **Web app**: no new screens this phase. Existing English error mapping MAY show the new rate/concurrency messages if those codes reach the browser; designing new UI is out of scope.
- **Domain unit tests**: still run without a tracer. Adding a telemetry port MUST NOT make scoring tests require I/O.
- **Existing HTTP log line**: MAY remain as a human-readable companion but MUST NOT be the only record; structured fields are required.
- **Cost fields**: when present they are model-reported usage converted with a documented optional price; they MUST NOT require a billing integration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Create-quiz MUST emit replaceable telemetry stages for **fetch**, **preprocessing** (normalize/bound snapshot before generation), **generation**, **validation**, and each **retry or failure** of those stages. Stages for one HTTP request MUST share one correlation identity.
- **FR-002**: When a tracing destination is configured, those stages MUST be recorded there with: model identity, strategy, outcome, duration, quiz identity once assigned, prompt version when configured, and usage/cost when the model reports usage. When it is not configured, stages MUST still be observable via the replaceable boundary (no-op or test recorder) and create-quiz MUST NOT fail for missing tracing configuration.
- **FR-003**: Telemetry MUST sit behind a **replaceable port or equivalent inward-facing boundary** wired at the composition root. `packages/domain` and `packages/application` MUST NOT import Langfuse or any other tracing vendor SDK. Tests of use cases MUST run with an in-memory or no-op tracer.
- **FR-004**: Traces, structured logs and client error bodies MUST NEVER include `OPENAI_API_KEY`, `DATABASE_URL`, Langfuse secret or public keys, raw attempt tokens, `Authorization` header values, submitted answer selections, or answer keys / correctness flags. Secret-shaped substrings (`sk-…`, `Bearer …`) MUST be redacted. Full hidden generation instructions MUST NOT be logged; a prompt **version label** is allowed.
- **FR-005**: Every API response, including errors and health, MUST include a correlation identity. If the client sends a well-formed identity (visible ASCII token, length 8–128, no whitespace), the server MUST reuse it; otherwise it MUST assign a new identity. Structured logs for the request MUST include that identity, the route, duration, and outcome or stable error code.
- **FR-006**: Client errors MUST continue to use allowlisted stable codes and English non-secret messages. This cycle MUST add `REQUEST_RATE_LIMITED` and `GENERATION_CONCURRENCY_LIMIT`. Unhandled failures MUST still map to a generic internal error without provider traces. Existing Phase 2/3 codes MUST keep their meaning.
- **FR-007**: Create-quiz MUST reject further requests from the same client identity after **5** successful-or-attempted creates in a **60-second** window, with `REQUEST_RATE_LIMITED`, without starting fetch or generation for the rejected call.
- **FR-008**: The API process MUST allow at most **2** in-flight create-quiz generations at a time. Additional creates MUST fail with `GENERATION_CONCURRENCY_LIMIT` without starting fetch or generation. Completing or failing a create MUST release the slot.
- **FR-009**: Generation retries MUST remain bounded at **3** total attempts per create (Phase 3). Tracing export or tracer errors MUST retry **at most once** and then drop, and MUST NOT change the quiz outcome.
- **FR-010**: Fetch timeout (**10 seconds**), snapshot size (**512 KiB**), redirect hop limit (**3**), usable-length and generation-window bounds from Phase 3 MUST remain in force. This cycle documents them alongside the new rate and concurrency limits; it MUST NOT relax them.
- **FR-011**: `GET /health` MUST remain process liveness without querying PostgreSQL, the model or the tracer. `GET /ready` MUST remain database reachability only and MUST NOT require model or tracing configuration. Neither route MAY fetch arbitrary URLs.
- **FR-012**: Example environment and developer documentation MUST name optional `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, existing model and database placeholders, fetch timeout, size cap, generation retry bound, create-quiz rate limit and generation concurrency cap. They MUST contain no real secret values. Boot MUST NOT require tracing keys.
- **FR-013**: SSRF destination policy, untrusted-Markdown handling, pre-submit answer-key isolation, attempt-token hashing and Phase 1 scoring MUST remain as specified in Phases 1–3. This cycle MUST NOT add new public quiz resources or change grading.
- **FR-014**: The generation port MUST remain the sole extension point for question generation (input includes strategy). This cycle MUST NOT add a second strategy value to the public create-quiz contract. Unknown strategies still fail `CREATE_QUIZ_INVALID`.
- **FR-015**: Automated evidence MUST cover: diagnosis of fetch failure, validation retry, retries exhausted; redaction of secrets/tokens/answers from traces and logs; rate-limit and concurrency-limit enforcement without extra fetch/generation; correlation identity echo; `/health` and `/ready` independence from tracing; domain/application remaining free of tracing vendor SDKs. Live Langfuse inspection is required for definition of done **only when** tracing credentials are configured; otherwise the environment blocker is recorded and the replaceable recorder still proves stages.
- **FR-016**: This cycle MUST NOT mark CI/CD, production images, deployment automation, P2 extensions or a second generation strategy as in scope.

### Key Entities

- **Correlation identity**: Per-request token that joins HTTP response, structured logs and trace stages. Assigned or reused as specified in FR-005.
- **Trace**: One create-quiz (or other request) observation made of ordered stages, sharing a correlation identity.
- **Trace stage**: Named span for fetch, preprocessing, generation, validation, retry or failure, with outcome and duration.
- **Telemetry boundary**: Replaceable inward-facing port (or equivalent) that records stages. Concrete Langfuse adapter lives outside domain/application.
- **Structured log record**: Machine-readable request log with identity, route, duration and outcome/code; secrets redacted.
- **Client identity**: Documented key for rate limiting (network peer by default).
- **Rate window**: Per client identity, 5 create-quiz attempts per 60 seconds.
- **Generation slot**: One of at most two in-flight create-quiz executions in the API process.
- **Prompt version label**: Optional configuration name recorded on traces; not the full prompt text.
- **Redaction rule**: Policy that strips secrets, bearer tokens, answer keys and submitted selections from telemetry and logs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can, for 100% of documented fetch-failure, validation-retry, retries-exhausted and success cases, name the failing or completing stage, the stable outcome and the correlation identity from traces (or the test recorder) and logs **without** reading secrets.
- **SC-002**: 100% of documented inspections of traces, structured logs and client error bodies contain **zero** environment secret values, raw attempt tokens, submitted selections and answer keys.
- **SC-003**: 100% of documented over-limit create-quiz bursts receive `REQUEST_RATE_LIMITED` or `GENERATION_CONCURRENCY_LIMIT` as specified, with **zero** extra fetch or generation starts and **zero** playable quizzes stored for those rejected requests.
- **SC-004**: 100% of documented API responses (including errors and health) echo a correlation identity that matches the structured log for that request.
- **SC-005**: With tracing keys absent, a reviewer can still boot the API, receive successful liveness, and complete or fail create-quiz for product reasons only. With the database down, liveness stays successful and readiness reports not-ready in 100% of documented checks.
- **SC-006**: A reviewer can locate documented values for tracing placeholders, fetch timeout, size cap, generation retry bound (3 attempts), create-quiz rate (5 / 60s) and concurrency (2) without finding real secret values in those documents.
- **SC-007**: A scope review of this phase’s delivery finds **zero** tracing vendor SDK imports in domain and application, **zero** CI workflows added, **zero** production Dockerfiles, **zero** new generation strategy values, **zero** P2 dashboards/evaluations, and confirms SSRF, prompt-injection, answer-key privacy and attempt-token hashing still match Phases 2–3.
- **SC-008**: Automated checks for stages, redaction, limits, correlation identity and health/readiness independence exist and pass without live tracing credentials. Live tracing inspection is recorded when credentials are present, or recorded as an environment blocker when they are not.

## Assumptions

- The Constitution’s technology choices remain binding: TypeScript, NestJS composition root, hexagonal packages, Zod contracts, Jest, Langfuse as the configured tracer **behind a port**. Those names appear here as phase boundaries and evidence gates, not as an invitation to add CI/CD or a second product.
- Phase 3 create remains **synchronous**: the client waits until ready or failure. This cycle does not add a polling API or job queue.
- Existing HTTP error mapping and log sanitization are the base to **upgrade** (structured fields, correlation identity, two new codes), not a reason to invent a parallel error vocabulary.
- Client identity for rate limiting defaults to the network peer. Tests MAY inject a documented identity. The concurrency cap is always process-global.
- Five creates per minute and two in-flight generations are informed defaults for a small interview demo: they allow a reviewer to run the two-README sitting without hitting the cap, and they stop accidental loops. Planning may only change the numbers if the observable policy stays “fail closed, no extra fetch/generate.”
- Usage/cost on traces is best-effort from model-reported token usage. No billing account integration.
- Prompt version is an optional environment label (for example `PROMPT_VERSION`). This cycle may introduce the label for traces; it MUST NOT redesign prompts.
- Full source snapshots are not written to traces by default; a short hash or truncated excerpt is enough if generation context is needed. Answer keys stay server-only.
- The web app is unchanged except that it MAY surface the two new stable codes through the existing English error path. No new screens.
- Second generation strategy is **deferred** (optional assessment bonus). The generation port is preserved so a later cycle can add `comprehension` (or similar) without changing orchestration shape.
- Concrete tracer SDK calls, logger libraries, rate-store memory vs map, and header names belong to planning. Observable header behavior: echo the correlation identity on responses (informed default name `x-request-id`).

## Dependencies

- Existing Constitution, `roadmap.md`, `implementation-roadmap.md`, `AGENTS.md` and Spec Kit installation.
- Verified Phases 0–3 runtime, scoring, `/v1` flow, fetch/generation adapters, error codes and `/health`/`/ready`.
- Phase 4 web flow and Phase 5 two-source evidence **as already delivered**; this cycle consumes them and MUST NOT rebuild them.
- Formal recording of Phase 4 and Phase 5 verification in `implementation-roadmap.md` (or an explicit leftover-blocker list) **before implementation starts**.
- For automated tests: no live tracing or model key required (telemetry and generation doubled).
- For live tracing definition-of-done evidence: configured Langfuse (or compatible) credentials. Missing those is an environment blocker, not a product-create failure.
- No Phase 7 code. This phase MUST NOT wait on GitHub Actions or production images.

## Deferred Context (not acceptance)

The following remain future cycles or optional bonuses and MUST NOT be implemented or tested as Phase 6 done-when items:

- **Second question-generation strategy** (optional assessment bonus, e.g. `balanced` vs `comprehension`) — **deferred**. Preserve `QuizGenerationPort`; do not add public strategy values this cycle.
- Phase 7: GitHub Actions, production Dockerfiles, deployment automation, architecture walkthrough kit.
- Roadmap M8 / P2: Langfuse evaluations and quality sampling, golden-set fixtures, usage dashboards, Markdown preview, difficulty pickers, historical quizzes, authenticated workspaces, queues, streaming.
- Optional Playwright browser-driver suite.
- Changing the provisional multiple-answer scoring policy.
