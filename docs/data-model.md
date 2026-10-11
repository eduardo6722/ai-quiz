# Persistence model

PostgreSQL via Prisma. `QuestionOption.isCorrect` is **server-only** and must not appear on pre-submit API responses, page props, or HTML.

```mermaid
erDiagram
  SourceDocument ||--o{ Quiz : "sourceDocumentId"
  Quiz ||--|{ Question : "quizId"
  Question ||--|{ QuestionOption : "questionId"
  Quiz ||--o{ QuizAttempt : "quizId"
  QuizAttempt ||--o{ AttemptAnswer : "attemptId"
  Question ||--o{ AttemptAnswer : "questionId"
  AttemptAnswer ||--o{ AttemptAnswerSelection : "answerId"
  QuestionOption ||--o{ AttemptAnswerSelection : "optionId"

  SourceDocument {
    uuid id
    string originalUrl
    string resolvedUrl
    string contentHash
    text contentSnapshot
    datetime fetchedAt
  }
  Quiz {
    uuid id
    string topic
    string strategy
    enum status
    string modelId
  }
  Question {
    uuid id
    int position
    enum type
    string prompt
    string sourceExcerpt
  }
  QuestionOption {
    uuid id
    int position
    string label
    boolean isCorrect
  }
  QuizAttempt {
    uuid id
    string publicTokenHash
    enum status
    float weightedScore
  }
  AttemptAnswer {
    uuid id
    int rawScore
  }
  AttemptAnswerSelection {
    uuid answerId
    uuid optionId
  }
```

## Uniqueness and ownership

- `(quizId, position)` — question order
- `(questionId, position)` — four option slots
- `(questionId, label)` — unique labels per question
- `(attemptId, questionId)` — one answer row per question
- `publicTokenHash` unique; the raw token is shown once at start and never stored
- Selections must belong to that question

Quiz `status`: `generating` | `ready` | `failed`. Attempt `status`: `open` | `scored`. Playable answer keys are immutable. Scoring and finalization run in one transaction.

Weighted score is stored on the **0–4** scale. `weightedScoreDisplay` and `percentageDisplay` are rounded for display only.
