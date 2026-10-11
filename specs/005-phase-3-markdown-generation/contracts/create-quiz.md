# Create quiz (HTTP)

`POST /v1/quizzes`  
No attempt token.

**Does** fetch `sourceUrl` on the server and **does** call the configured model. Request **shape** is unchanged from Phase 2 (`createQuizRequestSchema` in `@ai-quiz/contracts`). Parse failure → `CREATE_QUIZ_INVALID` (no fetch).

## Request JSON

```json
{
  "topic": "Express routing",
  "sourceUrl": "https://github.com/expressjs/express/blob/master/Readme.md",
  "questionCount": 5,
  "strategy": "balanced"
}
```

| Field | Required | Rules |
| ----- | -------- | ----- |
| `topic` | Yes | Trim; min length 1; max 200. |
| `sourceUrl` | Yes | URL with scheme `https` and a host. Path/query allowed. **Fetched** after parse. |
| `questionCount` | No | Integer 5–8. Default **5**. |
| `strategy` | No | Only `"balanced"`. Default **balanced**. |

## Success response `201`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "ready"
}
```

MUST NOT include questions, options, answer keys, excerpts, model id, API keys, or prompts.

Persist a fetched snapshot and `questionCount` valid grounded questions. Create is **synchronous**: the client waits until `ready` or an error.

## Error responses

See [error-codes.md](./error-codes.md). Typical create failures: `CREATE_QUIZ_INVALID` (400), `SOURCE_UNSAFE_DESTINATION` (400), `SOURCE_TOO_LARGE` (413), `SOURCE_UNSUPPORTED_TYPE` (415), `SOURCE_UNUSABLE` (422), `GENERATION_*` (422/502), `SOURCE_TIMEOUT` (504), `SOURCE_FETCH_FAILED` (502).

On every error: **no ready quiz** for that request.

## Product vs tests

Production composition uses the HTTPS source adapter and the OpenAI generation adapter. Missing model key → `GENERATION_UPSTREAM_FAILED`, **not** the Phase 2 fixture bank.

Automated E2E/integration MAY override the two ports with fixtures or doubles.
