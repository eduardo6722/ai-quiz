# Feature Specification: Reject Insufficient Markdown Sources

**Feature Branch**: `010-insufficient-source-reject`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "Cover tests when we have Markdown files with limited information or even empty Markdown files. Another test to be covered is to avoid duplicated questions with little information — e.g. Markdown with one section and a quiz of 8 questions. Acceptance criteria is to reject Markdown with insufficient data to generate a quiz."

## Goal

When a creator asks for a quiz from a remote Markdown document, the product MUST refuse to invent a quiz from a document that does not contain enough distinct information. Empty files, heading-only files, and thin one-section documents MUST fail closed. The product MUST NOT pad a requested 5–8 question quiz with repeated or restated questions.

This cycle tightens the existing create-quiz source gate. Fetch safety, scoring, attempt flow, and answer-key privacy stay as they are. Success is proven by documented fixtures: empty Markdown, limited-information Markdown, and a one-section source requested at 8 questions all reject with no playable quiz; a genuinely rich source still produces a quiz of unique questions.

## In-Scope Behavior

A quiz creator MUST:

- See a clear refusal when the fetched Markdown is empty, whitespace-only, or too thin to support the requested number of distinct questions.
- Never receive a playable quiz that repeats the same question (or a restatement of the same question) because the source did not have enough material.
- Still be able to create a quiz from a document that does contain enough distinct, on-topic content for the requested count.

The product MUST:

- Reject empty and whitespace-only Markdown **before** treating generation as successful, and MUST NOT store a playable quiz for those requests.
- Reject limited-information Markdown — including heading-only documents, comment/boilerplate-only documents, and a single short section that cannot support the requested count of unique questions.
- Treat sufficiency as **relative to the requested question count**. Eight unique questions require more distinct source material than five. The product MUST NOT silently lower the requested count to “make it fit.”
- Refuse to persist a quiz that contains duplicate or restated questions. If uniqueness cannot be met from that source, the create request fails.
- Keep the existing learner-facing setup flow: the creator stays on setup, sees English copy that the source does not have enough information, and can try another URL or topic.
- Cover these behaviors with automated tests on the documented fixtures in this specification.

## Explicit Exclusions

This cycle MUST NOT:

- Change scoring, attempt tokens, or pre-submit answer-key privacy.
- Add authentication, billing, queues, or new screens beyond existing error copy on the setup flow.
- Silently generate fewer than the requested number of questions in the 5–8 range.
- Invent questions from general knowledge when the Markdown cannot support the topic.
- Re-open Phase 7 golden-set calibration, human labels, or a frozen evaluation baseline as new product work. Existing evaluation coverage of insufficient sources MAY be reused as evidence; it does not replace product create-path tests.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **quiz creator** (learner or interviewer) submitting a topic, Markdown URL, and question count on the existing setup flow. A **reviewer** confirms that rejected sources leave no playable quiz and that rich sources still work.

### User Story 1 - Reject empty Markdown (Priority: P1)

A creator points the product at a Markdown document that has no usable text — an empty file, or a file that is only spaces and blank lines. The product refuses to create a quiz. The creator sees that the source does not have enough information. No playable quiz is stored, and the product does not treat generation as successful.

**Why this priority**: An empty document cannot ground even one question. Inventing a quiz would break the “questions come from the source” contract and waste a generation attempt.

**Independent Test**: Submit create-quiz against documented empty and whitespace-only Markdown fixtures; confirm rejection, the insufficient-source outcome, no ready quiz, and that generation is not treated as successful.

**Acceptance Scenarios**:

1. **Given** a fetched Markdown file whose body is empty, **When** the creator requests a quiz, **Then** the request is rejected as an insufficient source and nothing playable is stored.
2. **Given** a fetched Markdown file that contains only whitespace and blank lines, **When** the creator requests a quiz, **Then** the request is rejected as an insufficient source and nothing playable is stored.
3. **Given** either empty or whitespace-only Markdown, **When** the request finishes, **Then** generation is not treated as successful (the product does not invent questions from an empty document).
4. **Given** that rejected request, **When** the creator is on the setup flow, **Then** they see English copy that the source does not have enough information to generate a quiz, and they can try another source.

---

### User Story 2 - Reject limited-information Markdown (Priority: P1)

A creator points the product at Markdown that looks like a file but has almost no quiz-able content: a title only, comments or badges that strip away to nothing, or a handful of words that cannot support five to eight distinct questions. The product refuses. Length by itself is not enough: a long repetition of one sentence is still insufficient.

**Why this priority**: These documents currently can pass a “not empty” check and still cannot support a valid quiz. That is the gap this cycle closes.

**Independent Test**: Submit create-quiz against documented heading-only, boilerplate-only, and thin-body fixtures; confirm rejection as insufficient and no playable quiz.

**Acceptance Scenarios**:

1. **Given** Markdown that is only a heading or title with no body, **When** the creator requests a quiz of 5–8 questions, **Then** the request is rejected as an insufficient source and nothing playable is stored.
2. **Given** Markdown whose remaining text after dropping comments and unusable chrome is empty or only a few words, **When** the creator requests a quiz, **Then** the request is rejected as an insufficient source.
3. **Given** Markdown that is long only because the same sentence is repeated, **When** the creator requests a quiz, **Then** the request is rejected as insufficient; character count alone MUST NOT make the source acceptable.
4. **Given** any limited-information rejection above, **When** storage is inspected, **Then** there is no ready quiz from that request.

---

### User Story 3 - Do not pad thin sources with duplicate questions (Priority: P1)

A creator requests **8 questions** from Markdown that has **one short section**. The source cannot support eight distinct, grounded questions. The product MUST reject the request rather than repeating the same question, restating it in different words, or padding with near-copies to fill the count.

**Why this priority**: Duplicate questions from thin sources are the failure mode this cycle exists to stop. A playable 8-question quiz that asks the same thing eight times is worse than a clear refusal.

**Independent Test**: Create from a documented one-section thin fixture at count 8; confirm insufficient-source rejection and zero stored questions that share a prompt or restate the same ask. A mocked generation that returns duplicate prompts MUST also fail closed.

**Acceptance Scenarios**:

1. **Given** Markdown with a single short topical section and a requested count of 8, **When** the creator requests a quiz, **Then** the request is rejected as insufficient and nothing playable is stored.
2. **Given** that one-section source, **When** the request finishes, **Then** no quiz is stored whose questions repeat the same prompt (ignoring extra spaces and letter case) or restate the same question from the same passage.
3. **Given** a generation result that would meet the count only by duplicating or restating questions, **When** the product validates the result, **Then** that result is not stored as ready; the create request fails closed after the existing bounded retry policy.
4. **Given** a source that can support 5 distinct questions but not 8, **When** the creator requests 8, **Then** the product still rejects rather than silently creating a 5-question quiz.

---

### User Story 4 - Keep rich sources working (Priority: P2)

A creator uses a normal README with several distinct sections and enough facts for the requested count. The product still creates a ready quiz of that many unique, source-grounded questions. This cycle MUST NOT become a blunt length filter that rejects ordinary public READMEs.

**Why this priority**: Closing the thin-source hole must not break the existing happy path.

**Independent Test**: Create from a documented multi-section fixture that already succeeds today (or an equivalent rich Markdown body) at count 5 and count 8; confirm a ready quiz with that many unique prompts and no insufficient-source error.

**Acceptance Scenarios**:

1. **Given** Markdown with multiple distinct sections and enough on-topic facts for 5 questions, **When** the creator requests 5 questions, **Then** a ready quiz with 5 unique questions is stored.
2. **Given** Markdown with enough distinct on-topic facts for 8 questions, **When** the creator requests 8 questions, **Then** a ready quiz with 8 unique questions is stored.
3. **Given** those ready quizzes, **When** a reviewer compares prompts, **Then** no two prompts match after ignoring extra spaces and letter case, and questions remain about the requested topic and source.

---

### Edge Cases

- **HTML comments or badge-only chrome** that strip away to empty text: treat as empty / insufficient; reject.
- **Heading plus a single short paragraph**: reject when that body cannot support the requested number of distinct questions (canonical case: one section, count 8).
- **One detailed section that can support 5 distinct facts but not 8**: count 5 MAY succeed; count 8 MUST reject. The product MUST NOT lower 8 to 5.
- **Repeated identical paragraphs**: treat as one unit of information, not as N units because the file is long.
- **Whitespace, BOM, or invisible characters only**: reject as empty / insufficient.
- **Binary, invalid text, or non-Markdown types**: keep existing unusable / unsupported-type refusals; this cycle does not replace those paths.
- **Topic that does not appear in an otherwise rich source**: still fail closed (do not invent off-source questions); that remains existing grounding behavior.
- **Unsafe, private, or timed-out URLs**: existing fetch refusals still apply first; this cycle does not change destination policy.
- **Count omitted**: still defaults to 5; empty and thin sources still reject at that default.
- **Generation returns unique prompts that are still the same fact restated**: MUST NOT persist; fail closed rather than pad.
- **Generation returns exact duplicate prompts**: MUST NOT persist; fail closed after the existing retry bound.
- **Failed request leftovers**: no start-able quiz; get/start remain not playable / not found as today.
- **Creator retries with a richer URL or a lower count that the same source can uniquely support**: a new create MAY succeed; the previous rejection is unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST reject create-quiz when the fetched Markdown is empty or whitespace-only. Generation MUST NOT be treated as successful. Nothing playable MUST be stored.
- **FR-002**: The product MUST reject create-quiz when remaining Markdown after dropping comments and unusable chrome has no quiz-able body (heading-only, boilerplate-only, or a few words that cannot support the requested count). Nothing playable MUST be stored.
- **FR-003**: Sufficiency MUST be judged against the **requested question count** (5–8, default 5). A source that cannot support that many **distinct**, source-grounded questions MUST be rejected. The product MUST NOT silently generate fewer questions than requested.
- **FR-004**: Sufficiency MUST NOT be judged by character count or file size alone. A long document that only repeats one statement MUST be insufficient.
- **FR-005**: A documented one-section thin fixture requested at **8 questions** MUST be rejected as insufficient. The product MUST NOT persist eight questions that repeat or restate the same ask.
- **FR-006**: A persisted ready quiz MUST contain the requested number of questions whose prompts are unique after trimming extra spaces and ignoring letter case. Duplicate prompts MUST fail closed (retry within the existing bound, then reject; never store as ready).
- **FR-007**: A persisted ready quiz MUST NOT contain questions that restate the same question from the same source passage in different words in order to fill the count. If that is the only way to reach the requested count, the request MUST be rejected.
- **FR-008**: Empty and whitespace-only sources MUST fail **before** a generation attempt is treated as needed. Limited-information sources that are obviously too thin for the requested count SHOULD fail before generation; if generation still runs, FR-006 and FR-007 still apply.
- **FR-009**: Rejections in this cycle MUST use the existing insufficient / unusable source outcome for empty and too-thin documents, and the existing invalid-generation outcome when a generation result is unique-count padding. Messages MUST be English, non-secret, and MUST NOT leak prompts, keys, or provider traces.
- **FR-010**: On the setup flow, the creator MUST see copy that the source does not have enough information to generate a quiz (empty and too-thin cases), or that questions could not be prepared from that source (duplicate-padding generation failure). They MUST be able to try again.
- **FR-011**: Fetch safety, size/type limits, untrusted-Markdown handling, grounding to the source, scoring, attempt tokens, and pre-submit key privacy MUST remain unchanged.
- **FR-012**: Documented rich multi-section Markdown that can support the requested count MUST still produce a ready quiz of that many unique questions.
- **FR-013**: Automated tests MUST cover at least: empty Markdown; whitespace-only Markdown; heading-only or otherwise limited-information Markdown; one-section Markdown at count 8 (reject, no duplicate questions stored); a generation result with duplicate prompts (not stored); and a rich source at count 5 and count 8 (unique questions stored).

### Key Entities

- **Source snapshot**: The fetched, normalized Markdown the quiz would be generated from. Empty or too-thin snapshots never become a playable quiz.
- **Requested question count**: The creator’s 5–8 target (default 5). Sufficiency is always relative to this number.
- **Insufficient source**: A snapshot that cannot support the requested number of distinct, on-topic, source-grounded questions without repeating or inventing content.
- **Distinct question**: A question whose prompt is unique in the quiz (ignoring extra spaces and letter case) and that does not merely restate another question from the same passage.
- **Playable quiz**: A stored, ready quiz a learner can start. This cycle requires zero playable quizzes from insufficient sources.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of documented empty and whitespace-only Markdown fixtures are rejected, with **zero** playable quizzes stored and generation **not** treated as successful.
- **SC-002**: 100% of documented limited-information fixtures (heading-only, boilerplate-only, thin body, repeated-sentence) are rejected, with **zero** playable quizzes stored.
- **SC-003**: 100% of documented one-section thin sources requested at 8 questions are rejected, with **zero** stored quizzes that contain duplicate or restated questions.
- **SC-004**: 100% of documented generation results that only meet the count by duplicating prompts fail closed, with **zero** ready quizzes from those results.
- **SC-005**: 100% of documented rich multi-section sources that can support the requested count still produce a ready quiz with that many unique prompts (count 5 and count 8 each covered at least once).
- **SC-006**: In a review sitting, a creator shown an empty or one-section-at-8 rejection understands from the on-screen message that the source did not have enough information (or that questions could not be prepared), without seeing secrets or internal traces, and can retry with another source in under 1 minute.
- **SC-007**: Automated coverage listed in FR-013 exists and fails if an empty, thin, or one-section-at-8 source becomes a ready quiz, or if duplicate prompts are stored as ready.

## Assumptions

- “Markflow” in the request means **Markdown** files used as quiz sources.
- The existing create-quiz flow (topic + HTTPS Markdown URL + optional count 5–8) is unchanged except for a stricter sufficiency gate and uniqueness check.
- The product continues to require exactly the requested count in 5–8. It will **not** auto-reduce 8 to 5 when the source is thin.
- Empty / whitespace-only / heading-only / too-thin documents reuse the existing unusable-source outcome already shown to creators, with copy clarified so “not enough information” is obvious. Duplicate-padding after a generation attempt reuses the existing could-not-prepare-questions outcome.
- “Distinct” for stored quizzes means unique prompts after trimming spaces and ignoring letter case, plus no restated same-question padding from the same passage. Exact duplicate prompts are the automated floor; restated-same-question padding is in scope for the one-section-at-8 fixture.
- A character-length floor may remain as a fast empty check but is **not** the definition of sufficiency.
- Ordinary public READMEs used in earlier phases remain sufficient when they contain multiple distinct facts; this cycle must not reject them.
- No new actor, screen, or authentication model. Reviewers inspect stored quizzes the same way they do today (API and/or setup error).
- Phase 7’s insufficient-source evaluation case is complementary evidence, not a substitute for product create-path tests in FR-013.

## Dependencies

- Existing create-quiz, source fetch, generation validation, setup error copy, and “nothing playable on failure” behavior from earlier phases.
- Constitution constraints: fail closed, untrusted Markdown, no pre-submit keys, Jest-verified behavior before calling the work done.
- No change to scoring math or attempt lifecycle.

## Out of Scope

- Rewriting fetch/SSRF policy, model provider choice, or the 5–8 / four-option quiz shape.
- Allowing quizzes shorter than the requested count.
- Human calibration or freezing a new evaluation baseline.
- New quiz types, file-upload of Markdown (URL fetch remains the input), or editing a rejected source inside the product.
