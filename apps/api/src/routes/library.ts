import { FastifyInstance } from "fastify";
import { prisma } from "@lexnexus/db";

export async function libraryRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin", "student"]));

  app.get("/library", async () => {
    const disciplines = await prisma.discipline.findMany({
      include: {
        documents: {
          include: {
            versions: {
              orderBy: { versionNumber: "desc" },
              take: 1
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return disciplines;
  });

  app.get("/documents/:id/versions", async (request) => {
    const { id } = request.params as { id: string };
    return prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { versionNumber: "desc" }
    });
  });
}
