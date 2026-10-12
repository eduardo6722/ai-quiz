# Contract: Public quiz view after mix

No schema change. Pre-submit `GET` quiz still exposes each option as `{ id, position, label }` only. `isCorrect`, `sourceExcerpt`, and `modelId` stay forbidden on the public view.

## Order

`position` on the public view MUST match the **stored** mixed order (0–3, contiguous). Two GETs of the same quiz MUST return the same labels in the same `position` sequence.

Results after submit MAY include `isCorrect` as they already do, still in that same order.

## E2E key mapping

HTTP tests MUST NOT assume `position === 0` is correct.

Map public options to the known fixture key by **label** (wording), then collect those option `id`s. Do not send correctness flags over HTTP.

The default fixture-bank E2E path keeps using fixture wording. The always-first E2E path selects `position === 0` (and `position < N` on multiples) on the public view **after** mix.

## Unchanged HTTP

| Surface | Change |
| ------- | ------ |
| `POST /v1/quizzes` | None |
| `GET /v1/quizzes/:id` | Option **order** may differ from generated order; fields unchanged |
| Start / submit / result | None besides stored order |
| Error codes | None |
