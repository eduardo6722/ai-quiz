# Error codes (Phase 2)

Stable string codes. Fail closed. Do not leak stack traces, Prisma traces, tokens, hashes or answer keys.

Body shape: `{ "code": "<CODE>", "message": "<English, non-secret>" }`.

| Code | HTTP | Meaning |
| ---- | ---- | ------- |
| `CREATE_QUIZ_INVALID` | 400 | Topic empty/whitespace, URL not `https`, count not 5–8, or `strategy` not `balanced`. |
| `SUBMIT_ANSWERS_INVALID` | 400 | Submit payload fails schema (missing fields, duplicate option ids in one answer, empty ids, non-array). |
| `SELECTION_ILLEGAL` | 400 | Selection arity, duplicates, unknown ids, or options that do not belong to the question. |
| `ATTEMPT_INCOMPLETE` | 400 | At least one quiz question has no legal selection. |
| `UNAUTHORIZED_ATTEMPT` | 401 | Missing, malformed, non-matching or other-attempt Bearer token on submit or result. |
| `QUIZ_NOT_FOUND` | 404 | No quiz with that id. |
| `ATTEMPT_NOT_FOUND` | 404 | No attempt with that id. |
| `ATTEMPT_NOT_SCORED` | 409 | Result requested before a successful submit. |
| `QUIZ_NOT_PLAYABLE` | 409 | Quiz exists but is not `ready` (should not appear on the fixture happy path). |
| `QUIZ_INVALID` | 422 | Fixture/playable quiz breaks domain invariants; nothing playable is stored. |

**Not an error**: second submit on a scored attempt with a valid token. Return the frozen stored result (HTTP 200).

Phase 3 fetch/generation codes (invalid URL fetch, SSRF, model failure, …) are **not** used this cycle.

Reuse Phase 1 codes where they already apply. New codes: `QUIZ_NOT_FOUND`, `ATTEMPT_NOT_FOUND`, `UNAUTHORIZED_ATTEMPT`, `QUIZ_NOT_PLAYABLE`.
