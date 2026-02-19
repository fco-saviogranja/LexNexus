import { FastifyInstance } from "fastify";
import { prisma, FlashcardRating, FlashcardSourceType } from "@lexnexus/db";
import { flashcardReviewSchema, flashcardSchema } from "@lexnexus/shared";
import { sendValidationError } from "../utils/http.js";

function nextReviewDate(rating: "easy" | "medium" | "hard") {
  const now = new Date();
  const increment = rating === "easy" ? 4 : rating === "medium" ? 2 : 1;
  now.setDate(now.getDate() + increment);
  return now;
}

export async function flashcardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin", "student"]));

  app.get("/flashcards", async (request) => {
    return prisma.flashcard.findMany({
      where: { userId: request.user.userId },
      include: { discipline: true },
      orderBy: { createdAt: "desc" }
    });
  });

  app.get("/flashcards/due", async (request) => {
    const now = new Date();
    return prisma.flashcard.findMany({
      where: {
        userId: request.user.userId,
        OR: [
          { reviews: { none: {} } },
          {
            reviews: {
              some: {
                nextReviewAt: { lte: now }
              }
            }
          }
        ]
      },
      include: { reviews: { orderBy: { reviewedAt: "desc" }, take: 1 } }
    });
  });

  app.post("/flashcards", async (request, reply) => {
    const parsed = flashcardSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const card = await prisma.flashcard.create({
      data: {
        userId: request.user.userId,
        disciplineId: parsed.data.disciplineId,
        front: parsed.data.front,
        back: parsed.data.back,
        sourceType: parsed.data.sourceType as FlashcardSourceType,
        sourceId: parsed.data.sourceId
      }
    });

    return reply.code(201).send(card);
  });

  app.post("/flashcards/from-wrong-questions", async (request, reply) => {
    const body = request.body as { limit?: number };
    const wrongAnswers = await prisma.userAnswer.findMany({
      where: { userId: request.user.userId, isCorrect: false },
      include: { question: true },
      take: body.limit ?? 10,
      orderBy: { answeredAt: "desc" }
    });

    const cards = await prisma.$transaction(
      wrongAnswers.map((item) =>
        prisma.flashcard.create({
          data: {
            userId: request.user.userId,
            disciplineId: item.question.disciplineId,
            front: item.question.statement.slice(0, 180),
            back: `Resposta correta: ${item.question.correctOption}`,
            sourceType: FlashcardSourceType.wrong_question,
            sourceId: item.questionId
          }
        })
      )
    );

    return reply.code(201).send(cards);
  });

  app.post("/flashcards/from-annotations", async (request, reply) => {
    const body = request.body as { limit?: number };
    const annotations = await prisma.annotation.findMany({
      where: {
        userId: request.user.userId,
        type: "note"
      },
      take: body.limit ?? 10,
      orderBy: { createdAt: "desc" }
    });

    const cards = await prisma.$transaction(
      annotations.map((item) =>
        prisma.flashcard.create({
          data: {
            userId: request.user.userId,
            front: `Página ${item.page}`,
            back: item.noteText ?? "Revisar anotação",
            sourceType: FlashcardSourceType.annotation,
            sourceId: item.id
          }
        })
      )
    );

    return reply.code(201).send(cards);
  });

  app.post("/flashcards/reviews", async (request, reply) => {
    const parsed = flashcardReviewSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const nextReviewAt = nextReviewDate(parsed.data.rating);
    const review = await prisma.flashcardReview.create({
      data: {
        flashcardId: parsed.data.flashcardId,
        rating: parsed.data.rating as FlashcardRating,
        nextReviewAt
      }
    });

    return reply.code(201).send(review);
  });
}
