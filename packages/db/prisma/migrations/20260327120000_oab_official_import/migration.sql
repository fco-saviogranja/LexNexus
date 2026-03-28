ALTER TYPE "QuestionSource" ADD VALUE IF NOT EXISTS 'oab_oficial';

CREATE TABLE "exam_resources" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "exam_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "phase" TEXT,
  "resource_area" TEXT,
  "proof_type" INTEGER,
  "published_at" TIMESTAMP(3),
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "exam_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exam_resources_exam_id_url_key" ON "exam_resources"("exam_id", "url");
CREATE INDEX "exam_resources_exam_id_phase_idx" ON "exam_resources"("exam_id", "phase");
CREATE INDEX "exam_resources_resource_type_published_at_idx" ON "exam_resources"("resource_type", "published_at");

ALTER TABLE "exam_resources"
  ADD CONSTRAINT "exam_resources_exam_id_fkey"
  FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
