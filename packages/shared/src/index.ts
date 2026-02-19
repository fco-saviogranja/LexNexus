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

export const documentSchema = z.object({
  title: z.string().min(2),
  disciplineId: z.string().uuid(),
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
  banca: z.string().min(2),
  year: z.number().int().min(1990).max(2100),
  statement: z.string().min(10),
  correctOption: z.enum(["A", "B", "C", "D", "E"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
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
