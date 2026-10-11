# Telemetry port and Langfuse mapping

## Port (`TelemetryPort`)

Inward-facing. No Langfuse types.

```ts
type TelemetryStageName =
  | "create-quiz"
  | "fetch"
  | "preprocessing"
  | "generation"
  | "validation";

type TelemetryAttributes = {
  correlationId?: string;
  strategy?: string;
  quizId?: string;
  modelId?: string;
  promptVersion?: string;
  attempt?: number;
  errorCode?: string;
  sourceHash?: string;
  topicChars?: number;
  sourceChars?: number;
  inputTokens?: number;
  outputTokens?: number;
};

type TelemetryPort = {
  runStage<T>(
    input: { name: TelemetryStageName; attributes?: TelemetryAttributes },
    fn: () => Promise<T>,
  ): Promise<T>;
  recordEvent(input: { name: string; attributes?: TelemetryAttributes }): void;
};
```

`runStage` MUST:

1. Start a stage with the given name and attributes (plus `correlationId` from request context when the adapter can read it).
2. Await `fn`.
3. On success, end the stage with `outcome=ok` and duration.
4. On throw, end the stage with `outcome=error`, duration, and `errorCode` when the error carries a stable code; then rethrow.
5. Never throw because the tracing backend failed. Export errors retry once then drop ([research.md](../research.md)).

`NoOpTelemetryPort.runStage` only calls `fn`.

## Create-quiz stage map

| Stage | When | Extra attributes |
| ----- | ---- | ---------------- |
| `create-quiz` | Whole use case (and, if convenient, limiter rejects as a root-only event) | `strategy` |
| `fetch` | `MarkdownSourcePort.fetch` | `sourceHash` after success |
| `preprocessing` | Usable-length, size, generation window | `sourceChars`, `topicChars` |
| `generation` | Each `QuizGenerationPort.generate` call | `attempt` 1–3, `modelId`, usage tokens when returned |
| `validation` | Grounding + `validateQuiz` | — |

After persist, set `quizId` on the root (adapter `recordEvent` or attribute update). Failures before persist omit `quizId`.

## Langfuse adapter (apps/api only)

When `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` are both non-empty:

- Root observation = `create-quiz`
- Child spans = fetch / preprocessing / validation
- `generation` observation type = generation, with `model` = `modelId` and `usageDetails` when tokens exist
- `sessionId` / metadata may include `correlationId` and `quizId`
- Incomplete keys or missing keys → `NoOpTelemetryPort`; create-quiz MUST NOT fail

## Allowlist / denylist

**Allow**: names and attributes in the types above; duration; outcome.

**Deny** (must be absent or redacted): `OPENAI_API_KEY`, `DATABASE_URL`, Langfuse public/secret keys, raw attempt tokens, `Authorization` values, selected option ids, `isCorrect`, full system/user prompts, full Markdown snapshots.

Secret-shaped substrings that appear in topic or source **counts are fine**; if any attribute is a free-text string, run [redaction](./structured-logs.md#redaction) first. Prefer hashes and counts over text.
