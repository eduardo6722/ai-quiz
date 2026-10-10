# Public result view (post-submit)

Zod schema in `@ai-quiz/contracts`. Produced only from a **scored** attempt. Includes which options were correct. MUST NOT be used as the pre-submit quiz view.

## JSON object (shape)

```json
{
  "attemptId": "att-1",
  "quizId": "quiz-1",
  "weightedScore": 1.8731117824773415,
  "weightedScoreDisplay": 1.87,
  "percentageDisplay": 46.83,
  "questions": [
    {
      "id": "q1",
      "position": 0,
      "type": "single",
      "rawScore": 4,
      "selectedOptionIds": ["opt-b"],
      "options": [
        { "id": "opt-a", "position": 0, "label": "An inbound adapter", "isCorrect": false },
        { "id": "opt-b", "position": 1, "label": "An interface the core depends on", "isCorrect": true },
        { "id": "opt-c", "position": 2, "label": "A database table", "isCorrect": false },
        { "id": "opt-d", "position": 3, "label": "A React hook", "isCorrect": false }
      ]
    }
  ]
}
```

| Field | Rules |
| ----- | ----- |
| `weightedScore` | Unrounded number on 0–4. |
| `weightedScoreDisplay` | Half-up two decimals. |
| `percentageDisplay` | Half-up two decimals of `(weightedScore / 4) * 100`. |
| `questions[].rawScore` | Integer 0–4. |
| `questions[].selectedOptionIds` | Frozen selections from the successful grade. |
| `questions[].options[].isCorrect` | Required here. Forbidden on the quiz view. |

Mapping an `open` attempt MUST fail with `ATTEMPT_NOT_SCORED`.

Isolated weighting `[4, 2, 0]` is **not** required to pass this full quiz-shaped schema; it asserts `calculateWeightedScore` + display helpers only.
