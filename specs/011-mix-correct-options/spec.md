# Feature Specification: Mix Correct Option Order

**Feature Branch**: `011-mix-correct-options`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "deterministically mix the correct option from the quiz. currently the ai return always the first option(s) as the correct ones. so if the user selected always the firsts they get full score"

## Goal

When a learner takes a quiz, they MUST NOT be able to earn a full score by always choosing the first displayed option (or the first several options on a multi-select question). Correct answers today sit in the leading display slots because generated content lists them first. The product MUST mix each question’s four options into a stable display order so correctness cannot be inferred from position.

This cycle does not change scoring math, question count, option count, or pre-submit answer-key privacy. Success is a playable quiz where selecting by slot position fails, selecting the actually correct options still earns the documented score, and the same quiz always shows the same mixed order.

## In-Scope Behavior

A learner MUST:

- See four options per question whose display order does **not** systematically put every correct answer first.
- Earn a full question score only by selecting the options that are actually correct, regardless of where those options appear on screen.
- See the same option order every time they open, retry viewing, or review that quiz (create-time mix is frozen for the stored quiz).

The product MUST:

- Mix option display order for every newly created quiz, including when generated content lists all correct options first.
- Keep each option’s wording paired with whether it is correct; mixing changes order only, not the answer key.
- Apply the mix to both single-answer and multiple-answer questions.
- Persist and present the mixed order as the quiz’s option positions (contiguous first-through-fourth slots).
- Leave scoring, attempt start/submit, and results feedback otherwise unchanged: after submit, the result still shows which displayed options were correct.

## Explicit Exclusions

This cycle MUST NOT:

- Change single-answer or multiple-answer scoring, weights, or the 5–8 question / four-option shape.
- Shuffle question order (weights stay tied to quiz question order).
- Reshuffle options on each page load, each attempt, or each results view.
- Expose which options are correct before the learner submits.
- Ask learners to pick answers by slot number in a new UI; the player still shows labels.
- Rewrite source fetching, generation grounding, or insufficient-source rejection from the prior cycle.
- Add authentication, new screens, or new quiz types.
- Retroactively rewrite option order on quizzes that already exist in storage (only newly created quizzes MUST be mixed).

## User Scenarios & Testing *(mandatory)*

The primary actor is a **learner** answering a newly created quiz. A **quiz creator** still generates from topic + Markdown URL. A **reviewer** confirms that an “always pick the first slot(s)” strategy does not produce a perfect score, and that choosing the real answers still does.

### User Story 1 - Always-first no longer yields a perfect score (Priority: P1)

A learner opens a newly created quiz. On every single-answer question they select only the first displayed option. On every multiple-answer question they select only the first displayed options (as many leading slots as they would need if the key were still “all correct answers come first”). They submit. They do **not** receive a perfect quiz score.

**Why this priority**: This is the defect. Position is currently a cheat code. Closing it is the whole point of the cycle.

**Independent Test**: Create a quiz from a documented generation result (or equivalent fixture) where every question’s correct options originally occupy the leading slots. Mix, present, and submit the always-first pattern. Confirm the stored weighted score is not a perfect 4.00, except on any question where every option is correct (mixing cannot change that question’s score).

**Acceptance Scenarios**:

1. **Given** a newly created quiz whose generated content listed every correct option first, **When** a learner selects only the first displayed option on every single-answer question and only the leading slots on every multiple-answer question (the same count of leading slots as there are correct options), **Then** the quiz score is not a perfect 4.00.
2. **Given** that same quiz, **When** a reviewer inspects display positions of correct options across questions, **Then** correct options are not confined to the first slot (or the first N slots on multi-select) on every question.
3. **Given** a quiz that includes multiple-answer questions with two or three correct options that originally occupied the leading slots, **When** the quiz is presented, **Then** those questions as a group do not all still show their correct options as an unbroken leading block.

---

### User Story 2 - Real answers still score correctly after mixing (Priority: P1)

A learner selects the options that are actually correct, now shown in mixed positions. They receive the same per-question scores the product already documents: 4 or 0 on single-answer; one point per correctly selected option on multiple-answer, bounded 0–4. Mixing MUST NOT change what is correct—only where it appears.

**Why this priority**: Mixing is worthless if it breaks grading or silently swaps which labels are marked correct.

**Independent Test**: For a documented four-option set with a known key, mix order, submit the options that were correct before the mix (by their wording / identity, not by original slot), and confirm the per-question score matches the existing scoring rules.

**Acceptance Scenarios**:

1. **Given** a single-answer question whose correct label was originally first, **When** that label is displayed later and the learner selects it, **Then** the question scores 4.
2. **Given** that same question, **When** the learner selects a different displayed option, **Then** the question scores 0.
3. **Given** a multiple-answer question, **When** the learner selects exactly the options that are correct (now in mixed slots) and none of the distractors, **Then** the question score matches the existing multiple-answer rule for that key.
4. **Given** mixed options, **When** a reviewer compares labels to the answer key, **Then** each label’s correctness is unchanged from the generated key; only display order changed.

---

### User Story 3 - The same quiz always shows the same mixed order (Priority: P1)

A learner opens a quiz, leaves, refreshes, or comes back later. A second attempt on the same quiz (if allowed by existing rules) still sees the same four options in the same order. Results after submit list options in that same order, then reveal which were correct. The mix is decided once when the quiz is created and then stays put.

**Why this priority**: “Deterministic” means the quiz is a stable artifact. Re-shuffling on every view would confuse review, break stored selections, and make scoring disputes impossible to audit.

**Independent Test**: Create one quiz; fetch the public question view twice; start (or inspect) an attempt; after submit, open results. Confirm option labels and slot order are identical every time, and that correctness flags appear only after submit.

**Acceptance Scenarios**:

1. **Given** a stored quiz, **When** the learner opens the player more than once, **Then** each question shows the same four labels in the same order.
2. **Given** that quiz, **When** results are shown after submit, **Then** options appear in that same order, with correctness revealed as they already do today.
3. **Given** two different newly created quizzes, **When** a reviewer compares them, **Then** each quiz has its own frozen order; one quiz’s mix MUST NOT change the other’s.

---

### User Story 4 - Creators still get a normal playable quiz (Priority: P2)

A creator submits a valid topic, Markdown URL, and count. They still receive a ready quiz of 5–8 questions with four unique options each. Mixing is invisible as a separate step: there is no new setup control and no extra error for “could not mix.” If creation would already fail (bad source, invalid generation), mixing does not invent a quiz.

**Why this priority**: The mix is a quality fix on a successful create, not a new product flow.

**Independent Test**: Create from a documented rich source that already succeeds; confirm a ready quiz, four options per question, unique labels, mixed positions, and unchanged setup/player copy aside from option order.

**Acceptance Scenarios**:

1. **Given** a source that already produces a ready quiz, **When** the creator generates, **Then** they still get a playable quiz of the requested count with four unique options per question.
2. **Given** that create, **When** the learner plays, **Then** there is no new instruction or control about shuffling; options simply appear in mixed order.
3. **Given** a create that would already be rejected, **When** it fails, **Then** mixing does not store a playable quiz.

---

### Edge Cases

- **Generated content already mixed**: still apply the product mix. Do not skip mixing because some questions already have a non-first correct option. The always-first exploit MUST still fail for the quiz as a whole.
- **Every option correct on a multiple-answer question**: mixing cannot change that question’s score; the always-first rule is judged on the **quiz**, not on that one question. Such questions MAY still be reordered for consistency.
- **Single-answer whose correct option is already last**: mixing MAY move it; it MUST remain exactly one correct option.
- **Two identical quizzes created separately**: each create MAY mix independently; stability is per stored quiz, not per source URL.
- **Partial always-first**: a learner who picks first on some questions and real answers on others is scored by existing rules against the mixed key.
- **Invalid or duplicate selections**: existing rejection rules still apply; mixing does not relax them.
- **Refresh during an in-progress attempt**: option order stays the same as when the quiz was created.
- **Pre-submit views**: still MUST NOT include correctness flags. Mixed order MUST NOT leak the key by styling or labeling the correct row differently from the others.
- **Existing quizzes already in storage**: left as stored; this cycle does not require rewriting their option positions.
- **Option labels stay unique**: mixing MUST NOT duplicate, drop, or rewrite labels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For every newly created playable quiz, the product MUST mix the display order of the four options on each question so that correctness is not systematically tied to leading slots.
- **FR-002**: Mixing MUST keep each option’s label paired with its correctness. The set of correct labels for a question MUST be identical before and after the mix.
- **FR-003**: Mixing MUST be applied even when generated content places every correct option in the first slot (single-answer) or in the first N slots (multiple-answer, N = number of correct options). The product MUST NOT depend on the generator to vary order.
- **FR-004**: A documented “always-first” sitting on a newly created quiz MUST NOT produce a perfect 4.00 weighted score. Always-first means: the first displayed option on every single-answer question, and the first N displayed options on every multiple-answer question, where N is that question’s number of correct options. Questions where all four options are correct are exempt from defeating always-first **for that question only**.
- **FR-005**: Across the questions of a newly created quiz, correct options MUST occupy more than one distinct display slot. It is not acceptable for every question to keep its correct option(s) only in the leading slot(s).
- **FR-006**: For multiple-answer questions with two or three correct options, the mix MUST NOT leave those correct options as an unbroken leading block in every such question of the quiz.
- **FR-007**: Option order for a stored quiz MUST be decided once at creation and MUST be the order used for play, repeat views, and post-submit results. The product MUST NOT mix again on load, attempt start, or results.
- **FR-008**: Selecting the actually correct options (by identity/label) after mixing MUST produce the same per-question scores as the existing scoring rules. Selecting incorrect options MUST NOT be rewarded because of their new slots.
- **FR-009**: Mixed options MUST remain exactly four, with unique labels, unique identities, and contiguous display slots from first to fourth.
- **FR-010**: Question order MUST NOT be mixed. Weighted scoring still uses existing quiz question order.
- **FR-011**: Pre-submit public quiz views MUST still omit correctness. Mixing MUST NOT reveal the key through order-only cues that are equivalent to labeling the answer (for example, a predictable “correct is always second”).
- **FR-012**: Create-quiz success and failure paths other than option order stay as they are: a valid source still yields a ready quiz; rejected creates still store nothing playable.
- **FR-013**: Quizzes that already exist in storage are out of scope for rewriting. Automated tests MUST cover newly created quizzes, including a fixture whose generated key is entirely leading-slot correct **before** the mix.
- **FR-014**: Automated tests MUST fail if (a) always-first still yields a perfect score on that fixture, (b) mixing changes which labels are correct, (c) scoring of the true key regresses, or (d) two reads of the same quiz show different option order.

### Key Entities

- **Option**: One of four answer choices on a question. Has wording (label), a stable identity, a display slot (first through fourth), and a server-only correctness flag.
- **Answer key**: The set of labels/identities that are correct for a question. Mixing must not change this set.
- **Display order**: The first-to-fourth sequence in which options appear to the learner. This is what the mix changes.
- **Always-first sitting**: A submission that chooses only leading display slots, as defined in FR-004. It MUST NOT earn a perfect quiz score on a newly created quiz (aside from all-correct four-option questions).
- **Stored quiz**: The created, playable quiz. Its mixed display order is part of the stored artifact and is reused for every later view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of documented newly created quizzes whose generated key was entirely leading-slot correct, an always-first sitting (FR-004) yields a weighted score **below** 4.00.
- **SC-002**: In 100% of those quizzes, a sitting that selects every actually correct option (and no distractors) still receives the existing full credit per question (4 on single-answer; full multiple-answer credit under the current rule).
- **SC-003**: In 100% of documented mixed quizzes, a second fetch of the player and the results view show the **same** option labels in the **same** order as the first fetch.
- **SC-004**: Across each documented 5–8 question quiz, correct options appear in **at least two distinct** display slots; they are not all in slot one (or all in a leading block on every multi-select).
- **SC-005**: 100% of pre-submit player views in the documented cases omit correctness flags; a reviewer cannot read the key from the player before submit.
- **SC-006**: In a review sitting, a learner who tries always-first sees a non-perfect score, understands they must read the options, and can complete an honest sitting in the same flow as today (no new screens and no extra setup steps).
- **SC-007**: Automated coverage in FR-014 exists and fails if always-first becomes perfect again, if labels swap correctness, if true-key scoring regresses, or if option order is unstable across reads.

## Assumptions

- “Mix” means reorder the four options on each question. It does not mean rewriting labels, changing which answers are correct, or shuffling questions.
- “Deterministically” means the mix is decided once per stored quiz and then repeats exactly. It does not mean a new random order on every visit.
- The generator may continue to emit correct options first; the product is responsible for mixing afterward. Prompt-only requests to the generator are not sufficient.
- Scoring rules, attempt tokens, idempotent resubmit, and answer-key privacy stay as specified in earlier phases.
- Existing in-storage quizzes keep their current option order; only creates after this cycle MUST mix.
- A question with all four options correct cannot defeat always-first by mixing; that case is already allowed by current quiz rules and remains rare.
- No new learner-facing copy is required beyond the options appearing in a different order.
- Reviewers verify behavior with documented fixtures and automated tests, not by inspecting a live model’s latest quirks.

## Dependencies

- Existing create-quiz, quiz validation (5–8 questions, four unique options, single/multiple keys), scoring, public quiz view (no pre-submit keys), and results (keys after submit).
- Constitution: scoring stays deterministic and independent of generation; keys stay server-only before submit; behavior is proven with tests before the work is called done.
- Prior cycle’s insufficient-source rejection remains in force; this cycle runs on successful creates.

## Out of Scope

- Changing the multiple-answer scoring policy or weight formula.
- Shuffling questions, randomizing per attempt, or letting learners choose a “shuffle” setting.
- Migrating option order on historical quizzes.
- New UI for revealing “this was shuffled.”
- Relying on the language model alone to randomize options.
