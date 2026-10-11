# Feature Specification: Phase 4 Complete Browser Quiz Experience

**Feature Branch**: `006-phase-4-web-experience`

**Created**: 2026-10-11

**Status**: Draft

**Roadmap phase**: Phase 4 — Complete web experience (P0)

**Input**: User description: "Create a Phase 4-only specification for the complete browser quiz experience. Prerequisite: verified Phases 0–3. Consume the verified API and public contracts; reuse its generation, persistence and scoring behavior. Describe entering a topic, Markdown URL and count (5–8), generating a quiz, answering single/multiple questions with progress and previous/next navigation, submitting, and viewing the persisted weighted result on the 0–4 scale with optional percentage, per-question feedback and source reference. Cover loading, validation, generation/submission errors and safe refresh/result access through the private attempt-token lifecycle. Never expose answer keys before submission. Use English UI copy, React Hook Form/Zod, Tailwind and shared shadcn/ui primitives. Follow the design-system skill for semantic tokens, light greens, responsive layouts, labels, keyboard navigation, focus and usable touch targets. Define Jest/RTL scenarios for validation, selection, progress, errors and submit, plus phone/desktop acceptance of the full flow. Exclude new scoring policies, generation strategies, Langfuse, CI/CD and production containers; limit backend fixes to documented blockers of this existing flow."

## Phase Identity and Goal

This specification covers **Roadmap Phase 4 only**. The goal is that an **interviewer or learner can complete the full quiz in the browser**: enter a topic and Markdown URL, generate a quiz, answer every question, submit, and see the **persisted** weighted result.

Success is a complete, independently testable web slice on top of the verified Phases 0–3 API. Generation, persistence, scoring math and public contracts **reuse Phase 3**. This cycle does **not** invent new grading rules, a second generation strategy, telemetry, hosted CI, or production images. Backend changes are allowed **only** when they are documented blockers that prevent this existing flow from working in the browser.

## Prerequisites

This cycle MUST reuse the Phase 0 workspace, Phase 1 scoring and public contracts, Phase 2 persistence and attempt-token lifecycle, and Phase 3 secure fetch plus generation. It MUST NOT re-scaffold the monorepo, reimplement grading, replace public quiz/attempt contracts, reinitialize Spec Kit or the Constitution, or rebuild product tables.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal boundaries, Zod contracts, answer-key isolation, Jest/RTL for UI, English copy, Tailwind/shadcn design-system skill and roadmap fidelity are binding. The web app MUST consume public REST contracts and UI primitives only. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of screens (`/`, `/quiz/[id]`, `/quiz/[id]/results`), player/result behavior, attempt-token safety and this phase’s checklist and definition of done. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy, including never exposing answer keys before submission. |
| Design-system skill and references | Complete | Semantic tokens, light-green botanical art direction, typography, layout, accessibility and Tailwind recipes. Binding for every visual change in this cycle. |
| Phase 0 scaffolding (`specs/002-phase-0-scaffold/`) | Verified | Monorepo, API/web shells, local PostgreSQL, shared UI tokens, Jest + React Testing Library harness. Current web home is a **non-quiz placeholder** that this cycle replaces with the product setup screen. |
| Phase 1 domain scoring (`specs/003-phase-1-domain-scoring/`) | Verified | Quiz invariants, deterministic scoring, public Zod contracts, keys omitted from pre-submit views, correctness only on the public result. |
| Phase 2 persistence and REST (`specs/004-phase-2-persistence-api/`) | Verified (2026-10-10) | `/v1` create/get/start/submit/result, private attempt token issued once, hash-only storage, transactional scoring, idempotent resubmit. |
| Phase 3 Markdown ingestion and generation (`specs/005-phase-3-markdown-generation/`) | Verified (2026-10-10) | Product create fetches a public Markdown URL and generates a grounded quiz. Evidence: tasks T001–T062 complete; lint, typecheck, unit, integration, API E2E and build passed. Gated live README (`PHASE3_LIVE_README=1` + model key) remains an **environment blocker**, not a fixture fallback. |
| Formal verification record in `implementation-roadmap.md` | Complete for Phases 0–3 | Status: Phase 3 verified; wait for an explicit request before starting Phase 4. This cycle is that requested Phase 4 specification only. |
| Phases 5–7 | Not started | Two-source demo package, Langfuse, CI/CD and production delivery are out of scope. |

**Blockers:** None that expand this phase’s scope. Phases 0–3 are recorded as verified.

- If Phase 0–3 quality commands later fail when this spec is implemented, that is a **prerequisite defect to fix in the earlier phase** and MUST NOT pull two-source demo work, telemetry, CI/CD or production containers into Phase 4.
- Missing model key or an unreachable sample README at **manual** browser verification time is an **environment blocker** for the live generate path. It MUST NOT restore fixtures as the product create path, and MUST NOT expand into Phase 5’s two-source demonstration package. Automated UI checks MAY use a test double of the verified API.
- If the verified API cannot be called from the browser (for example, the web origin is refused), enabling that access is an **in-scope blocker fix** for this existing flow. It is not a new product API, scoring change or generation strategy.

**Existing whole-product placeholder:** `specs/001-ai-quiz-generator/` remains unused leftover context. This cycle owns `specs/006-phase-4-web-experience/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

A learner using a browser MUST be able to:

- Open the web app landing screen and enter a **topic**, a **Markdown / README URL**, and a **question count from 5 through 8** (default 5).
- Generate a quiz with a single primary action and wait through a **clear loading/generation** state until the quiz is ready, or recover from a **validation or generation error**.
- Take the quiz one question at a time: see **progress** (current question and total), answer **single-choice** or **multiple-choice** questions with exactly four options, move with **previous** and **next**, and **submit** a complete attempt.
- View the **persisted** result: weighted score on the **0–4** scale, **optional percentage** beside it (not instead of it), **per-question feedback**, and a **source reference** to the original Markdown URL.
- Refresh the player or results safely according to the **private attempt-token** lifecycle, without putting the token in the address bar or seeing answer keys before submit.

The web app MUST:

- Speak **English** throughout (labels, help, errors, progress, results).
- Validate setup input with the same public create-quiz rules the API already uses (non-empty topic, `https` URL, count 5–8) **before** asking the server to generate, and still handle server-side fetch/generation failures with stable, non-secret messages.
- Consume the **verified** `/v1` resources and public contracts: create quiz, get sanitized quiz, start attempt, submit answers, get result. It MUST NOT compute the authoritative score in the browser.
- Start (or resume) an attempt only through the verified start-attempt contract. Keep the private token **only in session-scoped browser storage** for that sitting; present it on submit and result; never place it in the URL, page markup as a visible secret, or logs.
- Show questions and option **labels** from the public quiz view only. Correctness flags, raw scores and weighted scores MUST be absent from the player until after a successful submit.
- Combine the public quiz view (prompts, types, labels, original source URL) with the public result (scores, selected options, which options were correct) for the results screen. This cycle MUST NOT add new result fields unless a missing field is a documented blocker of the existing flow.
- Preserve in-progress selections when the learner moves previous/next, and after an ordinary refresh of the player **while the session token is still present**.
- After submit, show the stored result (including a later refresh of the results screen with the same session token). A second submit in the same sitting MUST follow the API’s idempotent behavior (existing result, not a re-grade).
- Follow the design-system skill: light-green canvas, white cards, dark-forest primary actions, serif page titles with sans-serif functional text, one-column quiz reading layout, **minimum 44px** touch targets, visible focus, associated labels, keyboard operation of fields and choices, and respect for reduced motion.
- Reuse shared UI primitives (and add shared form, choice, progress, alert and loading primitives there rather than one-off page widgets). Use constitution-bound form validation (schema-backed setup form) and Tailwind semantic tokens.
- Prove setup validation, choice selection, progress, loading/error and submit behavior with **Jest and React Testing Library**. Prove phone-width and desktop-width acceptance of the full flow by a reviewer in a real browser (about 320px and 1024px+).

Constitution-bound names for this phase (not open design choices): TypeScript strict packages, Next.js App Router web app, React Hook Form with Zod resolver, Tailwind CSS, shared shadcn/ui primitives from the design-system skill, public Zod contracts in `packages/contracts`, NestJS `/v1` API from Phases 2–3, and Jest + React Testing Library for UI evidence.

## Explicit Exclusions

This phase MUST NOT include:

- New scoring policies, weight formulas, rounding rules or a change to the provisional multiple-answer reading from Phase 1.
- A second question-generation strategy, prompt redesign, or client-side model calls.
- Langfuse or other generation telemetry.
- Production Dockerfiles, GitHub Actions, authentication of human users, billing, queues or dashboards.
- The **two-source demo package**: a second live README, interview README evidence kit, or claiming the assessment’s “at least two different README.md URLs” item done. One working browser flow against the verified API is enough for this cycle.
- Playwright or other browser-driver suites as a required gate (optional later; Jest + RTL remain the UI suite).
- Re-scaffolding the monorepo, overwriting the Constitution, rewriting Phase 1 scoring, or replacing Phase 2/3 persistence, tokens or generation **except** documented blocker fixes needed so this browser flow can call the existing API.
- Expanding public DTOs with answer keys, source excerpts, model ids or prompts-to-the-model on pre-submit views.
- A strategy picker, difficulty picker, Markdown preview pane, historical quiz list or admin screens.

Later-phase requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **learner** (including an interviewer demonstrating the product) using a web browser. The **verified API** is a collaborator, not a new actor. A **reviewer** confirms layout, accessibility, token safety and that keys stay hidden before submit.

### User Story 1 - Complete a quiz from setup through persisted results (Priority: P1)

A learner opens the web app, enters a topic, an HTTPS Markdown URL and a question count from 5 through 8, and generates a quiz. After a loading state, they see the first question. They answer every question, submit, and land on a results screen that shows the stored weighted score on the 0–4 scale, an optional percentage, per-question feedback and a link to the source they entered. Creating another quiz returns them to setup.

**Why this priority**: This is the phase definition of done. Without a browser path from URL to stored score, earlier API work is not interview-demonstrable as a product.

**Independent Test**: Drive the documented screens against the verified API (or a faithful test double of it); confirm the learner never sees keys during play; confirm the result matches the stored API result for that attempt.

**Acceptance Scenarios**:

1. **Given** a valid topic, HTTPS Markdown URL and count from 5 through 8, **When** the learner generates a quiz, **Then** they leave setup, see a generation/loading state, and then see a playable quiz of that many questions with four options each.
2. **Given** that playable quiz, **When** the learner answers every question with a legal selection and submits, **Then** they see the persisted weighted score on the 0–4 scale for that attempt, not a score invented in the browser.
3. **Given** that result, **When** the learner reads the screen, **Then** they see the optional percentage beside the 0–4 score, per-question correct/incorrect feedback, and a reference to the original Markdown URL.
4. **Given** a finished result, **When** the learner chooses to create another quiz, **Then** they return to the setup screen and can start a new generation without seeing the previous attempt’s keys on setup.
5. **Given** omitted question count on setup, **When** the learner generates, **Then** five questions are presented (API default).

---

### User Story 2 - Validate setup before generation (Priority: P1)

The setup screen is a labeled English form. Empty topic, non-HTTPS or malformed URL, and a count outside 5–8 are blocked in the form with messages tied to the fields. A valid form is the only way to start generation. The form does not ask for a generation strategy.

**Why this priority**: Invalid creates waste a long generation wait and fail the assessment’s input contract. Field-level messages let a learner fix mistakes without reading error codes.

**Independent Test**: Submit empty, `http`, malformed, out-of-range count and valid payloads; assert visible field errors, no generation request on invalid input, and a generation request (or equivalent) on valid input.

**Acceptance Scenarios**:

1. **Given** the setup screen, **When** the learner submits with an empty or whitespace-only topic, **Then** they see an English error on the topic field and generation does not start.
2. **Given** the setup screen, **When** the learner submits a URL that is not `https` or is not a URL, **Then** they see an English error on the URL field and generation does not start.
3. **Given** the setup screen, **When** the learner chooses a count outside 5–8, **Then** they cannot submit that value (the control only offers 5–8, or the form error blocks it).
4. **Given** valid topic, HTTPS URL and count 5–8, **When** the learner submits, **Then** generation starts and the primary action becomes unavailable until the attempt finishes or fails.
5. **Given** the setup screen, **When** a reviewer inspects it, **Then** every field has a visible label, the primary action is “Generate quiz” (or equivalent English), and there is no strategy or model-key field.

---

### User Story 3 - Answer single and multiple questions with progress and navigation (Priority: P1)

The player shows one question at a time in quiz order. Progress states the current index and the total (not a bar alone). Single-answer questions use exclusive one-of-four choice. Multiple-answer questions tell the learner to select all that apply and allow more than one. Previous and next keep earlier selections. The learner cannot skip forward without a legal selection on the current question. Submit is available when every question has a legal selection (typically from the last question).

**Why this priority**: Single vs multiple, four options, and visible progress are assessment must-haves. Losing answers on Back would make the player unusable.

**Independent Test**: Render a mixed single/multiple public quiz view; select, change, go next/back, assert progress text and that selections persist; assert next is blocked until a legal selection exists.

**Acceptance Scenarios**:

1. **Given** a ready quiz of N questions (5–8), **When** the player opens, **Then** the learner sees question 1 of N, the prompt, four options, and progress that names both the current question and the total.
2. **Given** a `single` question, **When** the learner chooses an option, **Then** exactly one option is selected; choosing another replaces the first; instructions say to select one answer.
3. **Given** a `multiple` question, **When** the learner chooses options, **Then** they can select more than one; instructions say to select all that apply; at least one selection is required to proceed.
4. **Given** a selection on question 2, **When** the learner goes previous then next, **Then** question 2 still shows that selection.
5. **Given** the current question has no legal selection, **When** the learner tries to go next or submit, **Then** they stay on that question with an English prompt to choose an answer.
6. **Given** all questions have legal selections, **When** the learner is on the last question, **Then** the primary action is submit (not a next that goes nowhere).

---

### User Story 4 - Show the persisted weighted result with feedback and source (Priority: P1)

After a successful submit, the results screen leads with the stored 0–4 weighted score (display rounding as already defined by the API). An optional percentage appears beside it. Each question shows the prompt, the learner’s picks, which options were correct, and a **Correct** or **Incorrect** label that does not rely on color alone. The original Markdown URL is offered as a source reference. The screen does not present the score as a simple count of right questions.

**Why this priority**: Interview acceptance requires seeing the weighted score, optional percentage, feedback and source after play — and knowing the value came from persistence, not the browser.

**Independent Test**: After a mocked or real submit, assert the displayed 0–4 value and percentage match the public result’s display fields; assert per-question labels and the source URL; assert no “X of N correct” as the primary score.

**Acceptance Scenarios**:

1. **Given** a scored attempt, **When** results load, **Then** the headline numeric score is the API display value on the 0–4 scale (for example two decimal places) and is labeled as a weighted quiz score.
2. **Given** that result, **When** the learner reads the score block, **Then** they also see the optional percentage from the API display field, clearly secondary to the 0–4 value.
3. **Given** that result, **When** the learner reviews questions, **Then** each question shows Correct or Incorrect with text (and icon if present), the options they selected, and which options were correct.
4. **Given** that result, **When** the learner looks for the source, **Then** they find the original Markdown URL as a usable reference (openable link).
5. **Given** a scored attempt, **When** the learner refreshes the results screen in the same sitting, **Then** the same stored result is shown (not a newly computed grade).

---

### User Story 5 - Keep the attempt token private across refresh and result access (Priority: P1)

Starting play creates an attempt and receives a private token once. Submit and results use that token. Refreshing the player in the same sitting continues that attempt and keeps selections. Refreshing results in the same sitting still loads the stored result. The token never appears in the address bar. Opening results without a token, or with the wrong sitting, does not show scores or keys. After submit, returning to the player does not let the learner change answers for that attempt.

**Why this priority**: The anonymous MVP’s access control is the attempt token. Putting it in the URL or dropping it on refresh would leak credentials or strand the interviewer.

**Independent Test**: Complete play in a session; refresh player then results; open results in a fresh sitting without the token; inspect the address bar and player markup for absence of the token.

**Acceptance Scenarios**:

1. **Given** a ready quiz, **When** the learner enters the player, **Then** an attempt is started (or a same-sitting attempt is resumed) and the private token is kept only in session-scoped storage — not in the URL.
2. **Given** an in-progress attempt with selections, **When** the learner refreshes the player in the same sitting, **Then** they resume the same attempt, see the same question progress, and keep prior selections.
3. **Given** a scored attempt in that sitting, **When** the learner refreshes results, **Then** the stored result loads using the session token.
4. **Given** a results address for a quiz, **When** the learner opens it in a new sitting with no stored token, **Then** they see an English “cannot show this result” (or equivalent) state, not scores or answer keys, and can return to setup.
5. **Given** a scored attempt, **When** the learner navigates back to the player URL for that quiz in the same sitting, **Then** they are sent to results (or shown a completed state) and cannot change that attempt’s answers.
6. **Given** the running app, **When** a reviewer inspects the address bar, shared links and visible page text during play, **Then** they do not find the private token.

---

### User Story 6 - Never reveal answer keys before submission (Priority: P1)

During setup, loading and play, the learner must not be able to tell which options are correct from the page, from downloaded HTML, or from data the browser received for those screens. Selected options may look selected, but not correct or incorrect. After submit, results **may** show which options were correct.

**Why this priority**: Pre-submit key leakage is an assessment failure even if the rest of the UI is polished.

**Independent Test**: Inspect player render, page source and the quiz payload used by the UI; assert no correctness flags or scores; submit; assert results then include correctness.

**Acceptance Scenarios**:

1. **Given** the player for an unsubmitted attempt, **When** a reviewer inspects on-screen copy, option styling and the public quiz data the page used, **Then** there are no correctness flags, raw scores, weighted scores or “correct answer” hints.
2. **Given** a selected option before submit, **When** the learner looks at it, **Then** it is marked selected only — not correct or incorrect — and color is not used as the only state.
3. **Given** a generation or submit error, **When** the error is shown, **Then** it does not include answer keys, tokens, model keys or provider traces.
4. **Given** a successful submit, **When** results render, **Then** correctness flags from the public result are shown with labels, and only then.

---

### User Story 7 - Recover from loading, generation and submission failures (Priority: P1)

Generation can take a noticeable time. The learner sees an honest loading state (topic visible; no fake precise progress). If the server rejects the source or generation, they see an English explanation and can try again from setup. If submit fails (network, unauthorized, incomplete), they stay in a recoverable player state when the attempt is still open. Unknown quiz or result-not-ready paths do not leak keys.

**Why this priority**: Live generation will fail in interviews if the URL is wrong or the model is down. A silent spinner or a raw error would block the demo.

**Independent Test**: Simulate slow create, `CREATE_QUIZ_INVALID` / source / generation failures, submit network failure and result-before-submit; assert English recovery UI and no keys.

**Acceptance Scenarios**:

1. **Given** a valid generate request in flight, **When** the learner waits, **Then** they see a loading/generation state with accessible status text (for example that the source is being read or questions are being prepared) and cannot double-submit the form.
2. **Given** a server create failure (unsafe URL, unusable source, generation failure, timeout, or similar stable code), **When** the response returns, **Then** the learner sees an English message they can act on, a way to try again, and no raw provider output.
3. **Given** an open attempt, **When** submit fails because of a temporary network error, **Then** the player remains on the attempt with selections intact and the learner can submit again.
4. **Given** a quiz identity that does not exist or is not playable, **When** the learner opens the player address, **Then** they see a not-available state and can return to setup; no questions or keys appear.
5. **Given** results requested before submit, **When** the API refuses as not scored, **Then** the UI shows that the result is not ready and does **not** show correctness flags.

---

### User Story 8 - Use a calm, accessible English interface on phone and desktop (Priority: P2)

The four screens (setup, generating, player, results) feel like one light-green educational product. Setup may use a wider editorial layout on large screens; the player stays a single reading column. Phone widths keep full-width primary actions, wrapping long URLs and option text, and 44px-tall controls. Keyboard users can fill the form, choose options, move between questions and read results. Decorative art never hides answers or leaks correctness.

**Why this priority**: The definition of done requires phone and desktop acceptance. Accessibility failures would make the demo look unfinished even if scoring is correct.

**Independent Test**: Reviewer completes the flow at about 320px and at desktop width; keyboard-only pass on setup, player and results; automated tests cover labels, progress text and disabled/loading states.

**Acceptance Scenarios**:

1. **Given** a viewport about 320px wide, **When** a reviewer walks setup → generate (or mocked ready quiz) → player → results, **Then** there is no horizontal scroll, option labels are fully readable, and primary actions meet the 44px minimum height.
2. **Given** a viewport 1024px or wider, **When** the reviewer opens setup and the player, **Then** setup may show restrained editorial artwork beside the form, and the player remains a single centered reading column without artwork beside answers.
3. **Given** a keyboard-only user, **When** they tab through setup, options, previous/next/submit and results actions, **Then** focus is always visible and every control has an accessible name.
4. **Given** a user with reduced motion, **When** they change selections or navigate, **Then** motion is not required to understand state.
5. **Given** all product screens, **When** a reviewer reads the copy, **Then** it is English only and does not use color as the only way to show selected, correct, incorrect or error.

---

### Edge Cases

- **Long topic or very long README URL**: fields wrap; the URL does not overflow the card; validation still applies (topic max length as in the public create contract).
- **Two-line option labels**: the entire option row stays clickable; height stays at least 44px.
- **Count 5 and count 8**: both play and show “Question x of 5” / “of 8”.
- **All single-answer quiz or mixed types**: player uses radio vs checkbox semantics per question type from the public view.
- **Changing a previous answer after going back**: allowed until submit; the new selection is what is submitted.
- **Refresh after the browser sitting ended** (session storage gone): player may start a **new** attempt for that quiz identity; results without a token stay denied. This is not “resume forever.”
- **Two tabs on the same quiz**: each tab may start its own attempt if it has no token yet; tokens MUST NOT be copied into the URL to sync tabs this phase.
- **Submit with stale selections vs server ownership errors**: show English recovery; do not display keys.
- **Idempotent second submit** in the same sitting: show the original stored result.
- **Direct visit to `/quiz/{id}`** for a ready quiz: load the public view, start or resume an attempt, play. No keys.
- **Direct visit to `/quiz/{id}/results`** without a scored sitting: not-ready or unauthorized English state; offer setup.
- **Browser back from results to player after submit**: completed/results behavior (User Story 5), not a new ungraded play of the same attempt.
- **Create another quiz**: clears the current sitting’s player state so a new generation cannot show the previous result’s keys on setup or on a new player by accident.
- **API unreachable / CORS or network down on generate**: English connection error and retry; not a stack trace.
- **Missing `NEXT_PUBLIC_API_URL`**: app fails closed at startup as in Phase 0; this cycle does not add new required public env secrets.
- **Model key missing on the API**: generate fails with the existing upstream generation failure; UI maps it to a retryable English error. No silent fixture quiz in the product UI.
- **Source excerpts**: not shown this phase unless already on a public contract (they are not on the public quiz view). Do not add them as a UI invention that requires a new pre-submit field.
- **Percentage of 0 or 100**: still shown as optional display beside 0.00 / 4.00 when the API provides display fields.
- **Decorative botanical art**: optional; `aria-hidden` when purely decorative; never behind option text.
- **Phase 0 “View API health” home**: replaced by the quiz setup screen; health remains an API surface, not the product landing CTA.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The web landing screen (`/`) MUST be an English quiz-setup form with topic, Markdown/README URL, optional question count 5–8 defaulting to 5, and a primary “Generate quiz” action. It MUST replace the Phase 0 placeholder home. It MUST NOT collect model keys, attempt tokens or a generation strategy.
- **FR-002**: Setup MUST validate with the public create-quiz contract (non-empty trimmed topic, `https` URL with a host, integer count 5–8). Invalid input MUST show field-associated English errors and MUST NOT call create-quiz.
- **FR-003**: Valid generate MUST call verified `POST /v1/quizzes`, wait through an accessible loading/generation state, then load the sanitized quiz with `GET /v1/quizzes/:quizId` and move the learner into the player. Create response MUST NOT be treated as if it contained questions or keys.
- **FR-004**: The player (`/quiz/{quizId}`) MUST present questions in stored order, one at a time, each with exactly the four public option labels, the public `single` or `multiple` type, previous/next navigation, and progress that states current index and total (a bar MAY accompany the text; it MUST NOT be the only progress cue).
- **FR-005**: Single-answer questions MUST use exclusive choice (radio semantics). Multiple-answer questions MUST use multi-select (checkbox semantics) and MUST say “Select all that apply” (or equivalent English). The player MUST require a legal selection on the current question before next, and a legal selection on every question before submit.
- **FR-006**: Entering a playable quiz MUST start an attempt via `POST /v1/quizzes/:quizId/attempts` unless a same-sitting token for that quiz already exists. The private token MUST be stored only in session-scoped browser storage, presented on submit/result, never written into the URL, and never shown as page copy.
- **FR-007**: Submit MUST call verified `POST /v1/attempts/:attemptId/submit` with the public submit-answers shape for **all** questions, authorized by the session token, then navigate to results. The browser MUST NOT calculate the official weighted score.
- **FR-008**: Results (`/quiz/{quizId}/results`) MUST display the public result’s 0–4 display score as the primary outcome, the display percentage as optional secondary text, per-question Correct/Incorrect feedback with selected and correct options (text plus icon; not color alone), and the original `sourceUrl` from the public quiz view as a source reference.
- **FR-009**: Pre-submit screens, HTML, client state and network bodies the player uses MUST NEVER include `isCorrect`, raw scores, weighted scores, answer keys, source excerpts, model ids, hidden prompts or API keys. Post-submit results MAY show `isCorrect` from the public result only.
- **FR-010**: Refresh of the player in the same sitting MUST resume the same attempt and restore selections when the session token and local selections are present. Refresh of results in the same sitting MUST reload the stored result with that token. Missing/invalid token on results MUST fail closed with English copy and **no** keys.
- **FR-011**: After a successful submit, the learner MUST NOT be able to change that attempt’s answers. Repeat submit in the same sitting MUST show the existing stored result (API idempotency). “Create another quiz” MUST return to setup for a new generation.
- **FR-012**: Generation, load, submit and result failures MUST map stable API codes (including Phase 3 source/generation codes and Phase 2 attempt codes) to English, non-secret messages with retry or return-to-setup as appropriate. Messages MUST NOT include tokens, hashes, keys, prompts or provider traces.
- **FR-013**: The web app MUST consume public contracts and the verified API only. It MUST NOT import server persistence, domain scoring implementations, environment secrets other than the already-required public API base URL, or answer-key logic. Authoritative grading remains on the server.
- **FR-014**: Backend changes in this cycle MUST be limited to **documented blockers** of this existing browser flow (for example allowing the web origin to call `/v1`). They MUST NOT add scoring policies, generation strategies, new product resources, Langfuse or production delivery.
- **FR-015**: UI MUST follow `.agents/skills/design-system/SKILL.md` and its art-direction and Tailwind references: semantic tokens (including light-green background, white surface, dark-forest primary), shared primitives, 44px minimum touch targets, visible focus ring, associated labels, keyboard access, wrapping at 320px, single-column player, and `prefers-reduced-motion`.
- **FR-016**: Shared primitives for button, input, form field, card, radio group, checkbox, progress, alert, badge and skeleton MUST live in the shared UI package when introduced, not as one-off unstyled page copies. Existing Phase 0 `PageShell`, `Card` and `Button` MUST be reused.
- **FR-017**: Automated UI evidence MUST use Jest and React Testing Library and MUST cover setup validation, single/multiple selection, progress text, loading and error states, submit success path to results, and absence of pre-submit correctness in the player. Tests MAY double the API; they MUST NOT require a live model key.
- **FR-018**: Phone-width (~320px) and desktop-width (≥1024px) acceptance of the full flow MUST be verified by a reviewer in a real browser before this phase is marked done. Horizontal overflow, clipped options, or sub-44px primary actions on those widths are defects.
- **FR-019**: This cycle MUST reuse Phases 0–3 as specified and MUST NOT mark Phase 5 two-source demonstration, Langfuse, CI/CD or production containers as in scope.

### Key Entities

- **Setup form**: Learner-facing topic, Markdown URL and question count used to create a quiz. Validated against the public create-quiz rules.
- **Generation sitting**: The in-progress create request and its loading or error state. Not a playable quiz until the API returns ready and the public quiz view loads.
- **Public quiz view**: Pre-submit questions, types, option labels and original source URL. No keys.
- **Player progress**: Current question index and total count for one attempt, plus locally held selections until submit.
- **Private attempt token**: Unguessable secret issued once at start-attempt; held in session-scoped storage; authorizes submit and result; never in the URL.
- **Attempt sitting**: One browser sitting’s pairing of quiz identity, attempt identity, token and selections.
- **Public result view**: Post-submit weighted score, display fields, per-question scores, selections and correctness.
- **Source reference**: The original Markdown URL the learner entered, shown after submit (and as context during play if useful) without implying correctness.
- **Per-question feedback**: Correct/Incorrect outcome plus selected vs correct option labels after submit.
- **Shared UI primitive**: Reusable labeled control (button, field, choice, progress, alert, skeleton) from the design-system package.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can, in one sitting, enter a topic and HTTPS Markdown URL, generate a quiz, answer all questions, submit, and see the persisted 0–4 weighted score with optional percentage, per-question feedback and source reference — without using a REST client.
- **SC-002**: 100% of documented invalid setup cases (empty topic, non-HTTPS/malformed URL, count outside 5–8) are blocked in the form with field-associated English messages and do not start generation.
- **SC-003**: 100% of documented player cases show progress as current-of-total, persist selections across previous/next, distinguish single vs multiple choice in both copy and control type, and refuse next/submit without a legal current selection.
- **SC-004**: 100% of documented pre-submit player and setup inspections show **zero** correctness flags, scores or answer keys in the UI and in the data those screens use. 100% of documented post-submit results show Correct/Incorrect with text, not color alone.
- **SC-005**: 100% of documented same-sitting refreshes of player and results keep the attempt token out of the address bar and still resume play or show the stored result. 100% of documented results visits without a token show no scores or keys.
- **SC-006**: 100% of documented generation and submit failure cases show an English recovery path and **zero** tokens, keys, prompts or provider traces.
- **SC-007**: A reviewer can complete the primary flow at about 320px width and at desktop width with no horizontal scroll, readable options, visible focus and primary actions at least 44px tall.
- **SC-008**: Automated UI checks for validation, selection, progress, errors and submit exist and pass without a live model key. Manual phone/desktop acceptance is recorded for the full flow.
- **SC-009**: A scope review of this phase’s delivery finds **zero** new scoring policies, **zero** new generation strategies, **zero** Langfuse instrumentation, **zero** production images or hosted CI pipelines, and confirms the official score still comes from the verified API. Backend diffs, if any, are limited to documented blockers of this browser flow.

## Assumptions

- The Constitution’s technology choices remain binding: TypeScript, Next.js App Router, React Hook Form, Zod, Tailwind CSS, shared shadcn/ui primitives, public contracts package, NestJS `/v1` API, Jest and React Testing Library. Those names appear here as phase boundaries and evidence gates, not as an invitation to add telemetry or delivery.
- Route shapes follow `roadmap.md` milestone M3: `/` setup, `/quiz/{id}` player, `/quiz/{id}/results` results. Exact file layout belongs to planning.
- Create remains **synchronous** as in Phase 3: the learner waits until the quiz is ready or the request fails. No polling API is added.
- Question count is shown on the form as a 5–8 control defaulting to 5. Strategy stays the server default `balanced` and is omitted from the UI.
- Session-scoped browser storage (cleared when the sitting ends) is the informed default for token and in-progress selections. Local durable storage across days is out of scope. Tokens in query strings are forbidden.
- Results compose the public quiz view (prompts, source URL) with the public result (scores and correctness). Missing prompts or source URL on the result payload are **not** treated as an API gap to fill with keys; the UI reuses the already-public quiz view.
- Per-question feedback is Correct/Incorrect plus selected vs correct labels. Free-text model explanations and source excerpts are not required this phase.
- Authoritative score is always the stored API result. The browser may format the provided display fields; it MUST NOT reimplement weights.
- CORS or equivalent browser access to `/v1` from the web origin is an allowed blocker fix if the verified API currently refuses the web app. No new quiz resources.
- Jest/RTL tests double the API for speed and isolation. Definition-of-done manual evidence uses the real API when the environment (model key and reachable README) allows; otherwise the environment blocker is recorded and the product path still MUST NOT fall back to fixtures.
- Phone/desktop acceptance is a reviewer pass in a real browser, not a Playwright requirement.
- Dark theme, remote fonts, extra component libraries and copying Encomenda.link artwork are not required.
- Multiple-answer scoring remains the Phase 1 provisional policy; this cycle does not reopen it.
- Concrete component filenames, storage keys and HTTP client wrappers belong to planning.

## Dependencies

- Existing Constitution, `roadmap.md`, `implementation-roadmap.md`, `AGENTS.md`, design-system skill and Spec Kit installation.
- Verified Phase 0 web/API shells, tokens and Jest/RTL harness.
- Verified Phase 1 public Zod contracts and scoring rules (consumed, not reimplemented in the browser).
- Verified Phase 2/3 `/v1` create, get quiz, start attempt, submit, result, error codes and attempt-token hashing.
- Running local API, web app and PostgreSQL for manual browser acceptance.
- For automated UI tests: no live model key required (API doubled).
- For live browser definition-of-done evidence: configured server-side model key and one reachable public README, as in Phase 3. Missing those is an environment blocker, not a reason to expand into Phase 5.
- No Phase 5–7 code. This phase MUST NOT wait on two-source demo kits, Langfuse or production pipelines.

## Deferred Context (not acceptance)

The following remain future cycles and MUST NOT be implemented or tested as Phase 4 done-when items:

- Phase 5: two-source demonstration, interview evidence kit, and full reliability package against two live READMEs (including claiming the assessment’s two-README item done).
- Phase 6: Langfuse, rate limits, concurrency limits and operational hardening.
- Phase 7: GitHub Actions, production images and interview walkthrough kit.
- Optional Playwright browser-driver suite (roadmap M4 later item).
- Markdown preview, grounded excerpt display, difficulty/strategy pickers and historical quiz lists (roadmap M8 / P2).
