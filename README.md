# LexNexus Monorepo (MVP)

Plataforma SaaS jurídico + tech para concurso/OAB/graduação em Direito.

## Stack
- Frontend: Next.js (App Router) + TypeScript + Tailwind
- Backend: Node.js + Fastify + TypeScript
- Banco: PostgreSQL + Prisma
- Storage PDF: S3 compatível (DigitalOcean Spaces via AWS SDK)
- Auth: email/senha (bcrypt) + JWT access/refresh + RBAC (admin/student)
- Observabilidade: logs estruturados com logger Fastify/Pino

## Estrutura

- `apps/web`: aplicação Next.js
- `apps/api`: API Fastify
- `packages/db`: Prisma schema, migrations e seed
- `packages/shared`: DTOs e validações Zod compartilhadas
- `docker-compose.yml`: Postgres local

## Funcionalidades MVP implementadas

- Auth e RBAC:
  - `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
  - Proteção de rotas por role (`admin`, `student`)
- Editorial/Admin:
  - CRUD disciplinas, documentos e questões
  - Upload de PDF como nova versão (`/admin/document-versions/upload`) com versionamento incremental
  - `is_current` atualizado automaticamente (nova versão fica atual)
  - Changelog e `published_at`
- Biblioteca + Viewer:
  - Biblioteca por disciplina
  - Lista de versões por documento
  - Viewer PDF (frontend com PDF.js via `react-pdf`)
  - Overlay por `document_version_id`: highlights, notes, bookmarks e progresso
- Dashboard:
  - Materiais recentes
  - Horas semanais por sessões
  - Progresso por disciplina
  - Constância
  - Questões respondidas e taxa de acerto
- Questões:
  - CRUD admin
  - Filtros por disciplina, banca, ano, dificuldade
  - Busca full-text (Postgres `tsvector` em `questions.statement`)
  - Respostas do aluno em `user_answers`
  - `performance_stats` atualizado no endpoint de resposta
  - Modo simulado com relatório
- Cronograma:
  - Plano com data da prova, horas/dia e disciplinas
  - Geração automática de tarefas com revisão 1-7-30
  - Concluir e reagendar tarefa (empurra para próximo dia útil)
- Flashcards:
  - Criação manual
  - Geração de flashcards de questões erradas e anotações
  - Revisão fácil/médio/difícil com cálculo de próxima revisão
- Assinaturas:
  - Tabela `subscriptions` e endpoint mock admin

## Escolha de storage PDF (segurança)

O projeto **não expõe PDF publicamente por padrão**. O `blob_url` salvo na tabela guarda a chave do objeto no bucket e a API gera URL assinada curta (`/viewer/:documentVersionId/url`).

Motivos:
- reduz risco de compartilhamento indevido de materiais autorais;
- mantém controle de acesso via autenticação e RBAC;
- compatível com Spaces/S3 em produção.

## Setup local (passo a passo)

1. Instale Node 20+ e pnpm.
2. Copie variáveis:
   - `cp .env.example .env` (Windows PowerShell: `Copy-Item .env.example .env`)
3. Suba Postgres local:
   - `docker compose up -d`
4. Instale dependências:
   - `pnpm install`
5. Gere client Prisma:
   - `pnpm --filter @lexnexus/db generate`
6. Rode migrations:
   - `pnpm db:migrate`
7. Rode seed:
   - `pnpm db:seed`
8. Inicie web + api:
   - `pnpm dev`

Acessos seed:
- Admin: `admin@lexnexus.com` / `Admin@123`
- Aluno: `aluno@lexnexus.com` / `Aluno@123`

## Scripts principais

- `pnpm dev`: roda API + Web
- `pnpm build`: build do monorepo
- `pnpm db:migrate`: aplica migrations Prisma
- `pnpm db:seed`: popula dados iniciais
- `pnpm lint`: lint (placeholder nos pacotes)
- `pnpm format`: format (placeholder nos pacotes)

## Rotas frontend obrigatórias

- `/login`, `/register`
- `/app`
- `/app/library`
- `/app/documents/[documentId]`
- `/app/viewer/[documentVersionId]`
- `/app/dashboard`
- `/app/questions`
- `/app/simulado`
- `/app/cronograma`
- `/app/flashcards`
- `/admin`

## Rotas API (padrão)

- `/auth`
- `/admin/disciplines`, `/admin/documents`, `/admin/document-versions`, `/admin/questions`
- `/library`, `/documents/:id/versions`
- `/viewer/:documentVersionId`
- `/dashboard`
- `/questions`, `/answers`
- `/study-plans`, `/study-tasks`
- `/flashcards`, `/flashcards/reviews`

## Deploy DigitalOcean (Droplet + domínio já existente)

### 1) Infra recomendada
- Droplet Ubuntu 22.04+
- PostgreSQL gerenciado da DigitalOcean (preferível ao banco no Droplet)
- Spaces privado para PDFs

### 2) DNS (no seu provedor de domínio)
- Crie/ajuste registro `A` para `app.seudominio.com` apontando para IP do Droplet
- Crie/ajuste registro `A` para `api.seudominio.com` apontando para IP do Droplet
- Aguarde propagação DNS

### 3) Bootstrap do servidor
- Copie e execute: `deploy/scripts/server-bootstrap.sh`
- Clone o repo em `/var/www/lexnexus`
- Copie `.env.example` para `.env` e preencha:
  - `DATABASE_URL` (Managed Postgres)
  - `S3_*` (Spaces)
  - `APP_DOMAIN` e `API_DOMAIN`
  - secrets JWT fortes

### 4) Build e banco
- `corepack pnpm install`
- `corepack pnpm --filter @lexnexus/db generate`
- `corepack pnpm db:migrate`
- `corepack pnpm db:seed` (opcional, apenas primeira carga)
- `corepack pnpm build`

### 5) PM2 (process manager)
- Use `deploy/pm2/ecosystem.config.cjs`
- Comando: `pm2 start deploy/pm2/ecosystem.config.cjs`
- Persistência: `pm2 save && pm2 startup`

### 6) Nginx reverse proxy
- Use `deploy/nginx/lexnexus.conf.example`
- Substitua `APP_DOMAIN` e `API_DOMAIN`
- Publique em `/etc/nginx/sites-available/lexnexus`
- Ative:
  - `sudo ln -s /etc/nginx/sites-available/lexnexus /etc/nginx/sites-enabled/`
  - `sudo nginx -t && sudo systemctl reload nginx`

### 7) SSL com Certbot
- `sudo certbot --nginx -d app.seudominio.com -d api.seudominio.com`
- Teste renovação: `sudo certbot renew --dry-run`

### 8) Deploy automático via GitHub Actions
- Workflow já disponível em `.github/workflows/deploy.yml`
- Dispara em push na `main` e também manualmente (`workflow_dispatch`)

Secrets necessários no GitHub (Repository → Settings → Secrets and variables → Actions):
- `DROPLET_HOST`: IP do droplet (ex.: `45.55.207.46`)
- `DROPLET_USER`: usuário SSH (ex.: `root`)
- `DROPLET_SSH_KEY`: chave privada SSH do servidor (conteúdo completo, incluindo `BEGIN`/`END`)
- `APP_DIR`: diretório do projeto no servidor (ex.: `/var/www/lexnexus`)
- `DEPLOY_BRANCH`: branch de deploy (ex.: `main`)

Fluxo sugerido para primeira execução:
1. No servidor, garanta que o projeto já está clonado em `/var/www/lexnexus` e com `.env` pronto.
2. No GitHub, abra `Actions` → `Deploy Production` → `Run workflow`.
3. Valide logs do job (migrate/build/pm2/nginx).
4. Em seguida, cada push na `main` fará deploy automático.

## Checklist produção e segurança

- [ ] Trocar secrets JWT e senhas padrão
- [ ] Usar Spaces bucket privado + CORS restrito
- [ ] Ativar backups de banco
- [ ] Configurar rate limiting na API
- [ ] Configurar logs e retenção
- [ ] Definir política de senha e recuperação
- [ ] Revisar cabeçalhos de segurança no Nginx
- [ ] HTTPS obrigatório

## Acessibilidade e performance

- UI simplificada, componentes leves e sem bibliotecas extras pesadas
- Viewer com render incremental por página
- Filtros no backend e índices no Postgres para reduzir payload

## Observações

- Este MVP não usa Kubernetes.
- Não há busca vetorial/IA no MVP.
- `subscriptions` está em modo mock (sem gateway de pagamento).
