# AI Quiz Generator — Presentation speaker notes

Prepared for Eduardo, 11 October 2026. Source snapshot: commit `9b6eec0`.

Use slides 1–16 for a 10–12 minute opening. Slides 17–53 are an on-demand technical appendix. Each numbered section matches the full PDF.

Evidence policy: implemented behavior is derived from current source. Historical passes are attributed to checked-in repository evidence. Application tests, paid model calls, external dashboards and hosted CI/deployments were not rerun or inspected when creating this deck.

## Opening timing

1–2: 1 minute; 3–5: 2 minutes; 6–9: 3 minutes; 10–14: 3 minutes; 15–16: 1–2 minutes. Stop the opening at slide 16 and follow the interviewer’s questions.

## Suggested opening

“I built a TypeScript application that generates a short quiz from a configurable README and topic. I separated AI content generation from deterministic grading, organized the code so an assistant and I can work across the whole feature, and added tests and evaluation tooling to distinguish software correctness from question quality. I’ll show the main decisions and the remaining evidence gaps, then we can follow the code path you want to discuss.”

## 01. AI Quiz Generator

Opening (20 seconds): I built a small application that turns a configurable Markdown source and topic into a quiz. My central decision was to separate probabilistic content generation from deterministic grading. I will start with the stack and delivery roadmap, then explain the data flow, testing and operational choices. Slides 1–16 form the opening; use the appendix when the discussion goes deeper.

**On-screen point:** Eduardo • Project presentation • 11 October 2026

**Evidence:** `package.json`, `docs/architecture.md`

## 02. One language, clear responsibilities

Explain choices by responsibility, not by listing logos. Nest gives a composition root for ports and adapters. Next supplies a modern UI while the browser consumes only public contracts. Prisma provides typed persistence and migrations. Zod handles runtime trust boundaries that TypeScript alone cannot validate. The Vercel AI SDK provides structured output without introducing a large autonomous-agent framework. Exact declared dependencies are in the package manifests; this deck avoids turning package version numbers into design arguments.

**On-screen point:** Frameworks live at the edges; business rules stay testable in plain TypeScript.

**Evidence:** `apps/api/package.json`, `apps/web/package.json`, `turbo.json`

## 03. Build the reliable path before adding AI

The roadmap reduced risk in order. I first proved grading and persistence using deterministic fixtures, then added the uncertain model dependency, then the UI and two-source acceptance. Observability and evaluations came after a stable generator. Spec Kit connects constitution → spec → plan → tasks → implementation and review. roadmap.md is the scope contract; implementation-roadmap.md and delivery-status.md carry phase evidence. Phase 7's harness is implemented, but calibration and baseline acceptance remain unfinished. A roadmap checkbox alone is not proof.

**On-screen point:** P0: a working assessment flow. P1: observability, quality evidence and a repeatable delivery path.

**Evidence:** `implementation-roadmap.md`, `roadmap.md`, `specs/`

## 04. Why a monorepo helps AI-assisted development

Suggested wording: I chose Turborepo and a monorepo because they fit how I develop with an AI assistant. The assistant can inspect the whole repository and help design a feature across the UI, contracts, API, domain and persistence. That is useful context, not a guarantee that every file fits a model's context window or that the assistant is correct. Turborepo is a build/task orchestrator, not the runtime web framework. pnpm owns workspace installation. Turbo understands the task graph and caching. Shared instructions, inward dependencies, review and tests keep end-to-end edits constrained. I do not claim a measured productivity improvement or universal superiority over separate repositories.

**On-screen point:** The benefit is my workflow judgment: visibility comes from the monorepo; Turbo makes its checks practical.

**Evidence:** `pnpm-workspace.yaml`, `turbo.json`, `AGENTS.md`

## 05. Folders follow the product lifecycle

A quiz is a published set of questions and keys. An attempt is one sitting with selections and a result. Keeping them separate makes ownership and transaction behavior easier to explain. Inside each context, roles such as HTTP, generation and persistence describe adapters. Next route files compose feature screens rather than owning product logic. Shared UI is for primitives, not complete screens. Evals are a separate reviewer workflow because a quality score must never replace the learner's grade.

**On-screen point:** Group code by the reason it changes; avoid a broad infrastructure/ or utils/ dumping ground.

**Evidence:** `.agents/skills/folder-architecture/SKILL.md`, `docs/architecture.md`

## 06. Ports and adapters around a pure core

SOLID is concrete here: each adapter has one reason to change, use cases depend on interfaces, and a new implementation can replace an adapter. The Nest module is the composition root that binds tokens to concrete implementations. Domain and application do not import Nest, Prisma, Next or provider SDKs. Application does use public contract types, so the dependency claim is framework independence, not a claim that application imports only one package. There is a tradeoff: more files and wiring than a single script, justified by security, deterministic tests and provider boundaries.

**On-screen point:** Swapping a model, transport or telemetry provider should not rewrite scoring.

**Evidence:** `packages/domain/src/`, `packages/application/src/`, `apps/api/src/quiz/quiz.module.ts`

## 07. Two paths, one durable source of truth

Walk left to right once. The source is fetched only on creation; later grading uses the stored quiz and keys, so upstream README changes do not change a sitting's score. Fetch and model calls happen before the short persistence transaction. On submit, the token, attempt, quiz and selection ownership are checked server-side. Question order determines weights. After successful finalization, repeated submissions return the stored result. Evals are offline reviewer work and do not participate in this learner path.

**On-screen point:** The browser never receives a pre-submit answer key and never supplies an authoritative score.

**Evidence:** `packages/application/src/quiz/create-quiz.ts`, `packages/application/src/attempt/submit-quiz.ts`

## 08. Seven tables tell an auditable story

There are seven Prisma models: SourceDocument, Quiz, Question, QuestionOption, QuizAttempt, AttemptAnswer and AttemptAnswerSelection. Selection is an explicit join because multiple answers may be chosen. Foreign keys and unique positions protect relational integrity. The application validates the exact four-choice cardinality and cross-question ownership; these are not all database CHECK constraints. Public serialization, not a second database, controls when keys may be revealed. A full ER diagram is in the technical appendix.

**On-screen point:** Snapshot + explicit order + stored selections allow the result to be reconstructed and explained.

**Evidence:** `apps/api/prisma/schema.prisma`, `docs/data-model.md`

## 09. The LLM never grades the learner

State the ambiguity proactively. The supplied task does not define penalties or normalization for multiple-answer questions. I used its literal count interpretation and isolated the function so a clarified rule changes one policy, not the whole system. If a multiple question has two correct options, choosing both earns 2, not 4. Choosing all four also earns 2 under this policy, an obvious incentive tradeoff. I would confirm the expected rule with the interviewer before adding a deduction or rescaling. Weight is by quiz position, not submission order or difficulty inferred by the model.

**On-screen point:** Consequence: an all-correct multi-select sitting may score below 4; selecting every option is not penalized.

**Evidence:** `packages/domain/src/scoring/scoring-policy.ts`, `packages/domain/src/scoring/weighted-score.ts`

## 10. Every boundary has a different risk

SSRF is the biggest network risk because the URL is caller-controlled. The adapter validates every hop and pins connections to checked public IPs. Prompt injection is a different risk: source text could try to override generation rules. The system prompt treats it as data, output is constrained, and adversarial evals probe failure modes. An excerpt occurring in the source does not prove that the claimed correct option follows from it. Keys and tokens have separate protections. sessionStorage limits token exposure through URLs, but is readable by browser JavaScript and is not protection against XSS.

**On-screen point:** Prompt instructions reduce injection risk; they do not prove semantic correctness or complete resistance.

**Evidence:** `apps/api/src/quiz/source/`, `packages/application/src/quiz/to-public-quiz.ts`, `packages/application/src/attempt/submit-quiz.ts`

## 11. Four test layers, four kinds of evidence

A unit test answers whether a known input gives the expected behavior. A database integration test answers whether adapters work with PostgreSQL, including locking and uniqueness. API E2E exercises the Nest stack through HTTP and persistence; the model is deliberately mocked for stable CI. RTL tests form/player/results behavior in jsdom. Live model evaluation asks whether new questions are supported, clear and relevant across a versioned dataset. Passing deterministic tests does not establish live content quality. Existing repository evidence is cited; application suites were not rerun to create this document.

**On-screen point:** Supertest is API E2E. RTL is component/UI integration. Neither is a full real-browser E2E suite.

**Evidence:** `apps/api/test/`, `apps/web/src/features/quiz/`, `evals/README.md`

## 12. Evaluate content quality separately

The dataset is small and curated, not a benchmark or statistical guarantee. Express and Fastify snapshots are pinned by checksums. The judge does not receive isCorrect, reducing anchoring on the generator's own key. We compare its independent proposed key with the server's key and inspect evidence. The live report recorded missing credentials; it is not a content-quality pass. Human labels are empty and a baseline has not been accepted. I would finish calibration before trusting a regression gate. Mocked harness tests establish evaluator mechanics, not model quality.

**On-screen point:** A quality score is reviewer evidence. It never overwrites the learner’s 0–4 score.

**Evidence:** `evals/datasets/golden-v1.json`, `docs/evals/phase-7-report.md`, `evals/baselines/`

## 13. Observe the workflow, compare quality runs

Explain the active file: LangfuseTelemetryAdapter implements the pure TelemetryPort using lazy OpenTelemetry and Langfuse imports. A generation stage becomes a generation observation; other stages become spans. The adapter extracts usage from the returned generation object and records outcome or stable error code. It exports metadata rather than raw prompts, source bodies, user answers or keys by default. PROMPT_VERSION is a trace label, not Langfuse-hosted prompt management. The adapter supports model metadata, but current use-case attributes do not supply modelId; improving that is a next step. The experiment adapter records already computed case results through experiment.run. It currently exposes first-question semantic dimensions as item scores, which is a limitation to improve.

**On-screen point:** Tracing is best-effort and redacted; it must not rerun completed business work after an error.

**Evidence:** `apps/api/src/quiz/telemetry/langfuse-telemetry.adapter.ts`, `apps/api/src/eval/langfuse-experiment.adapter.ts`

## 14. Automate confidence; make deployment explicit

Do not present this as continuous automatic deployment. Quality, integration and build jobs run in parallel; image builds depend on build. The release workflow is manually dispatched and is not automatically gated by the CI workflow. Production environments can apply controls, but branch protection and environment approval settings are outside this repo and have not been verified. Publishing defaults to false and deployment defaults to none. Even the compose path prints commands rather than remotely running them. A successful Docker build proves a packaging step, not that the application is live.

**On-screen point:** CI configuration exists; hosted green runs, registry publish and an actual deployment require separate evidence.

**Evidence:** `.github/workflows/ci.yml`, `.github/workflows/llm-evals.yml`, `.github/workflows/release.yml`

## 15. Delivery status with the gaps visible

Use three states: passed, failed and not_run. docs/delivery-status.md reports prior tests and container smoke checks as passed. This presentation inspected the implementation and those records but did not re-execute the historical demonstrations or inspect external dashboards. The latest eval report is not_run, and I will not call the golden-set quality gate passed. I can explain the code and the path to close each remaining item. A second strategy is an extension seam today, not a second implemented feature.

**On-screen point:** Production-oriented implementation with a repeatable deployment path; the deck does not claim a hosted service.

**Evidence:** `docs/delivery-status.md`, `README.md`, `implementation-roadmap.md`

## 16. Demo the behavior, then follow the questions

The recorded Express score is 3.123978313213543 and Fastify is 3.5963866275736684; displayed percentages are 78.10 and 89.91. These are historical evidence, not predictions for the next model call. They illustrate the multi-select interpretation. Do not retrieve hidden keys during a normal learner demo. If credentials or network are unavailable, demonstrate deterministic tests and stored records and clearly label that route offline. Invite the interviewer to choose ingestion, grading, evals or delivery for the deep dive. Stop the opening here rather than presenting all appendix slides in sequence.

**On-screen point:** Historical all-correct scores: Express 3.12 / 4; Fastify 3.60 / 4. Future live questions and scores may differ.

**Evidence:** `README.md#two-source-demonstration-interview-mvp`, `docs/walkthrough.md`

## 17. The pipeline, step by step

Explain ingestion, processing and loading as a bounded document pipeline, not a full retrieval platform. The source is one remote document. No vector database, embeddings, chunk ranking or autonomous tool loop are currently implemented. The creation path is synchronous and holds the HTTP request until validation and persistence finish. The status enum has generating and failed values, but the current use case inserts only ready quizzes after successful generation; it does not persist a generation job lifecycle.

**On-screen point:** Pseudocode is explanatory: it omits transport plumbing and is not a replacement for the real source.

**Evidence:** `packages/application/src/quiz/create-quiz.ts`, `packages/application/src/attempt/submit-quiz.ts`

## 18. Validate before spending model tokens

Contract defaults are 5 questions and balanced. Only balanced is accepted. The rate limiter counts attempts, including requests denied for concurrency, because the timestamp is recorded before the in-flight check. It bounds costly creates rather than all endpoints. A failed model configuration does not prevent API startup; a live create fails with a stable upstream error, never a fake product quiz. The request validation is not the full SSRF policy: the source adapter performs the network safety checks.

**On-screen point:** The limits are in-memory and process-local; shared admission control is future work for multiple replicas.

**Evidence:** `packages/contracts/src/quiz/create-quiz.ts`, `apps/api/src/quiz/http/quiz.controller.ts`, `apps/api/src/quiz/http/create-quiz-limiter.ts`

## 19. Resolve the URL into bounded bytes

GitHub blob links are transformed into raw.githubusercontent.com links. Other public HTTPS hosts can be fetched if they satisfy the safety and media-type policy. A missing content type is accepted only for raw.githubusercontent.com. Error codes distinguish unsafe destination, unsupported type, oversized body, timeout, unusable content and ordinary fetch failure. The transport is injectable, so tests can model DNS, redirects, bad media types and slow/large responses without using the internet. The 10-second timer is per request hop, not a global end-to-end creation deadline.

**On-screen point:** GitHub blob → raw preserves the source identity while retrieving Markdown rather than a repository web page.

**Evidence:** `apps/api/src/quiz/source/https-markdown-source.adapter.ts`, `apps/api/src/quiz/source/github-blob.ts`

## 20. Validate DNS and pin the connection

DNS rebinding means that resolving for validation and then allowing the HTTP client to resolve again can reach a different, unsafe address. This transport uses the checked address directly while preserving SNI and Host for the HTTPS origin. It also rejects mixed public/private DNS results. IP classification needs tests for unusual mapped and hexadecimal representations; the implementation roadmap records a previously found mapped-IPv6 bug that was fixed. Improvements include an overall deadline covering DNS and redirects, and outbound network policy as defense in depth. These are future work, not claims about current deployment.

**On-screen point:** The socket uses the validated IP; TLS and HTTP still use the intended hostname.

**Evidence:** `apps/api/src/quiz/source/public-ip.ts`, `apps/api/src/quiz/source/fetch-transport.ts`, `apps/api/src/quiz/source/public-ip.spec.ts`

## 21. Normalize Markdown without executing it

decodeUtf8 uses TextDecoder with fatal:true so malformed UTF-8 fails rather than silently replacing bytes. NUL is treated as binary content. The normalizer strips HTML comments and trims whitespace, then extracts the first H1 title. It does not perform heading-tree parsing, boilerplate ranking, Unicode canonicalization or explicit line-ending normalization. The size cap limits input memory, and the minimum length rejects empty/unusable documents but does not guarantee enough information for any topic. Checksums provide identity and reproducibility, not proof of trustworthiness or deduplication.

**On-screen point:** The full normalized snapshot is durable evidence; changing source content yields a different fingerprint.

**Evidence:** `apps/api/src/quiz/source/normalize-markdown.ts`, `packages/domain/src/quiz/markdown-source-port.ts`

## 22. Keep the snapshot; bound the model input

This is an important interview detail: I did not implement RAG. Sending a bounded prefix was the smallest workable approach for short README sources. The same snapshot supports persistence and excerpt matching. A 32,000-character bound is only an approximate cost guard and can still behave differently across languages/tokenizers. Heading-aware chunks, topic relevance ranking and token budgeting would be the next extension for longer documents; embeddings are optional if simpler retrieval is sufficient. Grounding currently checks the full snapshot rather than specifically restricting evidence to the prefix seen by the model. Context selection provenance could make that distinction explicit.

**On-screen point:** Next improvement: heading-aware selection under a token budget, retaining source offsets and citations.

**Evidence:** `packages/application/src/quiz/create-quiz.ts`, `packages/application/src/quiz/grounding.ts`

## 23. A constrained generation step

AI is appropriate for generating relevant questions and plausible distractors, not deciding a mathematical grade. The Vercel AI SDK adapter asks for an object constrained by Zod. The prompt includes the chosen topic, count, balanced strategy and a source block. Prompt delimiters are not a sanitizer or a proven security isolation boundary, especially when source text contains adversarial content. There are no tool calls, memory, planner, multi-agent loop or second strategy in the runtime. The explicit pipeline is easier to observe, test and bound for this assessment.

**On-screen point:** The system prompt and delimiters guide behavior; structured validation and evals test the result.

**Evidence:** `apps/api/src/quiz/generation/quiz-prompt.ts`, `apps/api/src/quiz/generation/openai-quiz-generation.adapter.ts`

## 24. Validate shape, then business invariants

The generation schema enforces the requested array length, four options, nonempty text, a question type and unique labels. Correct-key cardinality and server-owned identifiers are domain/adapter responsibilities. The adapter assigns random UUIDs and zero-based positions so the model does not control database identity. Application validation runs within the generation stage and again in a validation stage before persistence. Do not describe that as two model calls; they are deterministic checks. Exact Zod array/cardinality constraints do not validate that a claim follows logically from evidence.

**On-screen point:** A schema-valid object can still contain an unsupported answer; semantic quality needs additional evidence.

**Evidence:** `apps/api/src/quiz/generation/generated-quiz.schema.ts`, `packages/domain/src/quiz/quiz.ts`, `packages/application/src/quiz/grounding.ts`

## 25. Ground an excerpt back to source text

locateSourceExcerpt tries exact text, wrapping quotes, collapsed whitespace and unwrapped Markdown link labels. Offset mapping allows a label match to recover the original source markup span. This prevents rejecting otherwise grounded outputs merely because the model omitted link syntax. assertGrounded writes the canonical located span back to the question. It does not perform semantic entailment or rank relevant paragraphs. An irrelevant but present quote could still pass; that is why source support, relevance and clarity belong in evals and human review.

**On-screen point:** Textual traceability and factual entailment are separate quality checks.

**Evidence:** `packages/application/src/quiz/grounding.ts`, `packages/application/src/quiz/grounding.spec.ts`

## 26. Bound uncertainty and fail cleanly

Each generation attempt has a 30-second abort signal and creation permits at most three attempts. That does not equal a guaranteed 30-second user request: source fetching, DNS and multiple model attempts add time. Invalid outputs and retryable upstream errors retry immediately; missing configuration, quota and credential failures stop early. The prompt is rebuilt with the same rules rather than feeding validation details back for repair. Fetch is outside the retry loop. Database persistence happens only after validation and does not hold a database transaction during network/model calls.

**On-screen point:** Future work: overall deadline, error-specific backoff and prompt repair based on validation feedback.

**Evidence:** `packages/application/src/quiz/create-quiz.ts`, `apps/api/src/quiz/generation/provider-failure.ts`

## 27. Publish the quiz in one transaction

The repository uses nested Prisma creation; the pseudocode separates inserts only to make the data model understandable. The UnitOfWork adapter supplies repositories backed by the same transaction client. Avoid calling provider SDKs from these repositories. Hashes are stored but not unique, so repeating a creation can persist another source snapshot and a new quiz. Creation is not idempotent across HTTP retries in the way submission is. A creation idempotency key would be useful to avoid duplicated model costs after client timeouts. Application-level immutability means no published-key mutation route/port; it is not a database trigger guarantee.

**On-screen point:** Current create is synchronous: generating/failed enum values exist, but failed jobs are not persisted here.

**Evidence:** `apps/api/src/quiz/persistence/quiz.prisma-repository.ts`, `apps/api/src/quiz/persistence/prisma-unit-of-work.ts`

## 28. The relational model preserves ownership

Question position is unique within a quiz; option position and label are unique within a question. AttemptAnswer is unique per attempt/question. Selection's composite primary key prevents duplicate option selections for one answer. Some relationships use Restrict to preserve historical rows while others use Cascade for owned children; explain the actual schema rather than claiming every deletion is prohibited. Correct-choice cardinality, option-question ownership across the join, and immutable published keys are application invariants. The schema has Float fields for stored full score and display values, and an Int rawScore.

**On-screen point:** Foreign keys ensure referenced rows exist; the application also ensures each selected option belongs to its question.

**Evidence:** `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`, `docs/data-model.md`

## 29. A public contract for each lifecycle step

Controllers parse and delegate, use cases handle lifecycle and authorization, serializers control disclosure. GET quiz is public by design for this assessment; it is not an account-owned private document system. Only a token holder can submit/retrieve that attempt's result. The post-submit result includes correct flags and selected IDs, while the public pre-submit view excludes excerpts that could give away the key. Errors use an allowlisted stable code and request ID. Detailed model logs or provider stacks do not reach the browser.

**On-screen point:** Public quiz IDs identify documents; bearer tokens authorize a learner’s sitting and result.

**Evidence:** `apps/api/src/quiz/http/quiz.controller.ts`, `apps/api/src/attempt/http/attempt.controller.ts`, `packages/application/src/quiz/to-public-quiz.ts`

## 30. Setup → player → results

The player uses one question at a time and retains selections while navigating. The API client parses responses through public schemas and maps stable errors to English UI copy. sessionStorage permits reload recovery within a tab; cross-tab synchronization and account history are not implemented. It is accessible to JavaScript, so it does not eliminate XSS risk. ensureOpenSitting deduplicates pending start promises per quiz inside the current JavaScript runtime; it is not a distributed idempotency scheme. The botanical theme uses shared primitives and high-contrast actions, with correctness conveyed by text rather than color alone.

**On-screen point:** Accessible labels and explicit correctness text matter as much as visual polish.

**Evidence:** `apps/web/src/features/quiz/`, `apps/web/src/features/quiz/session/attempt-session.ts`, `packages/ui/`

## 31. Issue a capability for one sitting

This is a capability-style anonymous model, not full user authentication. The token authorizes one attempt. Storing a hash means a database read alone does not reveal the raw bearer credential. Timing-safe comparison is used after hashing. If browser state is lost there is no account or recovery mechanism to recover the capability. Tokens have no implemented expiry/revocation workflow in this MVP; this is a future product-hardening decision. Do not put the raw token in logs, URLs or telemetry.

**On-screen point:** The start response issues the raw token once; there is no token recovery endpoint.

**Evidence:** `packages/application/src/attempt/start-attempt.ts`, `apps/api/src/attempt/http/attempt-token.ts`, `packages/application/src/util/token-hash.ts`

## 32. Validate ownership before calculating

The browser posts only question IDs and selected option IDs. The domain checks quiz/attempt association and all selection invariants before scoring. All questions must have a valid answer, rather than silently treating a missing response as zero. Answers may arrive in arbitrary order; domain traversal uses the ordered quiz questions. After a sitting is scored, the existing result wins even if a later request attempts different selections. Authorization still applies to that repeated request.

**On-screen point:** An authenticated repeat after finalization returns the original result instead of overwriting it.

**Evidence:** `packages/application/src/attempt/submit-quiz.ts`, `packages/domain/src/attempt/attempt.ts`, `packages/domain/src/scoring/scoring-policy.ts`

## 33. Make the score policy explicit

Be ready to disagree constructively if the interviewer expects a normalized rubric. Say: The text did not specify penalties or whether selecting the complete correct set should earn four points. I documented a literal count policy. If you prefer full-set normalization or deductions, I can update this function and its unit expectations without changing persistence or the weighting function. Avoid quietly changing the assessment rule during the presentation. Selection validation ensures duplicates cannot inflate the count and foreign IDs cannot receive points.

**On-screen point:** This provisional policy matches the documented interpretation, but permits select-all gaming on multiple questions.

**Evidence:** `packages/domain/src/scoring/scoring-policy.ts`, `roadmap.md#scoring-formula-must-be-unit-tested`

## 34. A hand-checkable weighted average

The sum of geometric weights for n questions is (1.1^n − 1) / 0.1, but the implementation uses an easy-to-review loop. For five questions, the final weight is 1.4641. At eight questions, index seven is 1.9487171. The last question therefore has almost twice the first question's weight, because that is required by the task. The score stays in 0–4 if every raw score is in 0–4. Display conversions are secondary; they never replace the stored grade.

**On-screen point:** This example is deterministic teaching evidence, not a live-model result.

**Evidence:** `packages/domain/src/scoring/weighted-score.ts`, `packages/domain/src/scoring/weighted-score.spec.ts`

## 35. One result even under concurrent submits

The repository locks the attempt on find and finalization using parameterized Prisma.sql. The transaction keeps that lock until commit or rollback. A second writer waits, then observes the scored status and returns the stored result. If a uniqueness conflict occurs, the application catches AlreadyScoredConflictError only after the failed transaction has rolled back and reloads in a new transaction. Never try to reuse an aborted Postgres transaction. Integration and API tests cover repeats, races and rollback. Unrelated attempts can proceed independently; there is no global grading lock.

**On-screen point:** Submission is idempotent; creation and starting a new attempt are not equivalent idempotency guarantees.

**Evidence:** `apps/api/src/attempt/persistence/attempt.prisma-repository.ts`, `apps/api/src/quiz/persistence/prisma-unit-of-work.ts`, `packages/application/src/attempt/submit-quiz.ts`

## 36. Unit tests pin down deterministic behavior

The pure score needs neither network nor database. Unit tests should include independent expected values, not compute the expected result with the same algorithm under test. Use-case tests prove behavior across dependencies using memory ports: fetch once, bounded generation attempts, no persistence on invalid output, and keys excluded from the public view. Source-adapter tests inject a fake transport to cover DNS/redirect/type/size policies. Boundary tests reject prohibited framework imports. These tests run in the deterministic pnpm test lane.

**On-screen point:** Mock a port to control uncertainty; assert observable behavior rather than mirroring implementation details.

**Evidence:** `packages/domain/src/scoring/*.spec.ts`, `packages/application/src/quiz/create-quiz.spec.ts`, `packages/application/src/attempt/submit-quiz.spec.ts`

## 37. Use a real database for database claims

Use a disposable ai_quiz_test database with the production migration files applied, not a developer's quiz data. Test setup guards database identity and isolates cleanup. A concurrency test must run competing submissions, not just two sequential calls. Assert the final persisted record and selection counts, not only the response status. No live model is needed: a known quiz fixture provides reproducible scoring expectations. Turbo caching is disabled for database integration/E2E tasks because database state is not fully captured by source-file hashes.

**On-screen point:** A fake repository cannot prove PostgreSQL locking, transaction rollback or uniqueness behavior.

**Evidence:** `apps/api/test/integration/`, `apps/api/jest.integration.config.cjs`, `.github/workflows/ci.yml`

## 38. Exercise the public REST lifecycle

createApiApp overrides source/generation/telemetry ports by default. Certain tests use a fake transport with the real source adapter, while others enable the product adapters. Standard CI remains offline with respect to model calls while using a real database. The live README gate is PHASE3_LIVE_README=1 with model credentials, and Langfuse has a separate gate. A skipped gate is not a passed test. Describe Supertest as API end-to-end, not browser end-to-end; a Playwright-style real-browser suite is still future work.

**On-screen point:** Mocked API E2E proves application wiring; gated live tests separately prove source/provider connectivity.

**Evidence:** `apps/api/test/e2e/quiz/`, `apps/api/test/e2e/support/create-app.ts`, `apps/api/test/e2e/quiz/quiz-two-sources.spec.ts`

## 39. Test the learner’s interactions

RTL should test user-visible behavior such as labels, checked states, progress and recovery actions, rather than component internals. API calls are mocked so a network outage does not make a player test flaky. The repository also tests API-client parsing, attempt-session helpers, outcome copy and secret/server-import boundaries. The design-system checklist covers responsiveness and focus semantics, but a checklist is not an automated browser test. I would add one critical browser journey and narrow-screen/keyboard checks after completing the evaluation evidence.

**On-screen point:** A real-browser suite should complement RTL; it should not replace pure scoring and API tests.

**Evidence:** `apps/web/src/features/quiz/setup/setup-form.test.tsx`, `apps/web/src/features/quiz/player/quiz-player.test.tsx`, `apps/web/src/features/quiz/results/quiz-results.test.tsx`

## 40. Pin the evidence before comparing models

The dataset schema allows 12–20 cases; the current version has 14. Pinned source files and checksum validation catch accidental source drift. Reference facts and evidence excerpts guide review, while expected behavior distinguishes valid-grounded-quiz, refuse-unsupported and resist-injection. A live upstream README may evolve, so frozen eval snapshots serve a different purpose from a live product fetch. The cases are curated and not representative enough to claim global quality statistics. Expand by failure category rather than simply adding many near-duplicate happy paths.

**On-screen point:** A pinned source controls one source of variation; model outputs can still vary across runs.

**Evidence:** `evals/datasets/golden-v1.json`, `evals/sources/`, `evals/src/dataset/schema.ts`

## 41. Hide the generator’s key from the judge

The judge sees the question, labels, topic and full source but not the generator's correct flags or chosen evidence excerpt. It proposes positions and supporting excerpts. This is more informative than asking the same model 'is my answer correct?' while showing it the answer. The judge is configurable independently through EVAL_JUDGE_MODEL, but model diversity and independence are not established by configuration alone. Output validation/retry protects the harness from malformed verdicts. The rubric has versioned documentation, while the live adapter builds a code-defined prompt; synchronizing these is a useful improvement.

**On-screen point:** Independent input reduces anchoring; a judge model can still share biases and make mistakes.

**Evidence:** `evals/src/judge/strip-key.ts`, `apps/api/src/eval/openai-judge.adapter.ts`, `evals/src/judge/output-schema.ts`, `evals/src/evaluators/compare-keys.ts`

## 42. Run experiments outside learner grading

The runner reuses the production generation adapter/port, but uses pinned files rather than remote fetching. It separates runtime generation failures, deterministic failures, semantic findings, unavailable judge/destination and report state. Latency and token counts help compare quality against operational cost. The checked-in report records zero tokens and no live outcomes because credentials were missing in that run; do not use those zeros as performance measurements. A scoring-invariant evaluator asserts the learner's formula is still intact but is not a model-based grade.

**On-screen point:** One shared generation boundary avoids evaluating a different generator than the application uses.

**Evidence:** `evals/src/experiment/run-golden.ts`, `apps/api/src/eval/cli.ts`, `evals/src/experiment/report.ts`

## 43. Calibrate before freezing a baseline

A baseline is a frozen reference with version/provenance, not simply the latest run. Human review should focus on unsupported claims, ambiguous distractors and partial-credit questions. ≥90% is a local target, not an external standard. A judge disagreement is evidence to investigate; correlated model errors could still make both agree incorrectly. Calibration needs a real sample and explicit labels rather than treating missing labels as agreement. Missing credentials and missing baseline must remain not_run. The reporting artifact itself existing or the workflow exiting green does not turn those states into passed.

**On-screen point:** Latest committed report: 0 passed, 0 failed, 14 not_run; human sample size 0; no accepted baseline.

**Evidence:** `docs/evals/phase-7-report.md`, `evals/baselines/gates.v1.json`, `evals/baselines/human-labels.v1.json`

## 44. Stage traces explain latency and failure

The adapter distinguishes failure to start observation from a failure inside the business callback using invoked/started flags. Only an observation-start failure can retry observation setup or fall back to running the callback; once business work ran, its error is rethrown. This avoids accidentally repeating side effects when the tracer fails. SDK setup is lazy and best-effort. Shutdown flushes buffered data. Missing either tracing key selects NoOpTelemetryPort. Model usage is extracted from GeneratedQuiz. ModelId support exists in the adapter but is not filled by the current creation stage attributes. Raw prompt inspection and hosted prompt-version management are not implemented just because Langfuse is installed.

**On-screen point:** Observability failure should not become a quiz failure or cause duplicate generation/persistence.

**Evidence:** `apps/api/src/quiz/telemetry/langfuse-telemetry.adapter.ts`, `packages/domain/src/shared/telemetry-port.ts`, `apps/api/src/platform/http/request-context.ts`

## 45. Record reviewer outcomes as experiments

Be precise about the integration: the repository's versioned files are the golden dataset source of truth. The adapter calls the Langfuse experiment API with inline item data and tasks that return already computed case results; it does not establish that a persistent Langfuse-managed dataset was created. It records deterministic_pass, blocking_semantic_fail and first-question relevance/clarity/ambiguity/distractorQuality/coverageContribution. Run scores include deterministic rate and blocking-fail count. Repeated case IDs need robust item identity to avoid ambiguity when replaying results. A failed destination should not erase the local report or pretend a successful export.

**On-screen point:** Future: all-question aggregation, linked trace/model/prompt provenance and reliable experiment item identity.

**Evidence:** `apps/api/src/eval/langfuse-experiment.adapter.ts`, `evals/src/experiment/experiment-recorder-port.ts`

## 46. Know what is alive and what is ready

The app is not healthy merely because the model happened to answer a prompt. Liveness probes should not kill a process on a transient provider outage. Readiness is currently about database connectivity, not a composite provider status. Incoming request IDs are reused only when they satisfy the format policy; malformed values are replaced. Full URL/query data and logs need careful redaction because source URLs can contain secrets even though userinfo is forbidden. Future operations include request-wide cancellation, metrics/alerts, retention, and rate-limit state cleanup/shared storage for multiple replicas. Do not claim measured availability or latency objectives yet.

**On-screen point:** Current bounds suit one small process; horizontal scale needs shared limits, deadlines and measured SLOs.

**Evidence:** `apps/api/src/health/health.controller.ts`, `apps/api/src/platform/http/`, `apps/api/src/platform/logging/`

## 47. Cache reproducible work, rerun stateful work

The installed Turbo version observed here is 2.11.7; the root package range is ^2.5.8. Its bundled docs are the primary reference used for the task graph and cache explanation. This is a build system, while Nest and Next are runtime frameworks. The current file declares DATABASE_URL for stateful suites, but does not explicitly declare NEXT_PUBLIC_API_URL for build. Next-aware inference may apply; audit environment hashing before relying on reused build artifacts across public origins. Do not say that remote caching is enabled: the visible workflow caches the local .turbo directory using GitHub Actions cache. Cache hits are prior computation evidence rather than fresh executions.

**On-screen point:** Cache correctness depends on complete inputs, especially build-time public environment variables.

**Evidence:** `turbo.json`, `node_modules/turbo/docs/`, `.github/workflows/ci.yml`

## 48. CI checks the product from multiple angles

quality, integration and build have no needs edges between them and can run in parallel; images needs build. Lockfile drift fails frozen install. An unavailable integration database fails the job rather than skip-passing. The Docker build uses the repository root so workspace dependencies are present. The documented prior local checks are distinct from independently verified hosted GitHub runs. This presentation did not query GitHub Actions. Manual code review follows the repository checklist and complements Jest; an LLM review is not a substitute for test execution. Branch protection making these jobs required is a deployment/repository setting, not established by YAML alone.

**On-screen point:** A green deterministic workflow is valuable evidence; it is not a live model-quality or deployment verdict.

**Evidence:** `.github/workflows/ci.yml`, `docs/deployment.md`

## 49. A production-shaped packaging path

The API image has a subtle portability step: source workspace packages export TypeScript, and Node's stripping restrictions under node_modules require emitting JS and retargeting package manifests inside the build before pnpm deploy. It does not rewrite a developer checkout during ordinary startup. Production Compose uses its own persistent DB volume and one-shot migrate service. Runtime images have no development bind mounts. The Compose sample still uses default local PostgreSQL credentials and publishes the DB port; a real host must supply protected credentials and restrict database network access. release.yml is manual, publish_images defaults false, deploy_target defaults none and compose only prints commands. It does not automatically wait for or verify CI success; a future release gate should require a known green SHA. Backups and automated host deployment are future operational work.

**On-screen point:** Only NEXT_PUBLIC_API_URL is a permitted public web build argument; provider and database secrets stay out of images.

**Evidence:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `compose.prod.yml`, `.github/workflows/release.yml`

## 50. The choices I would defend and revisit

The hexagonal layout is more verbose than a one-file app, but separates high-risk policies. A monorepo has larger tooling/graph complexity and broader change visibility, so package boundaries and narrow exports matter. PostgreSQL avoids eventual-consistency problems for this attempt lifecycle. Storing snapshots has retention/storage costs and requires policies for private sources if supported later. A synchronous API is simple but can outlive proxy timeouts during retries. An LLM judge can amplify correlated biases, so I would invest in human calibration before larger dashboards. No queues, vector DB or microservices are necessary just to look production-ready.

**On-screen point:** Add complexity when a measured failure or product requirement justifies it.

**Evidence:** `roadmap.md`, `docs/delivery-status.md`, `packages/application/src/quiz/create-quiz.ts`

## 51. Improve evidence before expanding features

If I had one more day, I would run a credentialed live eval, manually review keys and ambiguity, inspect Langfuse export, and create an accepted baseline only after resolving disagreements. In parallel with delivery work I would verify a clean host startup and migration ordering. Then I would clarify scoring, add a browser acceptance test, and fix context selection for late README sections. For the interview coding portion, isolated scoring policy or a second adapter is a small, testable change. Do not auto-accept a baseline or invent human labels simply to turn the status green.

**On-screen point:** The next roadmap should be driven by evaluation failures and operational measurements.

**Evidence:** `docs/delivery-status.md`, `implementation-roadmap.md`, `roadmap.md`

## 52. Be ready to explain the edges

Rehearsal: explain why selecting all choices is not penalized today, whether answer keys ever reach the client, what happens when a model times out, how a transaction handles a double-submit race, and what Turbo actually caches. Be prepared to name where generation and grading live. For a semantically wrong key, acknowledge that runtime excerpt matching is insufficient and demonstrate the independent judge/compare-keys design rather than claiming hallucinations are impossible. For production readiness, distinguish packaging, local smoke checks, external deployment and quality calibration.

**On-screen point:** Show the relevant function and test; avoid claims broader than the evidence.

**Evidence:** `docs/walkthrough.md`, `docs/architecture.md`, `docs/evals/phase-7-report.md`

## 53. A code map for the interview

The deck is based on a read-only review of the implementation, configuration, tests, roadmap and checked-in evidence at commit 9b6eec0. It does not re-attest historical command runs, live provider quality, external CI status or hosted deployment. Pseudocode intentionally omits plumbing and should be explained alongside actual files. The editable HTML source and builder accompany the PDFs. Use the opening PDF for the first 10–12 minutes and the full PDF as a reference when engineers ask for detailed code/data-flow explanations.

**On-screen point:** Prepared from commit 9b6eec0 and repository state on 11 October 2026; no credentials or raw learner data included.

**Evidence:** `docs/presentation/build_presentation.py`, `docs/presentation/speaker-notes.md`

## Rebuild / export

Run `python3 docs/presentation/build_presentation.py`. Open either generated HTML to edit/review or export with headless Chrome. Both decks use local fonts and contain no network assets. PDF validation should confirm 53 full-deck pages and 16 opening pages, a 16:9 page size, readable text and no clipping.
