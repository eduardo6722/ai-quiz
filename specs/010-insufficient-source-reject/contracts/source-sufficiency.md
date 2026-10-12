# Contract: Source sufficiency

Create-quiz MUST refuse generation when the fetched Markdown cannot support the requested number of distinct questions.

`questionCount` remains the existing public input (5–8, default 5). This cycle does not change `POST /v1/quizzes` request or success shapes.

## Pre-generation gate

After a successful fetch and normalize, before `QuizGenerationPort.generate`:

1. If normalized snapshot text is empty after trim → `SOURCE_UNUSABLE`.
2. Extract **claim units** per [data-model.md](../data-model.md).
3. If `uniqueClaimCount < questionCount` → `SOURCE_UNUSABLE`.
4. Otherwise proceed to generation with the existing 32,000-character window.

`SOURCE_UNUSABLE` is not retried. `generate` MUST NOT be invoked. Nothing playable MUST be stored.

## Documented fixtures

These bodies are the contract’s pinned examples. Tests MUST use equivalent content (same claim counts), not merely “short vs long.”

### Empty (`uniqueClaims = 0`)

Empty string, or whitespace-only (`"   \n\t  "`).

### Heading-only (`uniqueClaims = 0`)

```markdown
# Notes
```

### Limited / comments-only (`uniqueClaims = 0`)

```markdown
<!-- badge chrome only -->
```

### Repeated sentence (`uniqueClaims = 1`)

```markdown
Ports are interfaces the core depends on. Ports are interfaces the core depends on.
Ports are interfaces the core depends on. Ports are interfaces the core depends on.
```

Length is irrelevant; unique claims stay 1.

### One short section (`uniqueClaims = 1`) — canonical count-8 reject

```markdown
# Setup

Install the widget with npm to add routing helpers to your application.
```

Requested `questionCount: 8` MUST return `SOURCE_UNUSABLE`. Count 5 MUST also reject (still one claim).

### Six-claim body — count 5 allow, count 8 reject

Six distinct keepable sentences (≥ 4 words and ≥ 24 characters each), no duplicates. Count 5 MAY proceed to generation. Count 8 MUST `SOURCE_UNUSABLE`.

### Rich body — count 5 and 8 allow

At least eight distinct keepable sentences. Existing happy-path snapshots MUST be expanded to this bar so default create tests keep passing.

## HTTP

Unchanged mapping: `SOURCE_UNUSABLE` → **422**, body `{ "code": "SOURCE_UNUSABLE", "message": "<English, non-secret>" }`.

See [error-codes.md](./error-codes.md) and [error-copy.md](./error-copy.md).
