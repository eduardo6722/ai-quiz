# Create-quiz rate and concurrency limits

Applies only to `POST /v1/quizzes`. Evaluated in the inbound adapter **before** `CreateQuizUseCase.execute`.

## Rate window

| Parameter | Value |
| --------- | ----- |
| Scope | Per client identity (`req.ip`) |
| Limit | **5** attempted creates |
| Window | **60 seconds** sliding |
| Overflow code | `REQUEST_RATE_LIMITED` |
| HTTP | **429** |

An “attempt” is a create that passed input parsing (`parseCreateQuizRequest`) and reached the limiter, whether or not fetch/generation later succeeds.

## Concurrency

| Parameter | Value |
| --------- | ----- |
| Scope | One API process |
| Limit | **2** in-flight create-quiz executions |
| Overflow code | `GENERATION_CONCURRENCY_LIMIT` |
| HTTP | **503** |

Release the slot in `finally` after execute returns or throws.

## Order

1. Parse body (`CREATE_QUIZ_INVALID` still 400; limiter not charged for invalid JSON/schema).
2. Rate window. Overflow → 429, **no** fetch, **no** generate, **no** slot taken.
3. Concurrency. Overflow → 503, **no** fetch, **no** generate; rate window **was** already charged (the client did attempt a create).
4. `execute`. Slot released in `finally`.

## Not covered

- `GET /v1/quizzes/:id`, start-attempt, submit, result
- `GET /health`, `GET /ready`
- Other processes (no shared Redis). Local demo is one API process.

## Tests

Overflow requests MUST leave source and generation test doubles uncalled (`fetch` / `generate` call count unchanged) and MUST NOT insert a ready quiz.
