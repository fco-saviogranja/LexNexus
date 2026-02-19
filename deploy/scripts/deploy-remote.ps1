param(
  [string]$DropletHost = $env:DROPLET_HOST,
  [string]$DropletUser = $env:DROPLET_USER,
  [string]$ProjectDir = $(if ($env:PROJECT_DIR) { $env:PROJECT_DIR } else { "/var/www/lexnexus" }),
  [string]$Branch = $(if ($env:BRANCH) { $env:BRANCH } else { "main" }),
  [string]$SshKeyPath = $env:DROPLET_KEY_PATH,
  [int]$Port = $(if ($env:DROPLET_PORT) { [int]$env:DROPLET_PORT } else { 22 })
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DropletHost) -or [string]::IsNullOrWhiteSpace($DropletUser)) {
  Write-Error "Defina DROPLET_HOST e DROPLET_USER. Exemplo:`n`$env:DROPLET_HOST='45.55.207.46'`n`$env:DROPLET_USER='root'"
}

$remoteScript = @"
set -eu

if [ ! -d '$ProjectDir' ]; then
  echo "Diretório $ProjectDir não existe no servidor"
  exit 1
fi

cd '$ProjectDir'

if [ ! -d .git ]; then
  echo "Diretório $ProjectDir não é um repositório git"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Arquivo $ProjectDir/.env não encontrado no servidor"
  exit 1
fi

set -a
. ./.env
set +a

git fetch --all
git reset --hard HEAD
git clean -fd
git checkout '$Branch'
git pull origin '$Branch'

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

echo 'Deploy concluído com sucesso'
"@

$remoteScript = $remoteScript -replace "`r", ""

$baseArgs = @("-p", "$Port")
if (-not [string]::IsNullOrWhiteSpace($SshKeyPath)) {
  $baseArgs += @("-i", $SshKeyPath)
}

$encodedScript = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($remoteScript))
$remoteCommand = "echo $encodedScript | base64 -d | bash"

$baseArgs += @("$DropletUser@$DropletHost", $remoteCommand)

& ssh @baseArgs
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Deploy finalizado." -ForegroundColor Green