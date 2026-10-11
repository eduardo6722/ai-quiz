#!/bin/sh
set -eu

cd /app

if [ ! -w /app ] || { [ -e /app/node_modules/.pnpm ] && [ ! -w /app/node_modules/.pnpm ]; }; then
  echo "Bind-mounted files are not writable by uid $(id -u)." >&2
  echo "Reclaim ownership from the host, then retry:" >&2
  echo "  docker run --rm -v \"\$(pwd):/workspace\" alpine chown -R \$(id -u):\$(id -g) /workspace" >&2
  exit 1
fi

(
  flock 9
  pnpm install --frozen-lockfile
  pnpm --filter @ai-quiz/api db:generate
) 9>/app/.compose-pnpm.lock

exec "$@"
