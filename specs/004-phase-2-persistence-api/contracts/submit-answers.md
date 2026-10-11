# Submit answers (HTTP)

`POST /v1/attempts/:attemptId/submit`  
**Authorization:** `Bearer <token>` from start-attempt.

Body is the Phase 1 submit-answers schema (`parseSubmitAnswersRequest`). Shape failure → `SUBMIT_ANSWERS_INVALID`.

## Request JSON

```json
{
  "answers": [
    { "questionId": "…", "selectedOptionIds": ["…"] },
    { "questionId": "…", "selectedOptionIds": ["…", "…"] }
  ]
}
```

| Field | Required | Rules |
| ----- | -------- | ----- |
| `answers` | Yes | Length 5–8; unique `questionId`. Must cover **every** question on that quiz (domain). |
| `answers[].questionId` | Yes | Must belong to this attempt’s quiz. |
| `answers[].selectedOptionIds` | Yes | Non-empty unique ids that belong to that question. |

## Success response `200`

Phase 1 **public result** (`publicResultSchema`): unrounded `weightedScore`, display fields, per-question `rawScore`, `selectedOptionIds`, and `options[].isCorrect`.

First success persists answers, selections and scores atomically. Any later submit with a **valid** token returns the **same** stored result (HTTP 200) and ignores a new payload.

## Auth and lifecycle errors

| Situation | Code | HTTP |
| --------- | ---- | ---- |
| Missing/malformed Bearer | `UNAUTHORIZED_ATTEMPT` | 401 |
| Token does not match this attempt | `UNAUTHORIZED_ATTEMPT` | 401 |
| Unknown attempt id | `ATTEMPT_NOT_FOUND` | 404 |
| Illegal ownership / arity | `SELECTION_ILLEGAL` | 400 |
| Missing question | `ATTEMPT_INCOMPLETE` | 400 |
