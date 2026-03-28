CREATE TYPE "QuestionSource" AS ENUM ('manual', 'pci_concursos', 'public_exam_import');

CREATE TABLE "exams" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_site" "QuestionSource" NOT NULL DEFAULT 'pci_concursos',
  "source_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "cargo" TEXT,
  "year" INTEGER,
  "instituicao" TEXT,
  "banca" TEXT,
  "nivel" TEXT,
  "modalidade" TEXT,
  "area_formacao" TEXT,
  "area_atuacao" TEXT,
  "exam_page_url" TEXT,
  "pdf_url" TEXT,
  "answer_key_url" TEXT,
  "metadata" JSONB,
  "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_comments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "question_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "question_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "simulation_attempts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "discipline_id" UUID,
  "title" TEXT,
  "total_questions" INTEGER NOT NULL,
  "correct_answers" INTEGER NOT NULL DEFAULT 0,
  "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "simulation_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "simulation_attempt_questions" (
  "attempt_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "selected_option" TEXT,
  "correct_option" TEXT,
  "is_correct" BOOLEAN,
  CONSTRAINT "simulation_attempt_questions_pkey" PRIMARY KEY ("attempt_id", "question_id")
);

ALTER TABLE "questions"
  ADD COLUMN "exam_id" UUID,
  ADD COLUMN "question_number" INTEGER,
  ADD COLUMN "instituicao" TEXT,
  ADD COLUMN "cargo" TEXT,
  ADD COLUMN "nivel" TEXT,
  ADD COLUMN "modalidade" TEXT,
  ADD COLUMN "area_formacao" TEXT,
  ADD COLUMN "area_atuacao" TEXT,
  ADD COLUMN "subject_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "law_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "source_site" "QuestionSource" NOT NULL DEFAULT 'manual',
  ADD COLUMN "source_name" TEXT,
  ADD COLUMN "source_url" TEXT,
  ADD COLUMN "external_id" TEXT,
  ADD COLUMN "commented_answer" TEXT,
  ADD COLUMN "is_outdated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "is_annulled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "metadata" JSONB;

ALTER TABLE "questions"
  ALTER COLUMN "correct_option" DROP NOT NULL;

ALTER TABLE "exams" ADD CONSTRAINT "exams_source_key_key" UNIQUE ("source_key");
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_question_number_key" UNIQUE ("exam_id", "question_number");

CREATE INDEX "exams_year_banca_instituicao_idx" ON "exams"("year", "banca", "instituicao");
CREATE INDEX "question_comments_question_id_created_at_idx" ON "question_comments"("question_id", "created_at");
CREATE INDEX "question_comments_user_id_created_at_idx" ON "question_comments"("user_id", "created_at");
CREATE INDEX "simulation_attempts_user_id_created_at_idx" ON "simulation_attempts"("user_id", "created_at");
CREATE INDEX "simulation_attempts_discipline_id_idx" ON "simulation_attempts"("discipline_id");
CREATE INDEX "simulation_attempt_questions_question_id_idx" ON "simulation_attempt_questions"("question_id");
CREATE INDEX "questions_banca_instituicao_cargo_nivel_year_idx" ON "questions"("banca", "instituicao", "cargo", "nivel", "year");
CREATE INDEX "questions_subject_tags_idx" ON "questions" USING GIN ("subject_tags");
CREATE INDEX "questions_law_tags_idx" ON "questions" USING GIN ("law_tags");

ALTER TABLE "exams" ADD CONSTRAINT "exams_source_key_check" CHECK ("source_key" <> '');
ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "question_comments" ADD CONSTRAINT "question_comments_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_comments" ADD CONSTRAINT "question_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "simulation_attempts" ADD CONSTRAINT "simulation_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "simulation_attempts" ADD CONSTRAINT "simulation_attempts_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "simulation_attempt_questions" ADD CONSTRAINT "simulation_attempt_questions_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "simulation_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "simulation_attempt_questions" ADD CONSTRAINT "simulation_attempt_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
