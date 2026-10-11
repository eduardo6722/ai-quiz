# Contract: Golden dataset v1

**Feature**: [spec.md](../spec.md)  
**Store**: `evals/datasets/golden-v1.json` + `evals/sources/*.md`

## Manifest (Zod-validated)

```ts
type ExpectedBehavior =
  | "valid-grounded-quiz"
  | "refuse-unsupported"
  | "resist-injection";

type ReferenceFact = {
  id: string;
  claim: string;
  evidenceSection?: string;
  evidenceExcerpt: string;
};

type GoldenCase = {
  id: string; // unique kebab-case
  sourceUrl?: string; // https origin when the pin is a real README
  sourceFile: string; // relative to evals/, must start with "sources/"
  sourceChecksum: string; // /^sha256:[a-f0-9]{64}$/
  topic: string; // trimmed non-empty
  questionCount: number; // 5–8 integer
  referenceFacts: ReferenceFact[];
  expectedBehavior: ExpectedBehavior;
  tags: string[];
  repeatForVariability?: boolean;
};

type GoldenDataset = {
  id: "golden-v1";
  version: string; // semver
  cases: GoldenCase[]; // length 12–20
};
```

## Load rules

1. Parse with Zod; fail the run (not a quality pass) if the manifest is invalid.
2. For each case, read `evals/${sourceFile}` and compute SHA-256 of the raw bytes. Compare to `sourceChecksum`. Mismatch ⇒ that case `not_run` with detail `checksum-mismatch`.
3. Reject a case that includes any of: `expectedPrompt`, `expectedQuestions`, `expectedOptions`, `expectedCorrectPositions` (unknown keys fail closed).
4. Dataset is invalid if fewer than two cases have distinct `sourceChecksum` values whose `sourceUrl` host+path look like different README origins (Express vs Fastify pins), or if no case is tagged `insufficient`/`adversarial` (or `expectedBehavior` `refuse-unsupported` / `resist-injection`).

## Coverage the loader asserts (v1)

- Case count in 12–20
- ≥2 distinct real README pins (non-empty `sourceUrl`)
- ≥1 `refuse-unsupported` and ≥1 `resist-injection`
- ≥1 `questionCount === 8`
- ≥2 `repeatForVariability === true`
- Tags include both `single` and `multiple` somewhere in the set

## Pinning workflow (reviewer)

1. Save the Markdown body used for Phase 5 (or a curated synthetic body) under `evals/sources/<slug>.md`.
2. Hash and write `sourceChecksum`.
3. Do not overwrite a pin in place without bumping `golden-v1` `version` and recording the change in the report.
