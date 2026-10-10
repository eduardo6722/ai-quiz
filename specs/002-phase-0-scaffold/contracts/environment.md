# Environment contract (Phase 0)

Template file: `.env.example` (committed). Runtime file: `.env` (gitignored). No live secrets in git.

## Required to start Phase 0

| Name | App | Example (local, not a secret) | Validation |
| ---- | --- | ----------------------------- | ---------- |
| `DATABASE_URL` | API | `postgresql://postgres:postgres@localhost:5432/ai_quiz?schema=public` | Zod URL; required |
| `PORT` | API | `3001` | Zod coerce number; default `3001` |
| `NEXT_PUBLIC_API_URL` | Web | `http://localhost:3001` | Zod URL; required |

## Optional / unused this phase

| Name | App | Phase 0 rule |
| ---- | --- | ------------ |
| `DIRECT_URL` | API | Optional; may duplicate `DATABASE_URL`. Not required to boot. |
| `NODE_ENV` | API/Web | Optional; default `development`. |
| `OPENAI_API_KEY` | — | Placeholder only. **Must not** be required. |
| `OPENAI_MODEL` | — | Placeholder only. **Must not** be required. |
| `LANGFUSE_PUBLIC_KEY` | — | Placeholder only. **Must not** be required. |
| `LANGFUSE_SECRET_KEY` | — | Placeholder only. **Must not** be required. |
| `LANGFUSE_BASE_URL` | — | Placeholder only. **Must not** be required. |

## Failure contract

- Missing `.env` or missing required keys → process exits before serving traffic.
- Error message names the missing/invalid **key**, never the secret **value**.
- Web schema MUST NOT include `DATABASE_URL` or provider keys.
- API MUST NOT print `DATABASE_URL` in logs.

## Compose alignment

`compose.yml` database user, password, database name and port MUST match the documented `DATABASE_URL` example so copy-paste from `.env.example` works.
