# Contract: Release migrations and gated deploy (`.github/workflows/release.yml`)

**Feature**: [spec.md](../spec.md)

## Triggers

- `workflow_dispatch` with inputs `publish_images` (boolean) and `deploy_target` (string, default `none`)
- Optional `push` to `main` that **builds** images; push-to-registry still requires `publish_images` / environment approval

## Environment

GitHub Environment `production`. Permissions: `contents: read`; `packages: write` only when publishing to GHCR.

## Variables (not secrets)

| Name | Default | Meaning |
| ---- | ------- | ------- |
| `REGISTRY` | `ghcr.io` | Container registry host |
| `IMAGE_PREFIX` | `ghcr.io/<owner>/<repo>` | Repository prefix for `api` and `web` images |
| `DEPLOY_TARGET` | `none` | `none` \| `compose` \| operator-defined |

No workflow file may hardcode a personal Fly/AWS/VPS endpoint.

## Migration

Always `prisma migrate deploy` (root `pnpm db:migrate:deploy`) against existing files.  
Forbidden: `prisma migrate dev`, `prisma db push`, generating migrations in the running API.

Order when a live database is configured: migrate **then** start/replace API containers.

## Publish / deploy outcomes

| Input | Evidence | Status to record |
| ----- | -------- | ---------------- |
| `publish_images=false` | none | publish **not_run** |
| `publish_images=true` and registry login succeeds | digest in the log | publish **passed** |
| `DEPLOY_TARGET=none` or unset | none | deploy **not_run** |
| `DEPLOY_TARGET=compose` | workflow prints the exact compose pull/up command; does not SSH unless the operator later adds a documented secret+script | deploy **not_run** until a host actually ran that command |
| Custom target with operator script + secret + success log | log | deploy **passed** |

## Rollback and backup (documentation contract)

- Rollback: redeploy previous `:git-sha` API and web images. Schema down-migration is **not** promised.
- Backup: PostgreSQL volume (`ai_quiz_prod_pgdata` locally; operator-managed backup in a real host). This cycle ships **no** backup service.

## Stub

Optional `scripts/deploy.sh`: if `DEPLOY_TARGET` is empty or `none`, print `deploy: not_run` and exit 0. Must not push anywhere.
