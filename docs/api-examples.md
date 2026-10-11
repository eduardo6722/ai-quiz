# API examples

Base URL in local development: `http://localhost:3001`. These payloads are illustrative. They do not contain real secrets or attempt tokens from a live sitting.

## Health

```bash
curl -sS http://localhost:3001/health
curl -sS http://localhost:3001/ready
```

`/health` is process liveness (no database or model key). `/ready` is database readiness.

## Create quiz

```bash
curl -sS -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -d '{"topic":"Express routing","sourceUrl":"https://github.com/expressjs/express/blob/master/Readme.md","questionCount":5}'
```

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "ready"
}
```

Live create needs `OPENAI_API_KEY`. Missing key is an environment blocker, not a fixture fallback. Unsafe destinations return a stable error such as `SOURCE_UNSAFE_DESTINATION`.

## Get quiz (no answer keys)

```bash
curl -sS http://localhost:3001/v1/quizzes/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "topic": "Express routing",
  "sourceUrl": "https://github.com/expressjs/express/blob/master/Readme.md",
  "questions": [
    {
      "id": "q1",
      "position": 0,
      "prompt": "Which method registers a route handler in the example?",
      "type": "single",
      "options": [
        { "id": "o1", "position": 0, "label": "app.get" },
        { "id": "o2", "position": 1, "label": "app.listen" },
        { "id": "o3", "position": 2, "label": "app.static" },
        { "id": "o4", "position": 3, "label": "app.engine" }
      ]
    }
  ]
}
```

Pre-submit responses must not include `isCorrect` or other correctness flags. Five to eight questions, exactly four options each.

## Start attempt

```bash
curl -sS -X POST http://localhost:3001/v1/quizzes/3fa85f64-5717-4562-b3fc-2c963f66afa6/attempts
```

```json
{
  "attemptId": "8b1c2d3e-4f56-7890-abcd-ef1234567890",
  "token": "<shown-once-unguessable-token>"
}
```

Store the token only in memory or `sessionStorage`. It is not in the URL. The database stores a hash, not this value.

## Submit

```bash
curl -sS -X POST http://localhost:3001/v1/attempts/8b1c2d3e-4f56-7890-abcd-ef1234567890/submit \
  -H 'content-type: application/json' \
  -H 'Authorization: Bearer <shown-once-unguessable-token>' \
  -d '{"answers":[{"questionId":"q1","selectedOptionIds":["o1"]}]}'
```

Repeat submit with the same token returns the existing result (idempotent).

## Result (after submit)

```bash
curl -sS http://localhost:3001/v1/attempts/8b1c2d3e-4f56-7890-abcd-ef1234567890/result \
  -H 'Authorization: Bearer <shown-once-unguessable-token>'
```

```json
{
  "attemptId": "8b1c2d3e-4f56-7890-abcd-ef1234567890",
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "weightedScore": 3.12,
  "weightedScoreDisplay": 3.12,
  "percentageDisplay": 78.1,
  "questions": [
    {
      "id": "q1",
      "position": 0,
      "type": "single",
      "rawScore": 4,
      "selectedOptionIds": ["o1"],
      "options": [
        { "id": "o1", "position": 0, "label": "app.get", "isCorrect": true },
        { "id": "o2", "position": 1, "label": "app.listen", "isCorrect": false },
        { "id": "o3", "position": 2, "label": "app.static", "isCorrect": false },
        { "id": "o4", "position": 3, "label": "app.engine", "isCorrect": false }
      ]
    }
  ]
}
```

`isCorrect` is allowed here because the sitting is already scored. `weightedScore` is the 0–4 geometric mean; the percentage is display-only.
