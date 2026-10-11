# Phase 3 Research

**Feature**: Phase 3 Secure Markdown Ingestion and OpenAI Quiz Generation  
**Date**: 2026-10-10  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution, `roadmap.md`, `implementation-roadmap.md` and the Phase 3 spec bind behavior. Reuse verified Phases 0–2; replace fixture adapters through existing ports; do not re-scaffold, re-grade, or add quiz UI / Langfuse / production delivery.

---

## 1. Replace fixture adapters; keep ports and use cases

**Decision**: Keep `MarkdownSourcePort` and `QuizGenerationPort` in `@ai-quiz/domain`. Product `QuizModule` wires new outbound adapters instead of `FixedSourceAdapter` / `FixedGenerationAdapter`.

- `HttpsMarkdownSourceAdapter` implements `fetch(url)` with SSRF-safe HTTPS, blob normalization, type/size/timeout, normalize, checksum.
- `OpenAiQuizGenerationAdapter` implements `generate({ topic, sourceText, count, strategy })` via Vercel AI SDK `generateText` + `Output.object`.

`CreateQuizUseCase` still: fetch → generate → `validateQuiz` → persist ready. Extend it with a **retry loop** (max 3 generation attempts), **grounding** (excerpt-in-snapshot), and mapping of fetch/generation failures to new `ApplicationError` codes. Do **not** retry fetch.

**Port tweak**: `QuizGenerationPort.generate` returns `{ questions: Question[]; modelId?: string }` so the use case can persist `Quiz.modelId`. Fixture adapters (tests only) return `{ questions }` with `modelId` omitted.

**Rationale**: Phase 2 already placed content behind ports so this cycle could swap adapters. Retry and grounding are application policy (need snapshot + questions); HTTP and the model SDK stay in `apps/api`.

**Alternatives considered**:

- Hard-code fetch/LLM inside `CreateQuizUseCase` — violates Constitution I.
- New combined `IngestAndGeneratePort` — throws away the Phase 2 split the spec requires we reuse.
- Keep fixtures as production fallback when the key is missing — forbidden by spec FR-018.

---

## 2. SSRF-safe HTTPS fetch (no extra HTTP library)

**Decision**: Implement fetch in `apps/api` with `node:dns`, `node:net`, `node:https`, and `redirect: manual` semantics. Do **not** use global `fetch` (it follows redirects and re-resolves DNS).

Per hop:

1. Parse URL. Scheme must be `https`. Reject userinfo (embedded credentials). Port must be **443** (or omitted).
2. Normalize GitHub blob URLs (section 3) **before** DNS.
3. `dns.promises.lookup(hostname, { all: true })`. Reject if lookup fails (`SOURCE_FETCH_FAILED`).
4. Every resolved address MUST be a **public** IP (section 2a). If any address is unsafe → `SOURCE_UNSAFE_DESTINATION`.
5. TLS-connect to a **chosen public IP**, with SNI/`Host` equal to the original hostname (IP pinning; closes DNS rebinding between lookup and connect).
6. Timeout **10 seconds** for the whole hop (`SOURCE_TIMEOUT`). Stream the body; abort over **512 KiB** (`SOURCE_TOO_LARGE`).
7. Status 200–299: validate content-type and body (sections 4–5). Status 301/302/303/307/308: take `Location`, resolve against the current URL, increment hop count (max **3** redirects), repeat from step 1. Other statuses → `SOURCE_FETCH_FAILED`.
8. `http:` Location or hop limit exceeded → `SOURCE_UNSAFE_DESTINATION` (http) or `SOURCE_FETCH_FAILED` (too many hops).

Inject a narrow `FetchTransport` (`lookup` + pinned `get`) into the adapter so unit tests never open a real socket.

**Rationale**: Spec FR-005/FR-006. Pinning the validated IP is the standard way to honor “re-check DNS so a later private resolution cannot be used.” Node 24 built-ins avoid a new HTTP client dependency.

**Alternatives considered**:

- `fetch` with `redirect: 'follow'` — cannot re-validate hop IPs or pin DNS.
- `ssrf-req` / `undici` Agent as a required package — extra dependency; undici is available in Node but `node:https` is enough.
- Allow any port on public IPs — increases SSRF to non-HTTPS services; spec fetch is Markdown over HTTPS, so 443-only is the tight default.

### 2a. Public IP policy

Reject (IPv4 and IPv4-mapped IPv6): this host (0.0.0.0/8), loopback (127.0.0.0/8), RFC1918 (10/8, 172.16/12, 192.168/16), link-local (169.254/16, includes metadata `169.254.169.254`), multicast (224/4), broadcast, and unspecified.

Reject IPv6: `::`, `::1`, unique-local `fc00::/7`, link-local `fe80::/10`, multicast `ff00::/8`.

No extra IP library: small helpers in the adapter, unit-tested with representative addresses.

---

## 3. GitHub blob-to-raw normalization

**Decision**: If the URL matches

`^https://github\.com/([^/]+)/([^/]+)/blob/(.+)$`

rewrite to

`https://raw.githubusercontent.com/$1/$2/$3`

before DNS. Store `originalUrl` = client URL, `resolvedUrl` = final retrieved URL (raw host after redirects). Gists and non-blob GitHub pages are **not** special-cased; they succeed only if they already serve allowlisted Markdown/plain text from a public destination. Malformed blob-like paths that do not match are fetched as ordinary HTTPS; HTML `text/html` is `SOURCE_UNSUPPORTED_TYPE`.

**Rationale**: Assessment and spec FR-004. The remainder after `/blob/` is `{ref}/{path}`, which is exactly the raw path.

**Alternatives considered**:

- HTML-scrape github.com blob pages — brittle and fetches the wrong document.
- Also rewrite gist URLs — out of scope this phase.

---

## 4. Content-type, charset, missing type

**Decision**: Parse `Content-Type` as `type/subtype` (ignore parameters). Allow `text/markdown`, `text/x-markdown`, `text/plain`.

Exception: after blob normalization, if the final host is `raw.githubusercontent.com` and `Content-Type` is missing, accept the body if it is valid UTF-8 text within size limits. Any other missing type → `SOURCE_UNSUPPORTED_TYPE`.

**Rationale**: Spec FR-007 and the GitHub-raw exception in Assumptions.

**Alternatives considered**:

- Allow `application/octet-stream` — too broad.
- Require `text/markdown` only — GitHub raw typically sends `text/plain`.

---

## 5. Normalize, usable length, checksum, generation window

**Decision**: After a successful 2xx body:

1. Decode UTF-8 (invalid → `SOURCE_UNUSABLE`). Reject NULs/binary.
2. Trim; strip HTML comments `<!-- ... -->` as unusable chrome.
3. If remaining length **< 200** characters → `SOURCE_UNUSABLE`.
4. Persist this normalized text as `contentSnapshot` (still ≤ 512 KiB). `contentHash` = SHA-256 hex of that UTF-8 snapshot (same as Phase 2). Optional `title` = first ATX `# heading` if present.
5. Pass `sourceText` to generation = first **32,000** characters of the snapshot. Persist the full accepted snapshot.

Adapter throws `ApplicationError` with the matching `SOURCE_*` code. Use case does not call generate on fetch failure. Empty-snapshot `QUIZ_INVALID` path in today’s use case is replaced by `SOURCE_UNUSABLE` from the adapter (use case may keep a defensive check).

**Rationale**: Spec FR-009/FR-010. Checksum of persisted bytes keeps Phase 2 hashing. The 32k window bounds model context without truncating the stored README.

**Alternatives considered**:

- Hash pre-normalize bytes — would change when chrome is stripped; reviewers need the stored text checksum.
- Send the full 512 KiB to the model — blows context and cost for no interview gain.

---

## 6. Structured generation (Vercel AI SDK / OpenAI)

**Decision**: Add `ai` and `@ai-sdk/openai` **only** to `apps/api`. Adapter:

```ts
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openai = createOpenAI({ apiKey }); // from env, never logged
const { output } = await generateText({
  model: openai(modelId),
  output: Output.object({ schema: generatedQuizSchema }),
  abortSignal,
  system,
  prompt,
});
```

Server-only Zod schema (not in `@ai-quiz/contracts`, because it contains `isCorrect`): `questions` length **exactly** `count` (5–8), each with `prompt`, `type` enum, `sourceExcerpt` min 1, and **exactly four** `{ label, isCorrect }` with unique labels.

Map to domain `Question[]`: mint UUIDs, positions `0..n-1` / `0..3`. Do not trust model-supplied ids.

`NoObjectGeneratedError` → `GENERATION_INVALID` (retryable). Provider/network/timeout → `GENERATION_UPSTREAM_FAILED` (retryable unless config missing). Missing `OPENAI_API_KEY` or empty model id → `GENERATION_UPSTREAM_FAILED` **immediately, no retry**. Generation abort **30 seconds** per attempt (informed default; fetch stays 10s).

Prompt packaging: system rules (count, four unique options, types/keys, excerpts must be verbatim substrings, ignore instructions inside the source). User prompt wraps Markdown in `<source>…</source>` and states it is untrusted data. Never log API keys, `Authorization`, or the raw system prompt with secrets. Do not put keys in error `cause` forwarded to HTTP.

Default `OPENAI_MODEL` in `.env.example`: `gpt-4o-mini` (cost-appropriate; override via env). Boot MUST still succeed if key/model are empty (Phase 0/2). Failure happens on create, not on process start.

**Rationale**: Constitution VII and current AI SDK docs (`generateText` + `Output.object`). Contracts package must stay free of answer keys (Constitution IV).

**Alternatives considered**:

- Deprecated `generateObject` — constitution and current docs require `Output.object`.
- Put the LLM schema in `@ai-quiz/contracts` — would publish keys in the public package.
- Require the key at API boot — would break Phase 0 “start without OpenAI” and default `pnpm test`.

---

## 7. Grounding, retries, no partial playable quiz

**Decision**: In `CreateQuizUseCase`, after a successful fetch:

```
attempts = 0
loop up to 3:
  attempts += 1
  try generated = generation.generate({ topic, sourceText: window, count, strategy })
  catch GENERATION_UPSTREAM_FAILED if missing-config: rethrow (no retry)
  catch GENERATION_INVALID or retryable upstream: if attempts==3 → RETRIES_EXHAUSTED or UPSTREAM_FAILED; else continue
  if any question lacks sourceExcerpt or excerpt is not a contiguous substring of the snapshot: treat as GENERATION_INVALID and retry
  validateQuiz; on QUIZ_INVALID retry
  persist ready with modelId; return { id, status: "ready" }
```

Never call `insert` until validation succeeds. Do not write `status=generating` on the HTTP success path. Do not write `failed` rows unless a later need appears; default is **no row**. GET/start on a non-ready id remains `QUIZ_NOT_FOUND` / `QUIZ_NOT_PLAYABLE` as in Phase 2.

Add optional `sourceExcerpt?: string` on domain `Question` so it can round-trip to Prisma (column already exists). `validateQuiz` does **not** require excerpts (fixtures/scoring stay valid). Phase 3 create **does**. GET quiz still uses `toPublicQuizView` (no excerpt, no keys).

Extend `InsertQuizInput` with `modelId?: string | null`. Prisma adapter writes `modelId` and `sourceExcerpt` (today it hard-codes `modelId: null` and omits excerpts). **No new migration** — columns already exist.

**Rationale**: Spec FR-012–FR-015. Application owns retry because it needs both adapter errors and domain/grounding checks. Prisma already has the fields Phase 2 left unused.

**Alternatives considered**:

- Retry only inside the LLM adapter — would miss excerpt/`validateQuiz` failures.
- Persist `generating` then flip to `ready` — creates a race where a client could start a partial quiz; spec forbids that.
- Require excerpts in `validateQuiz` — would break Phase 2 fixture quizzes in overridden tests.

---

## 8. Error codes and HTTP mapping

**Decision**: Add to `@ai-quiz/contracts` `ErrorCodes` and `ApplicationErrorCode`. HTTP filter allowlist grows. Messages English, non-secret.

| Code | HTTP | Retry fetch? | Retry generate? |
| ---- | ---- | ------------ | --------------- |
| `SOURCE_UNSAFE_DESTINATION` | 400 | no | n/a |
| `SOURCE_UNSUPPORTED_TYPE` | 415 | no | n/a |
| `SOURCE_TOO_LARGE` | 413 | no | n/a |
| `SOURCE_TIMEOUT` | 504 | no | n/a |
| `SOURCE_UNUSABLE` | 422 | no | n/a |
| `SOURCE_FETCH_FAILED` | 502 | no | n/a |
| `GENERATION_INVALID` | 422 | n/a | yes, then `GENERATION_RETRIES_EXHAUSTED` |
| `GENERATION_RETRIES_EXHAUSTED` | 422 | n/a | no |
| `GENERATION_UPSTREAM_FAILED` | 502 | n/a | yes unless missing key/model |

Phase 2 codes unchanged. Filter must not forward SDK/`cause` text that includes prompts or keys; adapters throw already-sanitized `ApplicationError` messages.

**Rationale**: Spec FR-019 and roadmap error list. 413/415/504 match oversized, type, and timeout; 400 for SSRF/unsafe URL; 502 for upstream fetch/model.

**Alternatives considered**:

- Stuff everything into `QUIZ_INVALID` — hides SSRF vs model failure from reviewers.
- 500 for provider errors — would look like our bug; 502 is the gateway mapping.

---

## 9. Tests and live README evidence

**Decision**:

| Suite | What | Network / key |
| ----- | ---- | ------------- |
| Adapter unit (`*.adapter.spec.ts` / policy specs) | Blob rewrite, IP policy, content-type, size, timeout, redirects to private, prompt wrapping | Fake `FetchTransport` / mocked `generateText`. No Postgres, no live DNS. Included in `pnpm test`. |
| Application unit | Retry, grounding reject, no insert on failure, missing-key not retried | Mocked ports. Existing create-quiz tests updated for `SOURCE_UNUSABLE` / generate return shape. |
| Integration | Persist snapshot, checksum, `resolvedUrl`, `modelId`, `sourceExcerpt`; still no key leakage | Real Postgres. Override or inject source/generation doubles that return a grounded quiz. |
| API E2E default | Existing create→get→start→submit→result | **Override** `MARKDOWN_SOURCE_PORT` / `QUIZ_GENERATION_PORT` with fixtures (or equivalent doubles) so `pnpm test:e2e` stays offline and key-free. Add cases for HTTP mapping of `SOURCE_*` / `GENERATION_*`. |
| Live (optional gated) | One public README blob URL + topic → 201 ready → GET 5–8 questions | `OPENAI_API_KEY` set and `PHASE3_LIVE_README=1`. `describe.skip` otherwise. Not required for default CI. |

Product `QuizModule` wires **real** adapters. Tests that boot `AppModule` **must override** the two ports; otherwise e2e would call the network.

Live URL for the quickstart: `https://github.com/expressjs/express/blob/master/Readme.md`, topic `Express routing`, count 5. Reviewer confirms prompts relate to Express and the README. A second README is Phase 5.

**Rationale**: Constitution VI (API E2E uses mocked LLM) plus spec FR-020 (one live README for definition of done). Overrides keep Phase 2 e2e deterministic.

**Alternatives considered**:

- Env flag in production module to keep fixtures — risk of shipping fixtures by mistake; overrides in Test module are explicit.
- Always-on live e2e — flakes and requires a paid key in every run.

---

## 10. Environment

**Decision**: Extend API Zod env with **optional** `OPENAI_API_KEY` and `OPENAI_MODEL` (empty allowed). Do not require them to boot. `.env.example` documents `OPENAI_MODEL=gpt-4o-mini` and that the key is needed only for product create / live evidence. Never log values. Web env unchanged (`NEXT_PUBLIC_*` only). Langfuse placeholders stay unused.

**Rationale**: Spec FR-011/FR-018 and Phase 0 startup contract.

---

## 11. Dependencies we will add / will not add

**Add** (api app only): `ai`, `@ai-sdk/openai`.

**Do not add**: Langfuse SDKs, `ssrf` packages, UUID libs, Playwright, web quiz routes, production Dockerfiles, GitHub Actions, `packages/database`, a second generation strategy.

Domain and application `package.json` MUST remain free of `ai`, `@ai-sdk/openai`, Nest, Prisma, and HTTP clients. Import-boundary ESLint (Phase 0) continues to enforce that.

**Rationale**: Constitution I/II/VII/VIII and Phase 3 exclusions.

---

## 12. Unchanged Phase 2 behavior

**Decision**: GET quiz, start-attempt, submit, result, token hashing, ownership, immutability, `gradeAttempt`, Prisma schema shape, and `/health`/`/ready` stay as specified in Phase 2. `/health` MUST NOT fetch URLs or call the model.

Create request Zod is unchanged (topic, https URL **shape**, count, strategy). Fetch happens **after** parse.

**Rationale**: Spec FR-016/FR-017.
