# Learner error copy (delta)

Setup-flow mapping only. API body remains `{ "code", "message" }`. Do not show stack traces, tokens, hashes, API keys, or model output.

| Code | Screen | Learner copy |
| ---- | ------ | ------------ |
| `SOURCE_UNUSABLE` | Setup | That source does not have enough information to generate a quiz. |
| `SOURCE_UNSUPPORTED_TYPE` | Setup | That source is not usable Markdown. *(unchanged)* |
| `GENERATION_INVALID` | Setup | Could not prepare questions from that source. Try again. *(unchanged)* |
| `GENERATION_RETRIES_EXHAUSTED` | Setup | Could not prepare questions from that source. Try again. *(unchanged)* |

All other rows stay as [Phase 4 error-copy](../../006-phase-4-web-experience/contracts/error-copy.md).

Retry action on setup remains **Try again** (re-enable generate). The creator MUST be able to submit a different URL or count without leaving the setup flow.
