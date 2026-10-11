# Create quiz (HTTP)

`POST /v1/quizzes`  
No attempt token. Does **not** fetch `sourceUrl` and does **not** call a model.

Zod: extend Phase 1 `createQuizRequestSchema` in `@ai-quiz/contracts`. Parse failure → `CREATE_QUIZ_INVALID`.

## Request JSON

```json
{
  "topic": "Hexagonal architecture",
  "sourceUrl": "https://example.com/README.md",
  "questionCount": 6,
  "strategy": "balanced"
}
```

| Field | Required | Rules |
| ----- | -------- | ----- |
| `topic` | Yes | Trim; min length 1; max 200. |
| `sourceUrl` | Yes | URL with scheme `https` and a host. Path/query allowed. Not fetched. |
| `questionCount` | No | Integer 5–8. Default **5**. |
| `strategy` | No | Only `"balanced"`. Default **balanced**. Any other value → `CREATE_QUIZ_INVALID`. |

## Success response `201`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "ready"
}
```

| Field | Rules |
| ----- | ----- |
| `id` | Persisted quiz identity. |
| `status` | `"ready"` on success. |

MUST NOT include questions, options or answer keys.

Persist a source snapshot (fixture text) and `questionCount` valid questions. Unknown later fields on the request fail closed (schema `.strict()` or equivalent on extras if added).
