# Learner error copy

API body remains `{ "code": "<CODE>", "message": "<English, non-secret>" }` (Phase 3 [error-codes.md](../../005-phase-3-markdown-generation/contracts/error-codes.md)).

The web app maps `code` to a **stable learner sentence**. Do not show stack traces, tokens, hashes, API keys, or model output.

| Code | Screen | Learner copy |
| ---- | ------ | ------------ |
| *(field invalid before POST)* | Setup | Schema-driven field messages (topic required; URL must be `https`; count 5–8). |
| `CREATE_QUIZ_INVALID` | Setup | Check the topic, URL, and question count. |
| `SOURCE_UNSAFE_DESTINATION` | Setup | That address cannot be used as a quiz source. |
| `SOURCE_UNSUPPORTED_TYPE` | Setup | That source is not usable Markdown. |
| `SOURCE_TOO_LARGE` | Setup | That source is too large to use. |
| `SOURCE_UNUSABLE` | Setup | That source is not usable Markdown. |
| `SOURCE_TIMEOUT` | Setup | Could not read the Markdown source. Try again. |
| `SOURCE_FETCH_FAILED` | Setup | Could not read the Markdown source. Try again. |
| `GENERATION_INVALID` | Setup | Could not prepare questions from that source. Try again. |
| `GENERATION_RETRIES_EXHAUSTED` | Setup | Could not prepare questions from that source. Try again. |
| `GENERATION_UPSTREAM_FAILED` | Setup | Could not prepare questions from that source. Try again. |
| `QUIZ_INVALID` | Setup | Could not prepare questions from that source. Try again. |
| `QUIZ_NOT_FOUND` | Player / results | This quiz is not available. |
| `QUIZ_NOT_PLAYABLE` | Player | This quiz is not available. |
| `ATTEMPT_NOT_FOUND` | Results | This result cannot be shown from this browser sitting. |
| `UNAUTHORIZED_ATTEMPT` | Results / submit | This result cannot be shown from this browser sitting. |
| `ATTEMPT_NOT_SCORED` | Results | Submit your answers to see the result. |
| `SUBMIT_ANSWERS_INVALID` | Player | Check your answers and try submitting again. |
| `SELECTION_ILLEGAL` | Player | Check your answers and try submitting again. |
| `ATTEMPT_INCOMPLETE` | Player | Answer every question before submitting. |
| `NETWORK` (client) | Any | Could not reach the quiz service. Try again. |
| unknown / `INTERNAL_ERROR` | Any | Something went wrong. Try again. |

Unknown codes MUST use the generic fallback, never `String(error)`.

Retry actions: setup → `Try again` (re-enable generate); player submit → keep selections; unavailable quiz → `Create another quiz`.
