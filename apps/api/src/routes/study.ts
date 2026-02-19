import { FastifyInstance } from "fastify";
import { prisma } from "@lexnexus/db";
import { studyPlanSchema } from "@lexnexus/shared";
import { sendValidationError } from "../utils/http.js";

function addDays(base: Date, days: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function nextBusinessDay(base: Date) {
  const date = new Date(base);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

export async function studyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin", "student"]));

  app.post("/study-plans", async (request, reply) => {
    const parsed = studyPlanSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const examDate = new Date(parsed.data.examDate);
    const start = new Date();
    const revisionStages = [0, 1, 7, 30];

    const plan = await prisma.studyPlan.create({
      data: {
        userId: request.user.userId,
        examDate,
        dailyHours: parsed.data.dailyHours,
        tasks: {
          create: parsed.data.disciplineIds.flatMap((disciplineId, index) => {
            const baseDate = addDays(start, index);
            return revisionStages
              .map((stage) => {
                const scheduledDate = nextBusinessDay(addDays(baseDate, stage));
                if (scheduledDate > examDate) {
                  return null;
                }
                return {
                  disciplineId,
                  scheduledDate,
                  revisionStage: stage,
                  completed: false
                };
              })
              .filter(Boolean) as Array<{
                disciplineId: string;
                scheduledDate: Date;
                revisionStage: number;
                completed: boolean;
              }>;
          })
        }
      },
      include: { tasks: true }
    });

    return reply.code(201).send(plan);
  });

  app.get("/study-plans", async (request) => {
    return prisma.studyPlan.findMany({
      where: { userId: request.user.userId },
      include: { tasks: true },
      orderBy: { createdAt: "desc" }
    });
  });

  app.get("/study-tasks", async (request) => {
    const query = request.query as { planId?: string; date?: string };
    return prisma.studyTask.findMany({
      where: {
        planId: query.planId,
        scheduledDate: query.date
          ? {
              gte: new Date(`${query.date}T00:00:00.000Z`),
              lt: new Date(`${query.date}T23:59:59.999Z`)
            }
          : undefined
      },
      include: { discipline: true, plan: true },
      orderBy: { scheduledDate: "asc" }
    });
  });

  app.patch("/study-tasks/:id/complete", async (request) => {
    const { id } = request.params as { id: string };
    return prisma.studyTask.update({
      where: { id },
      data: { completed: true }
    });
  });

  app.post("/study-tasks/:id/reschedule", async (request) => {
    const { id } = request.params as { id: string };
    const task = await prisma.studyTask.findUnique({ where: { id } });
    if (!task) {
      return { message: "Tarefa não encontrada" };
    }

    const nextDate = nextBusinessDay(addDays(new Date(task.scheduledDate), 1));
    return prisma.studyTask.update({
      where: { id },
      data: { scheduledDate: nextDate }
    });
  });
}
