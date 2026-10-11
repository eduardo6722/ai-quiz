# Feature Specification: Phase 8 CI/CD, Production Containers and Interview Delivery

**Feature Branch**: `009-phase-8-delivery`

**Created**: 2026-10-11

**Status**: Draft

**Roadmap phase**: Phase 8 — GitHub Actions, Docker production and interview walkthrough (P1); main-roadmap **M7–M8**

**Input**: User description: "Create a Phase 8-only specification for P1 CI/CD, production containers and interview delivery documentation. Prerequisite: verified Phases 0–7, including the Phase 7 golden-set baseline. Reuse earlier deliveries and keep optional deferred product enhancements outside this cycle. Specify merge-time quality gates for reproducible dependency installation, lint, strict types, unit/UI tests, real-database integration and API end-to-end tests, and production builds. Cover production-ready API and web images with minimal non-root runtimes, runtime configuration, controlled release migrations, and a configurable gated deployment path. Define acceptance for passing CI, optionally gated golden-set evaluation with protected secrets and a published comparison report (mark unrun as unrun), production image builds, and reproducible local/container startup. Include architecture/data-flow and persistence diagrams, API examples, environment/setup/deployment documentation, rollback and backup expectations, known trade-offs, and honest delivery status. Include read-only review and a 5–10 minute walkthrough covering ingestion, generation, boundaries, persistence and scoring. Exclude new quiz features and P2 extensions; do not claim deployment or optional work complete without execution evidence."

## Phase Identity and Goal

This specification covers **Roadmap Phase 8 only** (main-roadmap **M7** and **M8**). The goal is to make **builds and delivery reproducible** and to **prepare the interview walkthrough**, without adding quiz product features.

Success is a complete, independently testable **operations and delivery** slice on top of the existing product: automated merge-time quality gates; a **separate**, explicitly gated golden-set evaluation path that never treats skipped live work as passed; production-ready API and web images with **minimal, non-privileged** runtimes and **runtime** configuration; controlled release-time schema application; a **configurable** gated deployment path; reproducible local and container startup; published architecture, data-flow and persistence diagrams plus API, environment, rollback and backup documentation; an honest delivery-status record; a read-only review of this cycle’s changes; and a **5–10 minute** walkthrough of ingestion, generation, adapter boundaries, persistence, deterministic scoring and evaluation methodology.

Quiz creation, play, scoring, two-source demonstration, observability and the Phase 7 evaluation harness **reuse Phases 0–7**. This cycle does **not** ship new learner-facing features, a second generation strategy, P2 extensions, or a redesigned evaluator/scoring policy. It MUST NOT mark a live production deployment, a frozen evaluation baseline, or optional work as complete without **execution evidence**.

## Prerequisites

This cycle MUST reuse the Phase 0 workspace and quality commands, Phase 1 scoring and public contracts, Phase 2 persistence and attempt-token lifecycle, Phase 3 secure fetch and generation, Phase 4 browser flow, Phase 5 two-source demonstration evidence, Phase 6 observability, and the Phase 7 golden dataset, evaluators, explicit local evaluation command and portable report. It MUST NOT re-scaffold the monorepo, reimplement grading, replace public quiz/attempt contracts, reinitialize Spec Kit or the Constitution, rebuild product tables, or redesign the evaluation harness.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal ports/adapters, Zod contracts, Jest discipline, **secure AI integration** (secrets never logged or baked into client bundles), and **roadmap fidelity** (production-ready means repeatable builds and a documented deployment path; unfinished P1/P2 MUST be documented, not presented as done). Domain and application MUST remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client SDKs. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of merge-time gates, separate gated live-evaluation workflow, multi-stage production images, non-root runtime, controlled release migrations, configurable gated deploy, interview diagrams/walkthrough, and this phase’s checklist and definition of done. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy, including never logging secrets and never marking roadmap items done without verification. |
| Phase 0 scaffolding (`specs/002-phase-0-scaffold/`) | Verified | Monorepo, API/web shells, local PostgreSQL Compose, `.env.example`, `pnpm lint` / `typecheck` / `test` / `build`. Local Compose already starts PostgreSQL and optional API/web in **development** watch mode; that is **not** a production image. |
| Phase 1 domain scoring (`specs/003-phase-1-domain-scoring/`) | Verified | Pure quiz invariants, deterministic 0–4 scoring, geometric weights `1.1` raised to the zero-based question index, public contracts, keys omitted from pre-submit views. This cycle MUST NOT change them. |
| Phase 2 persistence and REST (`specs/004-phase-2-persistence-api/`) | Verified (2026-10-10) | `/v1` create/get/start/submit/result, private attempt token issued once, hash-only storage, transactional scoring, idempotent resubmit, Prisma product models. Evidence: tasks T001–T071 complete. |
| Phase 3 Markdown ingestion and generation (`specs/005-phase-3-markdown-generation/`) | Verified (2026-10-10) | Product create fetches a public Markdown URL and generates a grounded quiz through `QuizGenerationPort`. SSRF, untrusted Markdown, bounded generation retries. Evidence: tasks T001–T062 complete. |
| Phase 4 complete browser quiz experience (`specs/006-phase-4-web-experience/`) | Delivered in earlier commits; this cycle does not re-open that gate | Setup → play → submit → results in the browser; attempt token stays out of the URL. |
| Phase 5 two-source demonstration and reliability | Delivered under earlier commits / README evidence (2026-10-11); no separate `specs/…-phase-5-demo-reliability/` directory | Express and Fastify README demonstrations recorded in README. This cycle documents that evidence; it MUST NOT re-run the interview demo as a new product feature. |
| Phase 6 observability and operational controls (`specs/007-phase-6-observability/`) | Delivered in earlier commits; this cycle does not re-open that gate | Replaceable traces, structured logs, correlation identity, health/readiness, rate/concurrency limits. Optional second generation strategy remains **deferred**. |
| Phase 7 golden dataset and quality evaluation (`specs/008-phase-7-llm-evals/`) | Implemented and command-verified 2026-10-11 (T001–T078) | Versioned golden set, deterministic evaluators, judge rubric, `pnpm eval:golden`, portable report path `docs/evals/phase-7-report.md`. Learner scoring unchanged. |
| Phase 7 leftover gates | **Incomplete — recorded blockers, not Phase 8 scope** | Human calibration (`evals/baselines/human-labels.v1.json` empty) and **accepted frozen baseline** (`--accept-baseline` not used) remain **not run**. This cycle consumes the existing harness and report; it MUST NOT complete those leftovers as new product work. |
| Existing local containers | Present | `compose.yml` + `Dockerfile.dev` for development. **No** production API/web Dockerfiles, **no** hosted CI workflows, and **no** production image publish/deploy path exist yet. |

**Blockers:** Phase 7’s **human calibration** and **accepted frozen baseline** are **not run**. That is a **prerequisite leftover**, not a reason to expand this phase into filling human labels, accepting a baseline, redesigning evaluators, or treating skipped live evaluation as passed.

- Implementation of this specification MAY proceed with those leftovers **explicitly labeled not run** in delivery documentation and in any gated evaluation summary. It MUST NOT “fix” them by inventing labels, silently substituting mocked generation as live quality evidence, or claiming a frozen baseline exists.
- If the current portable report on disk disagrees with the last recorded live sitting (for example an environment-blocked later overwrite), delivery documentation MUST state the last **executed** evidence and the current file’s status honestly. This cycle MUST NOT fabricate a matching report.
- If Phase 0–7 quality commands later fail when this spec is implemented, that is a **prerequisite defect to fix in the earlier phase**, except for defects this cycle introduces in CI, images, docs or workflows.
- Missing model or evaluation-destination credentials at gated-evaluation time is an **environment blocker**. The omitted live run MUST be **not run**, never passed. Merge-time quality gates MUST still pass without those credentials.
- Missing a chosen production hosting destination is **not** a blocker for documenting a configurable gated path. Claiming that path has **deployed** the application requires execution evidence; otherwise deployment is **not run**.
- Essential SSRF, prompt-injection handling, answer-key privacy, attempt-token protections, scoring math and the generation port are **prerequisite behavior**. If any of those later fail, repair them as earlier-phase defects. This cycle MUST NOT redesign fetch policy, scoring, token hashing, or question generation.

**Existing whole-product placeholder:** If `specs/001-ai-quiz-generator/` exists, it remains unused leftover context. This cycle owns `specs/009-phase-8-delivery/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

A **developer or operator** MUST be able to:

- From a **clean clone**, follow documented steps to install dependencies **reproducibly** (lockfile-faithful), start local PostgreSQL (and documented app startup), apply existing migrations, and run lint, strict typecheck, unit/UI tests, real-database integration tests, API end-to-end tests, and production builds.
- Rely on a **hosted merge-time pipeline** that runs those same gates on every proposed change to the protected main line: lockfile-faithful install, lint, types, Jest unit and UI tests, disposable real PostgreSQL with migrations applied **before** integration and API end-to-end tests, and production builds. Paid live model calls MUST NOT run on every pull request.
- Trigger a **separate**, protected golden-set evaluation (manual, scheduled, or trusted environment with secrets) that reuses the Phase 7 command, dataset and report path; compares against the existing Phase 7 evidence; **publishes** a comparison report; and labels skipped, unaffordable or uncredentialed live work **not run**.
- Build **production** API and web images in **multiple stages** (install → build → minimal runtime), run them as a **non-privileged** process, pass configuration at **runtime** (not as baked secrets), and observe documented health checks.
- Apply schema changes in a **controlled release** step using existing migrations (`migrate deploy` semantics). The running application MUST NOT generate destructive migrations at startup.
- Follow a **documented, gated** path to publish images and optionally deploy to a **configurable** destination. The destination/provider is intentionally not locked in this specification. A skipped live deploy is **not run**.
- Read **rollback** steps (how to return to a previous known-good image and what schema rollback would require) and **backup expectations** for the quiz database.

A **reviewer or interviewer** MUST be able to:

- Follow **architecture and data-flow** diagrams from configurable Markdown URL → fetch → generation → persistence → attempt → deterministic score, including hexagonal adapter boundaries.
- Follow a **persistence / entity-relationship** diagram of source documents, quizzes, questions, options, attempts, answers and selections, including that correctness flags are server-only before submit.
- Copy **API examples** for create, get quiz, start attempt, submit and result (with answer keys absent from pre-submit examples).
- Use **environment, setup and deployment** documentation, including which values are required to boot versus required for live generation, tracing or evaluation.
- Read **known trade-offs** (including the provisional multi-answer scoring reading) and an **honest delivery-status** checklist with P0 / P1 / P2 labels and passed / failed / **not run** for optional work.
- Sit through a **5–10 minute** walkthrough covering ingestion, generation, grounded-question quality, adapter boundaries, database design, weighted scoring and evaluation methodology.
- See that a **read-only review** ran on this cycle’s meaningful diff, with findings recorded; deterministic tests remain the merge gate (an LLM review MUST NOT replace them).

The product MUST:

- Keep the verified learner path unchanged: create, retrieve, attempt, submit and result, including SSRF, untrusted Markdown, answer-key isolation, attempt-token hashing and **Phase 1 scoring math**.
- Keep evaluation, judge rubrics and experiment recording **outside** the pure domain scoring policy. No quality metric MAY change a learner’s 0–4 question score.
- Keep secrets (`OPENAI_API_KEY`, `DATABASE_URL`, Langfuse credentials, attempt tokens) **server-side**, out of client bundles, logs, image build arguments and published examples.
- Reuse local Compose PostgreSQL (and existing development API/web services) for documented local startup. Production images are **new** in this cycle; development watch images MUST NOT be presented as production runtimes.
- After CI, images and documentation exist, run a **read-only code review** of this cycle’s changes; resolve blocking findings without adding quiz features.

Constitution-bound names for this phase (not open design choices): TypeScript strict packages, hexagonal `domain` / `application` / `contracts`, NestJS REST adapters as the composition root, Next.js App Router web app, PostgreSQL + Prisma persistence, Jest unit/UI plus Jest/Supertest integration and API E2E against **real** PostgreSQL with a **mocked** model in merge-time tests, GitHub Actions as the hosted automation, Docker multi-stage production images, Compose for local PostgreSQL (and optional API/web), Turbo/pnpm lockfile-faithful install, `pnpm eval:golden` (or the documented equivalent) for gated evaluation, and the portable report path `docs/evals/phase-7-report.md`.

## Explicit Exclusions

This phase MUST NOT include:

- New learner-facing quiz features (new screens, difficulty pickers, source-preview UI, historical quiz lists, dashboards, authenticated workspaces).
- P2 / after-delivery extensions (roadmap **M9**): expanding the golden set, ongoing human-review sampling, experiment-driven prompt optimization, usage dashboards, admin moderation, queued jobs, streaming, or a second generation strategy.
- Completing Phase 7 leftovers (filling human labels, accepting a frozen baseline, recalibrating the judge) as a requirement of this cycle. Those remain **not run** unless independently executed and evidenced; this cycle only **reports** their status.
- Redesigning evaluators, the scoring policy, question-generation strategies, fetch/SSRF policy, or public `/v1` contracts.
- Treating a skipped, unaffordable, unavailable or unrun live evaluation or live deploy as **passed**.
- Claiming a production environment is live, images are published, or optional work is done **without execution evidence**.
- Running paid live model evaluation on **every** pull request.
- Generating or applying destructive schema migrations at application runtime.
- Baking secrets into client bundles, image build arguments, or committed workflow logs.
- Replacing deterministic merge-time tests with an LLM code review.
- Authentication of human users, billing, Redis, extra brokers, microservices, or analytics product UIs.
- Optional Playwright as a replacement for the required Jest suites (Playwright MAY be mentioned as deferred only).
- Re-scaffolding the monorepo, overwriting the Constitution, or executing a whole-product spec task list.

Later-phase or optional requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **developer** merging changes and preparing a production-shaped runtime. A **reviewer / interviewer** uses diagrams and the walkthrough. A **learner** is unchanged from Phases 4–5. An **operator** follows release, rollback and backup documentation.

### User Story 1 - Merge-time quality gates on every proposed change (Priority: P1)

A developer opens a change against the protected main line. Automation installs dependencies from the committed lockfile, then runs lint, strict type checking, unit and UI tests, starts a **disposable** real PostgreSQL instance, applies existing migrations, runs integration and API end-to-end tests with a **mocked** model, and performs production builds. Cache of install and build artifacts is allowed; secrets are not cached. The change cannot merge while any of those gates fail.

**Why this priority**: Without a repeatable merge gate, “production-ready” is a local machine claim. This is the core of M7.

**Independent Test**: Trigger the documented merge pipeline (or an equivalent local reproduction of the same commands in the same order) on a clean tree; confirm each gate runs; confirm a deliberate lint or unit failure blocks the pipeline; confirm no live model credential is required.

**Acceptance Scenarios**:

1. **Given** a clean proposed change that already passes locally, **When** the merge-time pipeline runs, **Then** it performs lockfile-faithful install, lint, strict types, Jest unit and UI tests, real-PostgreSQL integration tests, Jest/Supertest API end-to-end tests, and production builds, and the pipeline **passes**.
2. **Given** the integration and API end-to-end jobs, **When** they start, **Then** they use a disposable real PostgreSQL instance, apply existing migrations **before** tests, and use a mocked model — they MUST NOT require `OPENAI_API_KEY`.
3. **Given** a change that fails lint, types, a unit/UI test, an integration/E2E test, or the production build, **When** the pipeline finishes, **Then** the pipeline **fails** and MUST NOT be summarized as passed.
4. **Given** pipeline caches, **When** install or build outputs are reused, **Then** no secret values are written into the cache, logs, or artifacts.
5. **Given** every pull request, **When** the merge-time pipeline runs, **Then** it does **not** invoke paid live golden-set evaluation.

---

### User Story 2 - Production images and reproducible startup (Priority: P1)

An operator builds production API and web images from documented Dockerfiles. Each image is produced in stages so the final runtime is **small**, runs as a **non-privileged** user, receives configuration at start time, and exposes a documented health check. The same documentation lets a new machine start local PostgreSQL (and documented app processes) from a clean clone. Development watch images MUST remain labeled as development, not as production.

**Why this priority**: Interview production-ready means a small application that can be built and started the same way twice, not only `pnpm dev`.

**Independent Test**: From a clean tree, follow the documented production image build for API and web; run each image without a privileged user; confirm health; confirm a documented secret is supplied at runtime and is absent from the image history/build args. Separately, follow local Compose/startup docs on a clean clone.

**Acceptance Scenarios**:

1. **Given** the documented production build instructions, **When** an operator builds the API image and the web image, **Then** both builds succeed using a multi-stage flow (dependency install → build → minimal runtime).
2. **Given** a started production API image with valid runtime database configuration, **When** an operator probes the documented liveness endpoint, **Then** it succeeds without requiring a model key; readiness MAY depend on the database and MUST NOT depend on a model or tracing key.
3. **Given** a started production web image with the API location supplied at runtime (or build-time **public** API location only), **When** an operator probes the documented web health or start check, **Then** the process is running as a non-privileged user.
4. **Given** `OPENAI_API_KEY`, `DATABASE_URL`, or Langfuse secrets, **When** production images are built, **Then** those values are **not** passed as image build arguments and **not** present in client bundles.
5. **Given** a clean clone and the documented local startup, **When** an operator starts PostgreSQL via Compose and follows migrate + app start (host or Compose), **Then** `/health` succeeds and `/ready` succeeds once the database is up — matching the Phase 0 local contract, now with production-image instructions **in addition**.
6. **Given** `Dockerfile.dev` / development Compose API and web services, **When** delivery docs describe them, **Then** they are labeled **development**, not production runtimes.

---

### User Story 3 - Gated golden-set evaluation with honest unrun labeling (Priority: P1)

A reviewer triggers a **separate** evaluation workflow in a trusted environment that has protected secrets, or they skip it. When it runs, it reuses the Phase 7 golden set, explicit local command, and portable report; compares with the existing Phase 7 evidence; and publishes a comparison report. When secrets are missing, the workflow is skipped or exits as **not run**. Human calibration and frozen-baseline comparison remain **not run** unless those Phase 7 leftovers were independently completed. Merge-time CI MUST NOT treat this workflow’s absence as a quality pass.

**Why this priority**: Phase 8 is the first cycle allowed to host evaluation, and the roadmap forbids pretending skipped live runs passed.

**Independent Test**: Inspect the separate workflow definition and a sample summary: PR pipeline does not call it; a dry run without secrets is labeled **not run**; a credentialed run writes/publishes a report; leftover Phase 7 gates stay **not run** unless evidenced.

**Acceptance Scenarios**:

1. **Given** the hosted automation, **When** a reviewer lists workflows, **Then** golden-set evaluation is a **separate** workflow from merge-time CI (roadmap default name `.github/workflows/llm-evals.yml` or an equivalent documented workflow).
2. **Given** a pull request from an untrusted fork or any ordinary PR, **When** merge-time CI runs, **Then** live evaluation does **not** run and is **not** reported as passed.
3. **Given** protected secrets and an explicit trigger (manual, scheduled, or trusted environment), **When** the evaluation workflow runs, **Then** it executes the documented Phase 7 command against the versioned golden set, writes `docs/evals/phase-7-report.md` (or a dated comparison alongside it), and records dataset/rubric/model versions and per-case outcomes.
4. **Given** missing model or evaluation-destination secrets, **When** someone inspects the evaluation status, **Then** live generation, live judge, and live destination export are each **not run** (never passed), with the environment blocker named.
5. **Given** Phase 7 leftovers (empty human labels; no accepted frozen baseline), **When** the comparison report is published, **Then** `humanRelevanceClarity` and `regression` remain **not run** unless independent evidence shows those leftovers were completed.
6. **Given** a published evaluation summary, **When** a reader compares it with merge-time CI, **Then** they can tell CI green from evaluation **not run**; CI green MUST NOT be described as “quality baseline passed” if live evaluation did not run.

---

### User Story 4 - Controlled release migrations and a configurable gated deploy path (Priority: P1)

An operator releasing a new version applies **already reviewed** migrations in a dedicated release step, then (optionally) publishes production images and deploys to a destination that documentation treats as **configurable**. The running API does not generate migrations. If the team has not executed a live deploy, documentation says **not run** and still describes how to point the gated path at a chosen registry and host. Rollback and backup expectations are written down.

**Why this priority**: Production-ready for this task includes a clear deployment path, not an accidental schema change at boot, and not a fake claim that “it is deployed.”

**Independent Test**: Read release docs and the gated workflow/job: migrations are `deploy` of existing files; no runtime migrate-dev; destination is parameterized; a dry documentation review marks live deploy **not run** until evidence exists.

**Acceptance Scenarios**:

1. **Given** a release of a version that includes schema changes, **When** the documented release job runs, **Then** it applies existing migrations in a controlled step (roadmap: `prisma migrate deploy` semantics) **before** or as an explicit step of starting the new API, and it MUST NOT run migrate-dev or schema-generation against production.
2. **Given** the API production runtime, **When** the process starts, **Then** it does **not** generate or rewrite migration files.
3. **Given** the documented gated deploy path, **When** an operator reads it, **Then** they can name how images are built/published, how the destination is selected/configured, and that the job is gated (protected main or explicit approval) — without this spec locking a single cloud vendor.
4. **Given** no executed publish or deploy in this cycle, **When** delivery status is read, **Then** image publish and/or deploy are **not run**, and MUST NOT be checked off as complete.
5. **Given** the rollback section, **When** an operator follows it, **Then** they can restore a previous known-good API and web image and see what is (and is not) promised about reversing a migration.
6. **Given** the backup section, **When** an operator reads it, **Then** they see that PostgreSQL data (quizzes, keys, attempts, scores) is the durable store, that a volume or managed backup is expected, and that this cycle does **not** ship a custom backup product.

---

### User Story 5 - Interview delivery documentation (Priority: P1)

An interviewer (or the candidate preparing) opens the published documentation and can explain the system without reading the entire source tree. The pack includes architecture and data-flow diagrams, a persistence ER diagram, API request/response examples, environment and setup steps, deployment/rollback/backup notes, known trade-offs, and an honest status checklist.

**Why this priority**: Assessment acceptance includes explaining data flow and the data model live. Missing or over-claiming docs would fail the interview even if CI is green.

**Independent Test**: Using only the published docs (not tribal knowledge), a reviewer traces one quiz from URL to stored score, names the main tables, copies an API example that omits pre-submit keys, and classifies each P0/P1/P2 item as done, failed, or **not run**.

**Acceptance Scenarios**:

1. **Given** the architecture / data-flow diagram, **When** a reviewer follows it, **Then** they can order: configurable topic and Markdown URL → server-side fetch (untrusted content, SSRF bounds) → generation via the generation port → validated persist → sanitized get-quiz → start attempt (token once) → submit → deterministic weighted score stored with answers.
2. **Given** the persistence ER diagram, **When** a reviewer inspects it, **Then** they see SourceDocument, Quiz, Question, QuestionOption, QuizAttempt, AttemptAnswer and AttemptAnswerSelection, uniqueness/ownership constraints at a narrative level, and that `isCorrect` is not a learner-facing field before submit.
3. **Given** API examples, **When** a reviewer copies create / get-quiz / start / submit / result samples, **Then** get-quiz examples contain **no** correctness flags, start-attempt shows a token only in the start response, and result examples appear only after submit.
4. **Given** environment and setup docs, **When** a new developer follows them, **Then** they can distinguish values required to boot (`DATABASE_URL`, public API location) from values required for live generation, tracing, or golden-set evaluation, and they never find real secret **values** in examples.
5. **Given** the honest delivery-status checklist, **When** a reviewer reads P0 assessment must-haves, P1 Phase 6–8 items, and P2 extras, **Then** unfinished or unrun items (human calibration, accepted baseline, live deploy if not executed, deferred second strategy, P2 extensions) are labeled incomplete or **not run**, not done.
6. **Given** known trade-offs, **When** a reviewer reads them, **Then** they include at least: provisional multi-answer scoring; mocked merge-time tests vs live generation; evaluation leftover gates; configurable (not executed-by-default) deploy destination.

---

### User Story 6 - Read-only review and 5–10 minute walkthrough (Priority: P1)

After meaningful CI, image and documentation changes land, a read-only reviewer inspects the diff using the project’s code-review checklist (correctness, scoring, hexagonal boundaries, secrets, tests). Findings include severity, location, evidence, impact and blocking status. Separately, the candidate can deliver a **5–10 minute** spoken walkthrough from the published outline. Deterministic tests remain the merge gate.

**Why this priority**: M8’s exit criterion is that a reviewer can catch a scoring or answer-leak regression and that an interviewer can follow the architecture.

**Independent Test**: Produce a review report for this cycle’s diff; confirm blocking findings are resolved or explicitly deferred with rationale; time the walkthrough outline at 5–10 minutes covering the required topics; optionally demonstrate the checklist against a **temporary** seeded scoring or answer-leak defect that is **reverted** and never shipped.

**Acceptance Scenarios**:

1. **Given** this cycle’s meaningful diff, **When** the read-only review runs, **Then** the report uses the canonical checklist (correctness, scoring, hexagonal boundaries, Zod, migrations, LLM safety, secret handling, tests) and each finding has severity, `file:line` or equivalent location, evidence, impact, suggested fix and blocking status.
2. **Given** a blocking finding, **When** the cycle is claimed done, **Then** the finding is resolved or recorded as an accepted leftover with rationale — not ignored.
3. **Given** the manual PR checklist in the documentation, **When** a developer prepares a merge, **Then** they are instructed to invoke the code-review workflow **and** to rely on CI for deterministic gates; an LLM review MUST NOT replace tests.
4. **Given** a deliberately seeded scoring-error or pre-submit answer-key leak (created only for this demonstration), **When** the review checklist is applied, **Then** the issue is reported as blocking; the seed is **reverted** before merge and MUST NOT remain in the delivered tree.
5. **Given** the walkthrough outline, **When** a speaker follows it, **Then** it fits **5–10 minutes** and covers source ingestion, generation, grounded-question quality, adapter boundaries, persistence, weighted scoring, and evaluation methodology (including human calibration / baseline **not run** if still true).
6. **Given** the walkthrough, **When** the speaker describes scoring, **Then** they state the 0–4 per-question policy, geometric weights in quiz order, rounding-for-display-only, and that judges do not change learner scores.

---

### Edge Cases

- **Lockfile drift**: If the lockfile does not match manifests, lockfile-faithful install MUST fail the merge-time pipeline rather than silently rewriting the lockfile.
- **Missing test database in CI**: Integration and API E2E MUST fail closed if PostgreSQL never became healthy; they MUST NOT skip and report passed.
- **Migration applied twice**: Re-running the release migrate-deploy on an already migrated database MUST be safe (no duplicate-schema failure presented as a successful empty deploy without applying needed migrations).
- **Production image started without `DATABASE_URL`**: API MUST fail closed with a configuration error; it MUST NOT boot a playable API against an implicit empty store.
- **Production image started without `OPENAI_API_KEY`**: API MUST still boot and serve liveness; create-quiz live generation fails with the existing stable error; this MUST NOT be hidden by a fixture fallback.
- **Secrets in logs**: Workflow logs, image build logs and container logs MUST NOT print API keys, database passwords, Langfuse secrets or raw attempt tokens.
- **Fork pull requests**: Live evaluation secrets MUST NOT be available to untrusted forks. Evaluation stays **not run** there.
- **Stale or overwritten evaluation report**: If a later environment-blocked run overwrote `docs/evals/phase-7-report.md`, delivery docs MUST not claim the overwritten file is the successful live sitting. Status is whatever the file and last evidenced run actually show.
- **Human labels still empty**: Gated evaluation MUST leave calibration **not run**. It MUST NOT invent agreement percentages.
- **No accepted baseline file**: Regression gate stays **not run**. Comparing to an unofficial snapshot is allowed only if labeled unofficial; it MUST NOT be called the frozen baseline.
- **Deploy destination unset**: Gated deploy job fails closed or is skipped as **not run**; it MUST NOT push to a hardcoded personal account.
- **Rollback after a forward-only migration**: Docs MUST say whether a schema reverse is supported. If it is not, rollback is “previous image + restore from backup,” not an automatic down-migration.
- **Development Compose bind mounts**: Production instructions MUST NOT tell operators to run `Dockerfile.dev` as the production runtime.
- **Seeded review defect**: If a scoring or leak seed is used to prove the reviewer, it MUST be confined to a throwaway change and fully reverted; leaving it in `main` is a blocking defect.
- **Walkthrough overrun**: An outline that requires more than 10 minutes of essential material MUST be tightened; optional deep-dives are labeled optional.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A hosted merge-time pipeline MUST run on proposed changes to the protected main line with lockfile-faithful dependency installation, lint, strict TypeScript, Jest unit tests, Jest UI tests, Jest integration tests against **real** PostgreSQL, Jest/Supertest API E2E against **real** PostgreSQL with a **mocked** model, and production builds. Roadmap default path: `.github/workflows/ci.yml` or an equivalent documented workflow.
- **FR-002**: Merge-time integration and E2E jobs MUST start disposable PostgreSQL, wait until it is healthy, and apply **existing** Prisma migrations before tests. They MUST NOT require live model or tracing credentials.
- **FR-003**: Merge-time automation MAY cache package and build outputs. It MUST NOT cache secrets. A failing gate MUST fail the pipeline.
- **FR-004**: Paid live golden-set evaluation MUST NOT run on every pull request.
- **FR-005**: A **separate** gated evaluation workflow MUST exist (roadmap default `.github/workflows/llm-evals.yml` or equivalent). It MUST be manual, scheduled, and/or restricted to a trusted environment with protected secrets.
- **FR-006**: When the evaluation workflow runs with required secrets, it MUST reuse the Phase 7 golden set and explicit command (`pnpm eval:golden` or documented equivalent), publish a comparison report (update or dated companion to `docs/evals/phase-7-report.md`), and record versions, per-case outcomes, and live vs mocked vs **not run**.
- **FR-007**: When evaluation secrets are missing or the workflow is not triggered, live evaluation MUST be labeled **not run**. Skipped live work MUST NEVER be counted as passed. Phase 7 leftovers (human calibration, accepted frozen baseline) stay **not run** unless independently evidenced.
- **FR-008**: Production **multi-stage** Dockerfiles MUST exist for the NestJS API and the Next.js web app. The final stage MUST be a minimal runtime, run as a **non-root** user, use a `.dockerignore`, and define a health check. Next.js standalone output MUST be used where it reduces the runtime.
- **FR-009**: Production images MUST take secrets and environment-specific settings at **runtime**. `OPENAI_API_KEY`, `DATABASE_URL`, Langfuse credentials and attempt tokens MUST NOT be baked into build arguments, client bundles, or committed example files as real values.
- **FR-010**: Documented local startup MUST remain reproducible: Compose PostgreSQL with healthcheck and volume; migrate; API and web start. Development Compose API/web (watch mode) MAY remain; they MUST be documented as development, not production.
- **FR-011**: Release schema application MUST use controlled `migrate deploy` semantics on existing migration files. Runtime processes MUST NOT generate migrations. Destructive migrate-dev against production is forbidden.
- **FR-012**: A gated image-build/publish and deploy path MUST be documented and, where implemented as automation, configurable for destination/provider. Executed publish/deploy is complete **only** with evidence; otherwise it is **not run**.
- **FR-013**: Documentation MUST include rollback (previous known-good images; schema reverse vs backup restore) and backup expectations for PostgreSQL (volume or managed backup). This cycle MUST NOT build a custom backup product.
- **FR-014**: Published interview docs MUST include: architecture and data-flow diagrams; Prisma ER / persistence diagram; API examples for `/v1` create, get quiz, start attempt, submit, result and `/health`/`/ready`; environment/setup/deployment instructions; known trade-offs; honest P0/P1/P2 delivery status with passed / failed / **not run**.
- **FR-015**: Pre-submit API examples, diagrams and screenshots MUST omit answer keys and raw attempt tokens. Result examples are post-submit only.
- **FR-016**: A read-only review of this cycle’s meaningful diff MUST run using `.agents/skills/code-review/SKILL.md` (via the harness adapter). Blocking findings MUST be resolved. LLM review MUST NOT replace FR-001 tests.
- **FR-017**: Documentation MUST include a 5–10 minute walkthrough outline covering ingestion, generation, grounded-question quality, hexagonal boundaries, persistence, weighted scoring (`1.1 ** index` in quiz order; 0–4 stored; percentage display-only) and evaluation methodology.
- **FR-018**: A demonstration that the review checklist catches a seeded scoring defect or pre-submit answer-key leak MUST be performed; the seed MUST be reverted and MUST NOT remain in the delivered tree.
- **FR-019**: This cycle MUST NOT change learner scoring math, public quiz contracts, generation strategy set, or evaluation rubric design. It MUST NOT add P2 product features. It MUST NOT claim Phase 7 leftover gates or an unexecuted deploy as done.
- **FR-020**: Delivery documentation MUST reuse Phases 0–7 evidence (including the two-source demo and Phase 7 report path) rather than reimplement those products. If a prerequisite leftover remains, it is recorded as a blocker/status line, not absorbed as new Phase 8 product scope.

### Key Entities

- **Merge-time pipeline**: Automated checks that must pass before the protected main line accepts a change.
- **Lockfile-faithful install**: Dependency installation that fails when manifests and the committed lockfile disagree.
- **Disposable test database**: Short-lived real PostgreSQL used only for integration and API E2E in automation.
- **Gated evaluation workflow**: Separate, credential-protected process for golden-set experiments; not part of ordinary PR tests.
- **Comparison report**: Published evaluation summary that records versions, outcomes and **not run** gates.
- **Production image**: Multi-stage build result intended to run the API or web app without a development toolchain.
- **Runtime configuration**: Environment values supplied when a production image starts, not at image build, except non-secret public web settings where the platform requires them at build.
- **Release migration step**: Controlled application of already-reviewed schema migrations during release.
- **Gated deploy path**: Optional, configurable, approval- or branch-protected route to publish images and start them at a destination.
- **Rollback procedure**: Documented return to a previous known-good image, plus schema/backup caveats.
- **Backup expectation**: Operator responsibility to retain PostgreSQL data; not a new product feature.
- **Architecture / data-flow diagram**: Visual of ingestion → generation → persistence → attempt → score, with adapter boundaries.
- **Persistence ER diagram**: Visual of SourceDocument, Quiz, Question, QuestionOption, QuizAttempt, AttemptAnswer, AttemptAnswerSelection.
- **Honest delivery status**: Checklist that distinguishes done, failed and **not run** for P0/P1/P2 work.
- **Walkthrough outline**: Timed 5–10 minute script for the live engineering discussion.
- **Seeded review defect**: Temporary scoring or leak bug used only to prove the review checklist, then removed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of proposed changes to the protected main line are subject to automated install, lint, type, unit/UI, real-database API, and production-build checks. A known failing check causes a failed pipeline in 100% of sampled trials (at least one deliberate failure of lint or tests during verification).
- **SC-002**: A reviewer following the published local startup from a clean clone reaches a live liveness endpoint **without** a model key. Timebox: the documented happy path is completable in **under 15 minutes** of attended steps once dependencies and the database engine are available (excluding first-time toolchain downloads).
- **SC-003**: Production API and web packages both build successfully from the documented instructions. A running production API process is **non-privileged**, answers liveness without a model key, and does not contain model or database secrets in its image build arguments.
- **SC-004**: 100% of omitted live evaluation runs (no secrets, not triggered, leftover Phase 7 calibration/baseline) are labeled **not run**. **Zero** of those omitted runs appear as passed on the delivery checklist or evaluation summary.
- **SC-005**: A reviewer who has only the published diagrams and API examples can narrate the path from Markdown URL to stored weighted score and can name the main persisted records, including that correctness is hidden before submit, in **one sitting**.
- **SC-006**: The walkthrough outline is **5–10 minutes** of required material and covers ingestion, generation, quality evaluation, adapter boundaries, persistence and scoring. A timed dry run lands in that window.
- **SC-007**: 100% of P2 extras, unexecuted deploys, and Phase 7 leftover gates on the interview status list are marked incomplete or **not run**. **Zero** of those items are presented as complete without execution evidence.
- **SC-008**: A scope review of this phase’s delivery finds **zero** new learner-facing quiz features, **zero** scoring-policy changes, **zero** new generation-strategy values, and **zero** evaluation-platform SDK imports in domain and application.
- **SC-009**: After the read-only review, **zero** unresolved blocking findings remain, and the seeded scoring or leak demonstration (if used) is **absent** from the delivered tree.
- **SC-010**: Merge-time automation completes its required suites **without** live model credentials. Live evaluation, if executed, is a separate evidenced run; if not executed, delivery still meets SC-004.

## Assumptions

- The Constitution’s technology choices remain binding. Names such as GitHub Actions, Docker, Jest, NestJS, Next.js, Prisma and PostgreSQL appear as **phase boundaries and evidence gates** from `roadmap.md`, not as an invitation to introduce extra platforms (Kubernetes operators, service meshes, extra clouds).
- Merge-time tests keep the Phase 2/5 contract: real PostgreSQL, mocked model. Live README generation remains an environment-gated demonstration, not a PR gate.
- The evaluation workflow’s default triggers are **workflow_dispatch and/or schedule** on a trusted branch, plus optional trusted-environment reuse. Ordinary pull requests never receive evaluation secrets.
- Destination/provider for image publish and deploy is **intentionally configurable**. Informed default: document a container-registry publish plus a placeholder/gated deploy job whose destination is supplied by repository configuration. This spec does **not** require choosing AWS vs Fly vs a single VPS in order to start implementation.
- A live production deployment is **optional evidence**, not a silent pass. If nobody deploys, status is **not run** and the path must still be documented.
- Rollback default: redeploy the previous image tag; do not promise automated down-migrations unless an existing migration strategy already supports them. Backup default: PostgreSQL volume or the host’s managed backup; no new backup microservice.
- Next.js may need a **public** API base URL available when the web image is built. That value MUST NOT include secrets. Server-side secrets stay on the API at runtime.
- Development Compose (`Dockerfile.dev`, bind mounts, watch mode) stays for local DX. Production Dockerfiles are additional files (roadmap: `apps/api/Dockerfile`, `apps/web/Dockerfile`) or equivalent documented paths.
- Caching pnpm and Turbo outputs in CI is in scope and must exclude secrets.
- Human calibration and accepted baseline remain Phase 7 leftovers. Phase 8 reports them; it does not require a human labeling session unless someone independently performs one and records evidence.
- The portable code-review skill and harness adapters already exist from earlier cycles. This cycle **invokes** them and adds them to the manual PR checklist; it does not rewrite the skill.
- The 5–10 minute walkthrough is a published outline plus a dry run, not a required recorded video.
- Node.js 24 and pnpm 12 remain the local toolchain from Phase 0. Production images use the same supported LTS line.
- Existing `.env.example` keys remain the configuration catalog; this cycle adds only values required for production runtime/deploy documentation (for example image names or public API URL), never real secrets.

## Dependencies

- Existing Constitution, `roadmap.md`, `implementation-roadmap.md`, `AGENTS.md` and Spec Kit installation.
- Verified Phases 0–3 runtime, scoring, `/v1` flow, fetch/generation adapters, snapshots/checksums, error codes and `/health`/`/ready`.
- Phase 4 web flow, Phase 5 two-source evidence, Phase 6 telemetry and Phase 7 eval harness **as already delivered**; this cycle consumes them and MUST NOT rebuild them.
- Phase 7 leftover status: human calibration and accepted frozen baseline **not run** — recorded, not expanded.
- Existing local Compose PostgreSQL, quality scripts (`pnpm lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `build`, `eval:golden`) and `.env.example`.
- For merge-time verification: hosted or equivalent runner, lockfile, and a disposable PostgreSQL. No live model key.
- For gated evaluation verification: optional protected secrets. Missing secrets ⇒ **not run**.
- For production image verification: ability to build the documented Dockerfiles locally or in CI. A public registry account is **not** required to prove the image builds.
- For live deploy evidence: a configured destination. Missing destination ⇒ deploy **not run**.
- Code-review skill at `.agents/skills/code-review/SKILL.md` and the current harness adapter.

## Deferred Context (not acceptance)

The following remain future cycles, optional bonuses, or Phase 7 leftovers and MUST NOT be implemented or tested as Phase 8 done-when items:

- Filling `evals/baselines/human-labels.v1.json` and accepting `baseline-v1.json` (Phase 7 leftovers; report as **not run**).
- Expanding the golden set, ongoing sampling, or experiment-driven prompt optimization (roadmap M9).
- A second question-generation strategy (optional assessment bonus).
- Learner-facing grounding preview, difficulty picker, usage dashboards, historical quizzes, authenticated workspaces, queues or streaming.
- Optional Playwright browser-driver suite as a replacement for Jest.
- Choosing and operating a specific commercial host beyond a configurable gated path.
- Custom backup tooling, multi-region failover, or Kubernetes operators.
- Changing the provisional multiple-answer scoring policy.
- Authentication, billing, Redis, extra brokers or analytics product UIs.
