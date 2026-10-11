# Production NestJS API image. Build from the repository root:
#   docker build -f apps/api/Dockerfile .
# Do not pass OPENAI_API_KEY, DATABASE_URL, or Langfuse keys as build-args.

FROM node:24-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY evals/package.json evals/package.json
COPY packages/application/package.json packages/application/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @ai-quiz/api build
# Workspace packages export TypeScript. Node 24 refuses type stripping under
# node_modules, so emit JS and retarget package.json before pnpm deploy.
RUN node scripts/emit-api-workspace-js.mjs
RUN pnpm --filter @ai-quiz/api deploy --prod /deploy/api --ignore-scripts
# pnpm pack respects gitignore (`dist/`); copy emitted JS onto the deploy tree.
RUN for pkg in domain application contracts; do \
      cp -a "/app/packages/${pkg}/dist" "/deploy/api/node_modules/@ai-quiz/${pkg}/dist"; \
    done \
  && cp -a /app/evals/dist /deploy/api/node_modules/@ai-quiz/evals/dist

FROM base AS migrate
COPY --from=build --chown=node:node /app /app
WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV HOME=/home/node
USER node
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM node:24-bookworm-slim AS runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build --chown=node:node /deploy/api ./
COPY --from=build --chown=node:node /app/apps/api/dist ./dist
COPY --from=build --chown=node:node /app/apps/api/prisma ./prisma
COPY --from=build --chown=node:node /app/apps/api/prisma.config.ts ./prisma.config.ts
ENV NODE_ENV=production
ENV PORT=3001
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=12 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
