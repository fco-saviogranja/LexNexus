#!/usr/bin/env bash
set -euo pipefail

SERVER_HOST="${SERVER_HOST:-${DROPLET_HOST:-}}"
SERVER_USER="${SERVER_USER:-${DROPLET_USER:-}}"
SERVER_PORT="${SERVER_PORT:-${DROPLET_PORT:-22}}"

if [[ -z "${SERVER_HOST}" || -z "${SERVER_USER}" ]]; then
  echo "Defina SERVER_HOST e SERVER_USER (ou DROPLET_HOST e DROPLET_USER) antes de executar."
  echo "Exemplo: SERVER_HOST=203.0.113.10 SERVER_USER=ubuntu bash deploy/scripts/deploy-remote.sh"
  exit 1
fi

PROJECT_DIR="${PROJECT_DIR:-/var/www/lexnexus}"
BRANCH="${BRANCH:-main}"

ssh -p "${SERVER_PORT}" "${SERVER_USER}@${SERVER_HOST}" <<EOF
set -euo pipefail
cd "${PROJECT_DIR}"

git fetch --all
git reset --hard HEAD
git clean -fd

git checkout "${BRANCH}"

git pull origin "${BRANCH}"

corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @lexnexus/db generate
corepack pnpm --filter @lexnexus/db exec prisma migrate deploy --schema prisma/schema.prisma
corepack pnpm --filter @lexnexus/api build
corepack pnpm --filter @lexnexus/web build

if [ ! -f apps/api/dist/server.js ] && [ ! -f apps/api/dist/apps/api/src/server.js ]; then
  echo "Build da API não gerou apps/api/dist/server.js"
  exit 1
fi

pm2 startOrReload deploy/pm2/ecosystem.config.cjs
pm2 save

sudo nginx -t
sudo systemctl reload nginx

echo "Deploy concluído em \\$(date)"
EOF
