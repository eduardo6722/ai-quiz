# Contract: Question uniqueness

A ready quiz MUST NOT contain duplicate questions. This is a quiz invariant, enforced after generation and before persist.

## Prompt uniqueness

Two questions are duplicates when their prompts are equal after:

- trim
- `toLocaleLowerCase('en-US')`

Examples that MUST fail:

- `"What is a port?"` and `"What is a port?"`
- `"What is a port?"` and `"  What is a port?  "`
- `"What is a port?"` and `"what is a port?"`

Distinct prompts that ask different facts MUST pass.

## Outcome

Duplicate prompts are **invalid generation**:

1. Do not insert a ready quiz.
2. Retry within the existing bound (3 total attempts).
3. After exhaustion, return `GENERATION_RETRIES_EXHAUSTED` (422) if every attempt failed this way (or `GENERATION_INVALID` when rejected with no remaining retries — same mapping as today’s schema/policy failures).

`SOURCE_UNUSABLE` is **not** used for this path: the source may have been sufficient; the model padded anyway.

## Out of this contract

- Unique `sourceExcerpt` values are **not** required.
- Thin one-section sources at count 8 MUST already fail [source-sufficiency.md](./source-sufficiency.md) before generation, so they never rely on this uniqueness check to avoid an 8-question padded quiz.
- Semantic paraphrase detection (embeddings / judge) is **not** on the product create path.

## Prompt instruction

Generation instructions MUST tell the model to ask a different fact in each question and not to repeat or rephrase the same question. Validation above remains authoritative.
