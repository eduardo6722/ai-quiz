# Error codes (Phase 3)

Stable string codes. Fail closed. Do not leak stack traces, Prisma traces, provider traces, prompts, tokens, hashes, API keys or answer keys.

Body shape: `{ "code": "<CODE>", "message": "<English, non-secret>" }`.

Phase 2 codes remain. New fetch/generation codes are required this cycle.

| Code | HTTP | Meaning |
| ---- | ---- | ------- |
| `CREATE_QUIZ_INVALID` | 400 | Topic empty/whitespace, URL not `https` **shape**, count not 5–8, or `strategy` not `balanced`. No fetch. |
| `SOURCE_UNSAFE_DESTINATION` | 400 | Private, loopback, link-local, metadata, unique-local, multicast, unspecified, `http`, non-443, userinfo, or redirect to any of these. |
| `SUBMIT_ANSWERS_INVALID` | 400 | Submit payload fails schema. |
| `SELECTION_ILLEGAL` | 400 | Selection arity, duplicates, unknown ids, or options that do not belong. |
| `ATTEMPT_INCOMPLETE` | 400 | At least one quiz question has no legal selection. |
| `UNAUTHORIZED_ATTEMPT` | 401 | Missing, malformed, non-matching or other-attempt Bearer token. |
| `QUIZ_NOT_FOUND` | 404 | No quiz with that id. |
| `ATTEMPT_NOT_FOUND` | 404 | No attempt with that id. |
| `SOURCE_TOO_LARGE` | 413 | Remote body exceeds 512 KiB. |
| `SOURCE_UNSUPPORTED_TYPE` | 415 | Content-Type not Markdown/plain text (see fetch contract). |
| `ATTEMPT_NOT_SCORED` | 409 | Result requested before a successful submit. |
| `QUIZ_NOT_PLAYABLE` | 409 | Quiz exists but is not `ready`. |
| `SOURCE_UNUSABLE` | 422 | Empty, binary, invalid UTF-8, or shorter than 200 characters after normalize. |
| `GENERATION_INVALID` | 422 | Structured output failed schema or policy (wrong count/options/keys/excerpts). May be retried internally. |
| `GENERATION_RETRIES_EXHAUSTED` | 422 | Three generation attempts failed validation/schema/grounding. |
| `QUIZ_INVALID` | 422 | Playable quiz would break domain invariants; nothing playable is stored. |
| `SOURCE_FETCH_FAILED` | 502 | DNS failure, connect error, non-success HTTP status, or too many redirects. |
| `GENERATION_UPSTREAM_FAILED` | 502 | Provider timeout/error, or missing `OPENAI_API_KEY` / model id on the product path. |
| `SOURCE_TIMEOUT` | 504 | Fetch exceeded 10 seconds. |

**Not an error**: second submit on a scored attempt with a valid token. Return the frozen stored result (HTTP 200).

Fetch failures are **not** retried. Generation schema/policy/upstream failures **are** retried up to 3 attempts except missing key/model (fail immediately as `GENERATION_UPSTREAM_FAILED`).
