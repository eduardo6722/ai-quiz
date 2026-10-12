#!/bin/sh
set -eu

cd /app

if [ ! -w /app ] || { [ -e /app/node_modules/.pnpm ] && [ ! -w /app/node_modules/.pnpm ]; }; then
  echo "Bind-mounted files are not writable by uid $(id -u)." >&2
  echo "Reclaim ownership from the host, then retry:" >&2
  echo "  docker run --rm -v \"\$(pwd):/workspace\" alpine chown -R \$(id -u):\$(id -g) /workspace" >&2
  exit 1
fi

# Only the API container regenerates Prisma. Both api and web share the bind
# mount; a sibling `pnpm install` re-runs apps/api's postinstall generate and
# nest --watch then restarts into EADDRINUSE on :3001.
generate_prisma=0
for arg in "$@"; do
  if [ "$arg" = "@ai-quiz/api" ]; then
    generate_prisma=1
    break
  fi
done

(
  flock 9
  lock_hash=$(sha256sum /app/pnpm-lock.yaml | awk '{print $1}')
  stamp=/app/node_modules/.ai-quiz-compose-install-stamp
  if [ ! -d /app/node_modules/.pnpm ] || [ "$(cat "$stamp" 2>/dev/null || true)" != "$lock_hash" ]; then
    pnpm install --frozen-lockfile
    mkdir -p /app/node_modules
    echo "$lock_hash" > "$stamp"
  fi
  if [ "$generate_prisma" -eq 1 ]; then
    pnpm --filter @ai-quiz/api db:generate
  fi
) 9>/app/.compose-pnpm.lock

exec "$@"
