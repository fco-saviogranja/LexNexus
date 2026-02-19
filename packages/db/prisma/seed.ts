import bcrypt from "bcryptjs";
import { PrismaClient, Role, Difficulty } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@lexnexus.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@123";
  const studentEmail = "aluno@lexnexus.com";
  const studentPassword = "Aluno@123";

  const [adminHash, studentHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(studentPassword, 10)
  ]);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash: adminHash,
      role: Role.admin
    }
  });

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      name: "Aluno Demo",
      email: studentEmail,
      passwordHash: studentHash,
      role: Role.student
    }
  });

  await prisma.subscription.create({
    data: {
      userId: student.id,
      plan: "premium",
      status: "active",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  }).catch(() => undefined);

  const direitoConstitucional = await prisma.discipline.upsert({
    where: { name: "Direito Constitucional" },
    update: {},
    create: { name: "Direito Constitucional" }
  });

  const documento = await prisma.document.create({
    data: {
      title: "Controle de Constitucionalidade",
      disciplineId: direitoConstitucional.id,
      description: "Material introdutório"
    }
  });

  await prisma.documentVersion.create({
    data: {
      documentId: documento.id,
      versionNumber: 1,
      isCurrent: true,
      blobUrl: "https://example.com/material.pdf",
      fileHash: "seed-hash",
      changelog: "Versão inicial"
    }
  });

  const question = await prisma.question.create({
    data: {
      disciplineId: direitoConstitucional.id,
      banca: "FGV",
      year: 2025,
      statement: "A Constituição Federal admite controle de constitucionalidade difuso e concentrado.",
      correctOption: "A",
      difficulty: Difficulty.easy,
      options: {
        create: [
          { optionLetter: "A", content: "Correto." },
          { optionLetter: "B", content: "Incorreto." },
          { optionLetter: "C", content: "Apenas concentrado." },
          { optionLetter: "D", content: "Apenas difuso." },
          { optionLetter: "E", content: "Nenhuma das anteriores." }
        ]
      }
    }
  });

  await prisma.userAnswer.create({
    data: {
      userId: student.id,
      questionId: question.id,
      selectedOption: "A",
      isCorrect: true
    }
  });

  await prisma.performanceStat.upsert({
    where: {
      userId_disciplineId: {
        userId: student.id,
        disciplineId: direitoConstitucional.id
      }
    },
    update: {
      totalQuestions: 1,
      correctAnswers: 1
    },
    create: {
      userId: student.id,
      disciplineId: direitoConstitucional.id,
      totalQuestions: 1,
      correctAnswers: 1
    }
  });

  console.log("Seed concluído", { admin: admin.email, student: student.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
