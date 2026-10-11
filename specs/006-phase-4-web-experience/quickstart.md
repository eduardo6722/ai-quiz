# Quickstart: Phase 4 browser quiz experience

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)  
**Contracts**: [screens.md](./contracts/screens.md), [attempt-session.md](./contracts/attempt-session.md), [error-copy.md](./contracts/error-copy.md), [browser-api.md](./contracts/browser-api.md), [ui-primitives.md](./contracts/ui-primitives.md)  
**HTTP (unchanged)**: [Phase 3 create](../005-phase-3-markdown-generation/contracts/create-quiz.md), [public quiz](../005-phase-3-markdown-generation/contracts/public-quiz-view.md), [start](../004-phase-2-persistence-api/contracts/start-attempt.md), [submit](../004-phase-2-persistence-api/contracts/submit-answers.md), [result](../004-phase-2-persistence-api/contracts/public-result.md)  
**Data model**: [data-model.md](./data-model.md)

This is a validation guide, not an implementation task list. Commands assume Phases 0–3 are present and Phase 4 code described in the plan has been implemented.

## Prerequisites

- Node.js 24 (Active LTS) and pnpm (pinned by root `packageManager`)
- Docker (or compatible) for PostgreSQL
- `pnpm install` from the repo root; `.env` copied from `.env.example`
- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `WEB_ORIGIN` may be omitted (API defaults to `http://localhost:3000`)
- **Jest UI suites do not require `OPENAI_API_KEY` or PostgreSQL**
- Live browser generate (definition of done) needs `OPENAI_API_KEY`, `OPENAI_MODEL`, network, and a reachable HTTPS README

## Setup

```bash
docker compose up -d db
pnpm db:generate
pnpm db:migrate
pnpm --filter @ai-quiz/api dev
pnpm --filter @ai-quiz/web dev
```

Web: `http://localhost:3000` · API: `http://localhost:3001`

## Quality commands (always)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` MUST pass **without** PostgreSQL and **without** a model key. Web tests MUST mock the API (or `fetch`) and MUST cover:

- Setup validation (empty topic, non-https URL, valid generate)
- Single vs multiple selection, progress `Question n of N`, previous/next keeps answers
- Generating and mapped error + retry
- Submit success shows `weightedScoreDisplay` from the mocked result (not a client-computed weight)
- Player markup / quiz fixture has **no** `isCorrect`

Existing `pnpm test:integration` and `pnpm test:e2e` MUST still pass (API behavior unchanged aside from CORS at `main.ts` boot).

## Browser definition of done

With API + web running and a model key configured:

1. Open `http://localhost:3000`. Confirm English setup (not “View API health”).
2. Enter a topic, a public HTTPS README URL (for example the Phase 3 Express blob URL), count 5–8. Generate.
3. Wait through generating; then answer every question (mix of single/multiple if present). Use Back once and confirm the previous selection remains. Submit.
4. Confirm the headline score is on the **0–4** scale, percentage is secondary, each question has Correct/Incorrect text, and the source URL is linked.
5. Refresh results: same stored score. Confirm the address bar has **no** attempt token.
6. Open results in a fresh tab (or after clearing session storage): English cannot-show-result state, **no** keys.

If the model key or README is missing, record an **environment blocker**. Do **not** silently serve the Phase 2 fixture bank in the UI. Jest evidence still counts for validation/selection/errors.

## Phone and desktop acceptance

Reviewer pass (not Playwright):

| Width | Expect |
| ----- | ------ |
| ~320px | No horizontal scroll; full-width Generate/Submit; wrapped URL and options; 44px targets |
| ≥1024px | Setup may show restrained artwork; player stays a single ~720px column |

Keyboard: tab through fields, choose options, Next/Submit, results CTA, visible focus.

## Scope check

A diff review MUST find **zero** new scoring functions in `apps/web`, **zero** Langfuse, **zero** production Dockerfiles or GitHub Actions, **zero** new `/v1` routes, and CORS limited to `WEB_ORIGIN`.
