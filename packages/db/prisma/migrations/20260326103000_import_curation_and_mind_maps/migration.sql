CREATE TYPE "ImportReviewStatus" AS ENUM ('approved', 'pending_review', 'rejected');
CREATE TYPE "ImportRunStatus" AS ENUM ('running', 'completed', 'completed_with_errors', 'failed');
CREATE TYPE "ImportRunTrigger" AS ENUM ('schedule', 'manual');
CREATE TYPE "ImportIssueSeverity" AS ENUM ('info', 'warning', 'error');
CREATE TYPE "DocumentKind" AS ENUM ('study_material', 'mind_map');

ALTER TABLE "documents"
  ADD COLUMN "kind" "DocumentKind" NOT NULL DEFAULT 'study_material',
  ADD COLUMN "topic" TEXT;

CREATE INDEX "documents_discipline_id_kind_idx" ON "documents"("discipline_id", "kind");

ALTER TABLE "exams"
  ADD COLUMN "source_category" TEXT,
  ADD COLUMN "review_status" "ImportReviewStatus" NOT NULL DEFAULT 'pending_review',
  ADD COLUMN "parse_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "exams"
SET
  "source_category" = COALESCE("metadata"->>'sourceCategory', "source_category"),
  "review_status" = CASE
    WHEN "answer_key_url" IS NOT NULL THEN 'approved'::"ImportReviewStatus"
    ELSE 'pending_review'::"ImportReviewStatus"
  END,
  "parse_confidence" = CASE
    WHEN "answer_key_url" IS NOT NULL THEN 0.82
    WHEN "pdf_url" IS NOT NULL THEN 0.58
    ELSE 0.4
  END;

CREATE INDEX "exams_source_category_year_idx" ON "exams"("source_category", "year");
CREATE INDEX "exams_review_status_year_idx" ON "exams"("review_status", "year");

ALTER TABLE "questions"
  ADD COLUMN "review_status" "ImportReviewStatus" NOT NULL DEFAULT 'approved',
  ADD COLUMN "parse_confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
  ADD COLUMN "normalized_statement_hash" TEXT;

UPDATE "questions"
SET
  "review_status" = CASE
    WHEN "source_site" = 'manual'::"QuestionSource" THEN 'approved'::"ImportReviewStatus"
    WHEN "correct_option" IS NOT NULL THEN 'approved'::"ImportReviewStatus"
    ELSE 'pending_review'::"ImportReviewStatus"
  END,
  "parse_confidence" = CASE
    WHEN "source_site" = 'manual'::"QuestionSource" THEN 1
    WHEN "correct_option" IS NOT NULL THEN 0.82
    ELSE 0.58
  END,
  "normalized_statement_hash" = encode(digest(lower(regexp_replace("statement", '\s+', ' ', 'g')), 'sha1'), 'hex');

CREATE INDEX "questions_review_status_year_idx" ON "questions"("review_status", "year");
CREATE INDEX "questions_normalized_statement_hash_idx" ON "questions"("normalized_statement_hash");

CREATE TABLE "question_import_runs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_site" "QuestionSource" NOT NULL DEFAULT 'pci_concursos',
  "status" "ImportRunStatus" NOT NULL DEFAULT 'running',
  "trigger" "ImportRunTrigger" NOT NULL DEFAULT 'schedule',
  "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "max_pages" INTEGER,
  "max_exams_per_category" INTEGER,
  "delay_ms" INTEGER,
  "dry_run" BOOLEAN NOT NULL DEFAULT false,
  "total_exams_discovered" INTEGER NOT NULL DEFAULT 0,
  "processed_exams" INTEGER NOT NULL DEFAULT 0,
  "imported_questions" INTEGER NOT NULL DEFAULT 0,
  "pending_review_questions" INTEGER NOT NULL DEFAULT 0,
  "rejected_questions" INTEGER NOT NULL DEFAULT 0,
  "skipped_exams" INTEGER NOT NULL DEFAULT 0,
  "failed_exams" INTEGER NOT NULL DEFAULT 0,
  "summary" JSONB,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  CONSTRAINT "question_import_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_import_issues" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "run_id" UUID NOT NULL,
  "exam_id" UUID,
  "question_id" UUID,
  "source_key" TEXT,
  "stage" TEXT NOT NULL,
  "severity" "ImportIssueSeverity" NOT NULL DEFAULT 'info',
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_import_issues_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "question_import_runs_status_started_at_idx" ON "question_import_runs"("status", "started_at");
CREATE INDEX "question_import_runs_source_site_started_at_idx" ON "question_import_runs"("source_site", "started_at");
CREATE INDEX "question_import_issues_run_id_created_at_idx" ON "question_import_issues"("run_id", "created_at");
CREATE INDEX "question_import_issues_severity_created_at_idx" ON "question_import_issues"("severity", "created_at");
CREATE INDEX "question_import_issues_exam_id_idx" ON "question_import_issues"("exam_id");
CREATE INDEX "question_import_issues_question_id_idx" ON "question_import_issues"("question_id");

ALTER TABLE "question_import_issues" ADD CONSTRAINT "question_import_issues_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "question_import_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_import_issues" ADD CONSTRAINT "question_import_issues_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_import_issues" ADD CONSTRAINT "question_import_issues_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
