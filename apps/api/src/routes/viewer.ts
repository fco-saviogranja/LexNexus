import { FastifyInstance } from "fastify";
import { prisma, AnnotationType } from "@lexnexus/db";
import { annotationSchema, bookmarkSchema, userDocumentStateSchema } from "@lexnexus/shared";
import { getSignedBlobUrl } from "../lib/s3.js";
import { sendValidationError } from "../utils/http.js";

function isPlaceholderAsset(blobUrl: string) {
  return blobUrl.startsWith("https://example.com/") || blobUrl.startsWith("https://mock-storage.local/");
}

async function resolveViewerVersion(documentVersionId: string) {
  const requestedVersion = await prisma.documentVersion.findUnique({
    where: { id: documentVersionId },
    include: { document: true }
  });

  if (!requestedVersion) {
    return null;
  }

  if (!isPlaceholderAsset(requestedVersion.blobUrl)) {
    return requestedVersion;
  }

  const currentVersion = await prisma.documentVersion.findFirst({
    where: {
      documentId: requestedVersion.documentId,
      isCurrent: true,
      id: { not: requestedVersion.id }
    },
    include: { document: true },
    orderBy: { versionNumber: "desc" }
  });

  return currentVersion ?? requestedVersion;
}

export async function viewerRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin", "student"]));

  app.get("/viewer/:documentVersionId", async (request) => {
    const { documentVersionId } = request.params as { documentVersionId: string };
    const userId = request.user.userId;
    const version = await resolveViewerVersion(documentVersionId);

    const [state, annotations, bookmarks] = await Promise.all([
      prisma.userDocumentState.findUnique({ where: { userId_documentVersionId: { userId, documentVersionId } } }),
      prisma.annotation.findMany({ where: { userId, documentVersionId }, orderBy: { createdAt: "desc" } }),
      prisma.bookmark.findMany({ where: { userId, documentVersionId }, orderBy: { createdAt: "desc" } })
    ]);

    return { version, state, annotations, bookmarks };
  });

  app.get("/viewer/:documentVersionId/url", async (request) => {
    const { documentVersionId } = request.params as { documentVersionId: string };
    const version = await resolveViewerVersion(documentVersionId);
    if (!version) {
      return { url: null };
    }
    const url = await getSignedBlobUrl(version.blobUrl);
    return { url };
  });

  app.post("/viewer/:documentVersionId/annotations", async (request, reply) => {
    const { documentVersionId } = request.params as { documentVersionId: string };
    const parsed = annotationSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const annotation = await prisma.annotation.create({
      data: {
        userId: request.user.userId,
        documentVersionId,
        page: parsed.data.page,
        type: parsed.data.type as AnnotationType,
        rects: parsed.data.rects,
        noteText: parsed.data.noteText,
        color: parsed.data.color ?? "#fbbf24"
      }
    });

    return reply.code(201).send(annotation);
  });

  app.delete("/viewer/annotations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.annotation.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.post("/viewer/:documentVersionId/bookmarks", async (request, reply) => {
    const { documentVersionId } = request.params as { documentVersionId: string };
    const parsed = bookmarkSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: request.user.userId,
        documentVersionId,
        page: parsed.data.page,
        label: parsed.data.label
      }
    });

    return reply.code(201).send(bookmark);
  });

  app.delete("/viewer/bookmarks/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.bookmark.delete({ where: { id } });
    return reply.code(204).send();
  });

  app.put("/viewer/:documentVersionId/state", async (request, reply) => {
    const { documentVersionId } = request.params as { documentVersionId: string };
    const parsed = userDocumentStateSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const state = await prisma.userDocumentState.upsert({
      where: {
        userId_documentVersionId: {
          userId: request.user.userId,
          documentVersionId
        }
      },
      update: {
        lastPage: parsed.data.lastPage,
        percentCompleted: parsed.data.percentCompleted,
        lastSeenAt: new Date()
      },
      create: {
        userId: request.user.userId,
        documentVersionId,
        lastPage: parsed.data.lastPage,
        percentCompleted: parsed.data.percentCompleted,
        lastSeenAt: new Date()
      }
    });

    return state;
  });

  app.post("/viewer/:documentVersionId/sessions", async (request, reply) => {
    const { documentVersionId } = request.params as { documentVersionId: string };
    const body = request.body as { startedAt?: string; endedAt?: string; durationSeconds?: number };
    if (!body.startedAt || !body.endedAt || typeof body.durationSeconds !== "number") {
      return reply.code(400).send({ message: "startedAt, endedAt e durationSeconds obrigatórios" });
    }

    const session = await prisma.studySession.create({
      data: {
        userId: request.user.userId,
        documentVersionId,
        startedAt: new Date(body.startedAt),
        endedAt: new Date(body.endedAt),
        durationSeconds: body.durationSeconds
      }
    });
    return reply.code(201).send(session);
  });
}
