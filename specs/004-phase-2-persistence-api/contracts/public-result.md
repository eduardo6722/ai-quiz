# Get result (HTTP)

`GET /v1/attempts/:attemptId/result`  
**Authorization:** `Bearer <token>` from start-attempt.

Produced only from a **scored** attempt. Body is the Phase 1 public result schema. MUST NOT be used as the pre-submit quiz view.

## Success response `200`

```json
{
  "attemptId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "weightedScore": 1.8731117824773415,
  "weightedScoreDisplay": 1.87,
  "percentageDisplay": 46.83,
  "questions": [
    {
      "id": "…",
      "position": 0,
      "type": "single",
      "rawScore": 4,
      "selectedOptionIds": ["…"],
      "options": [
        { "id": "…", "position": 0, "label": "An inbound adapter", "isCorrect": false },
        { "id": "…", "position": 1, "label": "An interface the core depends on", "isCorrect": true },
        { "id": "…", "position": 2, "label": "A database table", "isCorrect": false },
        { "id": "…", "position": 3, "label": "A React hook", "isCorrect": false }
      ]
    }
  ]
}
```

Values MUST match the rows written at finalize (not a fresh re-grade).

| Situation | Code | HTTP |
| --------- | ---- | ---- |
| Missing/wrong token | `UNAUTHORIZED_ATTEMPT` | 401 |
| Unknown attempt | `ATTEMPT_NOT_FOUND` | 404 |
| Attempt still `open` | `ATTEMPT_NOT_SCORED` | 409 (no `isCorrect` in body) |
