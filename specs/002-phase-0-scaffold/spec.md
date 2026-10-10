# Feature Specification: Phase 0 Project Scaffolding

**Feature Branch**: `002-phase-0-scaffold`

**Created**: 2026-10-10

**Status**: Draft

**Roadmap phase**: Phase 0 — Project scaffolding, monorepo and local runtime (P0)

**Input**: User description: "Create a Phase 0-only specification for project scaffolding, monorepo and local runtime. Reuse the existing Constitution and planning kit. A developer from a fresh clone must install dependencies, start local PostgreSQL and minimal API/web shells, verify health and database connectivity, and run lint, strict typecheck, tests and builds. Cover shared package shells, environment validation, example environment file, local database compose, persistence bootstrap, test harness setup, and minimal shared design foundations. Exclude quiz product behavior and later-phase delivery work."

## Phase Identity and Goal

This specification covers **Roadmap Phase 0 only**. The goal is that both minimal application shells start, the local database runs, and the documented quality commands succeed.

This is a **developer-platform** slice, not a product-quiz slice. Success is a reproducible local workspace that later phases can attach to. It does **not** deliver quiz creation, scoring, generation, or a playable UI.

## Prerequisites

These prerequisites already exist in the repository and MUST be reused. They MUST NOT be reinitialized or overwritten by this cycle.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal boundaries, strict TypeScript, Zod, Jest, security and roadmap fidelity already ratified. |
| Spec Kit planning kit and Cursor integration | Complete | `.specify/` templates, scripts and integration are installed. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of product scope and this phase's checklist. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy. |
| Design-system skill and references | Complete | Canonical visual tokens, art direction and recipes. |
| Prior verified implementation cycle | Not required | `implementation-roadmap.md` records **no verified deliveries**. Phase 0 has no code prerequisite. |

**Blockers:** None. No incomplete prerequisite expands this phase's scope.

**Existing whole-product placeholder:** `specs/001-ai-quiz-generator/` exists as empty directories only (no specification). It is retained as unused product-context leftover. This cycle owns `specs/002-phase-0-scaffold/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

A developer MUST be able to:

- Install workspace dependencies from a fresh clone using the constitution-bound package manager and monorepo task runner.
- Start a **local PostgreSQL** instance with a health check and durable local storage, from documented compose configuration.
- Start a **minimal API shell** and a **minimal web application shell**.
- Confirm API liveness at `/health` and confirm the API can connect to the local database.
- Run documented **lint**, **strict typecheck**, **Jest tests** and **build** commands successfully on the scaffold.
- Use shared package shells named in the constitution: `domain`, `application`, `contracts`, `ui` and `config`.
- Validate required environment configuration, with an example environment file that contains no real secrets.
- Bootstrap persistence configuration enough to connect and apply a **minimal baseline** if needed for connectivity. No quiz product tables.
- Use Jest for API/domain packages and Jest plus React Testing Library for the web shell.
- See **minimal shared design foundations** (semantic tokens, typography, a small set of shared primitives) on the web shell, following the design-system skill. No quiz forms, player or results.

Constitution-bound platform names for this phase (not open design choices): pnpm workspaces, Turborepo, NestJS API shell, Next.js App Router web shell, PostgreSQL, Prisma bootstrap, Tailwind CSS, shadcn/ui primitives, Zod for environment validation, ESLint, Prettier and Jest.

## Explicit Exclusions

This phase MUST NOT include:

- Quiz entities or full product tables (`SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, answers, selections).
- Scoring, weighted averages, or grading policy implementation.
- Quiz REST endpoints (`POST /v1/quizzes` and related attempt/result routes). `/health` is in scope.
- Remote Markdown fetching, GitHub URL normalization, SSRF controls for source URLs, or treating Markdown as product input.
- AI / model generation, provider SDKs, or structured quiz output.
- Quiz setup forms, quiz player, progress, submission or results screens.
- Langfuse or other generation telemetry.
- Production Dockerfiles, multi-stage images, non-root production runtimes.
- GitHub Actions or other CI/CD pipelines.
- Authentication, billing, queues, microservices or dashboards.
- Regenerating or overwriting the Constitution, Spec Kit initialization, or portable skills.

Later-phase requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **developer** (including an interviewer reproducing the local environment) working from a fresh clone of this repository.

### User Story 1 - Fresh clone to running local platform (Priority: P1)

A developer clones the repository, follows the documented setup, installs workspace dependencies, copies the example environment file, starts the local database, and starts the API and web shells. Both applications come online using only documented steps and values. The developer does not need quiz, model or observability secrets to complete this story.

**Why this priority**: Nothing later can be built or demonstrated until a clean clone becomes a running local platform.

**Independent Test**: From a clean working copy, perform the documented install and start steps and confirm both shells are reachable without undocumented manual fixes.

**Acceptance Scenarios**:

1. **Given** a fresh clone with no prior local install, **When** the developer installs workspace dependencies using the documented command, **Then** all workspace packages install successfully and a lockfile-consistent install is possible.
2. **Given** documented example environment values for this phase, **When** the developer starts the local database and both application shells, **Then** the API and web applications become reachable on their documented local addresses.
3. **Given** a valid local configuration, **When** the developer starts the platform, **Then** startup does **not** require model-provider keys, observability keys, or quiz-specific settings.
4. **Given** the documented compose definition, **When** the developer starts the local database, **Then** the database becomes healthy and keeps data across ordinary local restarts.
5. **Given** a fresh clone, **When** the developer reads the setup documentation, **Then** it lists install, environment copy, database start, any connectivity bootstrap, application start, health verification and the quality commands.

---

### User Story 2 - Health and database connectivity (Priority: P1)

A developer confirms the API is alive and that it can talk to the local database. A simple health check answers whether the process is up. A connectivity check answers whether the database is reachable. Persistence is configured only enough to connect; no quiz records exist.

**Why this priority**: Local runtime is incomplete if the API cannot prove it is up and cannot reach storage.

**Independent Test**: With the database and API running, request the documented health/readiness paths and confirm a successful database connectivity result.

**Acceptance Scenarios**:

1. **Given** the API process is running, **When** the developer requests `GET /health`, **Then** the response indicates the process is live.
2. **Given** the local database is healthy and the API has valid database configuration, **When** the developer checks database connectivity (via the documented health/readiness behavior or documented verification step), **Then** the check reports that the database is reachable.
3. **Given** persistence bootstrap has been applied, **When** the developer inspects the local database, **Then** no quiz product tables or scoring structures are present.
4. **Given** the local database is stopped, **When** the developer checks database connectivity through the API, **Then** the check fails clearly and does not report a successful connection.

---

### User Story 3 - Valid and invalid configuration (Priority: P1)

A developer can start the platform with the documented example configuration. Missing or invalid required values are rejected before the applications pretend to be ready. The example environment file shows every required name for this phase and contains no real secrets.

**Why this priority**: Environment-driven configuration is part of the project's definition of production-ready, and invalid config must fail closed.

**Independent Test**: Start once with the example configuration (success) and once with a required value removed or malformed (clear failure).

**Acceptance Scenarios**:

1. **Given** a configuration matching the example file's required local values, **When** the developer starts the API and web shells, **Then** configuration validation succeeds and both applications start.
2. **Given** a required value is missing or malformed (for example an invalid database connection string), **When** the developer starts the affected application, **Then** startup fails closed with a clear, non-secret-leaking message that names the problem.
3. **Given** the example environment file in the repository, **When** a reviewer inspects it, **Then** it documents the names needed for local database, API and web startup, contains no live credentials, and may list later-phase placeholders as unused in this phase.
4. **Given** later-phase secret names appear as placeholders, **When** the developer starts Phase 0 applications, **Then** those unused secrets are not required for startup or health checks.

---

### User Story 4 - Quality commands on the scaffold (Priority: P1)

A developer runs the documented lint, strict typecheck, test and build commands from the workspace root. All of them complete successfully on the scaffold, including empty-but-valid shared packages and the minimal app shells.

**Why this priority**: The phase definition of done requires these commands to pass from a fresh clone before any quiz work begins.

**Independent Test**: After install, run the four documented quality commands and observe a successful result for each.

**Acceptance Scenarios**:

1. **Given** a successful dependency install, **When** the developer runs the documented lint command, **Then** it completes with no lint errors across apps and packages in this phase.
2. **Given** a successful dependency install, **When** the developer runs the documented strict typecheck command, **Then** all TypeScript in this phase compiles under strict settings.
3. **Given** a successful dependency install, **When** the developer runs the documented test command, **Then** the Jest suites configured for this phase pass (including at least one API/domain proof and one web component proof using React Testing Library).
4. **Given** a successful dependency install, **When** the developer runs the documented build command, **Then** the API and web shells produce a successful production-style build.

---

### User Story 5 - Shared workspace shells with hexagonal boundaries (Priority: P2)

A developer sees a workspace with an API app, a web app, and shared `domain`, `application`, `contracts`, `ui` and `config` packages. The core packages exist as compilable shells. Domain and application shells do not depend on API, web, persistence or provider frameworks. Shared config supplies lint, TypeScript and test settings used by the workspace.

**Why this priority**: Later phases attach business rules to these shells. Creating them now prevents later boundary violations, but the platform still delivers value if stories 1–4 already run.

**Independent Test**: Inspect the workspace layout and confirm domain/application packages typecheck without framework or provider dependencies.

**Acceptance Scenarios**:

1. **Given** the scaffold is present, **When** a reviewer lists workspace members, **Then** they include API and web applications plus `domain`, `application`, `contracts`, `ui` and `config` packages.
2. **Given** the domain and application shells, **When** they are typechecked, **Then** they have no dependencies on the API framework, web framework, persistence client, or model/observability SDKs.
3. **Given** the shared config package, **When** apps and packages run lint, typecheck or tests, **Then** they consume those shared settings rather than inventing unrelated toolchains.
4. **Given** import-boundary rules from the Constitution, **When** a disallowed import from a core package toward a framework package is introduced in a test or review, **Then** the quality setup detects or otherwise prevents it from being an accepted default.

---

### User Story 6 - Minimal design foundations on the web shell (Priority: P2)

A developer opens the web shell and sees a calm, English-language educational shell that uses the project's light-green botanical foundations: shared semantic colors, typography, spacing rhythm and a small set of shared primitives. There is no quiz form, player or results flow. Decorative artwork is optional and must not replace a working shell.

**Why this priority**: Visual foundations must exist before later quiz screens, but they are secondary to a running, checked platform.

**Independent Test**: Open the web shell, confirm English copy and shared tokens/primitives, and confirm the absence of quiz product screens.

**Acceptance Scenarios**:

1. **Given** the web shell is running, **When** the developer opens the home view, **Then** they see an English-language placeholder/status shell on a light-green-tinted canvas with dark-green primary actions and readable forest-green text.
2. **Given** shared UI primitives are installed, **When** the home view renders, **Then** it uses shared semantic tokens and at least a small set of shared primitives (for example a page shell, card and button) rather than one-off unthemed controls.
3. **Given** the design-system skill's accessibility baseline, **When** the shell is viewed at a narrow phone width and a desktop width, **Then** content remains readable without horizontal scrolling, interactive targets remain usable, and focus is visible.
4. **Given** this phase's exclusions, **When** the developer inspects available routes, **Then** there is no quiz setup form, quiz player, or results screen.

---

### Edge Cases

- **Missing environment file**: Startup fails closed and tells the developer to copy the example file; it does not crash with an unreadable stack-only failure.
- **Database not running**: API liveness may still report the process is up, but connectivity/readiness MUST NOT report success.
- **Malformed database URL**: Configuration validation fails before the API claims to be ready.
- **Port already in use**: Startup fails with a clear local-runtime error; the spec does not require automatic port hunting.
- **Clean clone without copied environment values**: Documented steps include creating local env from the example; skipping that step is an invalid-configuration path.
- **Placeholder secrets for later phases**: Presenting unused names in the example file MUST NOT make Phase 0 startup depend on them.
- **Empty shared packages**: Packages with no product logic MUST still lint, typecheck, test and build.
- **Repeat local database start**: Ordinary stop/start keeps the local volume; this phase does not require production backup or migration-deploy tooling.
- **Unsupported Node.js version**: Documentation states the current supported LTS expectation; this phase does not require a runtime version manager.
- **Quiz-shaped files added early**: Presence of quiz tables, scoring modules, generation adapters or quiz UI in this cycle is a scope defect, not extra credit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A developer MUST be able to install all workspace dependencies from a fresh clone using the documented workspace install command.
- **FR-002**: The workspace MUST be a pnpm + Turborepo monorepo with root scripts that run development, lint, strict typecheck, test and build across apps and packages.
- **FR-003**: The workspace MUST include a NestJS API application shell and a Next.js App Router web application shell that start locally with documented commands.
- **FR-004**: The workspace MUST include shared package shells named `domain`, `application`, `contracts`, `ui` and `config`.
- **FR-005**: Domain and application packages MUST remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client dependencies.
- **FR-006**: All application TypeScript in this phase MUST compile under strict compiler settings.
- **FR-007**: Required environment values MUST be validated at startup. Invalid or missing required values MUST fail closed with a clear error that does not leak secrets.
- **FR-008**: The repository MUST provide an example environment file documenting local database, API and web settings, with no live secrets. Later-phase names MAY appear as unused placeholders.
- **FR-009**: Phase 0 API and web startup MUST NOT require model-provider keys, Langfuse keys, or quiz-specific settings.
- **FR-010**: Local PostgreSQL MUST be startable from documented compose configuration that includes a health check and a persistent volume.
- **FR-011**: Persistence MUST be bootstrapped so the API can verify it can reach the local database. A minimal baseline migration MAY exist only if required for that connectivity. Quiz product models and their migrations are out of scope.
- **FR-012**: The API MUST expose `GET /health` for process liveness. Database connectivity MUST be verifiable through documented readiness/health behavior or an equivalent documented check.
- **FR-013**: The API MUST NOT expose quiz create/get/attempt/submit/result endpoints in this phase.
- **FR-014**: Jest MUST be configured for domain/API packages, and Jest plus React Testing Library MUST be configured for the web shell, with at least one passing proof test on each configured surface.
- **FR-015**: Documented commands equivalent to `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` MUST succeed on the scaffold.
- **FR-016**: Shared UI MUST install design tokens once and expose them to the web app and shared primitives, using the semantic palette, typography and layout rhythm from the design-system skill (light-green canvas, white surfaces, dark-forest primary actions, English copy).
- **FR-017**: Shared UI MAY include a small foundation set of primitives (page shell, card, button, and similar non-quiz controls). It MUST NOT implement quiz forms, option lists, player progress or results layouts.
- **FR-018**: The web shell home view MUST demonstrate those foundations and MUST NOT be a quiz product screen.
- **FR-019**: Import-boundary enforcement (lint rules or equivalent quality gate) MUST make framework leakage into domain/application an error, not an accepted default.
- **FR-020**: Setup documentation MUST describe clone, install, environment copy, database start, migration/connectivity bootstrap if any, application start, health verification and the quality commands.
- **FR-021**: This cycle MUST reuse the existing Constitution and Spec Kit installation and MUST NOT reinitialize Spec Kit, regenerate the Constitution, or overwrite portable skills.

### Key Entities

- **Workspace**: The local monorepo a developer installs and runs; contains applications, shared packages, tooling and documented scripts.
- **API shell**: Minimal backend application that starts, validates configuration, serves `/health`, and can verify database connectivity. No quiz resources.
- **Web shell**: Minimal frontend application that starts and renders the shared design foundations. No quiz workflow.
- **Shared core packages**: `domain` (future entities/ports), `application` (future use cases), `contracts` (future public schemas). Shells only in this phase.
- **Shared UI package**: Semantic tokens and a small primitive set consumed by the web shell.
- **Shared config package**: Lint, TypeScript and test settings reused by apps and packages.
- **Local database instance**: Developer-only PostgreSQL with health check and persistent volume. No quiz schema.
- **Environment configuration**: Named, validated settings for local runtime. Example file is the documented template; real secrets never belong in the repository.
- **Quality command suite**: Lint, strict typecheck, tests and build that a developer runs from the workspace root.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer following the documented setup can go from a fresh clone to both applications running and the local database healthy without undocumented steps or hidden files.
- **SC-002**: After the applications are up, a developer can confirm API liveness and database connectivity in under one minute of checking (not including first-time dependency install).
- **SC-003**: 100% of the documented quality commands for lint, strict type checking, tests and build complete successfully on the scaffold.
- **SC-004**: Invalid or missing required configuration prevents the affected application from becoming ready in 100% of documented invalid cases, and the developer can tell what to fix without seeing secret values.
- **SC-005**: Valid documented local configuration starts both applications without requiring later-phase secrets, in 100% of documented valid cases.
- **SC-006**: Reviewers inspecting the workspace can identify the two application shells and the five named shared packages, and can confirm the core packages do not depend on application frameworks.
- **SC-007**: A developer opening the web shell recognizes the shared light-green educational visual language (readable text, primary action, card/surface) at both a phone-width and desktop-width view, with English copy only.
- **SC-008**: A reviewer can complete a scope check and find **zero** quiz product tables, scoring behavior, quiz HTTP resources, Markdown fetching, model generation, quiz UI flows, telemetry product integration, production images or hosted CI pipelines in this phase's delivery.

## Assumptions

- The Constitution's technology choices are binding for this phase: TypeScript on current supported Node.js LTS; pnpm and Turborepo; NestJS; PostgreSQL and Prisma; Next.js App Router; Tailwind CSS and shared shadcn/ui primitives; Zod; Jest (and React Testing Library on the web); ESLint and Prettier.
- "Minimal application shell" means the app boots, serves a trivial verified surface (`/health` or a non-quiz home view), and participates in lint/typecheck/test/build. It does not host product workflows.
- A baseline persistence migration is allowed only when required so connectivity can be proven. An empty or non-product baseline is acceptable. Product tables wait for Phase 2.
- Local compose in this phase starts **PostgreSQL only**. Optional API/web containers are a later delivery concern.
- Example environment values for local database and app URLs are sufficient. Model and observability keys, if listed, are placeholders and unused.
- Default local ports follow ordinary development practice and are documented; they are not a product decision.
- Concrete file trees, package versions and command wiring belong to planning. This specification names constitution-bound capabilities and observable developer outcomes only.
- Jest is configured and proven with smoke/harness tests. Domain scoring fixtures and API end-to-end quiz flows belong to later phases.
- Dark theme, remote font loading, extra component libraries and quiz illustrations are not required. System/local font stacks from the design-system skill are enough.
- `specs/001-ai-quiz-generator/` remains an empty placeholder and is not this cycle's specification.
- Documentation updates needed for local setup belong in this phase; interview walkthrough diagrams and two-source demo notes do not.

## Dependencies

- Existing Constitution, roadmaps, `AGENTS.md`, Spec Kit installation and design-system skill (all present).
- Developer machine capabilities assumed: current Node.js LTS, pnpm, Docker (or equivalent) to run local PostgreSQL, and a browser to open the web shell.
- No verified code from Phases 1–7. This phase MUST NOT wait on them.

## Deferred Context (not acceptance)

The following remain future cycles and MUST NOT be implemented or tested as Phase 0 done-when items:

- Phase 1: domain model, scoring, public quiz contracts.
- Phase 2: product schema, repositories, quiz REST flow.
- Phase 3: Markdown ingestion and model generation.
- Phase 4: complete quiz web experience.
- Phase 5: two-source demonstration and reliability evidence.
- Phase 6: Langfuse and operational hardening.
- Phase 7: GitHub Actions, production images and interview walkthrough kit.
