#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/www/wwwroot/Dou-admin}"
BRANCH="${BRANCH:-main}"
LOG_FILE="${LOG_FILE:-/www/wwwlogs/dou-admin-deploy.log}"
PNPM_VERSION="${PNPM_VERSION:-10.8.1}"

mkdir -p "$(dirname "$LOG_FILE")"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "[$(date '+%F %T')] dou-admin deploy start"
echo "app_dir=$APP_DIR branch=$BRANCH"

for node_bin in /www/server/nodejs/v*/bin /www/server/nodejs/*/bin /usr/local/bin /usr/bin /bin; do
  if [ -d "$node_bin" ]; then
    export PATH="$node_bin:$PATH"
  fi
done

cd "$APP_DIR"

git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

node -v

if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare "pnpm@${PNPM_VERSION}" --activate || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g "pnpm@${PNPM_VERSION}"
fi

pnpm -v
pnpm install --frozen-lockfile
pnpm build

test -f "$APP_DIR/dist/index.html"

echo "[$(date '+%F %T')] dou-admin deploy success"
