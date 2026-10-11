# AI Quiz Generator

The source of truth for product behavior remains `roadmap.md`. This repository also contains harness-agnostic **planning and agent configuration** for Cursor, OpenAI Codex and Claude Code, plus the Phase 0 local workspace (monorepo, NestJS API shell, Next.js web shell, and PostgreSQL).

## Canonical files

| Path | Purpose |
| --- | --- |
| `roadmap.md` | English product and implementation roadmap, milestone gates, testing and deployment |
| `AGENTS.md` | Shared repository-wide engineering policy for Cursor/Codex/recent Claude Code |
| `.agents/skills/design-system/SKILL.md` | Canonical light-green/botanical design system |
| `.agents/skills/design-system/references/` | Art direction and Tailwind/shadcn recipes |
| `.agents/skills/code-review/SKILL.md` | Canonical read-only review criteria, severity and required report format |

## Thin harness adapters

| Path | Who uses it | Why it exists |
| --- | --- | --- |
| `.cursor/agents/code-review.md` | Cursor | Real review subagent, `readonly: true`, delegates to shared checklist |
| `.cursor/rules/ui-design.mdc` | Cursor | Optional path-scoped automatic UI instruction referencing the shared skill |
| `.codex/agents/code-review.toml` | Codex | Real review subagent, `sandbox_mode = "read-only"`, delegates to shared checklist |
| `.claude/agents/code-review.md` | Claude Code | Real review subagent with read-only tools, delegates to shared checklist |
| `.claude/skills/design-system/SKILL.md` | Claude Code | Lightweight skill entry point to `.agents/skills/design-system/` |
| `.claude/skills/code-review/SKILL.md` | Claude Code | Lightweight skill entry point to `.agents/skills/code-review/` |

Cursor and Codex automatically discover canonical project skills from `.agents/skills/`. Current Claude Code automatically loads project skills from `.claude/skills/`, so small entry points are supplied instead of duplicating full skills. Claude Code v2.1.277+ also reads `AGENTS.md` directly by default when no local `CLAUDE.md` takes precedence. On older versions, add a `CLAUDE.md` containing `@AGENTS.md` as a compatibility fallback (do not duplicate policy content).

## Installation

1. Extract this ZIP into the **repository root**, including hidden `.agents/`, `.cursor/`, `.codex/` and `.claude/` folders.
2. Open the repository in Cursor, Codex or Claude Code and verify the skills/agents have been discovered. Some clients may require a new agent session.
3. Read `roadmap.md` and `AGENTS.md` before generating files.
4. Invoke the design-system skill for visual work, and the specialized code-review agent after each meaningful feature.
5. If your chosen agent does not offer subagent delegation, explicitly instruct it to follow `.agents/skills/code-review/SKILL.md` in a separate review step. A skill is not itself a separate worker/context.
6. Commit these files so engineering conventions travel with the repository.

## Spec Kit uses separate per-harness integration

The **product roadmap, AGENTS.md and skills remain portable**. Spec Kit-generated commands are tied to the harness integration installed at initialization. In a new repository, choose the current harness:

```bash
# Use ONE of the following after installing Specify CLI:
specify init --here --integration cursor-agent
specify init --here --integration codex
specify init --here --integration claude
```

If Spec Kit is already initialized, use `specify integration list` and `specify integration install <key>` or `specify integration switch <key>` after checking your installed version and how it manages existing integration files. Do **not** run `--force` without inspecting changes. The kit does not include Spec Kit-generated files because they should be created by the CLI.

## Suggested implementation prompt (works with any harness)

> Read `roadmap.md` and `AGENTS.md`. Implement only milestone M0 using Spec Kit: pnpm + Turborepo monorepo, NestJS API, Next.js frontend, shared domain/application/contracts/UI packages, TypeScript/ESLint, Prisma/PostgreSQL and Docker Compose for development. Use `.agents/skills/design-system/SKILL.md` when touching UI. Run the available lint, typecheck, tests and build. Afterwards, delegate review to the native code-review subagent or follow `.agents/skills/code-review/SKILL.md` as a separate read-only review step. Do not mark unfinished roadmap items complete.

## Important limitation

There is **no single guaranteed interoperable native subagent or path-scoped rules format** across Cursor, Codex and Claude. This kit standardizes the **content**, not those runtimes. Thin adapters deliberately preserve native functionality without maintaining duplicate engineering policies.

## Scoring contract note

The supplied task leaves multi-answer partial scoring underspecified. The roadmap records a provisional policy (one point per correctly selected option, without adding an unspecified penalty). Confirm this during the interview or in a project ADR before presenting it as an authoritative requirement.

## Local development (Phase 0)

Requires **Node.js 24** (Active LTS), **pnpm 12**, and Docker. Do **not** run `specify init --force` or regenerate the Constitution.

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL, the NestJS API (`nest start --watch` on port 3001), and the Next.js web shell (`next dev` on port 3000). Compose points the API at the `db` hostname; `.env` `localhost` values stay for host-side `pnpm dev`.

Host-only alternative (Postgres in Compose, apps on the host):

```bash
pnpm install
docker compose up -d db
pnpm db:generate
pnpm db:migrate
pnpm dev
```

- Web quiz: http://localhost:3000 (see **Run the web quiz** below)
- API liveness: http://localhost:3001/health
- API readiness (database): http://localhost:3001/ready

### Run the web quiz

| Route | Screen |
| --- | --- |
| `/` | Setup — topic, HTTPS Markdown URL, question count 5–8 |
| `/quiz/{id}` | Player — one question at a time |
| `/quiz/{id}/results` | Results — stored 0–4 weighted score |

The API allowlists the web origin via optional `WEB_ORIGIN` (default `http://localhost:3000`) so the browser can call `/v1`. Attempt tokens stay in `sessionStorage`, never in the URL.

Live **Generate quiz** needs `OPENAI_API_KEY` and a reachable HTTPS README on the API. Missing those is an environment blocker — the UI must not fall back to the Phase 2 fixture bank. Jest UI tests mock the API and do not need a model key.

Startup does **not** require `OPENAI_API_KEY` or Langfuse keys.

Phase 1 scoring lives in `@ai-quiz/domain` (`scoreSingleChoice`, isolated `scoreMultipleChoice`, `calculateWeightedScore`). It is deterministic and does not need PostgreSQL or a model key — `pnpm --filter @ai-quiz/domain test` is enough to demonstrate grading.

### Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

These four succeed without PostgreSQL. Live `/ready` against Compose is a manual check: stop `db` and expect `/health` 200 and `/ready` 503.

## Phase 2 persistence and `/v1` smoke

Phase 2 adds PostgreSQL persistence and a fixture-backed REST quiz flow. It does **not** fetch remote Markdown, call a model, or ship a quiz player.

Create the isolated test database once (same Postgres instance as `ai_quiz`, never the dev data volume):

```bash
docker compose up -d db
docker compose exec db psql -U postgres -c "CREATE DATABASE ai_quiz_test;"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public pnpm db:migrate
```

Then, with Postgres available:

```bash
pnpm test:integration
pnpm test:e2e
```

Default `pnpm test` still does not require `ai_quiz_test`. Integration and API suites use `postgresql://postgres:postgres@localhost:5432/ai_quiz_test?schema=public` (also documented as a comment in `.env.example`).

Optional manual smoke against `pnpm --filter @ai-quiz/api dev` (migrated `ai_quiz`):

```bash
curl -sS -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -d '{"topic":"Hexagonal architecture","sourceUrl":"https://example.com/README.md","questionCount":5}'
```

Then `GET /v1/quizzes/:quizId`, `POST /v1/quizzes/:quizId/attempts`, `POST /v1/attempts/:attemptId/submit` with `Authorization: Bearer <token>`, and `GET /v1/attempts/:attemptId/result`. Create returns `{ id, status: "ready" }`. GET quiz has no answer keys. Submit/result scores match Phase 1 for the fixture.

## Phase 3 Markdown ingestion and OpenAI generation

Product `POST /v1/quizzes` fetches HTTPS Markdown (SSRF-safe, GitHub blob → raw) and generates a 5–8 question quiz with the Vercel AI SDK / OpenAI adapter. Scoring stays in `@ai-quiz/domain`. This phase does **not** add a quiz player UI, a second live README package, Langfuse, or production delivery.

`OPENAI_API_KEY` and `OPENAI_MODEL` (example `gpt-4o-mini`) are required for **product create** and gated live evidence. They are **not** required to boot the API. Default `pnpm test` and `pnpm test:e2e` override source/generation ports so they stay offline and key-free.

Unsafe destination smoke (expect `SOURCE_UNSAFE_DESTINATION`; full steps in `specs/005-phase-3-markdown-generation/quickstart.md`):

```bash
curl -sS -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -d '{"topic":"Nope","sourceUrl":"https://127.0.0.1/README.md"}'
```

Gated live README (needs `OPENAI_API_KEY`, `OPENAI_MODEL`, and `PHASE3_LIVE_README=1` for the automated file):

```bash
curl -sS -X POST http://localhost:3001/v1/quizzes \
  -H 'content-type: application/json' \
  -d '{"topic":"Express routing","sourceUrl":"https://github.com/expressjs/express/blob/master/Readme.md","questionCount":5}'
```
