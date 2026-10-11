# AI Quiz Generator — Implementation Roadmap

> **Status:** Living product roadmap. See `implementation-roadmap.md` for phase-specific status and verification evidence; planned checkboxes below are not proof of completion.

> **Language:** English (product UI and technical documentation)

> **Target:** A small, demonstrably production-ready Node.js/TypeScript application for the AI Engineer second-interview task

> **Approach:** Vertical slices first; explicit hexagonal boundaries, SOLID design, deterministic scoring, AI-quality evaluation and practical operational quality.

## 1. Product goal and assessment contract

Build an AI-powered quiz application that retrieves knowledge from a **user-configurable Markdown URL**, generates questions about a **customizable topic**, runs the quiz through a responsive web UI, scores the answers, and stores the full attempt in PostgreSQL.

### Assessment requirements (must-have)

- [ ] Accept a topic and a configurable remote Markdown/README.md URL.
- [ ] Retrieve the Markdown server-side; normalize GitHub `blob` URLs to raw content when appropriate.
- [ ] Generate **5–8 questions** from that Markdown.
- [ ] Provide **exactly four choices** for every question.
- [ ] Support single-answer and multiple-answer questions.
- [ ] Score each correct single-answer question as **4 points** and each incorrect one as **0 points**.
- [ ] For multiple-answer questions, award **0–4 points based on the number of correctly selected answers**; see the scoring clarification below.
- [ ] Calculate the final score as a **weighted average** of per-question scores, with geometric weights `1.0, 1.1, 1.21, ...` in quiz order.
- [ ] Persist source metadata, generated questions, answer keys, submitted answers, per-question scores, and final score in PostgreSQL.
- [ ] Expose a REST API for creating/running/submitting quizzes.
- [ ] Provide a working web application to complete a quiz and view results.
- [ ] Demonstrate the workflow against **at least two different README.md URLs**.
- [ ] Explain the application data flow and data model during the live engineering discussion.

### Assessment nice-to-haves

- [ ] Instrument model generation with **Langfuse**.
- [ ] Support an alternative question-generation strategy through a replaceable port.

### Post-MVP engineering quality gate (P1)

The assessment does **not** require an LLM evaluation platform, but this project treats **LLM Evaluation, Golden Dataset and Quality Regression** as an explicit **P1 quality gate before production delivery** (implementation **Phase 7**, main-roadmap **M6**). The functional interview MVP is complete at Phase 5; post-MVP evaluation measures whether generated questions and answer keys are supported by their Markdown sources. The LLM quality score must never alter deterministic user scoring.

### Definition of “production-ready” for this task

A production-ready **small application**, not a broad SaaS platform: validated inputs, controlled source fetching, graceful failures, durable persistence, predictable business rules, essential tests, environment-driven configuration, repeatable builds, and a clear deployment path. Authentication, billing, rich analytics, queues, and microservices are **not required** for the interview MVP.

## 2. Technology choices

| Concern | Selected technology | Decision |
| --- | --- | --- |
| Language/runtime | TypeScript / current supported Node.js LTS | Strict TypeScript across packages |
| Monorepo | Turborepo + pnpm workspaces | Shared tooling and cached tasks |
| Spec-driven development | GitHub Spec Kit | Constitution → specification → clarification → plan → tasks → implementation |
| Backend | NestJS | REST adapters, dependency injection and modularity |
| Persistence | PostgreSQL + Prisma | Type-safe persistence adapters and migrations |
| Input and LLM output validation | Zod | Shared request schemas and generation contracts |
| Frontend | Next.js App Router | Responsive quiz creation, player and results |
| Styling/components | Tailwind CSS + shadcn/ui | Shared semantic theme and accessible primitives |
| Forms | React Hook Form + Zod resolver | Topic/URL input and quiz submission |
| AI orchestration | Vercel AI SDK | Structured generation through `generateText` + `Output.object` |
| Model provider | OpenAI API | Provider configured on the server; model ID via environment |
| Observability | Langfuse | Trace LLM calls, prompts, errors, usage and prompt/model versions |
| LLM evaluations | Versioned golden dataset + deterministic evaluators + LLM-as-a-Judge + human review | Validate grounding, answer keys, ambiguity, topic relevance and regressions |
| Evaluation experiments | Langfuse Datasets, Experiments and Scores | Compare prompt/model versions, latency, usage, costs and quality baselines |
| Tests | Jest + Testing Library + Supertest | Unit, integration, NestJS API end-to-end |
| Automation | GitHub Actions | Lint, types, tests, build and deployment gates |
| Local containers | Docker Compose | PostgreSQL (and optionally API/web) in development |
| Production containers | Multi-stage Dockerfiles | Small, non-root production runtime images |
| Architecture | Hexagonal + SOLID | Pure domain, ports, application use cases, adapters |
| Code quality | ESLint + Prettier | Consistent rules for backend, frontend and packages |

**Important boundaries:** AI proposes quiz content; deterministic TypeScript code computes scores. Never use an LLM to decide the final score. Do not expose correct choices in any pre-submission API response. Golden-set evaluation judges the **quality of generated content**, not the user's quiz performance. Judge outputs are evidence to review, not unquestionable ground truth.

## 3. Proposed repository layout

```text
ai-quiz/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── quiz/                 # quiz HTTP, generation, source, persistence, telemetry
│   │   │   ├── attempt/              # attempt HTTP and persistence
│   │   │   ├── health/
│   │   │   ├── platform/             # config, http, logging, Prisma client
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/e2e/<context>/
│   │   ├── test/integration/<context>/
│   │   └── Dockerfile
│   └── web/
│       ├── src/app/                  # thin Next.js routes
│       ├── src/config/
│       ├── src/features/quiz/        # setup, player, results, layout, api, session, errors
│       ├── src/app/globals.css
│       └── Dockerfile
├── packages/
│   ├── domain/src/{quiz,attempt,scoring,shared}/
│   ├── application/src/{quiz,attempt,util,testing}/
│   ├── contracts/src/{quiz,attempt,errors}/
│   ├── ui/src/{components,lib}/      # shadcn primitives only
│   └── config/                       # Shared ESLint, TypeScript and test configs
├── evals/                              # Version-controlled LLM evaluation suite
│   ├── src/                             # dataset, evaluators, judge, experiment
│   ├── datasets/                        # Curated golden cases, human-verified facts
│   ├── sources/                         # Pinned Markdown snapshots/checksums
│   ├── rubrics/                         # Versioned LLM-as-a-Judge criteria
│   └── baselines/                       # Frozen comparison metadata
├── docs/evals/phase-7-report.md         # Human-readable experiment evidence
├── .agents/skills/folder-architecture/SKILL.md
├── .agents/skills/design-system/
│   ├── SKILL.md
│   └── references/
│       ├── art-direction.md
│       └── tailwind-recipes.md
├── .agents/skills/code-review/SKILL.md # Portable code-review workflow
├── .cursor/agents/code-review.md       # Cursor adapter (read-only)
├── .claude/agents/code-review.md       # Claude Code adapter
├── .codex/agents/code-review.toml      # Codex adapter (read-only)
├── .cursor/rules/folder-architecture.mdc
├── .cursor/rules/ui-design.mdc         # Optional Cursor UI auto-attach
├── .specify/            # Generated by Spec Kit during initialization
├── specs/               # Generated per-feature specs/plans/tasks
├── .github/workflows/ci.yml
├── .github/workflows/llm-evals.yml   # Explicitly gated live evaluations (Phase 8)
├── compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
├── AGENTS.md             # Optional repo-wide agent conventions
└── roadmap.md
```

### Hexagonal dependency rules

1. `domain` knows **no** NestJS, Prisma, HTTP, OpenAI, React, or Langfuse types.

2. `application` depends on domain models and interfaces (ports), not concrete providers.

3. `api` provides inbound REST adapters and outbound fetch/LLM/Prisma adapters via NestJS dependency injection.

4. `contracts` holds public Zod schemas/DTOs only. Keep grading keys in server-only domain/persistence models.

5. `web` uses REST contracts and UI components, never imports server persistence, environment secrets or answer-key logic.

5a. Evaluation runners belong outside the pure domain and scoring modules. Use existing generation ports/adapters; keep judges, rubrics and Langfuse integration separate from quiz-grading policy.

6. Prefer dependency inversion, single responsibility, small use cases, and replaceable adapters. Avoid abstractions without a clear boundary.

### Core ports / use cases

```text
Ports (interfaces):
  MarkdownSourcePort.fetch(url)
  QuizGenerationPort.generate({ topic, sourceText, count, strategy })
  QuizRepositoryPort.save/findById(...)
  AttemptRepositoryPort.create/finalize(...)
  UnitOfWorkPort.transaction(...)
  TelemetryPort.trace(...) [optional; infrastructure may handle it]
Use cases:
  CreateQuizUseCase
  GetQuizUseCase
  StartAttemptUseCase
  SubmitQuizUseCase
  GetQuizResultUseCase
Pure domain services:
  ValidateQuizPolicy
  ScoreQuestion
  CalculateWeightedScore
```

## 4. Domain and persistence design

| Model | Minimum fields | Notes |
| --- | --- | --- |
| `SourceDocument` | `id`, `originalUrl`, `resolvedUrl`, `contentHash`, `title?`, `fetchedAt`, `contentSnapshot` | Keep a reproducible source snapshot; set size limit. |
| `Quiz` | `id`, `sourceDocumentId`, `topic`, `strategy`, `status`, `createdAt`, `modelId?` | Status: `generating`, `ready`, `failed`. |
| `Question` | `id`, `quizId`, `position`, `type`, `prompt`, `sourceExcerpt?` | `type`: `single` or `multiple`; ordered. |
| `QuestionOption` | `id`, `questionId`, `position`, `label`, `isCorrect` | **Server-only** correctness field; exactly four options. |
| `QuizAttempt` | `id`, `quizId`, `publicTokenHash`, `status`, `startedAt`, `submittedAt?`, `weightedScore?`, `percentage?` | Anonymous MVP: unguessable attempt token; store only its hash. |
| `AttemptAnswer` | `id`, `attemptId`, `questionId`, `rawScore` | Enforce one answer per attempt/question. |
| `AttemptAnswerSelection` | `answerId`, `optionId` | Explicit selected options; validate ownership. |

**Constraints and consistency:** uniqueness on `(quizId, position)`, `(questionId, position)`, `(attemptId, questionId)`; foreign keys; scoring and finalization in one transaction; immutable quiz answer keys once the quiz is playable; idempotent repeat submission (return the existing result instead of re-scoring). Consider `Question`/`QuestionOption` only visible through sanitized serializers.

### Scoring formula (must be unit-tested)

For zero-based question position `i`:

```ts
const weight = Math.pow(1.1, i);          // 1.0, 1.1, 1.21, ...
const weightedScore =
  sum(questionScores[i] * weight[i]) / sum(weight[i]);
const percentage = (weightedScore / 4) * 100; // Optional display conversion
```

- **Single-select:** 4 points if the chosen choice is exactly the correct one; otherwise 0.
- **Multi-select:** Literal reading of the assessment: one point per correctly selected answer, clamped to `[0, 4]`; incorrect selections earn no points. The task does **not** specify deductions for incorrect selections or whether multi-select sets containing 1–3 correct options can reach 4 points.
- **Unresolved scoring detail:** Explicitly document and discuss the above assumption with the interviewer; do not silently invent penalties, normalization, or a different rubric. Keep a scoring-policy function isolated so the requirement can be clarified without rewriting the application.
- Weight order is **question order**, not answer-submission time.
- Store score on the `0–4` scale; show optional `0–100%` alongside it, not as a replacement.
- Round **only for display** (e.g., two decimals); use unrounded values in calculation/storage where feasible.

**Deterministic fixtures:** test all-correct, all-wrong, mixed single/multi, repeated submission, boundary index 0/7, and a hand-calculated 3-question sample for the weighting implementation.

## 5. API contract (first draft)

| Method | Endpoint | Request | Response / important behavior |
| --- | --- | --- | --- |
| `POST` | `/v1/quizzes` | `{ topic, sourceUrl, questionCount?: 5..8, strategy?: 'balanced' }` | Validate, fetch, generate, store; return quiz ID/status. |
| `GET` | `/v1/quizzes/:quizId` | — | Topic, source summary and sanitized questions/choices; **no correct flags**. |
| `POST` | `/v1/quizzes/:quizId/attempts` | — | Attempt ID and private bearer token for this attempt. |
| `POST` | `/v1/attempts/:attemptId/submit` | `{ answers: [{ questionId, selectedOptionIds }] }` | Authorized by attempt token; grades transactionally and returns score. |
| `GET` | `/v1/attempts/:attemptId/result` | Attempt token | Weighted score, per-question score and answer explanation **after submission**. |
| `GET` | `/health` | — | Process/liveness; separate dependency readiness if needed. |

**Errors:** use stable error codes for invalid URLs, unsupported content type, oversized sources, fetch timeout, malformed LLM output, generation retries exhausted, invalid quiz answers, unauthorized attempts, and duplicate/non-finalized submissions. Do not leak provider stack traces, API keys or sensitive prompts.

## 6. Milestone roadmap

**Relationship to `implementation-roadmap.md`:** The milestones below describe cross-cutting product deliveries; the phase-specific roadmap defines separate, spec-driven execution cycles. They are related, but not identical units of completion.

| Implementation cycle | Main roadmap milestone(s) | Acceptance checkpoint |
| --- | --- | --- |
| Phase 0 | M0 | Development environment and app shells |
| Phases 1–2 | M1 | Pure grading, persistence and deterministic REST flow |
| Phase 3 | M2 | Real Markdown ingestion and OpenAI generation |
| Phase 4 | M3 | Working browser quiz |
| Phase 5 | M4 | Two-source acceptance evidence; **interview MVP ready** |
| Phase 6 | M5 | Langfuse and operational controls |
| **Phase 7** | **M6** | **Golden dataset, LLM evaluations and frozen quality baseline** |
| Phase 8 | M7–M8 | GitHub Actions, containers, review and interview delivery |
| After delivery | M9 | Optional product extensions |

Quality evaluation is **P1** and does not retroactively block the assessment's P0 acceptance. It is a required checkpoint in this project's chosen *production-delivery plan* before Phase 8.

### M0 — Bootstrap, conventions and design foundations (P0)

- [ ] Initialize git, pnpm workspace, Turbo pipeline, `apps/api`, `apps/web`, and packages.
- [ ] Configure strict TypeScript, ESLint, Prettier, import boundaries and common scripts (`lint`, `typecheck`, `test`, `build`).
- [ ] Install Spec Kit using its published CLI, then run `specify init --here --integration <harness-key>` for the current harness (`cursor-agent`, `codex`, or `claude`) **in a clean or explicitly approved repository**. Check `specify integration list` and `specify init --help` for supported keys and configuration; use `--force` only after reviewing existing files. Spec Kit-generated commands are harness-specific, while project rules/skills in this kit are portable.
- [ ] Write `.specify/memory/constitution.md`: hexagonal dependencies, test-first scoring, Zod validation, security controls, source grounding, accessibility, and code-review gates.
- [ ] Create feature spec / plan / tasks and clarify assessment ambiguities using `/speckit.specify`, `/speckit.clarify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.analyze` (use the commands or skills actually installed by the Cursor Spec Kit integration).
- [ ] Configure `compose.yml` for PostgreSQL with a healthcheck and persistent volume; supply `.env.example` without secrets.
- [ ] Configure Prisma schema, development migrations, local seed fixtures, and repository adapter stubs.
- [ ] Establish UI theme / shadcn component configuration from the portable design-system skill in `.agents/skills/`; `.cursor/rules/ui-design.mdc` is an optional Cursor adapter.
- [ ] Register the code-review workflow in `.agents/skills/code-review/SKILL.md`; use the matching subagent adapter for the selected harness and invoke it for the first meaningful backend PR or diff.

**Exit criterion:** `pnpm install`, database startup, migrations, lint, typecheck, basic API/web startup and local test script work from a clean clone.

### M1 — Domain model and deterministic grading (P0)

- [ ] Implement entities, invariants, use-case ports, and pure scoring policy.
- [ ] Add Zod contracts for create quiz and submit answers.
- [ ] Implement score calculator separately from any AI integration.
- [ ] Persist attempts, answers, selected options and final scores atomically.
- [ ] Write Jest unit tests for scoring, weighted average, invalid selections, and duplicate submits.
- [ ] Implement Prisma repositories behind interfaces and integration-test them against a real test PostgreSQL database.

**Exit criterion:** deterministic score calculations and end-to-end persistence can be demonstrated without an LLM.

### M2 — Markdown ingestion and AI quiz generation (P0)

- [ ] Implement the server-side Markdown fetch adapter with safe redirects, timeouts, size caps, domain/protocol safeguards, and raw-GitHub link normalization.
- [ ] Reject private/loopback/link-local destinations (including redirect and DNS resolution targets) to prevent SSRF; permit HTTPS; block unnecessary MIME types.
- [ ] Keep remote Markdown strictly as **untrusted task data**, never privileged instructions.
- [ ] Normalize Markdown, trim irrelevant boilerplate, select relevant content within token limits, and save snapshot plus SHA-256 checksum.
- [ ] Use Vercel AI SDK with OpenAI and **Zod-backed structured output** (`generateText` with `Output.object`) for quiz/question generation.
- [ ] Validate **5–8 questions, four unique options, stable option IDs, one or more correct answers, valid question type**, groundedness to source, and topic relevance.
- [ ] Server-side revalidate generation outputs; retry boundedly on malformed content; surface clear failure states.
- [ ] Keep prompts, model ID and optional prompt version configurable via environment/configuration.
- [ ] Save the generated quiz in a transaction once validated; prevent partial/invalid playable quizzes.
- [ ] Add mock-model unit tests and adapter-level error/timeout tests.

**Exit criterion:** create and retrieve a quiz generated from one README.md URL through REST.

### M3 — Runnable responsive web experience (P0)

- [ ] Build `/` with topic, Markdown URL, optional question count and generate action.
- [ ] Build `/quiz/[id]` with 5–8 sequential or paginated questions, four options each, single/multi-select input, and visible progress.
- [ ] Build `/quiz/[id]/results` with final `0–4` weighted score, optional percentage, per-question feedback and relevant source link.
- [ ] Integrate React Hook Form, Zod resolver, API client and appropriate loading, error, empty and retry states.
- [ ] Ensure correct choices are never embedded in pre-submit page props, server actions, HTML or client state.
- [ ] Use Tailwind + shadcn/ui and the green, warm, botanical art direction from the included skill.
- [ ] Add semantic form labels, visible focus indicators, keyboard support, responsive card sizing, and reduced-motion support.
- [ ] Add Jest + React Testing Library tests for form validation, choices, progress, and submission feedback.

**Exit criterion:** a user can create, take and finish a quiz from the web app; refresh/result access follows a safe attempt-token lifecycle.

### M4 — API integration and end-to-end reliability (P0)

- [ ] Use Jest + Supertest for API E2E: create → generate → retrieve → start attempt → submit → view result.
- [ ] Use an isolated PostgreSQL test database/compose service and deterministic mock LLM responses in CI.
- [ ] Test remote Markdown failures, OpenAI errors, wrong response schema, incomplete attempts, answer-key leakage, idempotency, and invalid token access.
- [ ] Run identical workflow against **two separate README.md sources**; keep source URLs and screenshots/results in a demo fixture or README.
- [ ] Validate weighted scores with known reference calculations and inspect persisted DB records.
- [ ] Optional later: add Playwright for true cross-browser UI E2E. **Jest + Supertest remains the required API E2E suite.**

**Exit criterion:** one CI command reliably exercises the full backend flow and the live app works with both README samples.

### M5 — AI observability, security and operational controls (P1)

- [ ] Add Langfuse traces/spans for fetching, source preparation, generation, validation and failure/retry paths.
- [ ] Trace model name, prompt version, latency, usage/cost when available, source checksum, `quizId`, strategy, experiment/correlation ID and outcome; redact secrets and avoid recording private attempt tokens/user answers by default.
- [ ] Add structured application logs, a request/correlation ID, health checks, and safe production error mapping.
- [ ] Set request timeout, maximum remote file length, concurrency limit, generation retry limit, and lightweight rate limiting.
- [ ] Keep secrets server-side (`OPENAI_API_KEY`, `DATABASE_URL`, Langfuse credentials); avoid secret values in build arguments/logs.
- [ ] Threat-model SSRF, prompt injection, score tampering, brute-force attempt enumeration and API abuse.
- [ ] Add a second question-generation strategy (e.g., `balanced` vs `comprehension`) behind `QuizGenerationPort` if time permits.

**Exit criterion:** generation behavior is measurable, misuse is bounded, and failures can be investigated without exposing secrets.

### M6 — LLM evaluation, golden dataset and quality regression (P1)

**Goal:** Establish reproducible evidence that generated quizzes are faithful to the supplied Markdown and have correct answer keys, clear questions and useful distractors. This milestone corresponds to **implementation Phase 7**, after Langfuse and before production delivery.

- [x] Build a **versioned golden dataset of 12–20 curated scenarios** covering at least two different README.md sources, multiple topics, single/multiple-answer questions, insufficient sources and adversarial/prompt-injection content.
- [x] Pin the Markdown source snapshots and SHA-256 checksums; for each case store a stable case ID, source URL, topic, requested question count, manually verified reference facts, supporting excerpt/section and expected behavior. Do **not** require brittle verbatim question matches.
- [x] Implement **deterministic evaluators** for schema validity, 5–8 questions, four unique options, correct-choice cardinality, distinct questions, no pre-submit answer-key leakage, and unchanged weighted-scoring invariants.
- [x] Implement **LLM-as-a-Judge** with a versioned rubric for source grounding, factual/answer-key correctness, relevance, clarity, ambiguity, distractor quality and coverage. Require the judge to identify the supporting Markdown evidence and express uncertainty; never give the judge the generated key as established truth.
- [ ] **Calibrate the judge against human review** for a representative sample, including multi-select keys and disagreements; record adjudicated labels and judge failure modes.
- [x] Execute repeatable **live-model offline experiments** using pinned Markdown snapshots via the existing generation port; repeat a subset to measure generation variability. Keep paid runs separate from Jest tests using mocked models.
- [x] Use **Langfuse Datasets, Experiments and Scores** for comparisons. Record dataset/prompt/model/rubric versions, source checksum, trace/experiment IDs, latency, token usage and approximate cost where available; export portable evidence.
- [x] Evaluate unsupported/invented facts, wrong answer keys, misleading distractors, ambiguous choices, source instructions trying to override the agent, duplicate questions and topic drift.
- [x] Add `pnpm eval:golden` (or equivalent explicit command) and document credential/environment requirements. Publish `docs/evals/phase-7-report.md` with per-case evidence, aggregates, prompt/model comparisons, costs, known failures and remediation.
- [x] Document **provisional, calibration-dependent quality gates**, for example: 100% deterministic structural checks; zero confirmed unsupported correct answers, answer-key leakage or successful prompt injections; at least 90% human-reviewed relevance/clarity acceptability; no material regression from the frozen baseline. Report sample size, adjudications and uncertainty instead of assuming these are universal benchmarks.
- [x] Run a read-only code review of the evaluators, golden cases and data-handling; resolve blockers while keeping domain scoring independent from judge opinions.

**Exit criterion:** The versioned golden dataset, evaluation runner and human-reviewed rubric produce a repeatable baseline; live generation has been evaluated against at least two pinned README sources; Langfuse results and a portable report are inspectable; quality gates explicitly show passed, failed or **not run**. The user-facing `0–4` scoring formula is unchanged.

### M7 — CI/CD and Docker production delivery (P1)

- [x] Implement `.github/workflows/ci.yml` with `pnpm install --frozen-lockfile`, ESLint, TypeScript, Jest unit tests, Jest/Supertest integration-E2E, and Turbo builds.
- [x] Add **a separate protected/explicitly gated LLM evaluation workflow** (`.github/workflows/llm-evals.yml`, or equivalent) for golden-set experiments against a frozen baseline. Run manually/scheduled or in trusted environments with secrets, publish quality reports, and report skipped live tests as **not run**, never as passed; do not make paid LLM calls on every PR.
- [x] Start disposable PostgreSQL in CI; run Prisma migrations before integration/E2E tests.
- [x] Cache pnpm and Turbo outputs appropriately; do not cache secrets.
- [x] Create development Compose services (at minimum PostgreSQL; optionally API/web with hot reload and bind mounts).
- [x] Create **multi-stage production Dockerfiles** for NestJS and Next.js: dependency/install → build → minimal runtime; Next.js standalone output where appropriate.
- [x] Run production containers as non-root; use `.dockerignore`; add health checks; configure environment variables at runtime.
- [ ] Automate production image build/push and gated deploy on protected `main` (destination/provider intentionally configurable).
- [x] Apply `prisma migrate deploy` in a controlled deployment/release job; do not run destructive migration generation at runtime.
- [x] Document rollback procedure, backup expectations, environment setup and troubleshooting.

**Exit criterion:** a clean pipeline builds/test images, preserves the Phase 7 evaluation baseline, and offers a reproducible production deployment path.

### M8 — Code review agent and engineering readiness (P1)

- [x] Enable the portable code-review skill at `.agents/skills/code-review/SKILL.md` and the appropriate harness-native subagent adapter: Cursor `.cursor/agents/code-review.md` (read-only), Codex `.codex/agents/code-review.toml` (read-only) or Claude `.claude/agents/code-review.md` (read-only tool access where supported).
- [x] Make the agent review `git diff`/PR scope, correctness, scoring, hexagonal boundaries, SOLID, Zod, Prisma migrations, LLM safety, secret handling, test quality and UI consistency.
- [x] Require findings with severity, `file:line`, evidence, impact, suggested fix and blocking status; avoid imaginary findings and unrequested rewrites.
- [x] Add code-review invocation to the manual PR checklist; use CI for deterministic gates (never substitute an LLM review for tests).
- [x] Prepare an architecture diagram and a 5–10-minute walkthrough of data flow, persistence, deterministic scoring, golden-set evaluation methodology, human calibration and trade-offs.
- [x] Document what was implemented before the meeting and what remains planned, with honest P0/P1/P2 labels.

**Exit criterion:** reviewer catches regressions in a deliberately seeded scoring or answer-leak bug; interviewer can follow the architecture and data flow.

### M9 — After core demo / optional extensions (P2)

- [ ] Add a preview of the source Markdown and an explanation of how each question is grounded in it.
- [ ] Add question difficulty or generation strategy selection.
- [ ] Expand the Phase 7 golden dataset, add ongoing human-review sampling and experiment-driven prompt optimization only after the initial eval baseline is established.
- [ ] Add usage dashboards, historical quizzes and admin moderation only if product scope grows.
- [ ] Add optional authenticated workspaces, rate-limit tiers, queued jobs or streaming **only after** core functionality is robust.

## 7. Testing strategy and quality gates

| Suite | Runner | What it proves | Where |
| --- | --- | --- | --- |
| Pure domain unit | Jest | Score rules, sequence weights, invalid state, invariants | `packages/domain/**/*.spec.ts` |
| Application unit | Jest + mocked ports | Use-case orchestration, retry/failure policies, no infrastructure leakage | `packages/application/**/*.spec.ts` |
| Frontend component/integration | Jest + React Testing Library | Zod/RHF validation, progress, selection UI, loading/error states | `apps/web/src/**/*.test.tsx` |
| Persistence integration | Jest + real PostgreSQL | Prisma mapping, keys, transactions, idempotency | `apps/api/test/integration` |
| API end-to-end | Jest + Supertest + real PostgreSQL + mocked LLM | REST flow, error responses, score persistence, no answer-key leakage | `apps/api/test/e2e` |
| LLM evaluation — deterministic | Versioned golden set + code evaluators | Format, constraints, key cardinality, duplicates, no leakage and grading invariants | `evals/src/evaluators/` |
| LLM evaluation — semantic | Live generation + LLM-as-a-Judge rubric + human adjudication | Grounding, factual correctness, answer keys, relevance, distractors and ambiguity | `evals/`, Langfuse and `docs/evals/` |
| LLM regression experiments | Langfuse Datasets/Experiments/Scores + pinned sources | Compare prompts/models versus quality baseline, variability, latency, tokens and cost | `evals/baselines/` |
| Optional browser E2E | Playwright | Real browser navigation, responsiveness and accessibility smoke | `apps/web/e2e` |

**PR gates:** no ESLint errors; passing type checks; passing domain, backend and UI tests; passing build; any changed scoring behavior must include reference-calculation tests; schema changes need migrations and test coverage; security-sensitive changes must be reviewed.

**LLM quality gates (Phase 7 onward):** golden-set benchmarks run separately from deterministic Jest gates; use pinned snapshots and a versioned rubric, require manual review of ambiguous or high-risk findings, and compare against a documented baseline. A skipped live evaluation cannot count as a pass. Confirmed unsupported correct answers, answer leakage or successful Markdown prompt injection are blockers for the evaluation milestone. The judge may not change the user's quiz score.

**Suggested scripts:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm eval:golden`, `pnpm build`, `pnpm dev`, `pnpm db:migrate` (exact package scripts to be implemented during their respective phases). `pnpm eval:golden` requires explicitly configured model credentials and is not part of the default PR test command.

## 8. UI design baseline

The complete visual specification lives in [`.agents/skills/design-system/SKILL.md`](.agents/skills/design-system/SKILL.md), with [art direction](.agents/skills/design-system/references/art-direction.md) and [Tailwind recipes](.agents/skills/design-system/references/tailwind-recipes.md).

**Visual direction:** adapt Encomenda.link's approachable botanical editorial language to an **English-language educational product**, emphasizing **light greens** with subtle cream/white surfaces, dark-forest primary actions, softly rounded cards, delicate leaf/book/check-mark illustrations, spacious layouts and accessible contrast.

| Semantic token | Hex | Typical use |
| --- | --- | --- |
| `background` | `#F7FBF7` | Light-green-tinted app canvas |
| `surface` | `#FFFFFF` | Main cards and forms |
| `cream` | `#FBF8F1` | Warm editorial separation |
| `primary` | `#23624B` | Primary CTA, active state, focus |
| `primary-foreground` | `#FFFFFF` | CTA text |
| `mint` | `#DFF2E4` | Light-green highlights |
| `sage` | `#EAF3E9` | Quiet cards, icon tiles |
| `ink` | `#173F32` | Primary headings/body text |
| `muted-foreground` | `#53695D` | Supporting descriptions |
| `border` | `#D4E6D8` | Cards and fields |
| `leaf` | `#567D58` | Small botanical/editorial accents |
| `danger` | `#A53D33` | Validation and destructive states |

**Screens:** (1) source/topic setup, (2) quiz loading, (3) quiz player, (4) completion/result. **Component primitives:** Button, Input, FormField, Select, RadioGroup, Checkbox, Card, Progress, Badge, Alert, Skeleton, Dialog/Toast where justified. Support 320px mobile to desktop and prefer a focused one-column quiz layout.

## 9. Developer environment and documentation

- [ ] Publish `.env.example`: `DATABASE_URL`, `DIRECT_URL` if needed by Prisma, `OPENAI_API_KEY`, `OPENAI_MODEL`, `NEXT_PUBLIC_API_URL`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, `PORT`, allowed source policy and timeouts.
- [x] Add `README.md` with setup, Docker Compose startup, Prisma migration steps, running tests, API examples, screenshots, and deployment notes.
- [x] Add sample request/response payloads and an ER/data-flow diagram.
- [ ] Publish a test matrix containing the **two actual README sources** demonstrated; do not mark this requirement complete until both have been run.
- [ ] Include decisions/ADRs: remote Markdown fetch security, multi-select scoring assumption, answer-key storage and exposing results, LLM structured-output strategy, caching/snapshotting.
- [ ] Add `docs/evals/phase-7-report.md` with golden dataset IDs/versions, pinned source hashes, rubric version, human-reviewed labels, per-case and aggregate results, experiment traces, cost/latency, baseline deltas, failures and confidence/limitations.
- [ ] Document how to execute `pnpm eval:golden`, where Langfuse datasets/experiments can be inspected, which results used real models vs mocks, and how skipped/failed evaluation runs are represented.
- [x] Add an honest delivery-status checklist for the interview.

## 10. Prioritized execution order (the shortest working vertical slice)

1. **First:** Bootstrap Turborepo + NestJS + Next.js + PostgreSQL/Prisma; define shared Zod contracts.

2. **Then:** Build pure scoring and persistent domain models (with Jest tests).

3. **Then:** Implement safe Markdown fetch → OpenAI structured quiz generation → persisted quiz; expose REST.

4. **Then:** Implement the full player flow and score results in the web UI.

5. **Then:** Demonstrate two different README.md sources and add API end-to-end coverage.

6. **After the P0 interview MVP:** Add Langfuse and stronger operational controls (implementation Phase 6).

7. **Before production delivery:** Run LLM golden-set evaluations, calibrate LLM-as-a-Judge with human review, freeze a baseline and resolve blocking quality findings (implementation Phase 7).

8. **Then:** Implement Docker production builds and GitHub Actions CI/CD with a separate credential-gated live evaluation workflow (implementation Phase 8).

9. **Throughout:** Apply the design-system skill, review meaningful diffs using the code-review agent, and update Spec Kit artifacts as decisions change.

**Post-MVP AI-quality acceptance checklist (Phase 7 / M6)**

- [x] The versioned golden set covers 12–20 scenarios, at least two pinned README sources, reference facts and supporting evidence.
- [x] Deterministic evaluators and an evidence-based judge rubric run reproducibly without changing the deterministic scoring engine.
- [ ] A human-adjudicated sample documents judge accuracy/disagreements, especially on multi-select keys.
- [ ] A Langfuse experiment and portable baseline report contain measured quality, failure cases, latency, tokens/cost and regression decisions.
- [x] Live runs are separated from CI mocks; every skipped/unavailable run is explicitly recorded as **not run**.

**Interview-ready acceptance checklist**

- [ ] `docker compose up -d db` and documented local startup work.
- [ ] A configurable README URL and topic generate 5–8 valid questions, each with 4 options.
- [ ] The user can complete the quiz from a responsive UI without seeing answer keys beforehand.
- [ ] Scoring is pure/deterministic and matches the documented weighting sequence.
- [ ] The PostgreSQL tables contain questions, options, answers and final scores.
- [ ] Two **different** README URLs were tested successfully.
- [ ] Jest unit, integration and API E2E suites pass.
- [x] API, data model, scoring policy and trade-offs can be explained live.
- [x] Any unfinished P1/P2 item is clearly documented rather than presented as complete.

## 11. Authoritative engineering references

- **Original assessment:** **AI Engineer – 2nd interview task**, PDF supplied with the project request (the specific scoring and functional requirements in section 1 come from this document).
- [Spec Kit official repository](https://github.com/github/spec-kit) and [Spec Kit core CLI documentation](https://github.com/github/spec-kit/blob/main/docs/reference/core.md).
- [Vercel AI SDK structured generation](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — use current `Output.object` with `generateText`.
- [NestJS documentation](https://docs.nestjs.com/).
- [Prisma documentation](https://www.prisma.io/docs).
- [Langfuse documentation](https://langfuse.com/docs).
- [Langfuse evaluations](https://langfuse.com/docs/evaluation/core-concepts) and [offline experiments](https://langfuse.com/docs/evaluation/get-started/offline) — datasets, rubrics, experiments and scores.
- [shadcn/ui documentation](https://ui.shadcn.com/docs).

> **Scope note:** This is the whole-product roadmap, not a claim that each milestone or its pipeline has been delivered. Refer to `implementation-roadmap.md` for phase-specific completion evidence. P0 assessment requirements and the post-MVP P1 quality gate are deliberately distinct; the multi-select scoring assumption remains explicitly subject to interviewer clarification.