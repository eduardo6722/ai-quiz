# Start attempt (HTTP)

`POST /v1/quizzes/:quizId/attempts`  
Empty body. No attempt token.

Unknown quiz → `QUIZ_NOT_FOUND`. Non-ready quiz → `QUIZ_NOT_PLAYABLE`.

## Success response `201`

```json
{
  "attemptId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "token": "<unguessable base64url secret>"
}
```

| Field | Rules |
| ----- | ----- |
| `attemptId` | Persisted attempt identity. |
| `token` | Private Bearer secret, shown **once**. 256-bit random. |

Storage writes **only** `SHA-256(token)` hex as `publicTokenHash`. Subsequent responses MUST NOT repeat `token`.

Each call creates a **new** attempt, even on the same quiz.
