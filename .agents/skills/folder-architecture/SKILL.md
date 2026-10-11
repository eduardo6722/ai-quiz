---
name: folder-architecture
description: Place new code in context-scoped folders across apps/api, apps/web, and packages. Use before adding files or features so dumps of unrelated modules are not recreated.
---

# Folder architecture

Organize by **product context**, then by role inside that folder. Hexagonal package boundaries stay (`domain` → `application` → adapters). Keep `quiz` (the document) and `attempt` (a sitting of that quiz) separate. Do not add a third `result/` folder in application — submit, grade, and get-result are the attempt lifecycle. Web keeps one `features/quiz` product area with screen slices (`setup`, `player`, `results`).

Read this skill before creating files. Do not recreate `helpers/`, `infrastructure/`, `modules/quiz/adapters/**`, or a grab-bag `shared/` just because older specs mentioned them.

## Canonical layout

```text
packages/domain/src/
  quiz/          # quiz entity, generation/source/repository ports
  attempt/       # attempt entity, attempt repository port
  scoring/       # scoring policy and weighted average
  shared/        # only code used by 2+ contexts (errors, UoW, telemetry ports)
  index.ts       # public package API

packages/application/src/
  quiz/          # create/get the quiz document, grounding, public quiz view
  attempt/       # start, submit, grade, get result — the sitting
  util/          # tiny pure helpers (token-hash)
  errors.ts
  testing/
  index.ts

packages/contracts/src/
  quiz/          # create-quiz request/response, public quiz view
  attempt/       # start attempt, submit answers, public result
  errors/        # error codes and error response
  index.ts

packages/ui/src/
  components/    # shadcn primitives only (not product features)
  lib/           # cn() and similar primitive helpers

apps/api/src/
  main.ts, app.module.ts
  health/        # liveness/readiness
  platform/      # Nest cross-cutting: config, http, logging, persistence
  quiz/          # quiz module, HTTP, generation, source, persistence, telemetry, fixture
  attempt/       # attempt HTTP and persistence
  eval/          # live judge + Langfuse experiment adapters for golden eval (composition root)

evals/           # evaluation context: golden dataset, pins, rubrics, runners — not domain scoring
  src/           # dataset/, evaluators/, judge/, experiment/, testing/
  datasets/, sources/, rubrics/, baselines/

apps/api/test/
  e2e/<context>/ + e2e/support/
  integration/<context>/ + integration/support/
  health/, platform/

apps/web/src/
  app/           # Next.js routes only; keep them thin
  config/        # public env parsing
  features/quiz/ # setup, player, results, layout, api, session, errors, testing
```

## Where new code goes

1. Name the context (`quiz`, `attempt`, `scoring`, `health`, `platform`, `eval`, or a **new** context folder if the feature is genuinely new). Offline golden evaluation lives in repo-root `evals/`; live adapters stay in `apps/api/src/eval/`.
2. Put domain types, invariants, and ports in `packages/domain/src/<context>/`.
3. Put use cases in `packages/application/src/<context>/` (`quiz/` vs `attempt/`). Package-level `errors.ts` is shared. `util/` is only for small pure helpers (e.g. `token-hash`); never put use cases there.
4. Put public Zod schemas in `packages/contracts/src/<context>/`.
5. Put Nest HTTP and outbound adapters in `apps/api/src/<context>/<role>/` (`http`, `persistence`, `generation`, `source`, `telemetry`).
6. Put Nest-wide HTTP/logging/env/Prisma wiring in `apps/api/src/platform/<role>/`, never inside a quiz folder.
7. Put web UI in `apps/web/src/features/<feature>/<slice>/`. Route files under `app/` only compose those features.
8. Add a shadcn primitive in `packages/ui/src/components/`. Product screens do not live in `packages/ui`.

`shared/` is allowed only for symbols imported by two or more contexts **in that same package**. If only one context uses it, put it in that context.

## Tests

- Colocate unit tests next to the source (`foo.ts` + `foo.spec.ts`).
- API integration and E2E suites stay under `apps/api/test/{integration,e2e}/<context>/`.
- Harnesses and fixtures go in `support/`, not mixed into spec folders.

## Public exports

Other packages import `@ai-quiz/domain`, `@ai-quiz/application`, `@ai-quiz/contracts`, and `@ai-quiz/ui` through `src/index.ts`. Do not deep-import another package’s internal folders.

## Do not

- Dump a new file into the nearest existing folder because it is “HTTP” or “a helper”.
- Recreate `apps/api/src/infrastructure/` or `apps/api/src/modules/quiz/adapters/{in,out}`.
- Put business rules in controllers, route files, or Prisma mappers.
- Add barrel `index.ts` files inside every context folder.
- Place answer-key or scoring logic in `apps/web` or `packages/contracts`.

Completed Spec Kit `tasks.md` files may still mention old paths. Follow this skill and the live tree, not historical task paths.
