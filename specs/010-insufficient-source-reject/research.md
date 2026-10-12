# Research: Reject Insufficient Markdown Sources

**Feature**: `010-insufficient-source-reject`  
**Date**: 2026-10-12

Phase 0 research. All Technical Context unknowns are resolved here. No `NEEDS CLARIFICATION` remains.

## 1. Where sufficiency is judged

**Decision**: Judge count-relative sufficiency in `packages/application/src/quiz/` after fetch and before `generate`. Keep adapter checks for binary, invalid UTF-8, and empty-after-normalize only.

**Rationale**: `MarkdownSourcePort.fetch` does not receive `questionCount`. Sufficiency is a create-quiz policy (like grounding), not a fetch-safety rule. Domain must stay free of Markdown parsing. The source adapter already rejects NULs/binary; heading-only text is non-empty after normalize and must fail in the use case.

**Alternatives considered**:

- Restore the Phase 3 **200-character** floor as the only gate — spec FR-004 forbids length-alone; `'a'.repeat(200)` and a repeated sentence would still reach the model.
- Put claim counting in the HTTPS adapter — adapter would need the requested count, leaking create-quiz policy into fetch.
- New error code `SOURCE_INSUFFICIENT` — extra contract surface; `SOURCE_UNUSABLE` already means “do not generate; nothing playable.”

## 2. Claim-unit heuristic (count-relative)

**Decision**: A **claim** is a unique sentence remaining after:

1. Drop ATX heading lines (`/^#{1,6}\s/`).
2. Drop empty lines.
3. Split remaining text on sentence boundaries (`.`, `?`, `!` followed by whitespace or end of text). List items (`- ` / `* `) count as their own units.
4. Normalize each unit: Unicode NFKC, trim, collapse internal whitespace, `toLocaleLowerCase('en-US')`.
5. Keep units with **at least 4 words** and **at least 24 characters**.
6. Deduplicate by the normalized key.

The source is insufficient when `uniqueClaims.size < questionCount`. Empty, whitespace-only, heading-only, comment-stripped-empty, and repeated-identical-paragraph documents therefore fail for every legal count (5–8). A one-section body with one keepable sentence fails at 5 and at 8. A body with six unique claims may pass at 5 and **must** fail at 8. The product never lowers the requested count.

**Rationale**: Spec FR-003/FR-004/FR-005. Distinct sentences are a deterministic, reviewable proxy for “enough facts.” Deduping catches FR-004 (long because the same sentence repeats). The 4-word / 24-character floor drops “hello”, “See docs.”, and heading leftovers without needing a second model.

**Alternatives considered**:

- Character count or section count only — fails FR-004 and the one-section-at-8 case (one heading is still one section even when the body is rich).
- Require `uniqueClaims >= 2 * questionCount` — over-rejects ordinary short READMEs.
- LLM-as-judge of sufficiency on the product path — forbidden (scoring/create must stay deterministic; Phase 7 already judges quality offline).
- Unique excerpts as the sufficiency definition — too late (after generation) and too strict for dense sentences that can ground two different questions.

**Fixture impact**: Happy-path snapshots used today (`SAMPLE_SNAPSHOT`, `FIXTURE_SNAPSHOT`, Express/Nest E2E markdown) have fewer than eight unique claims. This cycle MUST expand those bodies to **≥ 8** keepable unique claims so count 5 and count 8 still succeed. Keep existing grounding excerpts as substrings of the expanded text.

## 3. Duplicate questions: domain prompts, not excerpt identity

**Decision**:

- Extend `validateQuiz` to reject two prompts that match after trim + `toLocaleLowerCase('en-US')` (`QUIZ_INVALID`). `CreateQuizUseCase` already maps that to `GENERATION_INVALID` and retries (max 3), then `GENERATION_RETRIES_EXHAUSTED`.
- Do **not** require unique `sourceExcerpt` values. Same-passage restatement from a **thin** source is stopped by the claim-unit gate before `generate`. Unique excerpts would break legitimate citations of one dense sentence and would force every fixture question onto a different excerpt.
- Instruct the model not to repeat or rephrase the same question (prompt text only). Instruction is not a substitute for validation.

**Rationale**: Spec FR-006/FR-007. Exact/case duplicate prompts are the automated uniqueness floor (same rule as Phase 7 `evaluateDuplicates`). The canonical one-section-at-8 fixture never reaches generation. Constitution V: quiz invariants belong in the domain.

**Alternatives considered**:

- Application-only duplicate check — would leave `validateQuiz` accepting duplicate prompts that evals already fail.
- Semantic near-duplicate embeddings on the product path — extra provider, non-deterministic, out of MVP.
- Unique excerpts — see above; rejected.

## 4. Error mapping and learner copy

**Decision**:

| Failure | Code | HTTP (unchanged) | Learner copy |
| ------- | ---- | ---------------- | ------------ |
| Empty, whitespace, heading-only, too few unique claims | `SOURCE_UNUSABLE` | 422 | That source does not have enough information to generate a quiz. |
| Duplicate / restated prompts after generation (retries exhausted) | `GENERATION_INVALID` then `GENERATION_RETRIES_EXHAUSTED` | 422 | Could not prepare questions from that source. Try again. (unchanged) |
| Binary / invalid UTF-8 | `SOURCE_UNUSABLE` | 422 | Same copy as too-thin (one code, one sentence). |

`SOURCE_UNUSABLE` is **not** retried. Duplicate-prompt `GENERATION_INVALID` **is** retried inside the existing bound. No new error codes, routes, or screens.

**Rationale**: Spec FR-008/FR-009/FR-010. Clarifying `SOURCE_UNUSABLE` copy is the setup-flow change. `SOURCE_UNSUPPORTED_TYPE` stays “That source is not usable Markdown.”

**Alternatives considered**:

- New `SOURCE_INSUFFICIENT` — unnecessary split from unusable.
- Keep “not usable Markdown” for empty files — does not meet FR-010.

## 5. Adapter empty check vs application claims

**Decision**: Adapter `MIN_USABLE_CHARS` becomes **1** (reject only empty-after-normalize). Replace the Phase 3 “199 vs 200 characters” adapter test. Application claim-units are the real sufficiency gate, including `'a'.repeat(199)` (one non-sentence blob → 0–1 claims → still `SOURCE_UNUSABLE` at count 5).

**Rationale**: A 200-character floor is neither necessary nor sufficient. Empty files should still fail in the adapter so obviously blank fetches never become snapshots that look fetch-successful.

**Alternatives considered**: Keep 200 in the adapter **and** add claims — double gate, still length-alone for the first hop, and heading-only `# Title` plus padding spaces could game 200 without claims.

## 6. Tests and fixture placement

**Decision**: Colocate unit tests with source. Do not add a fixtures package.

| Layer | Coverage |
| ----- | -------- |
| `packages/domain/src/quiz/quiz.spec.ts` | Duplicate prompts (same text, extra spaces, letter-case). |
| `packages/application/src/quiz/source-sufficiency.spec.ts` | Empty, whitespace, heading-only, comments-only, repeated sentence, one-section vs count 5/8, six-claim body at 5 vs 8, ≥8-claim rich body. |
| `packages/application/src/quiz/create-quiz.spec.ts` | Empty/heading-only/one-section-at-8 do not call `generate` and insert nothing; mocked duplicate prompts → retries then no ready quiz; expanded `SAMPLE_SNAPSHOT` still succeeds at 5 and 8. |
| `apps/api/src/quiz/source/normalize-markdown.spec.ts` | Empty-after-normalize / binary only; drop 200-char floor. |
| `apps/api/test/e2e/quiz/quiz-source-errors.spec.ts` | Real fetch transport: empty body and one-section count 8 → 422 `SOURCE_UNUSABLE`, zero ready rows. |
| `apps/api/test/e2e/quiz/quiz-generation-errors.spec.ts` | Mocked duplicate prompts → 422 `GENERATION_RETRIES_EXHAUSTED`, zero ready rows. |
| `apps/web/.../error-copy.spec.ts` | New `SOURCE_UNUSABLE` sentence. |

Expand `FIXTURE_SNAPSHOT` / two-source markdown so default E2E create still works at count 5. Phase 7 golden insufficient pin stays complementary; this cycle does not freeze a new eval baseline.

**Rationale**: Spec FR-013 / SC-007. Constitution VI: tests with the behavior. Folder architecture: `quiz/` context, no `helpers/` dump.

## 7. Scope that stays unchanged

**Decision**: No Prisma migration, no new ports, no new workspace packages, no scoring/token/SSRF changes, no auto-reduced question counts, no file-upload path.

**Rationale**: Spec exclusions and Constitution VIII. This is a create-quiz quality gate on the existing hexagonal slice.
