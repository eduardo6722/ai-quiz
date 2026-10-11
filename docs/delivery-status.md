# Honest delivery status

States are `passed`, `failed`, or `not_run`. Skipped live work is never counted as passed.

| ID | Lane | Item | State | Evidence |
| --- | --- | --- | --- | --- |
| p0-scoring | P0 | Deterministic 0–4 scoring, `1.1 ** index` | passed | Phase 1 domain tests; `pnpm --filter @ai-quiz/domain test` |
| p0-rest | P0 | `/v1` create/get/start/submit/result; keys hidden pre-submit | passed | Phase 2–3 Jest integration/E2E |
| p0-web | P0 | Browser setup → play → results | passed | Phase 4 web app + Jest/RTL |
| p0-two-sources | P0 | Two different README demonstrations | passed | README sitting 2026-10-11 (Express, Fastify) |
| p0-jest | P0 | Unit, integration, API E2E | passed | `pnpm test`, `test:integration`, `test:e2e` |
| p1-observability | P1 | Langfuse port, logs, limits, health | passed | Phase 6; live Langfuse inspection still environment-gated |
| p1-golden-harness | P1 | Golden set, evaluators, `pnpm eval:golden`, portable report | passed | `specs/008-phase-7-llm-evals/` T001–T078 |
| p1-human-calibration | P1 | Human labels vs judge | not_run | `evals/baselines/human-labels.v1.json` empty |
| p1-accepted-baseline | P1 | Frozen baseline / regression gate | not_run | `--accept-baseline` not used |
| p1-ci | P1 | Merge-time GitHub Actions | passed | `.github/workflows/ci.yml` (hosted green depends on GitHub runners) |
| p1-images | P1 | Production Dockerfiles + `compose.prod.yml` | passed | Local `docker compose -f compose.prod.yml up --build`: `/health` and `/ready` 200; runtime `uid=1000(node)` |
| p1-gated-evals-workflow | P1 | Separate `llm-evals.yml` | passed | Workflow exists; last **live** artifact is **not_run** until dispatched with secrets |
| p1-live-eval-artifact | P1 | Last credentialed gated eval run | not_run | No dispatch artifact in this cycle unless secrets were present |
| p1-live-publish | P1 | Image push to a registry | not_run | `release.yml` `publish_images` default false |
| p1-live-deploy | P1 | Host actually running production images | not_run | `DEPLOY_TARGET=none` |
| p2-second-strategy | P2 | Second generation strategy | not_run | Deferred; `balanced` only |
| p2-extensions | P2 | Preview, dashboards, auth, queues, Playwright replacement | not_run | Roadmap M9 |

## Trade-offs

- Multi-answer scoring is the roadmap’s provisional reading (one point per correctly selected option, 0–4, no invented penalty). Confirm with the interviewer.
- Merge-time tests use a **mocked** model and real PostgreSQL. Live generation is a separate, credentialed path.
- Human calibration and an accepted frozen baseline remain Phase 7 leftovers.
- Deploy destination is configurable so this repo does not lock a cloud vendor. That means “production-ready path,” not “we are hosted.”
- Evaluation judges do not change the learner’s 0–4 score.

## Scoring attestation

Learner formula unchanged: single 4 or 0; multi one point per correct option bounded 0–4; `weight = 1.1 ** index`; store 0–4; percentage display-only.
