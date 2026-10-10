# Submit-answers request (public)

Zod schema in `@ai-quiz/contracts`. Shape check only; matching a specific quiz is domain (`gradeAttempt`).

## JSON object

```json
{
  "answers": [
    { "questionId": "q1", "selectedOptionIds": ["opt-a"] },
    { "questionId": "q2", "selectedOptionIds": ["opt-a", "opt-c"] }
  ]
}
```

| Field | Required | Rules |
| ----- | -------- | ----- |
| `answers` | Yes | Array length 5–8. `questionId` values unique in the array. |
| `answers[].questionId` | Yes | Non-empty string. |
| `answers[].selectedOptionIds` | Yes | Non-empty array of non-empty strings. Duplicate ids in the same array fail schema (`SUBMIT_ANSWERS_INVALID`). |

Domain then checks: ids exist on the quiz, every quiz question is present, single vs multiple arity (FR-005/FR-006/FR-013). Those failures are `SELECTION_ILLEGAL` or `ATTEMPT_INCOMPLETE`, not a successful score.

No correctness flags in this payload.
