import { FastifyInstance } from "fastify";
import { prisma } from "@lexnexus/db";
import { answerSchema } from "@lexnexus/shared";
import { sendValidationError } from "../utils/http.js";

export async function questionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin", "student"]));

  app.get("/questions", async (request) => {
    const query = request.query as {
      disciplineId?: string;
      banca?: string;
      year?: string;
      difficulty?: string;
      q?: string;
      limit?: string;
    };

    const limit = Math.min(Number(query.limit ?? 20), 100);

    if (query.q) {
      const data = await prisma.$queryRawUnsafe(
        `SELECT * FROM questions
         WHERE statement_tsv @@ plainto_tsquery('portuguese', $1)
         ORDER BY created_at DESC
         LIMIT $2`,
        query.q,
        limit
      ) as Array<{ id: string }>;

      const ids = data.map((item) => item.id);
      return prisma.question.findMany({
        where: {
          id: { in: ids },
          disciplineId: query.disciplineId,
          banca: query.banca,
          year: query.year ? Number(query.year) : undefined,
          difficulty: query.difficulty as "easy" | "medium" | "hard" | undefined
        },
        include: { options: true, discipline: true },
        take: limit,
        orderBy: { createdAt: "desc" }
      });
    }

    return prisma.question.findMany({
      where: {
        disciplineId: query.disciplineId,
        banca: query.banca,
        year: query.year ? Number(query.year) : undefined,
        difficulty: query.difficulty as "easy" | "medium" | "hard" | undefined
      },
      include: { options: true, discipline: true },
      take: limit,
      orderBy: { createdAt: "desc" }
    });
  });

  app.get("/questions/simulado", async (request) => {
    const query = request.query as { count?: string; disciplineId?: string };
    const count = Math.min(Number(query.count ?? 20), 100);
    const all = await prisma.question.findMany({
      where: { disciplineId: query.disciplineId },
      include: { options: true }
    });

    return all.sort(() => Math.random() - 0.5).slice(0, count);
  });

  app.post("/answers", async (request, reply) => {
    const parsed = answerSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const question = await prisma.question.findUnique({ where: { id: parsed.data.questionId } });
    if (!question) {
      return reply.code(404).send({ message: "Questão não encontrada" });
    }

    const isCorrect = question.correctOption === parsed.data.selectedOption;

    const answer = await prisma.userAnswer.create({
      data: {
        userId: request.user.userId,
        questionId: parsed.data.questionId,
        selectedOption: parsed.data.selectedOption,
        isCorrect
      }
    });

    await prisma.performanceStat.upsert({
      where: {
        userId_disciplineId: {
          userId: request.user.userId,
          disciplineId: question.disciplineId
        }
      },
      update: {
        totalQuestions: { increment: 1 },
        correctAnswers: isCorrect ? { increment: 1 } : undefined
      },
      create: {
        userId: request.user.userId,
        disciplineId: question.disciplineId,
        totalQuestions: 1,
        correctAnswers: isCorrect ? 1 : 0
      }
    });

    return reply.code(201).send({ answer, isCorrect });
  });

  app.post("/questions/simulado/submit", async (request) => {
    const body = request.body as { answers?: Array<{ questionId: string; selectedOption: string }> };
    const answers = body.answers ?? [];
    const ids = answers.map((a) => a.questionId);
    const questions = await prisma.question.findMany({ where: { id: { in: ids } } });

    const byId = new Map(questions.map((q) => [q.id, q]));
    let correct = 0;
    const report = answers.map((entry) => {
      const question = byId.get(entry.questionId);
      const isCorrect = question?.correctOption === entry.selectedOption;
      if (isCorrect) {
        correct += 1;
      }
      return {
        questionId: entry.questionId,
        selectedOption: entry.selectedOption,
        correctOption: question?.correctOption,
        isCorrect
      };
    });

    return {
      total: answers.length,
      correct,
      accuracy: answers.length ? Number(((correct / answers.length) * 100).toFixed(2)) : 0,
      report
    };
  });
}
