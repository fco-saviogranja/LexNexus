#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DROPLET_HOST:-}" || -z "${DROPLET_USER:-}" ]]; then
  echo "Defina DROPLET_HOST e DROPLET_USER antes de executar."
  echo "Exemplo: DROPLET_HOST=203.0.113.10 DROPLET_USER=root bash deploy/scripts/deploy-remote.sh"
  exit 1
fi

PROJECT_DIR="${PROJECT_DIR:-/var/www/lexnexus}"
BRANCH="${BRANCH:-main}"

ssh "${DROPLET_USER}@${DROPLET_HOST}" <<EOF
set -euo pipefail
cd "${PROJECT_DIR}"

git fetch --all

git checkout "${BRANCH}"

git pull origin "${BRANCH}"

corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @lexnexus/db generate
corepack pnpm db:migrate
corepack pnpm build

pm2 startOrReload deploy/pm2/ecosystem.config.cjs
pm2 save

sudo nginx -t
sudo systemctl reload nginx

echo "Deploy concluído em \\$(date)"
EOF
