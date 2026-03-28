#!/usr/bin/env bash
set -euo pipefail

SWAP_SIZE_GB="${SWAP_SIZE_GB:-4}"

sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx git curl ufw fail2ban ca-certificates gnupg

if ! command -v node >/dev/null 2>&1; then
	curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
	sudo apt install -y nodejs
fi

sudo corepack enable
sudo npm i -g pm2

if ! sudo swapon --show | grep -q '/swapfile'; then
	sudo fallocate -l "${SWAP_SIZE_GB}G" /swapfile
	sudo chmod 600 /swapfile
	sudo mkswap /swapfile
	sudo swapon /swapfile
	if ! grep -q '^/swapfile ' /etc/fstab; then
		echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
	fi
fi

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

sudo systemctl enable --now fail2ban
sudo systemctl enable --now nginx

echo "Bootstrap OCI concluído. Próximo passo: clonar repo em /var/www/lexnexus, configurar .env e executar deploy remoto."
