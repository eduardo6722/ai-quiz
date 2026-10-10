#!/bin/sh
set -eu

cd /app

(
  flock 9
  pnpm install --frozen-lockfile
  pnpm --filter @ai-quiz/api db:generate
) 9>/app/.compose-pnpm.lock

exec "$@"
