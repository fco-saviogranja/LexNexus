import { FastifyInstance } from "fastify";
import { prisma, Difficulty } from "@lexnexus/db";
import { disciplineSchema, documentSchema, questionSchema } from "@lexnexus/shared";
import { hashBuffer, uploadPdf } from "../lib/s3.js";
import { sendValidationError } from "../utils/http.js";

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin"]));

  app.get("/admin/users", async () => {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  });

  app.get("/admin/subscriptions", async () => prisma.subscription.findMany());

  app.post("/admin/subscriptions/mock", async (request, reply) => {
    const body = request.body as { userId?: string; status?: string; plan?: string; days?: number };
    if (!body.userId || !body.status || !body.plan) {
      return reply.code(400).send({ message: "userId, status e plan são obrigatórios" });
    }
    const subscription = await prisma.subscription.create({
      data: {
        userId: body.userId,
        status: body.status,
        plan: body.plan,
        expiresAt: new Date(Date.now() + 86400000 * (body.days ?? 30))
      }
    });
    return reply.code(201).send(subscription);
  });

  app.get("/admin/disciplines", async () => prisma.discipline.findMany({ orderBy: { name: "asc" } }));

  app.post("/admin/disciplines", async (request, reply) => {
    const parsed = disciplineSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }
    const discipline = await prisma.discipline.create({ data: parsed.data });
    return reply.code(201).send(discipline);
  });

  app.put("/admin/disciplines/:id", async (request, reply) => {
    const parsed = disciplineSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }
    const { id } = request.params as { id: string };
    const discipline = await prisma.discipline.update({ where: { id }, data: parsed.data });
    return reply.send(discipline);
  });

  app.delete("/admin/disciplines/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.discipline.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.get("/admin/documents", async () =>
    prisma.document.findMany({ include: { discipline: true, versions: { orderBy: { versionNumber: "desc" } } } })
  );

  app.post("/admin/documents", async (request, reply) => {
    const parsed = documentSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }
    const document = await prisma.document.create({ data: parsed.data });
    return reply.code(201).send(document);
  });

  app.put("/admin/documents/:id", async (request, reply) => {
    const parsed = documentSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }
    const { id } = request.params as { id: string };
    const document = await prisma.document.update({ where: { id }, data: parsed.data });
    return reply.send(document);
  });

  app.delete("/admin/documents/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.document.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.post("/admin/document-versions", async (request, reply) => {
    const body = request.body as {
      documentId?: string;
      blobUrl?: string;
      changelog?: string;
      fileHash?: string;
    };

    if (!body.documentId || !body.blobUrl || !body.fileHash) {
      return reply.code(400).send({ message: "documentId, blobUrl e fileHash são obrigatórios" });
    }

    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId: body.documentId },
      orderBy: { versionNumber: "desc" }
    });

    const version = await prisma.$transaction(async (tx) => {
      await tx.documentVersion.updateMany({
        where: { documentId: body.documentId, isCurrent: true },
        data: { isCurrent: false }
      });

      return tx.documentVersion.create({
        data: {
          documentId: body.documentId!,
          versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
          isCurrent: true,
          blobUrl: body.blobUrl!,
          fileHash: body.fileHash!,
          changelog: body.changelog,
          publishedAt: new Date()
        }
      });
    });

    return reply.code(201).send(version);
  });

  app.post("/admin/document-versions/upload", async (request, reply) => {
    const parts = request.parts();
    let documentId = "";
    let changelog = "";
    let fileBuffer: Buffer | null = null;
    let fileName = "material.pdf";

    for await (const part of parts) {
      if (part.type === "file") {
        fileName = part.filename;
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        fileBuffer = Buffer.concat(chunks);
      } else if (part.fieldname === "documentId") {
        documentId = String(part.value);
      } else if (part.fieldname === "changelog") {
        changelog = String(part.value ?? "");
      }
    }

    if (!documentId || !fileBuffer) {
      return reply.code(400).send({ message: "documentId e arquivo PDF são obrigatórios" });
    }

    const uploaded = await uploadPdf(fileBuffer, fileName);
    const fileHash = hashBuffer(fileBuffer);

    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" }
    });

    const version = await prisma.$transaction(async (tx) => {
      await tx.documentVersion.updateMany({
        where: { documentId, isCurrent: true },
        data: { isCurrent: false }
      });

      return tx.documentVersion.create({
        data: {
          documentId,
          versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
          isCurrent: true,
          blobUrl: uploaded.key,
          fileHash,
          changelog,
          publishedAt: new Date()
        }
      });
    });

    return reply.code(201).send(version);
  });

  app.get("/admin/questions", async () => prisma.question.findMany({ include: { options: true, discipline: true } }));

  app.post("/admin/questions", async (request, reply) => {
    const parsed = questionSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const question = await prisma.question.create({
      data: {
        disciplineId: parsed.data.disciplineId,
        banca: parsed.data.banca,
        year: parsed.data.year,
        statement: parsed.data.statement,
        correctOption: parsed.data.correctOption,
        difficulty: parsed.data.difficulty as Difficulty,
        options: {
          create: parsed.data.options
        }
      },
      include: { options: true }
    });

    return reply.code(201).send(question);
  });

  app.put("/admin/questions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = questionSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const question = await prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({ where: { questionId: id } });
      return tx.question.update({
        where: { id },
        data: {
          disciplineId: parsed.data.disciplineId,
          banca: parsed.data.banca,
          year: parsed.data.year,
          statement: parsed.data.statement,
          correctOption: parsed.data.correctOption,
          difficulty: parsed.data.difficulty as Difficulty,
          options: { create: parsed.data.options }
        },
        include: { options: true }
      });
    });

    return reply.send(question);
  });

  app.delete("/admin/questions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.question.delete({ where: { id } });
    return reply.code(204).send();
  });
}
