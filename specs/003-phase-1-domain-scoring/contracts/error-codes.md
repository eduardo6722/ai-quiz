# Error codes (Phase 1)

Stable string codes. Fail closed. Do not leak stack traces or secrets.

| Code | HTTP later (Phase 2, not this cycle) | Meaning |
| ---- | ------------------------------------ | ------- |
| `CREATE_QUIZ_INVALID` | 400 | Topic empty/whitespace, URL not `https`, or count not 5–8. |
| `SUBMIT_ANSWERS_INVALID` | 400 | Submit payload fails schema (missing fields, duplicate option ids in one answer, empty ids, non-array). |
| `QUIZ_INVALID` | 422 | Playable quiz breaks domain invariants. |
| `SELECTION_ILLEGAL` | 400 | Selection arity, duplicates, unknown ids, or options that do not belong to the question. |
| `ATTEMPT_INCOMPLETE` | 400 | At least one quiz question has no legal selection. |
| `ATTEMPT_NOT_SCORED` | 409 | Public result requested before a successful grade. |

**Not an error**: second `gradeAttempt` on a scored attempt. Return the frozen result (FR-020).

Each failure value SHOULD carry `{ code, message }` where `message` is English, non-secret, and safe for tests to match on `code`.
