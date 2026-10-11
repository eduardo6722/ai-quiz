# Phase 4 Research

**Feature**: Phase 4 Complete Browser Quiz Experience  
**Date**: 2026-10-11  
**Spec**: [spec.md](./spec.md)

All Technical Context unknowns are resolved below. Constitution, `roadmap.md`, `implementation-roadmap.md` and the Phase 4 spec bind behavior. Reuse verified Phases 0–3; consume public `/v1` contracts; do not re-scaffold, re-grade, add Langfuse, CI/CD, production containers, or a two-source demo package.

---

## 1. Consume the verified API from the browser (CORS blocker)

**Decision**: The web app calls `NEXT_PUBLIC_API_URL` (`http://localhost:3001`) from the browser with `fetch`. NestJS currently has **no** `enableCors`. That is a **documented blocker** of this existing flow.

Enable CORS in `apps/api` `main.ts` only:

- `origin`: exact allowlist from new optional env `WEB_ORIGIN` (default `http://localhost:3000`)
- `methods`: `GET`, `POST`, `OPTIONS`
- `allowedHeaders`: `Content-Type`, `Authorization`
- `credentials`: `false` (attempt token is a Bearer header, not a cookie)

Do **not** add quiz resources, change scoring, or proxy `/v1` through Next.js Route Handlers. E2E `createApiApp` does not boot `main.ts`; add a small unit test that the CORS options helper allowlists only `WEB_ORIGIN`.

**Rationale**: Spec FR-014 allows backend changes only when they block the browser flow. Phase 0 already published `NEXT_PUBLIC_API_URL` as the web→API origin. Cross-origin `fetch` without CORS fails in the browser.

**Alternatives considered**:

- Next.js rewrites / BFF Route Handlers — extra hop, hides the public API the interviewer must explain, still needs the token on some path.
- `credentials: true` plus cookies — changes the Phase 2 token lifecycle the spec forbids rewriting.
- Allow `*` origin — weaker than an explicit web origin for an API that accepts Bearer tokens.

---

## 2. Client architecture: App Router pages + `features/quiz`

**Decision**: Keep Next.js 16 App Router. Replace the Phase 0 placeholder `/` with setup. Add `/quiz/[quizId]` and `/quiz/[quizId]/results`. Thin `page.tsx` files render feature components from `apps/web/src/features/quiz/`. Those components are Client Components (`use client`) because they need React Hook Form, `sessionStorage`, and `fetch`.

Quiz HTTP lives in a small `api-client.ts` that:

- Uses `env.NEXT_PUBLIC_API_URL`
- Parses bodies with existing `@ai-quiz/contracts` Zod schemas
- Sends `Authorization: Bearer <token>` only on submit and result
- Throws a typed error `{ code, message }` from `errorResponseSchema`

Web MAY import `@ai-quiz/contracts` and `@ai-quiz/ui` only (existing ESLint boundary). It MUST NOT import `@ai-quiz/domain`, `@ai-quiz/application`, Prisma, or `apps/api`.

**Rationale**: Roadmap M3 routes. Constitution II: web consumes public contracts and UI primitives. Client Components are required for RHF and session token storage.

**Alternatives considered**:

- Server Actions that call use cases directly — would import application/API internals into web and risk putting tokens in server logs.
- Get quiz only via Server Components — start-attempt/submit still need the browser token; CORS would still be required. One client API module is simpler.

---

## 3. React Hook Form + Zod (setup only)

**Decision**: Add `react-hook-form` and `@hookform/resolvers` to `apps/web`. Setup form uses `zodResolver` against the public `createQuizRequestSchema` (or a thin coerce wrapper so `<select>` `questionCount` is an integer 5–8). `noValidate` on the form; field errors via `aria-invalid` / `aria-describedby` as in the design-system recipes.

Do **not** put the whole player on React Hook Form. Player selections are a `Record<questionId, string[]>` in sitting state; submit builds `parseSubmitAnswersRequest` once.

Omit `strategy` from the form; the contract default `balanced` is sent or omitted (API default).

**Rationale**: Constitution and Phase 0 research deferred RHF to this phase. Reusing `createQuizRequestSchema` keeps client validation aligned with `CREATE_QUIZ_INVALID`. Player selection rules (single vs multiple, required before next) are UX state, not the create-quiz schema.

**Alternatives considered**:

- Uncontrolled fields + manual `safeParse` — more glue, worse error association.
- RHF for every question — fights one-question-at-a-time navigation.
- Changing `packages/contracts` so `questionCount` is a string — leaks form encoding into the public API.

---

## 4. Private attempt token: session-scoped storage

**Decision**: After `POST /v1/quizzes/:id/attempts`, store `{ attemptId, token, currentIndex, selections, status }` in `sessionStorage` under `ai-quiz.attempt.<quizId>`. Never put the token in the URL, in visible copy, or in `console`/`Logger` calls.

- Player refresh in the same tab sitting: resume that attempt and selections.
- Results refresh: `GET .../result` with the stored Bearer token; also `GET` the public quiz view for prompts and `sourceUrl`.
- New sitting (storage empty): player starts a **new** attempt; results without a token show the unauthorized English state.
- After submit: `status: "scored"`; visiting the player URL redirects to results.
- “Create another quiz”: `router.push("/")` (new quiz id will use a new key). Optionally remove the old key; not required for privacy of the next sitting’s keys.

Do not use `localStorage` (would outlive the sitting). Do not use cookies.

**Rationale**: Spec FR-006/FR-010. `sessionStorage` is tab-scoped and matches “session-scoped browser storage.” Phase 2 already forbids storing plaintext tokens on the server.

**Alternatives considered**:

- Query-string token — leaks via history, referrer, and screenshots.
- `localStorage` — survives the sitting the spec does not promise to resume.
- Memory-only React state — a refresh would strand the interviewer after a long generation.

---

## 5. Results compose public quiz view + public result

**Decision**: Do **not** extend `publicResultSchema` with `prompt` or `sourceUrl`. Results load:

1. Public result (scores, `isCorrect`, `selectedOptionIds`, display fields) with the attempt token
2. Public quiz view (prompts, types, labels, original `sourceUrl`) without a token

Join on `questions[].id`. Headline score is `weightedScoreDisplay` / `4.00`; secondary text is `percentageDisplay`. Per-question **Correct** if every selected option is correct and, for `single`, the one selected option is the correct one — equivalently, use `rawScore === 4` for Correct and otherwise Incorrect (Phase 1 single is 4 or 0; multiple may be 1–3). Spec wants Correct/Incorrect labels: **Correct** when `rawScore === 4`, **Incorrect** otherwise. Still show which options were correct via `isCorrect` so a partial multi-select is understandable.

**Rationale**: Spec assumption: missing prompts on the result payload are not an API gap. Extending the result DTO is out of scope unless it blocked the flow; joining two public resources does not.

**Alternatives considered**:

- Add `prompt`/`sourceUrl` to the result contract — backend product change, not a blocker.
- Show excerpts — not on any public pre- or post-submit contract this phase.

---

## 6. Player navigation and selection rules

**Decision**: One question visible. Progress text `Question {n} of {N}` plus optional `Progress` bar (step completeness, not score). `single` → radio group, copy “Select one answer.” `multiple` → checkboxes, copy “Select all that apply.” Next disabled until a legal selection (single: exactly one id; multiple: one to four unique ids). Back always allowed from question 2+. Last question primary action is “Submit answers”. Changing a previous answer updates `selections` until submit.

**Rationale**: Spec User Story 3 and design-system player layout. Enforcing legality in the UI prevents most `ATTEMPT_INCOMPLETE` / `SELECTION_ILLEGAL` trips while the server remains source of truth.

**Alternatives considered**:

- Allow skip and only validate on submit — poorer UX, more error states.
- Show all questions on one page — contradicts the sequential player in the art guide.

---

## 7. Shared UI primitives (extend `@ai-quiz/ui`, no shadcn CLI)

**Decision**: Keep the Phase 0 pattern: hand-rolled Tailwind primitives in `packages/ui` using design-system tokens. **Do not** run `shadcn init`. Add:

`Input`, `Label`, `FormField`, `RadioGroup` / `RadioGroupItem`, `Checkbox`, `Progress`, `Alert`, `Badge`, `Skeleton`

Use **native** `<input type="radio">` / `<input type="checkbox">` inside labeled option rows (minimum 44px, entire row clickable). No Radix. Add `lucide-react` to `apps/web` for BookOpen / Check / X / leaf-style icons on setup and results. Decorative SVG `aria-hidden`.

Reuse existing `PageShell`, `Card`, `Button`, `cn`, and the token file in `packages/ui/src/styles/globals.css`.

**Rationale**: Phase 0 explicitly rejected `shadcn init --monorepo` because Spec Kit occupies the repo. The skill requires shared primitives and native accessible controls, not a second design-system library. Native radios/checkboxes satisfy keyboard and screen-reader needs without new peer dependencies in `@ai-quiz/ui`.

**Alternatives considered**:

- Full Radix shadcn copies — extra deps for little gain on four options.
- Page-local unstyled markup — violates “improve shared variants instead of scattering overrides.”

---

## 8. English error copy mapping

**Decision**: Map known `ErrorCodes` to short English sentences in `features/quiz/error-copy.ts`. Examples:

| Code | Learner copy |
| ---- | ------------ |
| `CREATE_QUIZ_INVALID` | Check the topic, URL, and question count. |
| `SOURCE_UNSAFE_DESTINATION` | That address cannot be used as a quiz source. |
| `SOURCE_TIMEOUT` / `SOURCE_FETCH_FAILED` | Could not read the Markdown source. Try again. |
| `SOURCE_TOO_LARGE` / `SOURCE_UNSUPPORTED_TYPE` / `SOURCE_UNUSABLE` | That source is not usable Markdown. |
| `GENERATION_*` | Could not prepare questions from that source. Try again. |
| `QUIZ_NOT_FOUND` / `QUIZ_NOT_PLAYABLE` | This quiz is not available. |
| `UNAUTHORIZED_ATTEMPT` / `ATTEMPT_NOT_FOUND` | This result cannot be shown from this browser sitting. |
| `ATTEMPT_NOT_SCORED` | Submit your answers to see the result. |
| Network / parse failure | Could not reach the quiz service. Try again. |

Never interpolate tokens, hashes, keys, or provider traces. Prefer the mapped sentence over the raw API `message` when a code is known (API messages are already English and non-secret; mapping keeps tone consistent).

**Rationale**: Spec FR-012. Stable codes already exist in Phase 3; the UI must not leak internals.

**Alternatives considered**:

- Show `error.message` only — acceptable safety-wise, less consistent tone.
- New API error payload — out of scope.

---

## 9. Jest + React Testing Library evidence

**Decision**: Stay on Jest + RTL + jsdom (Phase 0 harness). Add `@testing-library/user-event`. Mock `fetch` (or inject the api-client) so `pnpm test` needs **no** API, PostgreSQL, or `OPENAI_API_KEY`. Mock `sessionStorage` via jsdom (already available).

Required suites:

- Setup validation (empty topic, `http` URL, valid submit starts generate)
- Player single vs multiple, progress text, previous/next preserves selections, next blocked without selection
- Loading and mapped error + retry
- Submit success navigates to results and shows display score from the **fixture result**, not a client-computed weight
- Player render has **no** `isCorrect` / scores in markup or mocked quiz payload
- Attempt-session: token not written to URL helpers; scored sitting redirects

Replace the Phase 0 home test that looks for “View API health”.

Phone/desktop acceptance is a **manual** reviewer pass (quickstart), not Playwright.

**Rationale**: Constitution VI and spec FR-017/FR-018. Playwright is explicitly deferred.

**Alternatives considered**:

- MSW as a required framework — optional later; `jest.fn` fetch is enough.
- Playwright in this cycle — roadmap optional later item; spec exclusion.

---

## 10. Loading and generation UX

**Decision**: On valid setup submit, disable the primary button, replace the form card with a generating state (`Skeleton` rows + status “Preparing your questions…” / “Reading source…”). Wait for synchronous `POST /v1/quizzes` (Phase 3 create is fetch-then-generate). On 201, `router.push(/quiz/{id})`. On error, restore the form with `Alert` and keep field values.

No fake percent-complete for generation (duration is unknown). Player load (GET quiz + start attempt) uses a short skeleton on `/quiz/{id}`.

**Rationale**: Spec User Story 7 and art-direction generating state. Create is synchronous; no polling API.

**Alternatives considered**:

- Navigate before create returns — no quiz id yet.
- Indeterminate spinner only — weaker than the skill’s skeleton + status text.

---

## 11. Backend and contract freeze

**Decision**: No Prisma migration. No scoring or generation changes. No new `/v1` paths. Public Zod schemas unchanged. Allowed API diffs: CORS helper + optional `WEB_ORIGIN` in env + `.env.example` comment. If implementation finds a true blocker (for example GET result missing `quizId` — it does not; the field exists), document it before expanding.

**Rationale**: Spec exclusions and FR-014.

**Alternatives considered**:

- Silent fixture fallback in the web app when generate fails — forbidden (Phase 3 FR-018, Phase 4 assumptions).

---

## 12. Dependencies to add

**Decision**:

| Package | Where | Why |
| ------- | ----- | --- |
| `react-hook-form` | `apps/web` | Setup form |
| `@hookform/resolvers` | `apps/web` | Zod resolver |
| `lucide-react` | `apps/web` | Skill-approved icons |
| `@testing-library/user-event` | `apps/web` (dev) | RTL interactions |

No new workspace packages. No Langfuse SDK. No Playwright.

**Rationale**: Minimal additions on the constitution-bound stack.

**Alternatives considered**:

- `@radix-ui/*` — not required with native option controls.
- `next-safe-action` / TanStack Query — extra layer for five fetch calls.

---

## 13. Environment

**Decision**:

- Web: existing required `NEXT_PUBLIC_API_URL` (unchanged).
- API: optional `WEB_ORIGIN` default `http://localhost:3000`. API boot still succeeds without `OPENAI_API_KEY` (Phase 3). Product generate from the UI still needs the key on the API; UI maps `GENERATION_UPSTREAM_FAILED`.

Document `WEB_ORIGIN` in `.env.example`. Do not add public model keys to the web env schema.

**Rationale**: Phase 0 web env stays one public URL. CORS origin is not a secret.

---

## 14. Deferred on purpose (not NEEDS CLARIFICATION)

- Two live README demonstration package (Phase 5)
- Langfuse, rate limits (Phase 6)
- GitHub Actions, production images (Phase 7)
- Playwright
- Strategy/difficulty pickers, Markdown preview, excerpts on results
- Dark theme, remote fonts, authenticated users
