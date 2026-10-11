# Learner error copy (Phase 6 additions)

API body remains `{ "code": "<CODE>", "message": "<English, non-secret>" }`.

The web app already maps codes in `learnerMessageForCode`. Add two sentences so setup does not fall through to the generic internal line. **No new screens.**

| Code | Screen | Learner copy |
| ---- | ------ | ------------ |
| `REQUEST_RATE_LIMITED` | Setup | Too many quizzes right now. Wait a minute and try again. |
| `GENERATION_CONCURRENCY_LIMIT` | Setup | The quiz service is busy. Try again in a moment. |

Retry action: same as other setup failures — re-enable **Generate quiz**. Copy MUST NOT include tokens, hashes, or `sk-`.

All Phase 4 sentences in [Phase 4 error-copy.md](../../006-phase-4-web-experience/contracts/error-copy.md) stay unchanged.
