# Phase 0 Research

**Feature**: Phase 0 Project Scaffolding  
**Date**: 2026-10-10  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution and `roadmap.md` bind the stack; this file chooses current majors, local defaults and scaffold patterns.

---

## 1. Node.js runtime

**Decision**: Target **Node.js 24 (Krypton) Active LTS**. Set `engines.node` to `^24` and document it in setup docs.

**Rationale**: On 2026-10-10, Node 24 is Active LTS (until 2026-10-20 Maintenance, EOL 2028-04-30). Node 26 is Current and does not become LTS until 2026-10-28. The Constitution requires “current supported Node.js LTS,” not Current.

**Alternatives considered**:
- Node 22 Maintenance LTS — still supported until 2027-04-30, but not the current Active LTS.
- Node 26 Current — would become LTS later this month; too new as the documented baseline for an interview clone.

---

## 2. Monorepo tooling

**Decision**: **pnpm workspaces** (`apps/*`, `packages/*`) + **Turborepo 2.x**. Root scripts: `dev`, `lint`, `typecheck`, `test`, `build`. Turbo `tasks` (not deprecated `pipeline`): `build` depends on `^build`; `typecheck` depends on `^typecheck`; `dev` is persistent and uncached. Pin `packageManager` in root `package.json`.

**Rationale**: Bound by Constitution. Turbo 2 orchestrates the four quality commands the spec requires. pnpm prevents undeclared cross-package imports from resolving via hoist by default, which supports hexagonal isolation.

**Alternatives considered**:
- npm/yarn workspaces — not the bound package manager.
- pnpm recursive scripts only — works, but loses Turbo caching called for by the roadmap.
- Nx — extra platform, not in the roadmap.

---

## 3. NestJS API shell

**Decision**: **NestJS 12.x** (`@nestjs/core` current stable 12.1.x) with the default HTTP adapter. Keep **Jest** as the API test runner despite Nest 12 CLI defaults (Vitest). Do **not** add `@nestjs/observe`. Composition root: `AppModule` + `HealthModule` + Prisma provider. No `quiz` module.

**Rationale**: Nest 12 is current stable, requires Node 20.19+/22.12+ (satisfied by Node 24), and has first-class Standard Schema / Zod-friendly config. Constitution Principle VI requires Jest; adopting Vitest would be a constitution violation. Observability SDK is Phase 6.

**Alternatives considered**:
- NestJS 11.x — still receiving patches, not the current major.
- Follow Nest 12 CLI Vitest default — conflicts with Constitution.
- Fastify adapter — unnecessary for a health-only shell.

---

## 4. Health vs readiness

**Decision**:
- `GET /health` — **liveness only** (process up). HTTP 200 with `{ "status": "ok" }` even if PostgreSQL is down.
- `GET /ready` — **readiness** including a Prisma/PostgreSQL ping via `@nestjs/terminus` `PrismaHealthIndicator`. HTTP 200 when the database answers; HTTP 503 when it does not.

**Rationale**: Spec FR-012 and the edge case “liveness may still report the process is up, but connectivity/readiness MUST NOT report success.” Terminus is the Nest-supported pattern and already integrates Prisma.

**Alternatives considered**:
- Single `/health` that includes the database — would fail liveness when the DB is down, contradicting the spec.
- Manual `SELECT 1` controller without Terminus — smaller, but Terminus is the documented Nest health module and keeps 503 mapping consistent.

---

## 5. Next.js web shell

**Decision**: **Next.js 16.x App Router** (current stable 16.4.x line) with `src/app`, TypeScript, Tailwind v4. Home route `/` only. `transpilePackages` for `@ai-quiz/ui` (and other workspace packages the web app imports). Do **not** install React Hook Form in this phase. Do **not** enable a second linter (Biome).

**Rationale**: Constitution binds Next.js App Router. 16.x is current stable. Phase 0 has no forms, so RHF would be unused weight. ESLint is the bound linter.

**Alternatives considered**:
- Next.js 15 Maintenance LTS — security-patched, not current.
- `create-next-app` Cache Components defaults — acceptable if they do not block a static/simple home shell; do not add caching product behavior.
- Pages Router — excluded by Constitution.

---

## 6. Prisma bootstrap without product tables

**Decision**: **Prisma 7.x** in `apps/api/prisma/`. Schema: PostgreSQL datasource + client generator, **zero product models**. Connection settings in `prisma.config.ts` (v7 moved URL out of `schema.prisma`). Use `@prisma/adapter-pg` + `pg` at the Nest composition root. Connectivity via Terminus Prisma ping (`SELECT`-level). Create a **minimal init migration** only if `migrate dev` needs a recorded baseline for `_prisma_migrations`; otherwise document `prisma generate` + connect. No `packages/database`.

**Rationale**: Prisma 7 is the current ORM line. Keeping Prisma inside `apps/api` avoids an extra package the Constitution forbids without a boundary. Empty schema proves connectivity without Phase 2 quiz tables.

**Alternatives considered**:
- Prisma 6 (`url = env("DATABASE_URL")` in schema) — simpler, but not current.
- Separate `packages/database` — extra package without a Phase 0 boundary.
- Dummy `HealthCheck` table — invents a product-adjacent table the spec does not need.

---

## 7. Local PostgreSQL

**Decision**: Root `compose.yml` with **PostgreSQL 16 Alpine**, service name `db`, port **5432**, named volume, `pg_isready` healthcheck. Credentials are documented local defaults in `.env.example` (not production secrets). Apps are **not** Compose services.

**Rationale**: Spec: Compose is PostgreSQL-only this phase. Postgres 16 is a stable, widely used major. Healthcheck + volume match the spec. API/web containers are Phase 7.

**Alternatives considered**:
- Postgres 17 — current, slightly less ubiquitous in examples.
- Bitnami or cloud images — extra moving parts.
- API/web in Compose with bind mounts — excluded until delivery phase.

---

## 8. Environment validation

**Decision**: Validate with **Zod at each app’s bootstrap** (not in `packages/domain`). API required: `DATABASE_URL` (URL string), `PORT` (default `3001`). Web required: `NEXT_PUBLIC_API_URL` (URL string, default documented `http://localhost:3001`). Optional placeholders in `.env.example` only: `DIRECT_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `LANGFUSE_*`. Those unused names MUST NOT be in the Zod `.required()` set. Fail closed; never log secret values.

**Rationale**: Constitution IV requires Zod for external input; env is external. Public contracts package is for quiz DTOs later — env schemas are app-private. FR-009 forbids requiring AI/Langfuse keys.

**Alternatives considered**:
- Joi / `@nestjs/config` class-validator — not the bound validator.
- Shared env schema in `packages/contracts` — mixes public DTOs with server secrets.
- `t3-env` — extra library for a two-field schema.

**Local ports**: API **3001**, web **3000** (Next default) so they do not collide.

---

## 9. Shared packages and npm names

**Decision**: Workspace packages named `@ai-quiz/domain`, `@ai-quiz/application`, `@ai-quiz/contracts`, `@ai-quiz/ui`, `@ai-quiz/config`. Each publishes a compilable shell (`src/index.ts`). Domain and application `package.json` MUST NOT depend on Nest, Prisma, Next, React, OpenAI, AI SDK or Langfuse. Consume TypeScript source internally (`transpilePackages` / tsconfig paths) so Phase 0 does not need a separate bundler.

**Rationale**: Names match the Constitution package list and avoid clashing with shadcn’s `@workspace/ui` template, which we are not using as a wholesale scaffold (Spec Kit files already occupy the repo root).

**Alternatives considered**:
- `@repo/*` — generic; weaker product identity.
- `shadcn init --monorepo` from repo root — would fight existing `.specify/`, skills and docs.
- tsup/unbuild per package — extra build graph for empty shells.

---

## 10. Import-boundary enforcement

**Decision**: Combine:
1. **pnpm dependency declarations** (domain/application omit framework packages).
2. **ESLint `eslint-plugin-boundaries`** (or equivalent `no-restricted-imports`) in `@ai-quiz/config`: `domain` → nothing framework; `application` → `domain` (+ `contracts` if needed); `api` may import domain/application/contracts/prisma/nest; `web` may import contracts/ui, not api source, prisma or secrets.
3. A **lint fixture or documented rule test** so a disallowed import fails `pnpm lint`.

**Rationale**: FR-019 requires the gate to be an error, not a convention. Package.json isolation is necessary but not sufficient if someone adds a dependency later; ESLint catches the import.

**Alternatives considered**:
- Turborepo Boundaries tags only — package-level, weaker for npm package names like `@nestjs/core` inside `packages/domain`.
- Trust only code review — Constitution wants an automated gate.

---

## 11. Jest and React Testing Library

**Decision**: Jest 29/30.x as used by Nest 12’s Jest path, shared preset in `@ai-quiz/config`. API: Jest + Supertest for `GET /health` (no database). Domain/application/contracts: one passing identity/smoke test each. Web: Jest + `@testing-library/react` + `jest-environment-jsdom` rendering the home shell. `pnpm test` MUST pass **without** PostgreSQL running. Live `/ready` is proven in quickstart against Compose, not as a required unit-test dependency.

**Rationale**: Spec requires `pnpm test` on a fresh clone; a clone’s unit suite should not require Docker. Constitution still wants Jest (not Vitest/Playwright).

**Alternatives considered**:
- Vitest — Nest 12 default, forbidden by Constitution.
- Testcontainers in `pnpm test` — heavier than Phase 0 smoke tests.
- Playwright — explicitly deferred.

---

## 12. Design foundations

**Decision**: Tailwind CSS **v4** tokens live **once** in `packages/ui` (globals CSS), merged with shadcn semantic variables using the hex values from `.agents/skills/design-system/SKILL.md` and the `@theme inline` map from `references/tailwind-recipes.md`. Add shadcn **Button** and **Card** only, plus a small **PageShell**. English home copy. System/local font stacks; no remote fonts; no dark theme; no quiz routes. `packages/ui` must remain importable without Nest/Prisma.

**Rationale**: Design-system skill requires tokens installed once, Tailwind utilities, and shadcn primitives in `packages/ui`. Phase 0 may not build quiz forms/player/results.

**Alternatives considered**:
- Tokens duplicated in `apps/web` only — violates “install once.”
- Full shadcn set (Input, RadioGroup, Progress, …) — quiz-oriented, out of scope.
- CSS Modules / another component library — forbidden by the skill.

---

## 13. TypeScript, ESLint, Prettier

**Decision**: Strict `tsc` everywhere. Shared `tsconfig` bases in `@ai-quiz/config` (`strict: true`, no implicit any). ESLint 9 flat config + Prettier. Root `pnpm typecheck` → `turbo typecheck` (`tsc --noEmit`). Do not use `any` or non-null assertions to “make the shell compile.”

**Rationale**: Constitution III. Shared config package is in-scope (FR-004).

**Alternatives considered**:
- Per-app divergent compiler flags — drifts immediately.
- Biome instead of ESLint/Prettier — not the bound toolchain.

---

## 14. Documentation and secrets

**Decision**: Update root `README.md` with Phase 0 setup (install, env copy, compose db, prisma generate/migrate if any, `pnpm dev`, curl health/ready, quality commands). Keep `.env.example` committed; gitignore `.env`. Never commit secrets. Do not reinitialize Spec Kit or rewrite the Constitution.

**Rationale**: FR-020, FR-021, Principle VII.

**Alternatives considered**:
- Docs-only in `specs/002-phase-0-scaffold/quickstart.md` — that file is the validation guide; developers still need README at repo root.

---

## 15. Deferred on purpose (not NEEDS CLARIFICATION)

These are known later-phase items, not open research questions:

- React Hook Form + Zod resolver (Phase 4)
- Quiz Prisma models (Phase 2)
- OpenAI / Vercel AI SDK (Phase 3)
- Langfuse (Phase 6)
- GitHub Actions and production Dockerfiles (Phase 7)
- Production `prisma migrate deploy` (Phase 7)
