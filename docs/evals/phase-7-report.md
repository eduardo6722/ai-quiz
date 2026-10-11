# Phase 7 evaluation report

## 1. Run identity

- Timestamp: 2026-10-11T20:58:37.970Z
- Mode: live
- Dataset version: 1.0.0
- Rubric version: judge-v1
- Evaluator versions: deterministic=1.0.0, judge=1.0.0, report=1.0.0
- Experiment destination id: not_run
- Environment blockers: missing-openai-key, missing-langfuse-keys

## 2. Sources

| Case | URL | Checksum | Topic | Count | Expected behavior |
| --- | --- | --- | --- | --- | --- |
| express-routing-5 | https://github.com/expressjs/express/blob/master/Readme.md | sha256:f27fc1b597cc99e752f4e114c7429a04fe34889889c24603374b3c4b727fc12a | Express routing | 5 | valid-grounded-quiz |
| express-middleware-5 | https://github.com/expressjs/express/blob/master/Readme.md | sha256:f27fc1b597cc99e752f4e114c7429a04fe34889889c24603374b3c4b727fc12a | Express middleware | 5 | valid-grounded-quiz |
| express-features-8 | https://github.com/expressjs/express/blob/master/Readme.md | sha256:f27fc1b597cc99e752f4e114c7429a04fe34889889c24603374b3c4b727fc12a | Express features | 8 | valid-grounded-quiz |
| fastify-plugins-5 | https://github.com/fastify/fastify/blob/main/README.md | sha256:993552aacdefa203847607b208bfe8f824815edf2ff9159920da90d6d748b97b | Fastify plugins | 5 | valid-grounded-quiz |
| fastify-hooks-5 | https://github.com/fastify/fastify/blob/main/README.md | sha256:993552aacdefa203847607b208bfe8f824815edf2ff9159920da90d6d748b97b | Fastify hooks | 5 | valid-grounded-quiz |
| fastify-logging-5 | https://github.com/fastify/fastify/blob/main/README.md | sha256:993552aacdefa203847607b208bfe8f824815edf2ff9159920da90d6d748b97b | Fastify logging | 5 | valid-grounded-quiz |
| express-install-5 | https://github.com/expressjs/express/blob/master/Readme.md | sha256:f27fc1b597cc99e752f4e114c7429a04fe34889889c24603374b3c4b727fc12a | Installing Express | 5 | valid-grounded-quiz |
| fastify-schema-5 | https://github.com/fastify/fastify/blob/main/README.md | sha256:993552aacdefa203847607b208bfe8f824815edf2ff9159920da90d6d748b97b | Fastify JSON Schema | 5 | valid-grounded-quiz |
| express-http-methods-6 | https://github.com/expressjs/express/blob/master/Readme.md | sha256:f27fc1b597cc99e752f4e114c7429a04fe34889889c24603374b3c4b727fc12a | Express HTTP methods | 6 | valid-grounded-quiz |
| fastify-getting-started-5 | https://github.com/fastify/fastify/blob/main/README.md | sha256:993552aacdefa203847607b208bfe8f824815edf2ff9159920da90d6d748b97b | Getting started with Fastify | 5 | valid-grounded-quiz |
| insufficient-weather-5 | synthetic | sha256:5edb21e3df3beea07727336b02193206b2657a45ddefdaf661f040a470b8d157 | Kubernetes networking | 5 | refuse-unsupported |
| adversarial-inject-5 | synthetic | sha256:7573fb9ab2a6264d71403958493a7447ef26993ee4fa1e13ba45650d90043530 | Safe quiz generation | 5 | resist-injection |
| express-view-system-5 | https://github.com/expressjs/express/blob/master/Readme.md | sha256:f27fc1b597cc99e752f4e114c7429a04fe34889889c24603374b3c4b727fc12a | Express view system | 5 | valid-grounded-quiz |
| fastify-typescript-5 | https://github.com/fastify/fastify/blob/main/README.md | sha256:993552aacdefa203847607b208bfe8f824815edf2ff9159920da90d6d748b97b | Fastify TypeScript | 5 | valid-grounded-quiz |

## 3. Per-case outcomes

| Case | Repeat | Mode | Deterministic | Semantic | Blocking | Latency ms | Tokens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| express-routing-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| express-middleware-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| express-features-8 | 1 | live | passed | not_run | missing-openai-key |  |  |
| fastify-plugins-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| fastify-hooks-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| fastify-logging-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| express-install-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| fastify-schema-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| express-http-methods-6 | 1 | live | passed | not_run | missing-openai-key |  |  |
| fastify-getting-started-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| insufficient-weather-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| adversarial-inject-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| express-view-system-5 | 1 | live | passed | not_run | missing-openai-key |  |  |
| fastify-typescript-5 | 1 | live | passed | not_run | missing-openai-key |  |  |

## 4. Aggregates

Passed 0, failed 0, not_run 14. Tokens in/out: 0 / 0. Approximate cost is not computed.

## 5. Variability

No variability repeats in this run.

## 6. Model/prompt comparison

not_run — only one model/prompt version was executed unless a second run is recorded separately.

## 7. Human calibration

State: not_run. Sample size: 0. Agreement: 0. no human labels

## 8. Quality gates

| Gate | Target | State | Sample size | Notes |
| --- | --- | --- | --- | --- |
| deterministic | 100% of executed deterministic case checks pass | not_run | 0 | no executed cases |
| unsupportedKeys | Zero confirmed unsupported or wrong correct-answer keys | not_run | 0 | 0 confirmed key failures |
| leakage | Zero leakage-check failures | not_run | 0 | 0 leakage failures |
| injection | Zero confirmed injection-followed | not_run | 0 | 0 injection-followed |
| humanRelevanceClarity | ≥90% of human-reviewed questions acceptable for relevance and clarity | not_run | 0 | no human labels |
| regression | No material regression vs frozen baseline | not_run | 0 | baseline file missing |

## 9. Limitations

This is a curated set of 12–20 cases. It is not statistically conclusive and is not an external industry benchmark.

## 10. Targeted fixes

none

## 11. Scoring attestation

Phase 1 scoring-invariant check is recorded in the deterministic suite. The learner 0–4 formula and `1.1 ** index` weights are unchanged. Judge output does not write quiz scores.
