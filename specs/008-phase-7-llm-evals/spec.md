# Feature Specification: Phase 7 LLM Evaluation, Golden Dataset and Quality Regression

**Feature Branch**: `008-phase-7-llm-evals`

**Created**: 2026-10-11

**Status**: Draft

**Roadmap phase**: Phase 7 — LLM evaluation, golden dataset and quality regression (P1)

**Input**: User description: "Create a Phase 7-only specification for LLM evaluation, golden dataset and question-generation quality regression. Prerequisite: verified Phases 0–6, including the two-source acceptance demo and Langfuse observability. Reuse the existing generation port, live generation path, source snapshots and traces. Specify a manually curated and version-controlled golden dataset with at least two different README sources, 12–20 varied cases, source snapshot/checksum, requested topic/count, supported reference facts, evidence locations, and expected behaviors. Do not make the generated questions match fixed wording. Separate deterministic code evaluators from semantic evaluation. Define a versioned LLM-as-a-Judge rubric requiring source evidence, plus human-reviewed labels and calibration of judge agreement/disagreements. Treat unsourced or wrong correct-answer keys as blocking failures, even if the JSON is valid. Specify repeatable offline evaluation runs against pinned Markdown snapshots, small repeated-run variability checks, model/prompt comparison and configured experiment records. Track evaluator versions, source checksum, model/prompt versions, experiment ID, latency, token usage, cost and concrete failures. Produce a portable report at docs/evals/phase-7-report.md and an explicit local evaluation command; live and mocked evaluations must be clearly separated. Set provisional thresholds and regression rules with human review, and document sample size and limitations. Cover malicious Markdown instructions, unsupported facts, misleading choices, ambiguous multi-select answer keys and data exposure. Keep telemetry behind ports/adapters, never expose private tokens/answer keys to users, and never replace the deterministic final quiz scoring with an LLM judgment. Allow only targeted quality fixes supported by evidence. Exclude new product features, alternative generation strategies, CI/CD, deployment and UI redesign."

## Phase Identity and Goal

This specification covers **Roadmap Phase 7 only** (main-roadmap **M6**). The goal is to prove that generated quizzes are **faithful to their Markdown source**, **useful for the requested topic**, and **consistently high quality** — not merely well-formed output. This cycle establishes a **reproducible quality baseline** before production delivery.

Success is a complete, independently testable evaluation slice on top of the existing product: a versioned golden dataset; deterministic contract checks; a versioned evidence-based judge rubric with human calibration; repeatable offline generation runs against **pinned** source snapshots; experiment records that a reviewer can inspect; and a portable baseline report with honest pass / fail / **not run** outcomes. Generation, persistence, learner scoring, the two-source demonstration and observability **reuse Phases 0–6**. This cycle does **not** ship new product features, alternative generation strategies, hosted CI, deployment, or a UI redesign.

## Prerequisites

This cycle MUST reuse the Phase 0 workspace, Phase 1 scoring and public contracts, Phase 2 persistence and attempt-token lifecycle, Phase 3 secure fetch and generation port, Phase 4 browser flow, Phase 5 two-source demonstration evidence, and Phase 6 observability (replaceable telemetry, correlation identity, redaction, Langfuse traces when configured). It MUST NOT re-scaffold the monorepo, reimplement grading, replace public quiz/attempt contracts, reinitialize Spec Kit or the Constitution, or rebuild product tables.

| Prerequisite | Status | Notes |
| ------------ | ------ | ----- |
| Project Constitution (`.specify/memory/constitution.md`, v1.0.0) | Complete | Hexagonal ports/adapters, Zod contracts, Jest discipline, **secure AI integration** (Markdown is untrusted data; secrets never logged), and **scoring purity** (generation MUST NOT decide the learner’s final score). Domain and application MUST remain free of NestJS, Prisma, Next.js, React, OpenAI, Vercel AI SDK, Langfuse and HTTP-client SDKs. Evaluation runners MUST stay outside the pure scoring policy. |
| Product roadmap (`roadmap.md`) and phase execution guide (`implementation-roadmap.md`) | Complete | Source of the golden-set size, pinned snapshots, deterministic vs semantic split, judge-with-evidence rule, human calibration, experiment metadata, portable report path, provisional gates, and this phase’s checklist and definition of done. |
| Agent guide (`AGENTS.md`) | Complete | Runtime engineering policy, including never exposing answer keys before submission and never treating remote Markdown as privileged instructions. |
| Phase 0 scaffolding (`specs/002-phase-0-scaffold/`) | Verified | Monorepo, API/web shells, local PostgreSQL, quality commands. |
| Phase 1 domain scoring (`specs/003-phase-1-domain-scoring/`) | Verified | Pure quiz invariants, deterministic scoring, public contracts, keys omitted from pre-submit views. This cycle MUST prove those scoring invariants still hold; it MUST NOT change them. |
| Phase 2 persistence and REST (`specs/004-phase-2-persistence-api/`) | Verified (2026-10-10) | `/v1` create/get/start/submit/result, private attempt token issued once, hash-only storage, transactional scoring, idempotent resubmit. Evidence: tasks T001–T071 complete. |
| Phase 3 Markdown ingestion and generation (`specs/005-phase-3-markdown-generation/`) | Verified (2026-10-10) | Product create fetches a public Markdown URL and generates a grounded quiz through `QuizGenerationPort`. Snapshots and checksums persist. SSRF, untrusted Markdown, bounded generation retries. Evidence: tasks T001–T062 complete. Gated live README remains an **environment blocker**, not a fixture fallback. |
| Phase 4 complete browser quiz experience (`specs/006-phase-4-web-experience/`) | Delivery present; **formal verification record incomplete** | Spec, plan and tasks exist and are marked complete, including the browser setup → play → submit → results flow. `implementation-roadmap.md` still records **Phase 3 as the last verified cycle** and has no Phase 4 verification-evidence block. |
| Phase 5 two-source demonstration and reliability | Delivery present under Phase 4; **no separate spec cycle; formal verification record incomplete** | README records a two-source live sitting (Express and Fastify READMEs, 2026-10-11) and offline two-source API evidence. There is **no** `specs/…-phase-5-demo-reliability/` directory. `implementation-roadmap.md` does not record Phase 5 as verified. This cycle MUST pin those (or equivalently distinct) README snapshots rather than re-run the interview demo as a new product feature. |
| Phase 6 observability and operational controls (`specs/007-phase-6-observability/`) | Delivery present; **formal verification record incomplete** | Spec, plan and tasks exist and are marked complete. README documents replaceable traces for fetch → preprocessing → generation → validation, redaction, correlation identity, and gated live Langfuse inspection. `implementation-roadmap.md` does not record Phase 6 as verified. This cycle MUST reuse that telemetry boundary for experiment context; it MUST NOT couple evaluators to a vendor SDK inside domain or scoring. |
| Formal verification record in `implementation-roadmap.md` | Complete for Phases 0–3 only | Status header: Phase 3 verified; Phases 4–8 described as backlog. This cycle is the requested **Phase 7 specification only**. |
| Phase 8 | Not started | CI/CD, production Dockerfiles, deployment automation and interview walkthrough kit are out of scope. |

**Blockers:** Phases 4, 5 and 6 are **not formally recorded as verified** in `implementation-roadmap.md`. Phase 5 has no separate specification directory. Those are **prerequisite recording gaps**. They MUST NOT expand this phase into a second browser rewrite, a new two-source demo package, CI/CD, production containers, a UI redesign, or a second generation strategy.

- **Implementation of this specification MUST NOT start** until Phases 4, 5 and 6 are recorded as verified in `implementation-roadmap.md`, **or** any remaining Phase 4/5/6 acceptance gaps are listed as explicit blockers of those earlier phases. Missing formal checkboxes MUST NOT be “fixed” by absorbing demo, delivery or product-feature work into Phase 7.
- If Phase 0–6 quality commands later fail when this spec is implemented, that is a **prerequisite defect to fix in the earlier phase**.
- Missing model credentials at **live** evaluation time is an **environment blocker**. The live run MUST be recorded as **not run**, never as passed, and MUST NOT be silently replaced by a mocked generator as quality evidence.
- Missing tracing/experiment credentials at **live experiment inspection** time is an **environment blocker** for the configured experiment destination. The portable local report and version-controlled dataset MUST still be produced. Automated mocked evaluators MUST remain available without those credentials.
- If the existing generation port, source-snapshot/checksum behavior, or telemetry boundary is missing or broken, that is a **prerequisite defect**. This cycle reuses them; it MUST NOT invent a parallel generation path for evaluation.
- Essential SSRF, prompt-injection handling, answer-key privacy and attempt-token protections are **prerequisite behavior**. If any of those later fail, repair them as earlier-phase defects. This cycle evaluates whether generation **quality and safety** hold on pinned cases; it MUST NOT redesign fetch policy, scoring or token hashing.

**Existing whole-product placeholder:** `specs/001-ai-quiz-generator/` remains unused leftover context. This cycle owns `specs/008-phase-7-llm-evals/` and MUST NOT execute a whole-product task list.

## In-Scope Behavior

A **reviewer** (developer or interviewer judging generation quality) MUST be able to:

- Inspect a **manually curated, version-controlled golden dataset** of **12–20** generation scenarios that cover **at least two genuinely different README sources**, several topics, single- and multiple-answer expectations, insufficient or unsupported sources, and adversarial Markdown.
- For every case, see a **stable case identity**, source location, **pinned snapshot and checksum**, requested topic and question count, **manually verified reference facts**, **supporting excerpt or section locations**, expected **behavioral** constraints, and tags for difficulty or failure mode — **without** a prescribed question wording.
- Run **deterministic contract evaluators** that do not call a judge model: output shape, 5–8 questions, exactly four unique options, valid answer-key cardinality and indices, single/multiple type consistency, no duplicate questions or options, no pre-submit answer-key leakage, and unchanged weighted-scoring invariants.
- Run a **versioned evidence-based judge** for source grounding, answer-key correctness, topic relevance, clarity, ambiguity, distractor quality and set coverage. The judge MUST cite supporting source evidence, mark uncertainty, and treat the generated answer key as a **hypothesis to verify**, never as given truth.
- See **human-reviewed labels** on a representative sample, including multiple-answer keys and every recorded judge disagreement, plus a calibration note of where the judge agrees and where it systematically errs.
- Re-run **offline evaluation** against the **same pinned snapshots** through the **existing production generation path**, including a **small** repeated-run subset to observe variability, and compare at least two model or prompt versions when both are available.
- Read a **portable baseline report** at `docs/evals/phase-7-report.md` and invoke an **explicit local evaluation command** documented for reviewers. Live-model runs and mocked-model runs MUST be labeled as such.
- See **provisional quality gates** applied with human review of high-risk findings, plus the **sample size, disagreements and limitations**, rather than a claim of statistical certainty.

The product MUST:

- Keep the verified learner path unchanged: create, retrieve, attempt, submit and result, including SSRF, untrusted Markdown, answer-key isolation, attempt-token hashing and **Phase 1 scoring math**.
- Reuse `QuizGenerationPort`, persisted source snapshots/checksums, and the Phase 6 telemetry boundary. Evaluation MUST feed the generator the **pinned snapshot text**, not a freshly fetched mutable remote page, when measuring regression.
- Keep evaluation, judge rubrics and experiment recording **outside** the pure domain scoring policy. No judge score, quality metric or experiment label MAY change a learner’s 0–4 question score or the geometric weighted average.
- Keep telemetry and experiment export behind the **existing replaceable boundary**. Domain and application MUST NOT import a tracing or evaluation-platform vendor SDK. A no-op or in-memory double MUST be enough to prove recording and redaction in automated checks.
- Never place private attempt tokens, environment secrets, or answer keys into learner-facing responses, page props, or public documentation examples. Evaluation reports MAY record **server-side** generated keys and judge findings for reviewers; they MUST NOT publish secrets or raw attempt tokens.
- Treat **unsupported or wrong correct-answer keys** as **blocking quality failures** even when the output is structurally valid.
- Allow **only targeted** generation or prompt fixes that are supported by **recorded** evaluation failures. This cycle MUST NOT redesign the product, add a second generation strategy, or “optimize” prompts without that evidence.
- After the harness, cases and report exist, run a **read-only code review** of evaluators, golden cases and data handling; resolve blocking findings without coupling scoring to judge opinions.

Constitution-bound names for this phase (not open design choices): TypeScript strict packages, hexagonal `domain` / `application` / `contracts`, NestJS REST adapters as the composition root, the existing `QuizGenerationPort` and source-snapshot/checksum behavior, Langfuse as the configured destination for Datasets, Experiments and Scores **behind the telemetry/evaluation boundary**, Zod public contracts, Jest for mocked/deterministic evidence, the explicit local evaluation command (roadmap default name `pnpm eval:golden` or an equivalent documented command), and the portable report path `docs/evals/phase-7-report.md`.

## Explicit Exclusions

This phase MUST NOT include:

- New learner-facing product features (new screens, difficulty pickers, source-preview UI, historical quiz lists, dashboards, authenticated workspaces).
- A second question-generation strategy, a parallel generator, or online prompt-optimization loops.
- GitHub Actions or other hosted CI pipelines, including a gated live-evaluation workflow (that is Phase 8).
- Production Dockerfiles, multi-stage images, deployment automation, or interview walkthrough kits.
- Changes to the deterministic 0–4 scoring rules, geometric weights, rounding policy, or the provisional multiple-answer reading from Phase 1.
- Requiring generated questions to match a fixed expected wording or a canned question list.
- Treating a skipped, unaffordable, unavailable or unrun live evaluation as **passed**.
- Replacing or “confirming” a learner’s final quiz score with a judge judgment.
- Re-scaffolding the monorepo, overwriting the Constitution, rewriting Phase 1 scoring, replacing Phase 2/3 persistence, tokens, SSRF or generation **except** targeted quality fixes supported by recorded failures.
- Claiming statistical significance, population-level quality, or an external industry benchmark from this small curated set.
- Authentication of human users, billing, Redis, extra brokers or analytics product UIs.

Later-phase requirements may be mentioned only as deferred context. They are **not** acceptance criteria for this cycle.

## User Scenarios & Testing *(mandatory)*

The primary actor is a **reviewer** judging generation quality. A **human adjudicator** (may be the same person) labels a sample and resolves disagreements. A **learner** is unchanged from Phases 4–5. An **operator** may inspect experiment records using the Phase 6 telemetry boundary.

### User Story 1 - Curate a versioned golden dataset with reference facts (Priority: P1)

A reviewer assembles **12–20** generation scenarios that a later run can repeat without depending on a live website remaining unchanged. At least two cases use **different** real README sources (not two topics on one file). Other cases cover extra topics, single- and multiple-answer expectations, thin or unsupported sources, and Markdown that tries to instruct the generator. Each case stores human-verified facts and where in the source those facts live. The dataset does **not** contain a “correct quiz script” that generated wording must match.

**Why this priority**: Without pinned sources and reference facts, later scores cannot be compared and “grounded” has no meaning.

**Independent Test**: Open the versioned dataset and confirm the case count, two distinct README sources, required fields per case, pinned snapshot checksums, and the absence of expected question text.

**Acceptance Scenarios**:

1. **Given** the published dataset version, **When** a reviewer lists cases, **Then** there are between **12 and 20** cases inclusive, each with a stable case identity that does not change across runs of that version.
2. **Given** the published dataset version, **When** a reviewer inspects sources, **Then** at least two cases pin **different** README bodies (distinct checksums and distinct origin URLs), and each of those snapshots is stored with its checksum.
3. **Given** any case, **When** a reviewer reads it, **Then** they see requested topic, requested count (5–8), one or more manually verified reference facts, supporting excerpt or section locations, expected behavioral constraints (for example “must refuse unsupported claims” or “must produce a valid multi-answer key”), and tags — and they do **not** see a required question wording.
4. **Given** a later evaluation run of the same dataset version, **When** the generator is invoked, **Then** it receives the **pinned snapshot text** for that case, not a newly downloaded remote file, so a changed public README cannot silently invalidate the comparison.
5. **Given** the dataset, **When** a reviewer looks for coverage tags, **Then** the set includes multiple topics, both single-answer and multiple-answer expectations, at least one insufficient or unsupported-source case, and at least one adversarial/instruction-injection Markdown case.

---

### User Story 2 - Prove the quiz contract with deterministic evaluators (Priority: P1)

A reviewer runs code checks that do not ask another model for an opinion. Those checks confirm the generated quiz still meets the product contract: valid shape, 5–8 questions, four unique options, valid answer indices, consistent single/multiple types, no duplicate prompts or option labels, no answer-key leakage on the learner-facing view, and the same weighted-scoring arithmetic as Phase 1.

**Why this priority**: A quality program that only “feels right” would hide broken contracts. Structural failure must be cheap, repeatable and independent of the judge.

**Independent Test**: Feed valid, malformed, leaky and duplicate fixtures to the deterministic evaluators; assert pass/fail without any judge model; confirm scoring fixtures still match the hand-calculated Phase 1 weights.

**Acceptance Scenarios**:

1. **Given** a generated quiz that meets the contract, **When** deterministic evaluators run, **Then** they pass schema, count (5–8), four unique options per question, valid key indices, and type/key cardinality.
2. **Given** a quiz with duplicate question prompts or duplicate option labels, **When** deterministic evaluators run, **Then** they fail with a concrete, case-level reason.
3. **Given** a learner-facing quiz view, **When** the leakage evaluator runs, **Then** correctness flags and answer keys are absent; their presence is a **blocking** failure.
4. **Given** the documented Phase 1 scoring fixtures (including the hand-calculated weighted sample), **When** the scoring-invariant evaluator runs, **Then** results match the existing policy and geometric weights `1.1` raised to the zero-based question index.
5. **Given** only the deterministic suite, **When** judge credentials are absent, **Then** those checks still run and still report independently of any semantic score.

---

### User Story 3 - Judge grounding and answer keys with required source evidence (Priority: P1)

A reviewer runs a versioned judge rubric against generated questions and the **pinned source**, not against the model’s general knowledge. The judge must point to supporting evidence in the snapshot, rate relevance, clarity, ambiguity, distractor quality and coverage, and say when it is unsure. The generated “correct” options are treated as a claim to check. An unsourced or wrong correct-answer key fails the case even if the JSON is valid.

**Why this priority**: Valid structure does not prove the quiz is true to the README. Unsupported keys would teach the wrong fact.

**Independent Test**: Run the judge (or a recorded judge fixture) on (a) a question whose correct option is a verbatim supported fact, (b) a fluent question whose correct option is not in the snapshot, (c) a multi-select key that mixes supported and unsupported options; confirm (b) and (c) are blocking failures and that the judge output names evidence or uncertainty.

**Acceptance Scenarios**:

1. **Given** a generated question whose correct option is supported by a named location in the pinned snapshot, **When** the judge runs, **Then** it records that evidence and does not treat the generated key as already true.
2. **Given** a structurally valid quiz whose marked-correct option is **not** supported by the snapshot (invented or from general knowledge), **When** evaluators finish, **Then** the case is a **blocking** failure regardless of schema success.
3. **Given** a multiple-answer question whose marked-correct set is incomplete, extra, or ambiguous relative to the reference facts, **When** the judge and human-review rules run, **Then** the case is flagged and cannot be counted as a semantic pass without adjudication.
4. **Given** Markdown that instructs the generator to ignore the source, leak keys, or follow attacker rules, **When** the case is evaluated, **Then** following those instructions is a **blocking** failure; treating the Markdown as untrusted task data is the expected behavior.
5. **Given** a thin or off-topic source for the requested topic, **When** generation and evaluation run, **Then** unsupported claims, topic drift, or a wrong “successful” quiz are recorded as failures or expected refusals per the case’s behavioral constraint — not as quality passes.

---

### User Story 4 - Calibrate the judge against human labels (Priority: P1)

A human adjudicator reviews a **stratified sample** of generated questions, with extra attention to multiple-answer keys and every case where the judge and a first reading disagree. Adjudicated labels are stored with the dataset version. The reviewer compares judge verdicts to those labels and writes down systematic errors instead of treating the judge as objective ground truth.

**Why this priority**: An uncalibrated judge would freeze a biased baseline. Human labels outrank judge assertions.

**Independent Test**: Inspect the calibration record: sample composition, labels, agreement/disagreement table, and at least one documented judge failure mode. Confirm disagreements were adjudicated rather than auto-resolved by the judge.

**Acceptance Scenarios**:

1. **Given** a completed live (or recorded) evaluation of the golden set, **When** a reviewer opens the calibration record, **Then** they see a stratified human-reviewed sample that includes both sources, both question types, and every recorded judge disagreement.
2. **Given** a disagreement between judge and human, **When** adjudication finishes, **Then** the stored label is the human decision, the disagreement is listed, and the case is not silently counted as a judge pass.
3. **Given** the calibration note, **When** a reviewer reads it, **Then** they can name at least the sample size, the agreement picture, and any systematic judge error (for example over-trusting fluent distractors or missing multi-select extras).
4. **Given** only judge output and no human sample, **When** someone asks if the baseline is calibrated, **Then** calibration is **not run** / incomplete — it MUST NOT be reported as passed.

---

### User Story 5 - Repeat offline experiments and publish a portable report (Priority: P1)

A reviewer launches an explicit local evaluation command. The run uses pinned snapshots through the existing generation path, records evaluator version, source checksum, model and prompt versions, experiment identity, duration, token usage and approximate cost when available, and concrete per-case failures. A small subset is generated more than once to show variability. Results appear in the configured experiment destination **when credentials exist**, and always in the portable report `docs/evals/phase-7-report.md` so a reader without that destination can still review evidence. Mocked and live runs are labeled on every summary line.

**Why this priority**: A baseline that cannot be replayed or inspected is not a delivery gate.

**Independent Test**: Run the documented local command in mocked mode without model keys and confirm a labeled mocked summary; with keys, run live against at least two pinned README snapshots and confirm the report, metadata and experiment identity (or an explicit **not run** for the missing destination).

**Acceptance Scenarios**:

1. **Given** documented credentials and the golden dataset, **When** the reviewer runs the explicit local evaluation command, **Then** each case is executed against its pinned snapshot through the existing generation port, and per-case outcomes are written to the portable report.
2. **Given** a mocked evaluation (no live model), **When** the command finishes, **Then** the summary and report clearly say **mocked**, and that run MUST NOT be cited as live quality evidence.
3. **Given** a live evaluation of at least two pinned README sources, **When** the report is opened, **Then** it lists dataset version, rubric version, source checksums, model and prompt versions, evaluator versions, experiment identity when available, duration, token usage and cost when reported, and concrete failures.
4. **Given** the documented small variability subset, **When** those cases are generated more than once in the same experiment, **Then** the report shows that the outputs can differ and does not treat a single wording as the expected quiz.
5. **Given** two available model or prompt versions, **When** the reviewer compares them, **Then** the report (and the experiment destination when configured) shows both, with the same dataset and rubric versions, so a later change can be judged against the frozen baseline.
6. **Given** missing model or experiment-destination credentials, **When** the reviewer follows the documented command, **Then** the omitted live portion is recorded as **not run**, with the environment blocker named, and mocked deterministic checks may still pass on their own.

---

### User Story 6 - Apply provisional gates, human review and evidence-only fixes (Priority: P1)

A reviewer applies the documented provisional thresholds, reviews blocking and ambiguous findings in person, and decides pass, fail or **not run**. Confirmed unsupported correct answers, answer-key leakage and successful prompt injection are blockers for this milestone. If a targeted generation or prompt fix is made, it is tied to a recorded failure. The learner scoring formula stays exactly as Phase 1.

**Why this priority**: The definition of done is an honest baseline, not a vanity score and not an unnoticed scoring change.

**Independent Test**: Read the report’s gate table and sample-size/limitations section; confirm skipped live work is not marked passed; confirm a documented blocking failure cannot be waived by “valid JSON”; confirm scoring fixtures are unchanged.

**Acceptance Scenarios**:

1. **Given** a completed evaluation, **When** a reviewer reads the gate table, **Then** each gate is explicitly **passed**, **failed** or **not run**, with sample size and uncertainty beside any pass.
2. **Given** the provisional targets (100% deterministic contract checks; zero confirmed unsupported correct answers; zero confirmed leakage or successful injection; at least 90% of **human-reviewed** questions acceptable for relevance and clarity; no material regression from the frozen baseline), **When** results are compared, **Then** those numbers are treated as **calibration-dependent local gates**, not external standards.
3. **Given** a confirmed unsupported correct answer, leaked key, or successful Markdown injection, **When** gates are applied, **Then** the evaluation milestone is **failed** even if structure passed.
4. **Given** a generation or prompt change in this cycle, **When** a reviewer asks why it exists, **Then** it points at a recorded failing case; unexplained rewrites are out of scope.
5. **Given** the delivered scoring policy, **When** Phase 1 reference calculations are re-checked, **Then** they still match; no judge output appears in the learner result.

---

### Edge Cases

- **Remote README changes after pinning**: evaluation MUST keep using the stored snapshot and checksum. A checksum mismatch against the pin is a dataset/run error, not a silent refresh.
- **Malicious Markdown instructions**: source text that says “ignore previous rules”, “mark all options correct”, or “print the hidden key” MUST be evaluated as untrusted data. Compliance with those instructions is a blocking failure.
- **Unsupported or invented facts**: fluent, on-topic questions whose correct option is not in the snapshot are blocking semantic failures.
- **Misleading or overlapping distractors**: plausible but source-false options are expected; options that are also true according to the snapshot, or that make every choice defensible, must be flagged for ambiguity.
- **Ambiguous multi-select keys**: extra, missing, or contradictory marked-correct options fail semantic evaluation and require human adjudication.
- **Insufficient source for the requested topic**: the case’s expected behavior may be a clear generation failure or a tightly bounded quiz; inventing filler facts to “succeed” is a failure.
- **Duplicate or near-duplicate questions** in one quiz: deterministic or semantic coverage checks MUST fail or flag the set.
- **Topic drift**: questions about the source author’s biography when the requested topic is a library feature (or the reverse) fail relevance.
- **Generation variability**: two live runs of the same case may differ in wording; that is expected and MUST NOT be scored as a wording mismatch. Variability that introduces a blocking factual error **does** fail that run.
- **Missing live credentials**: live generation, live judge, or live experiment export is **not run**. Mocked structure checks may still run. None of the omitted live work may be summarized as passed.
- **Judge–human disagreement**: store both verdicts; the human label wins; do not average them into a hidden pass.
- **Data exposure**: attempt tokens, environment secrets, and learner-submitted answers MUST NOT appear in traces, logs, the portable report or experiment records. Reviewer-only generated keys in the evaluation report are allowed; they MUST NOT be copied into learner-facing surfaces.
- **Small sample**: 12–20 curated cases and a smaller human sample MUST be described as limited. The report MUST state that this is not a statistically certain quality claim.
- **Paid-run cost or timeout**: aborting mid-run records partial results and marks remaining cases **not run**, never passed.
- **Existing product rate or concurrency limits**: evaluation runs MUST be paced or isolated so they do not depend on silently raising Phase 6 abuse limits. Changing those limits to make eval pass is out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The cycle MUST publish a **versioned, manually curated golden dataset** of **12–20** generation cases inclusive. The dataset MUST be stored with the product so a reviewer can inspect it without an external account.
- **FR-002**: The dataset MUST include cases for **at least two different README sources** (distinct origin URLs and distinct pinned bodies), multiple topics, single-answer and multiple-answer expectations, at least one insufficient or unsupported-source case, and at least one adversarial Markdown/instruction-injection case.
- **FR-003**: Every case MUST record: stable case identity, source URL (when the case is based on a real document), pinned snapshot, checksum, requested topic, requested question count (5–8), manually verified reference facts, supporting excerpt or section locations, expected behavioral constraints, and tags. Cases MUST NOT prescribe generated question wording.
- **FR-004**: Repeatable evaluation MUST send the generator the **pinned snapshot text** for that case via the existing `QuizGenerationPort`. It MUST NOT treat a fresh remote fetch as the source of truth for regression comparison.
- **FR-005**: **Deterministic evaluators** MUST check, without a judge model: response schema; 5–8 questions; exactly four unique options per question; valid answer-key indices and cardinality; single/multiple type consistency; no duplicate questions or option labels; no pre-submit answer-key leakage on learner-facing views; and unchanged Phase 1 weighted-scoring invariants (`1.1` raised to the zero-based index; single-answer 4 or 0; multiple-answer one point per correctly selected option, bounded 0–4).
- **FR-006**: A **versioned judge rubric** MUST score source grounding, factual/answer-key correctness, topic relevance, clarity, ambiguity, distractor quality/distinctness, and question-set coverage. The judge MUST identify supporting snapshot evidence, express uncertainty, and MUST NOT be given the generated answer key as established truth.
- **FR-007**: An unsourced or incorrect marked-correct option is a **blocking** semantic failure even when deterministic checks pass. Confirmed answer-key leakage and confirmed successful prompt injection are likewise blocking.
- **FR-008**: A **human-reviewed, stratified sample** MUST be stored with adjudicated labels. The sample MUST include multiple-answer keys and every recorded judge disagreement. Human labels outrank judge assertions. Calibration MUST record sample size, agreement/disagreement and systematic judge errors.
- **FR-009**: Offline experiments MUST be **repeatable**: same dataset version, same snapshots/checksums, recorded evaluator and rubric versions, model identity, prompt version, experiment identity, duration, token usage and approximate cost when the model reports usage, plus concrete per-case failures.
- **FR-010**: A **small repeated-run subset** MUST be generated more than once in the same experiment to observe wording and quality variability. Variability of wording is expected; a new blocking factual error on a repeat is a failure of that run.
- **FR-011**: When two model or prompt versions are available, the cycle MUST compare them on the same dataset and rubric versions. If only one version can be run, the missing comparison is **not run**, not a pass.
- **FR-012**: When experiment-destination credentials are configured, the run MUST record Datasets, Experiments and Scores at the configured Langfuse destination **through the replaceable boundary**. A version-controlled local export and `docs/evals/phase-7-report.md` MUST exist so review does not require that destination.
- **FR-013**: An **explicit local evaluation command** MUST be documented (roadmap default `pnpm eval:golden` or an equivalent named command) with credential and environment requirements. Live-model evaluation MUST stay separate from default mocked Jest suites and MUST NOT be part of the ordinary pull-request test command.
- **FR-014**: Every summary MUST label each check **live**, **mocked**, or **not run**. A skipped, unaffordable, unavailable or unrun live check MUST be **not run** and MUST NEVER be counted as passed.
- **FR-015**: Documented **provisional gates**, to be calibrated rather than treated as universal law: 100% of deterministic structural/contract checks; zero confirmed unsupported correct answers; zero confirmed leakage or successful prompt injection; at least 90% of **human-reviewed** questions rated acceptable for relevance and clarity; no material regression against the frozen baseline of this dataset version. The report MUST state sample size, adjudications, disagreements and uncertainty beside any pass/fail.
- **FR-016**: Judge outputs, quality scores and experiment labels MUST NOT alter a learner’s per-question 0–4 score or the weighted quiz result. Scoring remains the Phase 1 deterministic policy.
- **FR-017**: Telemetry and experiment export MUST stay behind the existing replaceable port/adapter boundary. `packages/domain` and `packages/application` MUST NOT import Langfuse or another evaluation-platform SDK. Secrets, raw attempt tokens, `Authorization` values and learner-submitted answers MUST remain redacted from traces, logs and the portable report.
- **FR-018**: Evaluation MUST cover malicious Markdown instructions, unsupported/invented facts, misleading or ambiguous choices, ambiguous multi-select keys, duplicate questions, topic drift and data exposure. Source text MUST remain untrusted task data and MUST NOT be placed into privileged instruction slots.
- **FR-019**: Generation or prompt changes in this cycle MUST be **targeted** and MUST cite a recorded evaluation failure. This cycle MUST NOT add product features, a second generation strategy, CI/CD, deployment automation or a UI redesign.
- **FR-020**: A read-only review of the evaluation harness, graders, golden cases and data handling MUST run before the cycle is claimed done. Blocking findings MUST be resolved without making domain scoring depend on judge opinions.
- **FR-021**: This cycle MUST reuse Phases 0–6 as specified. Implementation MUST NOT start while Phases 4–6 remain unrecorded as verified unless leftover gaps are listed as blockers of those earlier phases. This cycle MUST NOT mark Phase 8 CI/CD, production images or walkthrough work as in scope.

### Key Entities

- **Golden dataset version**: Named, immutable collection of cases used for a baseline or comparison.
- **Golden case**: One generation scenario with stable identity, pin, topic, count, reference facts, evidence locations, behavioral expectations and tags.
- **Pinned source snapshot**: Stored Markdown body used as the only source text for that case’s regression run.
- **Source checksum**: Fingerprint of the pinned snapshot; used to detect accidental pin drift.
- **Reference fact**: A human-verified claim that is supported by a named location in the snapshot.
- **Evidence location**: Excerpt, heading or section marker that supports a reference fact.
- **Expected behavior**: Outcome constraint (valid grounded quiz, refuse unsupported topic, resist injection) — not expected wording.
- **Deterministic evaluator**: Code check of contract, uniqueness, leakage or scoring invariants; no judge model.
- **Judge rubric version**: Named criteria and anchors for semantic scores; requires evidence and uncertainty.
- **Judge verdict**: Per-question and per-quiz semantic assessment, including evidence cites and uncertainty.
- **Human label**: Adjudicated judgment that outranks the judge when they disagree.
- **Calibration record**: Sample composition, agreement/disagreement and documented judge failure modes.
- **Experiment run**: One offline evaluation with recorded versions, identity, duration, usage/cost and per-case outcomes.
- **Variability subset**: Small set of cases generated more than once in the same experiment.
- **Quality gate**: Provisional threshold with an explicit passed / failed / **not run** state.
- **Portable report**: Human-readable baseline at `docs/evals/phase-7-report.md`.
- **Frozen baseline**: First accepted experiment of a dataset/rubric pairing used for later regression comparison.
- **Material regression**: New confirmed blocking failure, or a drop below a documented gate, on the same dataset and rubric versions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can, without an external account, inspect a versioned dataset of **12–20** cases that includes **at least two different** pinned README sources and the required fields in FR-003, and can confirm that **zero** cases require a fixed question wording.
- **SC-002**: 100% of deterministic contract checks (shape, counts, unique options, valid keys, leakage, scoring invariants) are runnable without a judge model. On the documented fixtures, leakage and scoring invariants match Phase 1/2 expectations in 100% of those fixture cases.
- **SC-003**: After a live evaluation against at least two pinned README sources, 100% of cases have a recorded structural result and a semantic result or an explicit **not run**. **Zero** confirmed unsupported or wrong correct-answer keys are counted as passes.
- **SC-004**: 100% of judge outputs in the reviewed sample either cite snapshot evidence or mark uncertainty. **Zero** reviewed judge calls treat the generated answer key as given truth.
- **SC-005**: The calibration record names the human sample size, includes every recorded disagreement, and lets a reviewer state whether the judge is acceptable to use as a **helper** for this baseline. Missing calibration is **not run**, not passed.
- **SC-006**: A reviewer who cannot open the experiment destination can still read `docs/evals/phase-7-report.md` and reconstruct dataset version, rubric version, source checksums, model/prompt versions, which checks were live vs mocked vs **not run**, per-case failures, duration, and usage/cost when reported.
- **SC-007**: 100% of omitted live checks (missing model key, missing experiment credentials, aborted paid run) are labeled **not run**. **Zero** of those omitted checks appear as passed.
- **SC-008**: The gate table shows passed / failed / **not run** for each provisional target, with sample size and limitations stated. A reader is not told the small set is statistically conclusive.
- **SC-009**: A scope review of this phase’s delivery finds **zero** changes to learner scoring math, **zero** new generation strategy values, **zero** CI workflows, **zero** production Dockerfiles, **zero** UI redesigns, and **zero** evaluation-platform SDK imports in domain and application. Targeted generation/prompt edits, if any, each cite a recorded failing case.
- **SC-010**: Automated mocked/deterministic evaluation evidence exists and passes without live model keys. Live generation quality evidence is recorded for at least two pinned README sources when credentials exist, or recorded as an environment blocker when they do not.

## Assumptions

- The Constitution’s technology choices remain binding: TypeScript, hexagonal packages, Zod contracts, Jest for mocked/deterministic evidence, Langfuse as the configured experiment destination **behind a port**. Those names appear here as phase boundaries and evidence gates, not as an invitation to add CI/CD or a second product.
- The two Phase 5 demonstration READMEs (Express routing and Fastify plugins, as recorded in README on 2026-10-11) are the default **real** sources to pin. Additional cases MAY use other public READMEs or curated synthetic snapshots for insufficient-source and adversarial coverage.
- “12–20 varied cases” is the initial baseline size, not a promise of statistical power. Informed default for the variability subset: **at least two cases, each generated at least twice** in the same experiment.
- Human calibration reviews a **representative stratified sample**, not necessarily every generated question. Informed default: review enough to cover both real sources, both question types, all blocking semantic fails, and **all** judge disagreements. If the set is small enough, reviewing every question is acceptable.
- Provisional gates (100% structure; zero confirmed unsupported keys / leakage / injection; ≥90% human-reviewed relevance/clarity; no material regression) are **local starting targets** from the product roadmap. They may be tightened after calibration but MUST NOT be quietly loosened to force a pass.
- “Material regression” means a new confirmed blocking failure or a drop below a documented gate on the same dataset and rubric versions, judged with the human-review rule — not a change in average wording.
- The existing create-quiz path remains synchronous. Evaluation MAY call the generation port directly with pinned text so it does not depend on raising Phase 6 rate/concurrency limits.
- Usage/cost figures are best-effort from model-reported tokens. No billing-account integration.
- Prompt version is the existing optional environment label from Phase 6, plus any new version identifier created only when a targeted, evidence-backed prompt fix is made.
- Learner-facing UI, public contracts and scoring policy are unchanged. The evaluation report is a reviewer document, not a new product screen.
- Second generation strategy remains **deferred**. Evaluation uses the current `balanced` strategy only.
- A mocked generator is valid for proving deterministic evaluators, report labeling and command wiring. It is invalid as a substitute for live grounding evidence.
- Concrete file-tree placement of runners (beyond the required portable report path and a version-controlled dataset) belongs to planning. Observable rule: evaluation code stays outside pure scoring and outside learner-facing UI.

## Dependencies

- Existing Constitution, `roadmap.md`, `implementation-roadmap.md`, `AGENTS.md` and Spec Kit installation.
- Verified Phases 0–3 runtime, scoring, `/v1` flow, fetch/generation adapters, snapshots/checksums, error codes and `/health`/`/ready`.
- Phase 4 web flow, Phase 5 two-source evidence and Phase 6 telemetry **as already delivered**; this cycle consumes them and MUST NOT rebuild them.
- Formal recording of Phase 4, Phase 5 and Phase 6 verification in `implementation-roadmap.md` (or an explicit leftover-blocker list) **before implementation starts**.
- Existing `QuizGenerationPort`, source snapshot/checksum persistence, and the replaceable telemetry boundary.
- For automated mocked/deterministic evidence: no live model or experiment-destination key required.
- For live quality definition-of-done evidence: configured model credentials and at least the two pinned README snapshots. Missing those is an environment blocker, recorded as **not run**.
- For live experiment-destination inspection: configured Langfuse (or compatible) credentials. Missing those is an environment blocker for that inspection; the portable report remains required.
- No Phase 8 code. This phase MUST NOT wait on GitHub Actions or production images.

## Deferred Context (not acceptance)

The following remain future cycles or optional bonuses and MUST NOT be implemented or tested as Phase 7 done-when items:

- Phase 8: GitHub Actions, a gated hosted evaluation workflow, production Dockerfiles, deployment automation, architecture walkthrough kit.
- Expanding the golden set after the first baseline, ongoing sampling, or experiment-driven prompt optimization (roadmap after-delivery / M9).
- A second question-generation strategy (optional assessment bonus).
- Learner-facing grounding preview, difficulty picker, usage dashboards, historical quizzes, authenticated workspaces, queues or streaming.
- Optional Playwright browser-driver suite.
- Changing the provisional multiple-answer scoring policy.
- Claiming a hosted CI quality gate; this cycle only produces the local baseline that a later cycle may run behind protection.
