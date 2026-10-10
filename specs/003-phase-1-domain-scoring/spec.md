# Feature Specification: Phase 1 Domain Scoring and Public Contracts

**Feature Branch**: `003-phase-1-domain-scoring`

**Created**: 2026-10-10

**Status**: Draft

**Roadmap phase**: Phase 1 — Domain, scoring rules and Jest unit tests (P0)

**Input**: User description: "Create a Phase 1-only specification for the pure quiz domain, deterministic scoring and public schema-validated contracts. Prerequisite: verified Phase 0 scaffolding; reuse that delivery. This cycle must be testable without a database or language model. Define quiz, question, choice and attempt invariants (5–8 questions, exactly four unique options, single and multiple types, valid selections). Single-answer scoring is 4 if correct and 0 otherwise. Preserve the roadmap’s provisional multi-answer policy: one point per correctly selected option, bounded to 0–4, with no invented penalties or normalization; record the ambiguity and keep the policy replaceable. Weight by zero-based quiz position using 1.1 raised to the question index; divide the weighted sum by the sum of weights; round only for display. Cover validated inputs for topic, HTTPS source URL, count and answers, plus public result contracts that keep answer keys private before submission. Define automated acceptance cases for correct and wrong answers, mixed single/multiple questions, invalid and duplicate selections, ordering, boundaries and hand-calculated weights. Keep domain and application pure. Exclude product persistence models and migrations, repositories, quiz HTTP endpoints, source fetching, AI generation and quiz UI."

## Phase Identity and Goal

This specification covers **Roadmap Phase 1 only**. The goal is that a reviewer can **explain and prove grading** using pure quiz rules, without a database and without a language model.

Success is a complete, independently testable scoring core plus public request and result shapes that hide answer keys until after answers are scored. This cycle does **not** persist quizzes, expose quiz HTTP resources, fetch remote Markdown, generate questions, or build a quiz player.

## Clarifications

### Session 2026-10-10

- Q: Should the hand-calculated three-score example (4, 2, 0 → 6.2 ÷ 3.31) test weighting by itself, while a playable quiz still has to contain 5–8 questions? → A: Playable quizzes stay 5–8 questions. The 4, 2, 0 sample checks the weighting formula on a list of scores, not a full quiz.
- Q: If a learner leaves some questions unanswered, should scoring reject the whole attempt? → A: Reject the attempt. Do not produce a weighted score until every question has a legal selection.
- Q: After a quiz is scored, should the public result include which options were correct, or only the numeric scores? → A: After scoring, the public result includes per-question scores and which options were correct. The pre-submit quiz view still has no keys.
- Q: If a scored attempt is submitted again with different answers, should the original scores come back, or should the new payload be rejected? → A: Any second submit returns the original scores. The new answers are ignored and not graded.

## Prerequisites

This cycle MUST reuse the Phase 0 workspace. It MUST NOT re-scaffold the monorepo, replace shared package shells, or reinitialize Spec Kit or the Constitution.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal purity, Zod contracts, testable scoring, Jest discipline and roadmap fidelity are binding. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of scoring contract, multi-answer ambiguity and this phase’s checklist. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy. |
| Phase 0 scaffolding (`specs/002-phase-0-scaffold/`) | Present in the workspace | Shared `domain`, `application` and `contracts` shells, Jest harness, hexagonal import gates, quality commands and local runtime exist. Scoring and public quiz contracts are still placeholders. |
| Formal verification record in `implementation-roadmap.md` | Incomplete (status lag) | That file still lists **Verified deliveries: None recorded yet** and selected phase Phase 0. The Phase 0 task list is fully checked and the scaffold is on `main`. This cycle reuses those shells rather than repeating scaffolding. Updating that status file is not Phase 1 product work. |
| Phases 2–7 | Not started | Persistence, HTTP quiz flow, fetching, generation and UI are out of scope. |

**Blockers:** None that expand this phase’s scope. Missing formal status wording in `implementation-roadmap.md` is a documentation lag, not a reason to rebuild Phase 0. If Phase 0 quality commands later fail when this spec is implemented, that is a **prerequisite defect to fix in the scaffold** and MUST NOT pull persistence, HTTP, fetching, generation or UI into Phase 1.

**Existing whole-product placeholder:** `specs/001-ai-quiz-generator/` remains empty leftover context. This cycle owns `specs/003-phase-1-domain-scoring/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

A reviewer MUST be able to:

- Inspect quiz, question, choice and attempt rules: 5–8 questions; each question has exactly four unique options; questions are single-answer or multiple-answer; selections must be valid for the question type and must refer to that question’s options. A quiz score is produced only when **every** question has a legal selection.
- Score a single-answer question as **4** when the one selected option is the correct option, and **0** otherwise (when the selection itself is valid).
- Score a multiple-answer question under the **provisional** policy in `roadmap.md`: **one point per correctly selected option**, result **bounded to 0–4**; incorrect selections add no points and incur **no invented penalty**; do not rescale a partial set to 4.
- Record that this multi-answer reading is underspecified by the assessment, keep the policy in one isolated place, and leave it replaceable without rewriting the rest of the product.
- Compute the quiz score as a **weighted average** of per-question scores. For zero-based position `i`, weight is `1.1` raised to `i`. Weighted score is the sum of (question score × weight) divided by the sum of weights. Question **order in the quiz** defines weights, not the order answers were given.
- Keep calculated scores unrounded; round **only** for display (two decimal places). An optional percentage for display is `(weightedScore / 4) × 100`.
- Validate public inputs for **topic**, **HTTPS source URL**, **question count (5–8)** and **submitted answers**. The public quiz view **omits answer keys**. After scoring, the public result **includes** per-question scores and which options were correct.
- Prove the above with automated unit checks covering correct and wrong answers, mixed single and multiple questions, invalid and duplicate selections, ordering, index boundaries and at least one **hand-calculated** weighted-score sample. That sample is a list of per-question scores for the weighting formula; it is **not** a playable 3-question quiz.
- Keep the scoring core and any in-memory “grade these answers” operation free of database, HTTP, file fetch and model calls.

Constitution-bound names for this phase (not open design choices): TypeScript strict domain and application packages, Zod public contracts, Jest unit tests, and the scoring sequence `1.1 ** index` from the assessment/`roadmap.md`.

## Explicit Exclusions

This phase MUST NOT include:

- Prisma product models or their migrations (`SourceDocument`, `Quiz`, `Question`, `QuestionOption`, `QuizAttempt`, answers, selections).
- Repository adapters or real-database integration tests.
- Quiz REST endpoints (`POST /v1/quizzes` and related attempt/result routes). `/health` and `/ready` remain Phase 0 surfaces only.
- Remote Markdown fetching, GitHub URL normalization, SSRF controls, or treating a live URL as content to retrieve.
- AI / model generation, provider SDKs, or structured quiz output from a model.
- Quiz setup forms, player, progress, submission screens or results UI.
- Langfuse or other generation telemetry.
- Production Dockerfiles, GitHub Actions, authentication, billing, queues or dashboards.
- Re-scaffolding the monorepo or overwriting the Constitution.

HTTPS URL **shape** validation is in scope. Fetching that URL is not. Persistence of an attempt is not; an in-memory attempt that can be scored and frozen is.

Later-phase requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **reviewer** (developer or interviewer) who must explain and prove grading. A **learner** is the conceptual quiz-taker whose answers are scored; no browser or HTTP client is required in this phase.

### User Story 1 - Prove single-answer scoring (Priority: P1)

A reviewer scores single-answer questions. A valid selection of the one correct option yields 4 points. A valid selection of any other option yields 0. The score does not depend on a database, a model, or the order in which the learner clicked.

**Why this priority**: The assessment’s single-answer rule is non-negotiable and is the simplest proof that grading is deterministic.

**Independent Test**: Grade fixture single-answer questions as correct and as incorrect and observe 4 and 0 without starting a database or calling a model.

**Acceptance Scenarios**:

1. **Given** a valid single-answer question with exactly one correct option, **When** the learner selects that option only, **Then** the question score is 4.
2. **Given** the same question, **When** the learner selects a different valid option, **Then** the question score is 0.
3. **Given** a valid single-answer question, **When** scoring runs, **Then** it does not consult a database or a language model.

---

### User Story 2 - Prove provisional multiple-answer scoring (Priority: P1)

A reviewer scores multiple-answer questions using the documented provisional policy: one point for each correctly selected option, never below 0 or above 4, no penalty for extra wrong options, and no rescaling of a partial correct set to a full 4. The policy is written down as provisional and lives in one replaceable place.

**Why this priority**: The assessment is ambiguous here; the product must still grade consistently and be honest about the assumption.

**Independent Test**: Grade fixtures with zero, partial and full correct selections, including extra wrong selections, and confirm the documented 0–4 point counts.

**Acceptance Scenarios**:

1. **Given** a multiple-answer question whose correct options are a known set, **When** the learner selects `k` of those correct options and no others, **Then** the question score is `k`, bounded to 0–4.
2. **Given** the same question, **When** the learner also selects one or more incorrect options, **Then** those incorrect options add 0 and do **not** reduce the points already earned from correct selections.
3. **Given** a question with fewer than four correct options, **When** the learner selects every correct option, **Then** the score equals that correct-option count and is **not** normalized to 4.
4. **Given** the documented scoring notes, **When** a reviewer reads them, **Then** they state that this multi-answer reading is provisional, that the assessment did not specify penalties or normalization, and that the policy can be replaced without changing quiz shape or weighting.

---

### User Story 3 - Prove position-weighted quiz score (Priority: P1)

A reviewer combines per-question scores into one quiz score. Earlier questions weigh less than later ones using geometric weights 1.0, 1.1, 1.21, … in **quiz order**. The result is a weighted average on the 0–4 scale. Display may show two-decimal values and an optional percentage; calculation uses unrounded values. The documented three-score arithmetic checks the weighting formula in isolation; a playable quiz still has 5–8 questions.

**Why this priority**: Weighted averaging is the assessment’s final score; a wrong index or premature rounding would silently fail the interview.

**Independent Test**: Run the hand-calculated three-score weighting sample (not a playable quiz) and the all-correct / all-wrong / 5–8 question boundary cases below and match the documented numbers.

**Acceptance Scenarios**:

1. **Given** an ordered list of three per-question scores 4, 2 and 0 at positions 0, 1 and 2 (weighting fixture only, not a playable quiz), **When** the weighted score is computed, **Then** the weights are 1.0, 1.1 and 1.21, the weighted sum is 6.2, the weight sum is 3.31, and the unrounded weighted score is **6.2 ÷ 3.31**.
2. **Given** that same result, **When** values are shown for display, **Then** the weighted score rounds to **1.87** (two decimals) and the optional percentage `(weightedScore / 4) × 100` rounds to **46.83**, while the stored/calculated value remains unrounded.
3. **Given** every question scored 4, **When** the weighted score is computed, **Then** it equals 4 regardless of question count (within 5–8).
4. **Given** every question scored 0, **When** the weighted score is computed, **Then** it equals 0.
5. **Given** eight questions (positions 0 through 7), **When** weights are assigned, **Then** the first weight is 1.0 and the last weight is `1.1` raised to 7, and swapping two questions’ **positions** changes the final score even if their raw scores stay the same.
6. **Given** answers submitted in a different order than quiz position, **When** the weighted score is computed, **Then** weights still follow quiz position, not submission order.

---

### User Story 4 - Reject invalid quizzes and illegal selections (Priority: P1)

A reviewer cannot obtain a score from a quiz that breaks the invariants, or from an answer set that is illegal (wrong type, unknown option, duplicates). Illegal input fails closed with a clear, stable reason. A merely wrong but legal single-answer pick still scores 0 rather than being rejected.

**Why this priority**: Grading is only trustworthy if illegal states never produce a number that looks like a real score.

**Independent Test**: Feed the documented invalid fixtures and confirm rejection; feed a wrong-but-legal single selection and confirm score 0.

**Acceptance Scenarios**:

1. **Given** a quiz with fewer than 5 or more than 8 questions, **When** it is validated, **Then** it is rejected.
2. **Given** a question that does not have exactly four options, or whose options are not unique, **When** it is validated, **Then** it is rejected.
3. **Given** a single-answer question, **When** the learner selects no option or more than one option, **Then** scoring is rejected as invalid (not silently scored as 0).
4. **Given** any question, **When** the answer repeats an option or names an option that does not belong to that question, **Then** scoring is rejected.
5. **Given** a valid single-answer question, **When** the learner selects exactly one belonging option that is incorrect, **Then** the question is accepted and scores 0.
6. **Given** a mixed quiz of single-answer and multiple-answer questions that all satisfy the invariants, **When** each question is answered legally, **Then** each question is scored with its own rule and the quiz weighted score is produced.
7. **Given** a valid 5–8 question quiz, **When** any question has no legal selection, **Then** the attempt is rejected and no weighted score is produced (missing questions are not treated as 0 and are not dropped from the average).

---

### User Story 5 - Public contracts hide keys and validate setup inputs (Priority: P1)

A later screen or HTTP client will need shared shapes for creating a quiz and showing it to a learner. In this phase those shapes are defined and checked without I/O: topic, HTTPS source URL, question count 5–8, and submitted answers are validated. A public quiz view never includes which options are correct. After answers are scored, the public result includes per-question scores, the weighted score, optional display percentage, and which options were correct.

**Why this priority**: Answer-key leakage before submission is an assessment failure even if scoring math is correct.

**Independent Test**: Parse valid and invalid create/submit payloads; inspect a public quiz view for absence of correctness flags; inspect a post-score result for scores without requiring HTTP.

**Acceptance Scenarios**:

1. **Given** a non-empty topic, an `https` source URL, and a question count from 5 through 8, **When** the create-quiz input is validated, **Then** it is accepted.
2. **Given** a missing or blank topic, a non-`https` URL (including `http`), or a count outside 5–8, **When** the create-quiz input is validated, **Then** it is rejected.
3. **Given** a playable quiz, **When** the public quiz view is produced, **Then** it includes prompts, option labels and question types, and it does **not** include correctness flags or other answer-key fields.
4. **Given** a scored attempt, **When** the public result is produced, **Then** it includes per-question scores, the unrounded weighted score, and which options were correct for each question; it MAY include a two-decimal display score and percentage; and it MUST NOT be used as the public quiz view before scoring.
5. **Given** submit-answer input with unknown question ids, empty required selections, duplicate option ids, or fewer answers than quiz questions, **When** it is validated, **Then** it is rejected with a stable reason.

---

### User Story 6 - Freeze a scored attempt (Priority: P2)

A reviewer scores a valid in-memory attempt once. Any later submit returns the original per-question scores, weighted score and post-submit correctness. The new payload is ignored, even when the answers differ. Re-scoring is not performed.

**Why this priority**: Repeat submission must be idempotent in the product; proving the domain rule now avoids later double-grading. Persistence of that freeze belongs to Phase 2.

**Independent Test**: Score a fixture attempt, submit once with the same answers and once with different answers, and observe the original result unchanged both times.

**Acceptance Scenarios**:

1. **Given** an in-memory attempt that has already been scored, **When** the same answers are submitted again, **Then** the original per-question scores, weighted score and correctness explanation are returned and are not recalculated.
2. **Given** an in-memory attempt that has already been scored, **When** different answers are submitted, **Then** those answers are ignored, the original result is returned, and no new scores are produced.
3. **Given** an attempt that has not yet been scored, **When** it is scored once, **Then** it becomes frozen for further submit attempts.

---

### Edge Cases

- **Question count boundaries**: 5 and 8 are valid; 4 and 9 are rejected.
- **Position boundaries**: index 0 weight is 1.0; in an 8-question quiz, index 7 uses `1.1 ** 7`.
- **Four correct options on a multiple-answer question**: selecting all four scores 4; this is the only way this policy reaches 4 on a multiple-answer question.
- **One correct option on a multiple-answer question**: selecting that one option scores 1, not 4 (no normalization).
- **All options selected on multiple-answer**: score equals the number of correct options among the four (0–4); extra wrong marks do not subtract.
- **Single-answer with several marked-correct options in the quiz definition**: the quiz is invalid (single-answer requires exactly one correct option).
- **Multiple-answer with zero correct options**: the quiz is invalid.
- **Duplicate option labels or duplicate option identities on one question**: rejected.
- **Non-contiguous or colliding question positions**: rejected; positions MUST be the unique zero-based quiz order.
- **Display rounding of a .xx5 remainder**: use ordinary half-up two-decimal display rounding; this MUST NOT feed back into the unrounded total.
- **HTTPS URL with extra path/query**: accepted as a URL **shape** if the scheme is `https`; reachability, redirects and SSRF are out of scope.
- **Optional question count omitted**: default **5**.
- **Topic with only whitespace**: rejected as empty.
- **Scoring with no questions**: cannot occur; quizzes with 0 questions fail the 5–8 rule before scoring.
- **Three-score weighting fixture**: the 4, 2, 0 → 6.2 ÷ 3.31 check is valid for the weighting formula on a score list. A playable quiz with only three questions is still rejected.
- **Incomplete attempt**: omitting even one question’s legal selection rejects the whole attempt. Missing questions MUST NOT score 0 and MUST NOT be omitted from the weight set.
- **Extra answers**: selections for unknown question identities are rejected with the rest of the illegal-selection rules.
- **Database or model unavailable**: scoring and contract checks still succeed; this phase MUST NOT require them.
- **Result before scoring**: a public result with correctness MUST NOT be produced for an unscored attempt. The pre-submit quiz view remains key-free.
- **Second submit with different answers**: after freeze, the original result is returned; the new selections are not validated as a fresh attempt and are not graded.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST represent a quiz as an ordered list of 5–8 questions, each with a stable identity, a zero-based position, a prompt, a type of single-answer or multiple-answer, and exactly four unique options.
- **FR-002**: Each option MUST have a stable identity, a display label, a position, and a server-only correctness flag. Option identities and labels MUST be unique within a question.
- **FR-003**: A single-answer question MUST have exactly one correct option. A multiple-answer question MUST have at least one correct option and MAY have up to four.
- **FR-004**: Question positions MUST be unique, contiguous and zero-based in quiz order. Weights MUST use that order, not answer-submission order.
- **FR-005**: A legal single-answer selection MUST be exactly one option that belongs to that question. A legal multiple-answer selection MUST be one or more unique options that all belong to that question.
- **FR-006**: Illegal selections (wrong arity for the type, duplicates, unknown ids, options from another question) MUST be rejected and MUST NOT produce a question score. An attempt that lacks a legal selection for every quiz question MUST be rejected as incomplete and MUST NOT produce a weighted score. Unanswered questions MUST NOT be treated as 0 and MUST NOT be dropped so that remaining weights are renormalized.
- **FR-007**: Single-answer scoring MUST award 4 when the selected option is the correct option and 0 when a legal selection is not the correct option.
- **FR-008**: Multiple-answer scoring MUST award one point per correctly selected option, clamp the result to the inclusive range 0–4, add nothing for incorrect selections, subtract nothing for incorrect selections, and MUST NOT rescale a partial correct set to 4.
- **FR-009**: The multiple-answer rule in FR-008 MUST be documented as the provisional reading from `roadmap.md`, isolated so it can be replaced, and MUST NOT invent a different rubric (penalties, partial-credit formulas, or forced full marks).
- **FR-010**: The quiz weighted score MUST equal `sum(questionScore[i] × (1.1 ** i)) / sum(1.1 ** i)` for zero-based position `i`. This formula MUST be testable on an ordered list of per-question scores independently of playable-quiz size. The documented 4, 2, 0 → 6.2 ÷ 3.31 sample is that isolated check and MUST NOT be treated as a 3-question playable quiz.
- **FR-011**: Calculated and retained scores MUST remain unrounded. Rounding to two decimal places MUST apply only to display fields. An optional display percentage MUST equal `(weightedScore / 4) × 100` before display rounding.
- **FR-012**: Create-quiz public input MUST require a non-empty topic, an `https` source URL, and a question count of 5–8 (default 5 when omitted). Invalid values MUST fail closed.
- **FR-013**: Submit-answers public input MUST list, for every quiz question, the question identity and the selected option identities, and MUST reject duplicates, unknown identities, and incomplete sets (missing questions) at the contract boundary.
- **FR-014**: The public quiz view MUST include enough to present questions and options and MUST NEVER include correctness flags or other answer keys before submission.
- **FR-015**: The public result view, produced only after scoring, MUST include per-question scores, the weighted score on the 0–4 scale, and which options were correct for each question. It MAY include two-decimal display values and a percentage. It MUST NOT be emitted for an unscored attempt.
- **FR-016**: Domain scoring and any in-memory grade-attempt operation MUST run without a database, HTTP quiz resource, source fetch or language model.
- **FR-017**: Domain and application packages MUST remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client dependencies.
- **FR-018**: Public request, quiz-view and result shapes MUST be schema-validated with Zod in the contracts package. Answer keys MUST stay out of create/submit request schemas and the public quiz view. The public result schema MUST include post-submit correctness and MUST NOT be used as the pre-submit quiz view.
- **FR-019**: Automated Jest unit checks MUST cover correct and incorrect single-answer items, multiple-answer boundaries (0 through 4, extra wrong selections, no normalization), mixed single/multiple quizzes, invalid and duplicate selections, incomplete attempts (missing questions), ordering versus position, index 0 and 7, all-correct, all-wrong, duplicate submit on a frozen attempt, public quiz view without keys, public result with post-submit correctness, and the isolated three-score weighting sample in User Story 3. All-correct, all-wrong and index 0 / 7 cases MUST use playable 5–8 question quizzes.
- **FR-020**: An attempt that has already been scored MUST return the existing result on any later submit and MUST NOT re-score, including when the new answers differ. The new payload is ignored. Durable persistence of that freeze is Phase 2.
- **FR-021**: This cycle MUST reuse Phase 0 `domain`, `application` and `contracts` shells and MUST NOT add product persistence models, quiz HTTP endpoints, fetch/generation adapters or quiz UI.

### Key Entities

- **Quiz**: A playable set of 5–8 ordered questions about a topic, with a source URL recorded as metadata only in this phase (not fetched).
- **Question**: One prompt with type single-answer or multiple-answer, a zero-based position, and exactly four options.
- **Option (choice)**: One selectable answer text with a hidden correctness flag used only by scoring.
- **Attempt**: One in-memory sitting of a quiz; after scoring it is frozen. Later submits return that result and do not grade a new payload.
- **Answer selection**: The option identities chosen for one question on an attempt.
- **Question score**: An integer 0–4 produced by the type-specific rule.
- **Weighted quiz score**: The unrounded weighted average of question scores on the 0–4 scale.
- **Scoring policy**: Isolated multiple-answer (and single-answer) rules; the multiple-answer policy is provisional and replaceable.
- **Create-quiz request**: Public input: topic, HTTPS source URL, optional count 5–8.
- **Submit-answers request**: Public input: a legal selection for **every** quiz question (question identity plus selected option identities).
- **Public quiz view**: Learner-facing quiz shape with no answer keys.
- **Public result view**: Post-score shape with per-question scores, weighted score, and which options were correct; optional display rounding; not a substitute for the pre-submit quiz view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the documented scoring fixtures match the documented results without using a database or a model. The isolated three-score weighting sample (4, 2, 0 → unrounded **6.2 ÷ 3.31**, display **1.87** / **46.83%**) is required. All-correct = 4, all-wrong = 0, and index 0 / index 7 weighting MUST be shown on playable 5–8 question quizzes, not by shrinking a quiz to three questions.
- **SC-002**: 100% of documented invalid quizzes, illegal selections and incomplete attempts (any question without a legal selection) are rejected and produce no masquerading numeric score; 100% of documented wrong-but-legal single-answer picks score 0.
- **SC-003**: A reviewer can complete the grading demonstration (run the unit checks and explain single, multiple and weighted rules) in one sitting without starting a database or configuring a model key.
- **SC-004**: A reviewer inspecting the public quiz view finds **zero** correctness flags or answer-key fields in 100% of pre-submit cases. After scoring, 100% of documented public results include which options were correct together with the numeric scores.
- **SC-005**: Mixed single-answer and multiple-answer quizzes in the fixture set produce a weighted score that equals the documented combination of per-question rules and position weights, in 100% of those fixtures.
- **SC-006**: Repeat submit of an already scored in-memory attempt returns the original result in 100% of documented cases, including when the second payload uses different answers.
- **SC-007**: Invalid create-quiz and submit-answers inputs (blank topic, non-HTTPS URL, count outside 5–8, duplicate or unknown selections, missing questions) fail closed in 100% of documented invalid cases.
- **SC-008**: A reviewer can point to a single documented, replaceable multiple-answer policy statement and confirm it matches FR-008 (no penalties, no normalization) without searching adapters, UI or persistence.
- **SC-009**: A scope review of this phase’s delivery finds **zero** product persistence models/migrations, quiz HTTP resources, source fetching, model generation or quiz UI flows.

## Assumptions

- The Constitution’s technology choices remain binding: TypeScript, Zod for public inputs and public views, Jest for unit checks, hexagonal `domain` / `application` / `contracts` packages. Those names appear here as phase boundaries, not as an invitation to add NestJS, Prisma or Next.js behavior.
- Phase 0 package shells, Jest harness and import gates are the base to extend. This phase fills scoring and public contracts into those shells.
- The multi-answer policy is the **provisional** `roadmap.md` reading: one point per correctly selected option, clamped to 0–4, no deductions, no normalization. The assessment left penalties and “can a 1–3 correct set reach 4?” unspecified. This spec records that ambiguity and does not invent a different rubric.
- Display rounding is two decimal places, half-up. Optional percentage is for display beside the 0–4 score, not a replacement.
- The 4, 2, 0 → 6.2 ÷ 3.31 example validates the weighting formula on a score list. It does not relax FR-001: a playable quiz still has 5–8 questions.
- Omitted question count defaults to 5. Topic MUST be non-empty after trimming. Source URL scheme MUST be `https`; no fetch occurs.
- Single-answer questions have exactly one correct option. Multiple-answer questions have one to four correct options.
- Legal multiple-answer selections contain at least one option. Empty multiple-answer submissions are invalid, not a score of 0.
- A weighted quiz score requires a legal selection for every question. Incomplete attempts are rejected; gaps are not scored as 0 and not omitted from the average.
- Attempt freeze (idempotent re-submit) is an in-memory domain rule: any later submit returns the original result and ignores the new payload. PostgreSQL uniqueness and HTTP idempotency belong to Phase 2.
- Repository ports, unit-of-work, REST adapters and fixture-backed create-quiz use cases belong to Phase 2 even though M1 in `roadmap.md` also mentions persistence. This phase follows `implementation-roadmap.md` Phase 1 exclusions.
- Public result MUST describe which options were correct **after** scoring. That is not permission to put keys on the public quiz view.
- Concrete file paths, package versions and function names belong to planning. This specification names observable scoring behavior and contract guarantees only.
- `specs/001-ai-quiz-generator/` remains unused leftover context.

## Dependencies

- Existing Constitution, `roadmap.md`, `implementation-roadmap.md`, `AGENTS.md` and Spec Kit installation.
- Phase 0 delivery to reuse: `packages/domain`, `packages/application`, `packages/contracts`, shared Jest/TypeScript config, hexagonal import gates. Product scoring is not present there yet.
- No Phase 2–7 code. This phase MUST NOT wait on a database or a model to be testable.

## Deferred Context (not acceptance)

The following remain future cycles and MUST NOT be implemented or tested as Phase 1 done-when items:

- Phase 2: product schema, repositories, quiz REST flow, durable attempt tokens, transactional finalization.
- Phase 3: Markdown ingestion and model generation.
- Phase 4: complete quiz web experience.
- Phase 5: two-source demonstration and reliability evidence.
- Phase 6: Langfuse and operational hardening.
- Phase 7: GitHub Actions, production images and interview walkthrough kit.
