ALTER TABLE "document_versions"
ADD COLUMN "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
ADD COLUMN "file_name" TEXT;

UPDATE "document_versions"
SET "file_name" = CONCAT('documento-v', "version_number", '.pdf')
WHERE "file_name" IS NULL;
