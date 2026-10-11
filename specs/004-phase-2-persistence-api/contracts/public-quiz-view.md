# Get quiz (HTTP)

`GET /v1/quizzes/:quizId`  
No attempt token.

Success body is the Phase 1 **public quiz view** (Zod `publicQuizViewSchema`). **MUST NOT** contain `isCorrect`, scores or tokens.

## Success response `200`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "topic": "Hexagonal architecture",
  "sourceUrl": "https://example.com/README.md",
  "questions": [
    {
      "id": "…",
      "position": 0,
      "prompt": "What is a port?",
      "type": "single",
      "options": [
        { "id": "…", "position": 0, "label": "An inbound adapter" },
        { "id": "…", "position": 1, "label": "An interface the core depends on" },
        { "id": "…", "position": 2, "label": "A database table" },
        { "id": "…", "position": 3, "label": "A React hook" }
      ]
    }
  ]
}
```

`sourceUrl` is the stored original URL (source summary this phase). Question count is 5–8 as created.

Unknown `quizId` → `QUIZ_NOT_FOUND` (404). Non-ready quiz → `QUIZ_NOT_PLAYABLE` (409).

Tests MUST assert a payload with `options[].isCorrect` **fails** `publicQuizViewSchema`, and that the HTTP body does not include that field.
