# Phase 1 Research

**Feature**: Phase 1 Domain Scoring and Public Contracts  
**Date**: 2026-10-10  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution, `roadmap.md`, `implementation-roadmap.md` and the Phase 1 clarifications bind behavior; this file chooses package layout, scoring isolation, contract placement and test strategy. Reuse Phase 0 shells; do not re-scaffold.

---

## 1. Package layering

**Decision**: Extend the existing `@ai-quiz/domain`, `@ai-quiz/application` and `@ai-quiz/contracts` packages only.

- **Domain**: quiz/question/option/attempt types, invariant validation, `scoreSingleChoice`, isolated `scoreMultipleChoice` (provisional policy), `calculateWeightedScore`, display rounding, in-memory attempt freeze. **No Zod. No I/O.**
- **Contracts**: Zod 4 schemas and inferred public types for create-quiz input, submit-answers input, public quiz view (no keys) and public result (includes post-submit correctness). Stable error codes as string literals.
- **Application**: `gradeAttempt` orchestration — validate quiz, require a legal selection for every question, score, freeze, map to public quiz view / result. Depends on `domain` and `contracts`. **No ports, no repositories.**

**Rationale**: Constitution I–II put entities and scoring in domain, use cases in application, public schemas in contracts. Spec FR-021 forbids new persistence/HTTP packages. Phase 2 will add repository ports; adding empty ports now is an extra layer without a consumer.

**Alternatives considered**:
- Put scoring in application — violates Constitution V (scoring is domain).
- Put Zod in domain — couples invariants to HTTP/public schema tooling.
- Define `QuizRepositoryPort` now — unused until Phase 2; Constitution II forbids extra layers without a boundary.

---

## 2. Zod in contracts (not domain)

**Decision**: Add **Zod `^4.1.11`** as a runtime dependency of `@ai-quiz/contracts` (same major already used for API/web env). Domain `package.json` stays free of Zod. Application may import parsed contract types and mapping helpers; it MUST NOT reimplement schema parse.

**Rationale**: Constitution IV: public inputs and DTOs live in `packages/contracts`. Phase 0 already standardized Zod 4 on the apps. Sharing the same major avoids dual schema runtimes.

**Alternatives considered**:
- Duplicate request types as TypeScript-only in domain — Constitution requires Zod at the public boundary.
- Zod 3 — apps already use 4.
- Parse in application with inline schemas — would fork the public contract.

---

## 3. Isolated multiple-answer policy

**Decision**: Implement `scoreMultipleChoice(question, selectedOptionIds)` as its own function (or strategy object) with a short exported policy note string. `scoreSingleChoice` is separate. A tiny dispatcher `scoreQuestion` may switch on type. Changing the multi-answer rubric MUST NOT require edits to weighting, contracts or attempt freeze.

Policy (provisional, `roadmap.md`): one point per correctly selected option, clamp `[0, 4]`, incorrect selections add 0 and subtract 0, no rescaling of a partial set to 4.

**Rationale**: Spec FR-008/FR-009 and Constitution V require a replaceable multi-select rubric. The assessment left penalties/normalization unspecified; isolation is the interview-honest design.

**Alternatives considered**:
- Single `score(question, answers)` blob — mixing types makes a later rubric change rewrite weighting tests.
- Invented penalties or “percent of correct options × 4” — forbidden by the spec.

---

## 4. Weighted average, floats and display rounding

**Decision**:

- `weight(i) = 1.1 ** i` (`Math.pow(1.1, i)`).
- `weightedScore = Σ(score[i] × weight(i)) / Σ(weight(i))` over the provided score list (length 1+ for the isolated function; playable quizzes still 5–8).
- Retain the IEEE value; do not round it for storage/comparison of the raw score.
- Display: half-up to two decimals on **non-negative** values via `Math.round(x * 100) / 100`. Percentage = `(weightedScore / 4) * 100` then the same display round.
- Isolated fixture: scores `[4, 2, 0]` → unrounded `6.2 / 3.31`, display `1.87` and `46.83`.
- Playable all-correct / all-wrong / index 0 and 7 fixtures use 5–8 question quizzes.

**Rationale**: Spec clarifications keep the 3-score sample off the 5–8 quiz invariant. `Math.round` on `x * 100` is ordinary half-up for the 0–4 domain (no negatives). Tests assert `weightedScore === 6.2 / 3.31` (or the same expression) plus independent display assertions.

**Alternatives considered**:
- Pad the sample to five questions — changes the documented 6.2 ÷ 3.31 total.
- `Number.toFixed` only — rounding mode varies; keep an explicit half-up helper.
- Decimal.js — unjustified for 5–8 terms of `1.1 ** i`.

---

## 5. In-memory attempt freeze (no persistence)

**Decision**: An `Attempt` value holds `status: "open" | "scored"`, the quiz identity, and once scored a frozen `PublicResult` (or equivalent domain result). `gradeAttempt` on a scored attempt returns the frozen result and **does not inspect** a new answer payload. No database, tokens or uniqueness constraints.

**Rationale**: Spec FR-020 / clarification Q4: any later submit returns original scores, even if answers differ. Phase 2 owns durable tokens and HTTP idempotency.

**Alternatives considered**:
- Reject a second payload that differs — rejected in clarification.
- Re-score when answers change — forbidden by Constitution V.

---

## 6. Identities and fixtures

**Decision**: Callers (tests) supply string identities for quizzes, questions, options and attempts. Domain validates uniqueness (questions unique on a quiz; options unique by id and label within a question; positions 0..n-1 contiguous). No UUID library.

**Rationale**: Phase 1 has no persistence or HTTP minting. Fixtures stay readable (`q1`, `opt-a`). Phase 2 can mint ids in adapters.

**Alternatives considered**:
- Auto-generate UUIDs in domain — hides fixture intent and adds a dependency.
- Numeric-only ids — unnecessary restriction.

---

## 7. Public mapping and key isolation

**Decision**:

- `toPublicQuizView(quiz)` copies ids, topic, source URL, count, prompts, types, option labels/positions — **never** `isCorrect`.
- `toPublicResult(quiz, scoredAttempt)` includes per-question raw scores, unrounded weighted score, display fields, percentage display, selected option ids, and which options were correct (`isCorrect` on options **only here**).
- Result mapping MUST throw/fail if the attempt is not scored.
- Zod schemas encode the same split: quiz-view schema has no correctness field; result schema requires it.

**Rationale**: Clarification Q3 and FR-014/015/018. Constitution: keys never appear before submission.

**Alternatives considered**:
- One DTO with optional `isCorrect` — easy to leak on the quiz view.
- Scores-only result — rejected in clarification.

---

## 8. Error codes

**Decision**: Stable string codes, fail closed. Contracts parse failures and domain invariant failures share the same code family so Phase 2 HTTP can map them.

| Code | When |
| ---- | ---- |
| `CREATE_QUIZ_INVALID` | Topic empty, non-HTTPS URL, count not 5–8 |
| `SUBMIT_ANSWERS_INVALID` | Malformed submit payload (shape, duplicate option ids in one answer, empty id) |
| `QUIZ_INVALID` | Playable-quiz invariant broken (count, four unique options, types, positions, correct-option arity) |
| `SELECTION_ILLEGAL` | Wrong arity for type, unknown option/question, duplicates, option from another question |
| `ATTEMPT_INCOMPLETE` | Any quiz question lacks a legal selection |
| `ATTEMPT_NOT_SCORED` | Public result requested before scoring |

A scored attempt that is submitted again is **not** an error: return the frozen result (`FR-020`).

**Rationale**: Constitution IV requires stable error codes. Clarification deferred exact catalog as plan-level; this list is the catalog.

**Alternatives considered**:
- Thrown `Error` messages only — unstable for later HTTP.
- Numeric enums — string codes are easier to assert in Jest and map in Phase 2.

---

## 9. Create-quiz input vs in-memory quiz

**Decision**: `createQuizRequestSchema` validates topic / HTTPS URL / count only. It does **not** fetch, generate, or persist. Playable quizzes in tests are **fixture objects** that already satisfy domain invariants. Application does not expose `CreateQuizUseCase` this phase (that needs Phase 2 fixtures/REST).

**Rationale**: Spec exclusions: no fetch, generation or REST. Contracts still exist so later adapters share one parse.

**Alternatives considered**:
- Application `createQuiz` that builds empty quizzes — out of scope and unused.
- Skip create-quiz schema until Phase 2 — spec FR-012 requires it now.

---

## 10. HTTPS URL shape (no fetch)

**Decision**: Accept strings that parse as URLs with scheme `https` (host required). Allow path/query. Reject `http`, missing scheme, empty host. Do **not** resolve DNS, follow redirects, or block private IPs (Phase 3).

**Rationale**: Spec: shape only. SSRF belongs with fetching.

**Alternatives considered**:
- Require `.md` suffix — not in the assessment.
- Embed SSRF checks now — Phase 3 scope.

---

## 11. Testing

**Decision**: Jest unit tests colocated as `*.spec.ts` in each package (Phase 0 pattern). `pnpm test` from the repo root. No PostgreSQL, no network, no model keys.

Required coverage matches FR-019: single 4/0, multi 0–4 / extra wrong / no normalization, mixed quiz, invalid/duplicate/incomplete, order vs position, index 0 and 7 on an 8-question quiz, all-correct/all-wrong on 5–8 quizzes, isolated `[4,2,0]` weights, freeze with same and different second payload, quiz view without keys, result with keys.

Application tests call `gradeAttempt` directly (no mocked ports). Domain tests call scoring/validation without application. Contract tests parse valid/invalid payloads and assert quiz-view schema rejects `isCorrect`.

**Rationale**: Constitution VI; spec SC-003 (no database/model).

**Alternatives considered**:
- Integration tests against Compose Postgres — Phase 2.
- Vitest — Constitution forbids replacing Jest.

---

## 12. Dependencies we will not add

**Decision**: Do not add NestJS quiz modules, Prisma models, OpenAI/AI SDK, Langfuse, UUID, decimal libraries, HTTP servers in these packages, or new workspace packages.

**Rationale**: Spec exclusions and Constitution I/II/VII/VIII.

**Alternatives considered**: none in scope.
