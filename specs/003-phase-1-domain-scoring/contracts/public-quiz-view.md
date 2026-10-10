# Public quiz view (pre-submit)

Zod schema in `@ai-quiz/contracts`. Produced from a valid domain quiz. **MUST NOT** contain `isCorrect`, answer keys, or scoring fields.

## JSON object (shape)

```json
{
  "id": "quiz-1",
  "topic": "Hexagonal architecture",
  "sourceUrl": "https://example.com/README.md",
  "questions": [
    {
      "id": "q1",
      "position": 0,
      "prompt": "What is a port?",
      "type": "single",
      "options": [
        { "id": "opt-a", "position": 0, "label": "An inbound adapter" },
        { "id": "opt-b", "position": 1, "label": "An interface the core depends on" },
        { "id": "opt-c", "position": 2, "label": "A database table" },
        { "id": "opt-d", "position": 3, "label": "A React hook" }
      ]
    }
  ]
}
```

| Field | Rules |
| ----- | ----- |
| `id`, `topic`, `sourceUrl` | Same meaning as domain/create input. |
| `questions` | 5–8 items. |
| `questions[].type` | `"single"` or `"multiple"`. |
| `questions[].options` | Exactly four. Fields: `id`, `position`, `label` only. |

Schema `.strict()` (or equivalent) MUST reject unknown keys including `isCorrect`, `rawScore` and `weightedScore`.

Tests MUST assert a payload with `options[].isCorrect` **fails** this schema.
