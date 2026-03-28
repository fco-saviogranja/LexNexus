import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(name: string, fallback?: string) {
  const index = process.argv.findIndex((arg) => arg === `--${name}`);
  if (index === -1) {
    return fallback;
  }

  return process.argv[index + 1] ?? fallback;
}

async function main() {
  const slug = getArg("slug");
  const title = getArg("title");
  const disciplineName = getArg("discipline");
  const topic = getArg("topic") ?? null;
  const description = getArg("description") ?? null;
  const changelog = getArg("changelog") ?? "Versão inicial do mapa mental interativo.";

  if (!slug || !title || !disciplineName) {
    throw new Error("Use --slug, --title e --discipline.");
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..", "..", "..");
  const assetPath = path.join(repoRoot, "docs", "mind-maps", `${slug}.json`);
  const assetBuffer = await readFile(assetPath);
  const fileHash = createHash("sha256").update(assetBuffer).digest("hex");
  const blobUrl = `/api/mind-maps/${slug}`;

  const discipline = await prisma.discipline.upsert({
    where: { name: disciplineName },
    update: {},
    create: { name: disciplineName }
  });

  const existingDocument = await prisma.document.findFirst({
    where: {
      disciplineId: discipline.id,
      kind: "mind_map",
      title,
      topic
    }
  });

  const document = existingDocument
    ? await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          description
        }
      })
    : await prisma.document.create({
        data: {
          title,
          disciplineId: discipline.id,
          kind: "mind_map",
          topic,
          description
        }
      });

  const currentVersion = await prisma.documentVersion.findFirst({
    where: { documentId: document.id, isCurrent: true },
    orderBy: { versionNumber: "desc" }
  });

  if (currentVersion?.fileHash === fileHash && currentVersion.blobUrl === blobUrl) {
    console.log("Mind map already synced", {
      documentId: document.id,
      versionId: currentVersion.id,
      versionNumber: currentVersion.versionNumber
    });
    return;
  }

  const version = await prisma.$transaction(async (tx) => {
    await tx.documentVersion.updateMany({
      where: { documentId: document.id, isCurrent: true },
      data: { isCurrent: false }
    });

    return tx.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: (currentVersion?.versionNumber ?? 0) + 1,
        isCurrent: true,
        blobUrl,
        mimeType: "application/json",
        fileName: `${slug}.json`,
        fileHash,
        changelog,
        publishedAt: new Date()
      }
    });
  });

  console.log("Mind map synced", {
    discipline: discipline.name,
    documentId: document.id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    blobUrl
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
