# Browser access to the verified API

The web origin (`http://localhost:3000` locally) calls the existing API origin (`NEXT_PUBLIC_API_URL`, default `http://localhost:3001`). Paths and JSON are unchanged from Phase 3.

This cycle’s **only** API behavior change: allow that web origin to call `/v1`.

## CORS (blocker fix)

`apps/api` bootstrap MUST `enableCors` with:

| Option | Value |
| ------ | ----- |
| `origin` | `WEB_ORIGIN` env, default `http://localhost:3000` (exact match) |
| `methods` | `GET`, `POST`, `OPTIONS` |
| `allowedHeaders` | `Content-Type`, `Authorization` |
| `credentials` | `false` |

Requests from other origins MUST NOT be allowed. Do not use `origin: true` / `*`.

`WEB_ORIGIN` MUST be a valid absolute URL. Invalid value fails API env parse (closed). Omitted → default local web origin so existing `.env` files keep working.

Jest/Supertest E2E boots via `Test.createTestingModule` (not `main.ts`) and stays unaffected. Unit-test the CORS options helper.

## Client `fetch` rules

- `credentials: "omit"`
- `content-type: application/json` on POST
- Submit/result: `authorization: Bearer <token>`
- Parse success with the matching contract schema; fail closed if parse fails
- Parse errors with `errorResponseSchema`; map `code` via [error-copy.md](./error-copy.md)
- Create quiz has **no** client timeout shorter than the server generation budget (learner waits on the generating screen)

## Out of scope

- New `/v1` routes
- Changing public Zod schemas
- Cookies / `Set-Cookie` for the attempt token
- Next.js proxy/BFF
- Rate limiting (Phase 6)
