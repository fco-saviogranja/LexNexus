#!/usr/bin/env bash
set -euo pipefail

sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx git curl

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo npm i -g pm2

echo "Bootstrap base concluído. Próximo passo: clonar repo em /var/www/lexnexus e configurar Nginx/PM2."
