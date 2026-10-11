# Attempt sitting (browser)

Implements spec FR-006, FR-010, FR-011 and Phase 2 start-attempt / submit / result.

## Storage

| Item | Value |
| ---- | ----- |
| Mechanism | `sessionStorage` (tab sitting) |
| Key | `ai-quiz.attempt.<quizId>` |
| JSON | `{ attemptId, token, currentIndex, selections, status }` |

`selections` is `{ [questionId]: string[] }`.

## Rules

1. Write the token **only** into this JSON after `POST /v1/quizzes/:quizId/attempts` returns `{ attemptId, token }`.
2. Read the token **only** to set `Authorization: Bearer <token>` on submit and result.
3. MUST NOT put `token` in:
   - path, query, or hash
   - visible text, `aria-label`, or `document.title`
   - `console.log` / application logs
4. MUST NOT use `localStorage` or cookies for the token this phase.
5. Player with an existing `open` sitting for that `quizId` MUST NOT start another attempt.
6. Player with no sitting MUST start a new attempt (new token).
7. Player with `status: "scored"` MUST navigate to `/quiz/{quizId}/results`.
8. Results with no sitting or failed `UNAUTHORIZED_ATTEMPT` MUST render the English cannot-show-result state with **zero** scores and **zero** `isCorrect`.
9. After submit 200, set `status: "scored"` before navigation so refresh stays on results.
10. Tests MUST assert URL builders never receive the token.

## Mapping to HTTP

| UI event | HTTP | Auth |
| -------- | ---- | ---- |
| Generate | `POST /v1/quizzes` | none |
| Enter player | `GET /v1/quizzes/:quizId` | none |
| Enter player (no sitting) | `POST /v1/quizzes/:quizId/attempts` | none |
| Submit | `POST /v1/attempts/:attemptId/submit` | Bearer |
| Load results | `GET /v1/attempts/:attemptId/result` | Bearer |
| Load results prompts/source | `GET /v1/quizzes/:quizId` | none |

Idempotent second submit (API 200, frozen result) MUST display that same stored result.
