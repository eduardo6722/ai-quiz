# Error codes (delta)

Stable string codes. Fail closed. Do not leak stack traces, provider traces, prompts, tokens, hashes, API keys or answer keys.

Body shape unchanged: `{ "code": "<CODE>", "message": "<English, non-secret>" }`.

No new codes. Phase 3 table remains, with this cycle’s meaning for unusable sources:

| Code | HTTP | Meaning this cycle |
| ---- | ---- | ------------------ |
| `SOURCE_UNUSABLE` | 422 | Empty, binary, invalid UTF-8, heading-only / comments-only after normalize, or unique keepable claims **fewer than** the requested question count. **Not retried.** Generation is not invoked for empty/too-thin snapshots. |
| `GENERATION_INVALID` | 422 | Structured output failed schema or policy, including **duplicate prompts** (trim + case-fold). May be retried internally. |
| `GENERATION_RETRIES_EXHAUSTED` | 422 | Three generation attempts failed validation/schema/grounding/uniqueness. |

Other `SOURCE_*` / `GENERATION_*` / attempt codes are unchanged from [Phase 3 error-codes](../../005-phase-3-markdown-generation/contracts/error-codes.md).

Fetch failures remain not retried. Duplicate-prompt generation failures **are** retried up to 3 attempts. Missing model key still fails immediately as `GENERATION_UPSTREAM_FAILED`.
