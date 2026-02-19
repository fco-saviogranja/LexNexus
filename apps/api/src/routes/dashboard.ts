import { FastifyInstance } from "fastify";
import { prisma } from "@lexnexus/db";

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin", "student"]));

  app.get("/dashboard", async (request) => {
    const userId = request.user.userId;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const [recentSessions, weekSessions, states, answers, performance] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId },
        orderBy: { endedAt: "desc" },
        take: 5,
        include: {
          documentVersion: {
            include: {
              document: true
            }
          }
        }
      }),
      prisma.studySession.findMany({
        where: { userId, startedAt: { gte: weekAgo } },
        orderBy: { startedAt: "asc" }
      }),
      prisma.userDocumentState.findMany({
        where: { userId },
        include: {
          documentVersion: {
            include: {
              document: true
            }
          }
        }
      }),
      prisma.userAnswer.findMany({ where: { userId } }),
      prisma.performanceStat.findMany({
        where: { userId },
        include: { discipline: true }
      })
    ]);

    const weekHours = weekSessions.reduce((acc, item) => acc + item.durationSeconds, 0) / 3600;
    const consistency = new Set(
      weekSessions
        .filter((s) => s.startedAt >= monthAgo)
        .map((s) => s.startedAt.toISOString().slice(0, 10))
    ).size;

    const byDiscipline = new Map<string, { disciplineId: string; disciplineName: string; total: number; sum: number }>();
    for (const state of states) {
      const disciplineId = state.documentVersion.document.disciplineId;
      const disciplineName = state.documentVersion.document.title;
      const current = byDiscipline.get(disciplineId) ?? {
        disciplineId,
        disciplineName,
        total: 0,
        sum: 0
      };
      current.total += 1;
      current.sum += state.percentCompleted;
      byDiscipline.set(disciplineId, current);
    }

    const progressByDiscipline = Array.from(byDiscipline.values()).map((item) => ({
      disciplineId: item.disciplineId,
      disciplineName: item.disciplineName,
      percentCompleted: item.total ? Number((item.sum / item.total).toFixed(2)) : 0
    }));

    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((a) => a.isCorrect).length;

    return {
      recentMaterials: recentSessions.map((session) => ({
        sessionId: session.id,
        endedAt: session.endedAt,
        durationSeconds: session.durationSeconds,
        documentVersionId: session.documentVersionId,
        documentTitle: session.documentVersion?.document.title ?? "Sem material"
      })),
      weeklyHours: Number(weekHours.toFixed(2)),
      progressByDiscipline,
      consistencyDays: consistency,
      questionStats: {
        totalAnswers,
        correctAnswers,
        accuracyRate: totalAnswers ? Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0
      },
      performanceStats: performance
    };
  });
}
