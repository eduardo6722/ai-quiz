# Data Model: Reject Insufficient Markdown Sources

**Feature**: `010-insufficient-source-reject`  
**Date**: 2026-10-12

No new persisted entities. This cycle adds **derived** checks on the existing source snapshot and quiz. PostgreSQL tables, checksums, and attempt rows stay as in Phases 2–3.

## Existing entities (unchanged storage)

### Source snapshot

Durable copy of fetched, normalized Markdown (`originalUrl`, `resolvedUrl`, `contentSnapshot`, `contentHash`, `fetchedAt`, optional `title`).

**This cycle**: a snapshot that fails sufficiency is **not** stored as part of a ready quiz. Fetch adapters MAY still decode/normalize in memory; create-quiz MUST NOT insert a playable quiz.

### Quiz

Playable set of 5–8 questions, status `ready` on success. Linked to its snapshot.

**This cycle**: ready quizzes MUST have unique prompts (see Distinct question). Count still equals the requested 5–8. No `generating` success path.

### Generated question

Prompt, type, four unique options, server-only correctness, optional `sourceExcerpt` for grounding.

**This cycle**: `sourceExcerpt` remains required by application grounding (unchanged). Excerpts are **not** required to be unique across questions.

## Derived value objects (not persisted)

### Claim unit

A quiz-able sentence extracted from `contentSnapshot`.

| Field | Meaning |
| ----- | ------- |
| `normalizedKey` | NFKC, trimmed, collapsed whitespace, English lower-case |
| `wordCount` | Whitespace-separated tokens after normalize |
| `charCount` | Length of the normalized key |

**Validation**: keep only units with `wordCount >= 4` and `charCount >= 24`. Headings, empty lines, and comment chrome do not become claims.

### Source sufficiency assessment

Computed from `(contentSnapshot, questionCount)` immediately after fetch.

| Field | Meaning |
| ----- | ------- |
| `uniqueClaimCount` | Size of the unique `normalizedKey` set |
| `questionCount` | Requested 5–8 (default 5) |
| `sufficient` | `uniqueClaimCount >= questionCount` |

**State**: if `sufficient` is false → `SOURCE_UNUSABLE`, `generate` is not called, nothing playable is stored.

Canonical outcomes:

| Snapshot shape | Unique claims | Count 5 | Count 8 |
| -------------- | ------------- | ------- | ------- |
| Empty / whitespace / comments-only | 0 | reject | reject |
| Heading-only (`# Title`) | 0 | reject | reject |
| One short section (1 keepable sentence) | 1 | reject | reject |
| Repeated identical paragraph | 1 | reject | reject |
| Six distinct keepable sentences | 6 | allow | reject |
| Eight or more distinct keepable sentences | ≥ 8 | allow | allow |

### Distinct question

A question whose prompt is unique in the quiz after trim + English lower-case.

**Validation**: two questions with the same normalized prompt → `QUIZ_INVALID` / `GENERATION_INVALID`. Retried up to the existing bound; then `GENERATION_RETRIES_EXHAUSTED`. Never stored as `ready`.

## State transitions

```text
fetch OK
  → snapshot empty or uniqueClaimCount < questionCount
      → SOURCE_UNUSABLE (no generate, no ready quiz)
  → sufficient
      → generate (≤ 3 attempts)
          → duplicate prompts or other policy/schema failure
              → retry or GENERATION_RETRIES_EXHAUSTED (no ready quiz)
          → valid unique grounded quiz
              → persist ready quiz + snapshot
```

Failed leftover rows remain not startable (`QUIZ_NOT_PLAYABLE`) as today.

## Validation rules (summary)

- Empty after trim / comments stripped → insufficient.
- Unique keepable claims < requested count → insufficient (`SOURCE_UNUSABLE`).
- Length or file size alone MUST NOT mark a source sufficient.
- Requested count is never lowered.
- Duplicate prompts (trim + case-fold) → invalid generation; not persisted.
- Grounding excerpt-in-snapshot unchanged.
- Binary / invalid UTF-8 unchanged (`SOURCE_UNUSABLE` from the adapter).
