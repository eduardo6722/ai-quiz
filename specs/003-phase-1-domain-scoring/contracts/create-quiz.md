# Create-quiz request (public)

Zod schema in `@ai-quiz/contracts`. Validates **shape only**. Does not fetch the URL or create a persisted quiz.

## JSON object

```json
{
  "topic": "Hexagonal architecture",
  "sourceUrl": "https://example.com/README.md",
  "questionCount": 6
}
```

| Field | Required | Rules |
| ----- | -------- | ----- |
| `topic` | Yes | String. Trim; min length 1 after trim; max 200. |
| `sourceUrl` | Yes | String that parses as a URL with scheme `https` and a non-empty host. Path and query allowed. Reject `http` and non-URLs. |
| `questionCount` | No | Integer 5–8 inclusive. Default **5** when omitted. |

Parse success → typed request object. Parse failure → `CREATE_QUIZ_INVALID`.

This schema is **not** a public quiz view and MUST NOT include questions or answer keys.
