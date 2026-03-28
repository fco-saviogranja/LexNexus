import { z } from "zod";

export const roleSchema = z.enum(["admin", "student"]);

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const disciplineSchema = z.object({
  name: z.string().min(2)
});

export const documentKindSchema = z.enum(["study_material", "mind_map"]);

export const documentSchema = z.object({
  title: z.string().min(2),
  disciplineId: z.string().uuid(),
  kind: documentKindSchema.default("study_material"),
  topic: z.string().min(2).optional().nullable(),
  description: z.string().optional().nullable()
});

export const annotationSchema = z.object({
  page: z.number().int().positive(),
  type: z.enum(["highlight", "note"]),
  rects: z.any().optional(),
  noteText: z.string().optional(),
  color: z.string().optional()
});

export const bookmarkSchema = z.object({
  page: z.number().int().positive(),
  label: z.string().min(1)
});

export const userDocumentStateSchema = z.object({
  lastPage: z.number().int().positive(),
  percentCompleted: z.number().min(0).max(100)
});

export const questionSchema = z.object({
  disciplineId: z.string().uuid(),
  examId: z.string().uuid().optional().nullable(),
  questionNumber: z.number().int().positive().optional(),
  banca: z.string().min(2),
  year: z.number().int().min(1990).max(2100),
  instituicao: z.string().min(2).optional().nullable(),
  cargo: z.string().min(2).optional().nullable(),
  nivel: z.string().min(1).optional().nullable(),
  modalidade: z.string().min(1).optional().nullable(),
  areaFormacao: z.string().min(1).optional().nullable(),
  areaAtuacao: z.string().min(1).optional().nullable(),
  statement: z.string().min(10),
  correctOption: z.enum(["A", "B", "C", "D", "E"]).optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  subjectTags: z.array(z.string().min(1)).optional(),
  lawTags: z.array(z.string().min(1)).optional(),
  sourceName: z.string().min(1).optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  externalId: z.string().min(1).optional().nullable(),
  commentedAnswer: z.string().min(1).optional().nullable(),
  isOutdated: z.boolean().optional(),
  isAnnulled: z.boolean().optional(),
  options: z.array(
    z.object({
      optionLetter: z.enum(["A", "B", "C", "D", "E"]),
      content: z.string().min(1)
    })
  ).length(5)
});

export const answerSchema = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.enum(["A", "B", "C", "D", "E"])
});

export const questionCommentSchema = z.object({
  body: z.string().min(2)
});

export const reviewStatusSchema = z.enum(["approved", "pending_review", "rejected"]);

export const questionReviewSchema = z.object({
  reviewStatus: reviewStatusSchema,
  commentedAnswer: z.string().min(1).optional().nullable()
});

export const studyPlanSchema = z.object({
  examDate: z.string().date(),
  dailyHours: z.number().positive(),
  disciplineIds: z.array(z.string().uuid()).min(1)
});

export const flashcardSchema = z.object({
  disciplineId: z.string().uuid().nullable().optional(),
  front: z.string().min(2),
  back: z.string().min(2),
  sourceType: z.enum(["manual", "wrong_question", "annotation"]),
  sourceId: z.string().uuid().nullable().optional()
});

export const flashcardReviewSchema = z.object({
  flashcardId: z.string().uuid(),
  rating: z.enum(["easy", "medium", "hard"])
});

export type Role = z.infer<typeof roleSchema>;
