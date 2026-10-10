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
pnpm db:migrate   # optional; schema has no product tables
pnpm dev
```

- Web: http://localhost:3000
- API liveness: http://localhost:3001/health
- API readiness (database): http://localhost:3001/ready

Startup does **not** require `OPENAI_API_KEY` or Langfuse keys.

### Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

These four succeed without PostgreSQL. Live `/ready` against Compose is a manual check: stop `db` and expect `/health` 200 and `/ready` 503.
