#!/usr/bin/env bash
# Configurable deploy stub. Does not push images or SSH.
# DEPLOY_TARGET=none (default) records deploy as not_run.

set -euo pipefail

target="${DEPLOY_TARGET:-none}"

if [[ -z "$target" || "$target" == "none" ]]; then
  echo "deploy: not_run"
  exit 0
fi

if [[ "$target" == "compose" ]]; then
  echo "deploy: not_run until an operator host actually runs:"
  echo "  docker compose -f compose.prod.yml pull"
  echo "  docker compose -f compose.prod.yml up -d"
  exit 0
fi

echo "deploy: not_run (unknown DEPLOY_TARGET=${target}; configure an operator script without baking a vendor into the repo)"
exit 0
