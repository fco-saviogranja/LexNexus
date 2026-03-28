import { FastifyInstance } from "fastify";
import { Difficulty, ImportReviewStatus, Prisma, prisma } from "@lexnexus/db";
import { answerSchema, questionCommentSchema } from "@lexnexus/shared";
import { sendValidationError } from "../utils/http.js";

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const LETTERS = new Set(["A", "B", "C", "D", "E"]);

type QuestionListQuery = {
  disciplineId?: string;
  subject?: string;
  law?: string;
  banca?: string;
  year?: string;
  instituicao?: string;
  cargo?: string;
  nivel?: string;
  difficulty?: string;
  modalidade?: string;
  areaFormacao?: string;
  areaAtuacao?: string;
  q?: string;
  limit?: string;
  status?: string;
  excludeOutdated?: string;
  excludeAnnulled?: string;
  onlyCommentedAnswer?: string;
  onlyWithComments?: string;
  onlyMyComments?: string;
  onlyFromMySimulados?: string;
  hasAnswerKey?: string;
};

type SimulationSubmitBody = {
  title?: string;
  disciplineId?: string;
  answers?: Array<{
    questionId?: string;
    selectedOption?: string;
  }>;
};

type LatestAnswerRow = {
  questionId: string;
  isCorrect: boolean;
};

function cleanString(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function parseBoolean(value?: string) {
  return value === "true" || value === "1";
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(parsed), max);
}

function parseYear(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1900 && parsed <= 2100 ? parsed : undefined;
}

function parseDifficulty(value?: string) {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value as Difficulty;
  }
  return undefined;
}

async function getLatestAnswers(userId: string) {
  return prisma.$queryRaw<LatestAnswerRow[]>(Prisma.sql`
    SELECT DISTINCT ON ("user_answers"."question_id")
      "user_answers"."question_id" AS "questionId",
      "user_answers"."is_correct" AS "isCorrect"
    FROM "user_answers"
    INNER JOIN "questions" ON "questions"."id" = "user_answers"."question_id"
    WHERE "user_answers"."user_id" = ${userId}::uuid
      AND "questions"."review_status" <> 'rejected'
    ORDER BY "user_answers"."question_id", "user_answers"."answered_at" DESC
  `);
}

function buildStatusWhere(status: string | undefined, latestAnswers: LatestAnswerRow[]) {
  const answeredIds = latestAnswers.map((item) => item.questionId);
  const correctIds = latestAnswers.filter((item) => item.isCorrect).map((item) => item.questionId);
  const wrongIds = latestAnswers.filter((item) => !item.isCorrect).map((item) => item.questionId);

  if (status === "resolved") {
    return {
      id: {
        in: answeredIds.length ? answeredIds : [EMPTY_UUID]
      }
    } satisfies Prisma.QuestionWhereInput;
  }

  if (status === "correct") {
    return {
      id: {
        in: correctIds.length ? correctIds : [EMPTY_UUID]
      }
    } satisfies Prisma.QuestionWhereInput;
  }

  if (status === "wrong") {
    return {
      id: {
        in: wrongIds.length ? wrongIds : [EMPTY_UUID]
      }
    } satisfies Prisma.QuestionWhereInput;
  }

  if (status === "unresolved") {
    return answeredIds.length
      ? ({
          id: {
            notIn: answeredIds
          }
        } satisfies Prisma.QuestionWhereInput)
      : undefined;
  }

  return undefined;
}

function buildQuestionWhere(query: QuestionListQuery, userId: string, latestAnswers: LatestAnswerRow[]) {
  const clauses: Prisma.QuestionWhereInput[] = [{ reviewStatus: { not: ImportReviewStatus.rejected } }];

  const disciplineId = cleanString(query.disciplineId);
  const banca = cleanString(query.banca);
  const instituicao = cleanString(query.instituicao);
  const cargo = cleanString(query.cargo);
  const nivel = cleanString(query.nivel);
  const modalidade = cleanString(query.modalidade);
  const areaFormacao = cleanString(query.areaFormacao);
  const areaAtuacao = cleanString(query.areaAtuacao);
  const subject = cleanString(query.subject);
  const law = cleanString(query.law);
  const year = parseYear(query.year);
  const difficulty = parseDifficulty(query.difficulty);

  if (disciplineId) clauses.push({ disciplineId });
  if (banca) clauses.push({ banca: { equals: banca, mode: "insensitive" } });
  if (instituicao) clauses.push({ instituicao: { equals: instituicao, mode: "insensitive" } });
  if (cargo) clauses.push({ cargo: { equals: cargo, mode: "insensitive" } });
  if (nivel) clauses.push({ nivel: { equals: nivel, mode: "insensitive" } });
  if (modalidade) clauses.push({ modalidade: { equals: modalidade, mode: "insensitive" } });
  if (areaFormacao) clauses.push({ areaFormacao: { equals: areaFormacao, mode: "insensitive" } });
  if (areaAtuacao) clauses.push({ areaAtuacao: { equals: areaAtuacao, mode: "insensitive" } });
  if (subject) clauses.push({ subjectTags: { has: subject } });
  if (law) clauses.push({ lawTags: { has: law } });
  if (year) clauses.push({ year });
  if (difficulty) clauses.push({ difficulty });
  if (parseBoolean(query.excludeOutdated)) clauses.push({ isOutdated: false });
  if (parseBoolean(query.excludeAnnulled)) clauses.push({ isAnnulled: false });
  if (parseBoolean(query.onlyCommentedAnswer)) clauses.push({ commentedAnswer: { not: null } });
  if (parseBoolean(query.onlyWithComments)) clauses.push({ comments: { some: {} } });
  if (parseBoolean(query.onlyMyComments)) clauses.push({ comments: { some: { userId } } });
  if (parseBoolean(query.onlyFromMySimulados)) {
    clauses.push({ simulationAttemptQuestions: { some: { attempt: { userId } } } });
  }
  if (parseBoolean(query.hasAnswerKey)) clauses.push({ correctOption: { not: null } });

  const statusWhere = buildStatusWhere(cleanString(query.status), latestAnswers);
  if (statusWhere) clauses.push(statusWhere);

  return clauses.length ? { AND: clauses } satisfies Prisma.QuestionWhereInput : {};
}

async function getSearchIds(search: string, limit: number) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "questions"
    WHERE "review_status" <> 'rejected'
      AND "statement_tsv" @@ plainto_tsquery('portuguese', ${search})
    ORDER BY ts_rank("statement_tsv", plainto_tsquery('portuguese', ${search})) DESC, "created_at" DESC
    LIMIT ${limit}
  `);

  return rows.map((item) => item.id);
}

async function getDistinctArrayValues(column: "subject_tags" | "law_tags") {
  const query = column === "subject_tags"
    ? Prisma.sql`
        SELECT DISTINCT "value"
        FROM (
          SELECT trim(unnest("subject_tags")) AS "value"
          FROM "questions"
          WHERE "review_status" <> 'rejected'
        ) entries
        WHERE "value" <> ''
        ORDER BY "value" ASC
      `
    : Prisma.sql`
        SELECT DISTINCT "value"
        FROM (
          SELECT trim(unnest("law_tags")) AS "value"
          FROM "questions"
          WHERE "review_status" <> 'rejected'
        ) entries
        WHERE "value" <> ''
        ORDER BY "value" ASC
      `;

  const rows = await prisma.$queryRaw<Array<{ value: string }>>(query);
  return rows.map((item) => item.value);
}

export async function questionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authorize(["admin", "student"]));

  app.get("/questions/filters", async (request) => {
    const userId = request.user.userId;
    const baseWhere = { reviewStatus: { not: ImportReviewStatus.rejected } } satisfies Prisma.QuestionWhereInput;

    const [
      disciplines,
      bancas,
      years,
      instituicoes,
      cargos,
      niveis,
      modalidades,
      areasFormacao,
      areasAtuacao,
      subjects,
      laws,
      totalQuestions,
      questionsWithAnswerKey,
      questionsWithComments,
      questionsWithCommentedAnswer,
      latestAnswers
    ] = await Promise.all([
      prisma.discipline.findMany({
        where: { questions: { some: baseWhere } },
        select: {
          id: true,
          name: true,
          _count: { select: { questions: { where: baseWhere } } }
        },
        orderBy: { name: "asc" }
      }),
      prisma.question.findMany({
        where: { AND: [baseWhere, { banca: { not: "" } }] },
        distinct: ["banca"],
        select: { banca: true },
        orderBy: { banca: "asc" }
      }),
      prisma.question.findMany({
        where: baseWhere,
        distinct: ["year"],
        select: { year: true },
        orderBy: { year: "desc" }
      }),
      prisma.question.findMany({
        where: { AND: [baseWhere, { instituicao: { not: null } }] },
        distinct: ["instituicao"],
        select: { instituicao: true },
        orderBy: { instituicao: "asc" }
      }),
      prisma.question.findMany({
        where: { AND: [baseWhere, { cargo: { not: null } }] },
        distinct: ["cargo"],
        select: { cargo: true },
        orderBy: { cargo: "asc" }
      }),
      prisma.question.findMany({
        where: { AND: [baseWhere, { nivel: { not: null } }] },
        distinct: ["nivel"],
        select: { nivel: true },
        orderBy: { nivel: "asc" }
      }),
      prisma.question.findMany({
        where: { AND: [baseWhere, { modalidade: { not: null } }] },
        distinct: ["modalidade"],
        select: { modalidade: true },
        orderBy: { modalidade: "asc" }
      }),
      prisma.question.findMany({
        where: { AND: [baseWhere, { areaFormacao: { not: null } }] },
        distinct: ["areaFormacao"],
        select: { areaFormacao: true },
        orderBy: { areaFormacao: "asc" }
      }),
      prisma.question.findMany({
        where: { AND: [baseWhere, { areaAtuacao: { not: null } }] },
        distinct: ["areaAtuacao"],
        select: { areaAtuacao: true },
        orderBy: { areaAtuacao: "asc" }
      }),
      getDistinctArrayValues("subject_tags"),
      getDistinctArrayValues("law_tags"),
      prisma.question.count({ where: baseWhere }),
      prisma.question.count({ where: { AND: [baseWhere, { correctOption: { not: null } }] } }),
      prisma.question.count({ where: { AND: [baseWhere, { comments: { some: {} } }] } }),
      prisma.question.count({ where: { AND: [baseWhere, { commentedAnswer: { not: null } }] } }),
      getLatestAnswers(userId)
    ]);

    const resolved = latestAnswers.length;
    const correct = latestAnswers.filter((item) => item.isCorrect).length;
    const wrong = latestAnswers.filter((item) => !item.isCorrect).length;

    return {
      disciplines: disciplines.map((item) => ({
        id: item.id,
        name: item.name,
        questionCount: item._count.questions
      })),
      bancas: bancas.map((item) => item.banca).filter(Boolean),
      years: years.map((item) => item.year),
      instituicoes: instituicoes.map((item) => item.instituicao).filter(Boolean),
      cargos: cargos.map((item) => item.cargo).filter(Boolean),
      niveis: niveis.map((item) => item.nivel).filter(Boolean),
      modalidades: modalidades.map((item) => item.modalidade).filter(Boolean),
      areasFormacao: areasFormacao.map((item) => item.areaFormacao).filter(Boolean),
      areasAtuacao: areasAtuacao.map((item) => item.areaAtuacao).filter(Boolean),
      subjects,
      laws,
      difficulties: [
        { value: "easy", label: "Facil" },
        { value: "medium", label: "Media" },
        { value: "hard", label: "Alta" }
      ],
      statuses: {
        all: totalQuestions,
        unresolved: Math.max(totalQuestions - resolved, 0),
        resolved,
        correct,
        wrong
      },
      extras: {
        withAnswerKey: questionsWithAnswerKey,
        withComments: questionsWithComments,
        withCommentedAnswer: questionsWithCommentedAnswer
      }
    };
  });

  app.get("/questions", async (request) => {
    const userId = request.user.userId;
    const query = request.query as QuestionListQuery;
    const limit = parsePositiveInt(query.limit, 20, 100);
    const latestAnswers = await getLatestAnswers(userId);
    const where = buildQuestionWhere(query, userId, latestAnswers);
    const search = cleanString(query.q);
    const searchIds = search ? await getSearchIds(search, limit * 4) : [];

    if (search && !searchIds.length) {
      return [];
    }

    const finalWhere =
      search && searchIds.length
        ? ({
            AND: [
              where,
              {
                id: {
                  in: searchIds
                }
              }
            ]
          } satisfies Prisma.QuestionWhereInput)
        : where;

    const questions = await prisma.question.findMany({
      where: finalWhere,
      include: {
        discipline: true,
        exam: {
          select: {
            id: true,
            title: true,
            sourceSite: true,
            sourceCategory: true,
            reviewStatus: true,
            examPageUrl: true,
            pdfUrl: true
          }
        },
        options: {
          orderBy: { optionLetter: "asc" }
        },
        comments: {
          orderBy: { createdAt: "desc" },
          take: 3,
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        },
        userAnswers: {
          where: { userId },
          orderBy: { answeredAt: "desc" },
          take: 1,
          select: {
            selectedOption: true,
            isCorrect: true,
            answeredAt: true
          }
        },
        _count: {
          select: {
            comments: true,
            simulationAttemptQuestions: true
          }
        }
      },
      take: limit,
      orderBy: search ? undefined : [{ year: "desc" }, { createdAt: "desc" }]
    });

    if (search) {
      const order = new Map(searchIds.map((id, index) => [id, index]));
      questions.sort((left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER));
    }

    return questions.map((question) => ({
      ...question,
      latestAnswer: question.userAnswers[0] ?? null
    }));
  });

  app.get("/questions/:id/comments", async (request, reply) => {
    const { id } = request.params as { id: string };

    const exists = await prisma.question.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!exists) {
      return reply.code(404).send({ message: "Questao nao encontrada" });
    }

    return prisma.questionComment.findMany({
      where: { questionId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });
  });

  app.post("/questions/:id/comments", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = questionCommentSchema.safeParse(request.body);

    if (!parsed.success) {
      return sendValidationError(reply, parsed.error.flatten());
    }

    const exists = await prisma.question.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!exists) {
      return reply.code(404).send({ message: "Questao nao encontrada" });
    }

    const comment = await prisma.questionComment.create({
      data: {
        questionId: id,
        userId: request.user.userId,
        body: parsed.data.body.trim()
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    return reply.code(201).send(comment);
  });

  app.get("/questions/simulado", async (request) => {
    const query = request.query as QuestionListQuery & { count?: string };
    const count = parsePositiveInt(query.count, 20, 100);
    const latestAnswers = await getLatestAnswers(request.user.userId);
    const where = buildQuestionWhere(
      {
        ...query,
        hasAnswerKey: "true",
        excludeAnnulled: "true",
        excludeOutdated: query.excludeOutdated ?? "true"
      },
      request.user.userId,
      latestAnswers
    );

    const all = await prisma.question.findMany({
      where,
      include: {
        discipline: true,
        options: {
          orderBy: { optionLetter: "asc" }
        }
      }
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
      return reply.code(404).send({ message: "Questao nao encontrada" });
    }
    if (!question.correctOption) {
      return reply.code(409).send({ message: "Gabarito ainda nao importado para esta questao" });
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

    return reply.code(201).send({ answer, isCorrect, correctOption: question.correctOption });
  });

  app.post("/questions/simulado/submit", async (request, reply) => {
    const body = (request.body ?? {}) as SimulationSubmitBody;
    const answers = (body.answers ?? []).filter(
      (entry): entry is { questionId: string; selectedOption: string } =>
        Boolean(entry.questionId) && Boolean(entry.selectedOption) && LETTERS.has(String(entry.selectedOption).toUpperCase())
    );

    if (!answers.length) {
      return reply.code(400).send({ message: "Nenhuma resposta valida foi enviada" });
    }

    const ids = Array.from(new Set(answers.map((item) => item.questionId)));
    const questions = await prisma.question.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        disciplineId: true,
        correctOption: true
      }
    });

    const questionById = new Map(questions.map((item) => [item.id, item]));
    const report = answers.map((entry) => {
      const question = questionById.get(entry.questionId);
      const selectedOption = entry.selectedOption.toUpperCase();
      const isCorrect = question?.correctOption ? question.correctOption === selectedOption : undefined;

      return {
        questionId: entry.questionId,
        selectedOption,
        correctOption: question?.correctOption ?? null,
        isCorrect
      };
    });

    const correct = report.filter((item) => item.isCorrect).length;
    const accuracy = Number(((correct / report.length) * 100).toFixed(2));

    const attempt = await prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.simulationAttempt.create({
        data: {
          userId: request.user.userId,
          disciplineId: cleanString(body.disciplineId),
          title: cleanString(body.title),
          totalQuestions: report.length,
          correctAnswers: correct,
          accuracy
        }
      });

      await tx.simulationAttemptQuestion.createMany({
        data: report.map((item) => ({
          attemptId: createdAttempt.id,
          questionId: item.questionId,
          selectedOption: item.selectedOption,
          correctOption: item.correctOption,
          isCorrect: item.isCorrect ?? null
        }))
      });

      const gradedAnswers = report.filter((item) => item.correctOption);
      if (gradedAnswers.length) {
        await tx.userAnswer.createMany({
          data: gradedAnswers.map((item) => ({
            userId: request.user.userId,
            questionId: item.questionId,
            selectedOption: item.selectedOption,
            isCorrect: Boolean(item.isCorrect)
          }))
        });
      }

      const performanceByDiscipline = new Map<string, { total: number; correct: number }>();
      for (const item of report) {
        const question = questionById.get(item.questionId);
        if (!question) {
          continue;
        }
        const current = performanceByDiscipline.get(question.disciplineId) ?? { total: 0, correct: 0 };
        current.total += 1;
        if (item.isCorrect) {
          current.correct += 1;
        }
        performanceByDiscipline.set(question.disciplineId, current);
      }

      for (const [disciplineId, stats] of performanceByDiscipline.entries()) {
        await tx.performanceStat.upsert({
          where: {
            userId_disciplineId: {
              userId: request.user.userId,
              disciplineId
            }
          },
          update: {
            totalQuestions: { increment: stats.total },
            correctAnswers: { increment: stats.correct }
          },
          create: {
            userId: request.user.userId,
            disciplineId,
            totalQuestions: stats.total,
            correctAnswers: stats.correct
          }
        });
      }

      return createdAttempt;
    });

    return {
      attemptId: attempt.id,
      total: report.length,
      correct,
      accuracy,
      report
    };
  });
}
