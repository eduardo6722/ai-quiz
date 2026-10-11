# `@ai-quiz/evals`

Offline golden-set evaluation for question-generation quality. This is a **new product context**, not domain scoring and not a grab-bag `helpers/` folder.

- Dataset, pins, rubrics, and runners live here.
- Live OpenAI judge and Langfuse experiment adapters live in `apps/api/src/eval/`.
- Learner 0–4 scoring stays in `@ai-quiz/domain` and is only **asserted**, never replaced by a judge.

Run mocked checks with `pnpm --filter @ai-quiz/evals test` or `pnpm eval:golden --mocked`. Live generation is `pnpm eval:golden --live` and is **not** part of `pnpm test`.
