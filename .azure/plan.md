# LexNexus — Azure Deployment Plan

**Status**: Deployed  
**Mode**: MODERNIZE (existing pnpm monorepo → Azure)  
**Recipe**: Azure CLI App Service package deploy (existing infrastructure)  
**Region**: brazilsouth  
**Subscription**: Azure subscription 1 (e9826914-da95-4ade-86ca-bffd634b06c0)

---

## Architecture

| Component                | Current                  | Azure Service                                 | SKU/Tier       |
| ------------------------ | ------------------------ | --------------------------------------------- | -------------- |
| Frontend (Next.js 15)    | PM2 + Nginx              | Azure App Service (Linux)                     | B1             |
| Backend (Fastify 5)      | PM2 + Nginx              | Azure App Service (Linux)                     | B1             |
| Database (PostgreSQL 16) | Docker local             | Azure Database for PostgreSQL Flexible Server | Burstable B1ms |
| File Storage (PDFs)      | DigitalOcean Spaces (S3) | Azure Blob Storage                            | Hot tier       |
| DNS + SSL                | Manual                   | App Service managed certificates              | Free           |

## Resource Group

- **Name**: `rg-lexnexus`
- **Region**: `brazilsouth`

## Resources to Provision

1. **Resource Group**: `rg-lexnexus`
2. **App Service Plan**: `plan-lexnexus` (Linux, B1)
3. **Web App (frontend)**: `lexnexus-web` (Node 20, Next.js standalone)
4. **Web App (backend)**: `lexnexus-api` (Node 20, Fastify)
5. **PostgreSQL Flexible Server**: `lexnexus-db` (Burstable B1ms, 32GB storage)
6. **Storage Account**: `stlexnexus` (Blob, Hot tier)
7. **Blob Container**: `documents` (private)

## Code Changes Required

1. **Replace `@aws-sdk/client-s3`** with `@azure/storage-blob` in `apps/api/src/lib/s3.ts`
   - `uploadPdf()` → use `BlockBlobClient.upload()`
   - `getSignedPdfUrl()` → use SAS token generation
2. **Update `apps/api/package.json`** dependencies
3. **Environment variables** → Azure App Service Configuration
4. **Build scripts** → standalone Next.js output for App Service

## Steps

- [x] Step 1: Login & verify subscription
- [x] Step 2: Install azd
- [ ] Step 3: Generate Bicep infrastructure files
- [ ] Step 4: Create `azure.yaml` configuration
- [ ] Step 5: Migrate S3 code to Azure Blob Storage
- [ ] Step 6: Configure Next.js standalone output
- [x] Step 7: Validate infrastructure
- [x] Step 8: Deploy

## Section 7: Validation Proof

Validated on `2026-03-26 07:35:04 -03:00` against the existing Azure infrastructure in `rg-lexnexus`.

- `az account show` → authenticated in subscription `Azure subscription 1 (e9826914-da95-4ade-86ca-bffd634b06c0)`.
- `az group show --name rg-lexnexus` → resource group exists in `brazilsouth`.
- `az webapp list --resource-group rg-lexnexus` → `lexnexus-api` and `lexnexus-web` are present and `Running`.
- `az postgres flexible-server show --resource-group rg-lexnexus --name lexnexus-db` → PostgreSQL Flexible Server is `Ready`.
- `az storage account show --resource-group rg-lexnexus --name stlexnexus` → storage account exists and is `Succeeded`.
- `pnpm --filter @lexnexus/api build` → passed.
- `pnpm --filter @lexnexus/web build` → passed.
- `Invoke-WebRequest https://lexnexus-api.azurewebsites.net/health` → `200 OK`.
- Temporary firewall rule was created for the current public IP only to reach PostgreSQL for migration execution, then removed.
- `prisma migrate resolve --rolled-back 20260325010000_question_bank_upgrade` → cleared the failed migration state after fixing the SQL.
- `prisma migrate deploy --schema packages/db/prisma/schema.prisma` → applied `20260325010000_question_bank_upgrade` successfully.
- `prisma migrate status --schema packages/db/prisma/schema.prisma` → database schema is up to date.

## Deployment Result

- `az webapp deploy --resource-group rg-lexnexus --name lexnexus-api --src-path build/appservice/api.zip --type zip --restart true --clean true` → deployment `f43c38dc-a503-48c4-9f88-822a9a4ccfd3` completed with `RuntimeSuccessful`.
- `az webapp deploy --resource-group rg-lexnexus --name lexnexus-web --src-path build/appservice/web.zip --type zip --restart true --clean true` → deployment `6717d522-dcb9-4b8a-8a0f-de0e6f5b7659` completed with status `4` (`OneDeploy` success).
- `Invoke-WebRequest https://lexnexus-api.azurewebsites.net/health` → `200 OK`.
- `Invoke-WebRequest https://lexnexus-web.azurewebsites.net/` → `200 OK`.
- `Invoke-WebRequest https://lexnexus-web.azurewebsites.net/app/questions` → `200 OK`.
