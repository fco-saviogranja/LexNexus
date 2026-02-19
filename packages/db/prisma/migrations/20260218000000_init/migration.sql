CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('admin', 'student');
CREATE TYPE "AnnotationType" AS ENUM ('highlight', 'note');
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE "FlashcardSourceType" AS ENUM ('manual', 'wrong_question', 'annotation');
CREATE TYPE "FlashcardRating" AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'student',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "plan" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "disciplines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "discipline_id" UUID NOT NULL,
  "description" TEXT,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "document_id" UUID NOT NULL,
  "version_number" INTEGER NOT NULL,
  "is_current" BOOLEAN NOT NULL DEFAULT false,
  "blob_url" TEXT NOT NULL,
  "file_hash" TEXT NOT NULL,
  "changelog" TEXT,
  "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_document_state" (
  "user_id" UUID NOT NULL,
  "document_version_id" UUID NOT NULL,
  "last_page" INTEGER NOT NULL DEFAULT 1,
  "percent_completed" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_document_state_pkey" PRIMARY KEY ("user_id", "document_version_id")
);

CREATE TABLE "annotations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "document_version_id" UUID NOT NULL,
  "page" INTEGER NOT NULL,
  "type" "AnnotationType" NOT NULL,
  "rects" JSONB,
  "note_text" TEXT,
  "color" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "annotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bookmarks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "document_version_id" UUID NOT NULL,
  "page" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "study_sessions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "document_version_id" UUID,
  "started_at" TIMESTAMP(3) NOT NULL,
  "ended_at" TIMESTAMP(3) NOT NULL,
  "duration_seconds" INTEGER NOT NULL,
  CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "click_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "document_version_id" UUID NOT NULL,
  "term" TEXT NOT NULL,
  "context" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "questions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "discipline_id" UUID NOT NULL,
  "banca" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "statement" TEXT NOT NULL,
  "correct_option" TEXT NOT NULL,
  "difficulty" "Difficulty" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_options" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL,
  "option_letter" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_answers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "selected_option" TEXT NOT NULL,
  "is_correct" BOOLEAN NOT NULL,
  "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "performance_stats" (
  "user_id" UUID NOT NULL,
  "discipline_id" UUID NOT NULL,
  "total_questions" INTEGER NOT NULL DEFAULT 0,
  "correct_answers" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "performance_stats_pkey" PRIMARY KEY ("user_id", "discipline_id")
);

CREATE TABLE "study_plans" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "exam_date" TIMESTAMP(3) NOT NULL,
  "daily_hours" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "study_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "study_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "plan_id" UUID NOT NULL,
  "discipline_id" UUID NOT NULL,
  "scheduled_date" TIMESTAMP(3) NOT NULL,
  "revision_stage" INTEGER NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "study_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flashcards" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "discipline_id" UUID,
  "front" TEXT NOT NULL,
  "back" TEXT NOT NULL,
  "source_type" "FlashcardSourceType" NOT NULL,
  "source_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flashcards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flashcard_reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "flashcard_id" UUID NOT NULL,
  "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rating" "FlashcardRating" NOT NULL,
  "next_review_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "flashcard_reviews_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_name_key" UNIQUE ("name");
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_version_number_key" UNIQUE ("document_id", "version_number");
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_option_letter_key" UNIQUE ("question_id", "option_letter");

CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");
CREATE INDEX "documents_discipline_id_idx" ON "documents"("discipline_id");
CREATE INDEX "document_versions_document_id_is_current_idx" ON "document_versions"("document_id", "is_current");
CREATE INDEX "user_document_state_user_id_idx" ON "user_document_state"("user_id");
CREATE INDEX "user_document_state_document_version_id_idx" ON "user_document_state"("document_version_id");
CREATE INDEX "annotations_user_id_document_version_id_idx" ON "annotations"("user_id", "document_version_id");
CREATE INDEX "bookmarks_user_id_document_version_id_idx" ON "bookmarks"("user_id", "document_version_id");
CREATE INDEX "study_sessions_user_id_started_at_idx" ON "study_sessions"("user_id", "started_at");
CREATE INDEX "study_sessions_document_version_id_idx" ON "study_sessions"("document_version_id");
CREATE INDEX "click_events_user_id_document_version_id_idx" ON "click_events"("user_id", "document_version_id");
CREATE INDEX "questions_discipline_id_banca_year_difficulty_idx" ON "questions"("discipline_id", "banca", "year", "difficulty");
CREATE INDEX "questions_year_idx" ON "questions"("year");
CREATE INDEX "question_options_question_id_idx" ON "question_options"("question_id");
CREATE INDEX "user_answers_user_id_answered_at_idx" ON "user_answers"("user_id", "answered_at");
CREATE INDEX "user_answers_question_id_idx" ON "user_answers"("question_id");
CREATE INDEX "performance_stats_user_id_idx" ON "performance_stats"("user_id");
CREATE INDEX "performance_stats_discipline_id_idx" ON "performance_stats"("discipline_id");
CREATE INDEX "study_plans_user_id_idx" ON "study_plans"("user_id");
CREATE INDEX "study_tasks_plan_id_scheduled_date_idx" ON "study_tasks"("plan_id", "scheduled_date");
CREATE INDEX "study_tasks_discipline_id_idx" ON "study_tasks"("discipline_id");
CREATE INDEX "flashcards_user_id_idx" ON "flashcards"("user_id");
CREATE INDEX "flashcards_discipline_id_idx" ON "flashcards"("discipline_id");
CREATE INDEX "flashcard_reviews_flashcard_id_next_review_at_idx" ON "flashcard_reviews"("flashcard_id", "next_review_at");

ALTER TABLE "questions"
  ADD COLUMN "statement_tsv" tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', statement)) STORED;
CREATE INDEX "questions_statement_tsv_idx" ON "questions" USING GIN ("statement_tsv");

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_document_state" ADD CONSTRAINT "user_document_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_document_state" ADD CONSTRAINT "user_document_state_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_document_version_id_fkey" FOREIGN KEY ("document_version_id") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_stats" ADD CONSTRAINT "performance_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_stats" ADD CONSTRAINT "performance_stats_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_plans" ADD CONSTRAINT "study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "flashcard_reviews" ADD CONSTRAINT "flashcard_reviews_flashcard_id_fkey" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
