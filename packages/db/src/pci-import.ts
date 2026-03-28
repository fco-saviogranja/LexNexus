import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import {
  ImportIssueSeverity,
  ImportReviewStatus,
  ImportRunStatus,
  ImportRunTrigger,
  PrismaClient,
  QuestionSource
} from "@prisma/client";
import { DEFAULT_PCI_LEGAL_CATEGORIES, inferLegalDiscipline } from "./legal-taxonomy.js";

const PCI_BASE_URL = "https://www.pciconcursos.com.br";

function detectRepoRoot() {
  const cwd = process.cwd();

  if (existsSync(path.join(cwd, "packages", "db", "prisma", "schema.prisma"))) {
    return cwd;
  }

  if (path.basename(cwd) === "db" && existsSync(path.join(cwd, "prisma", "schema.prisma"))) {
    return path.resolve(cwd, "..", "..");
  }

  return cwd;
}

const repoRoot = detectRepoRoot();
const packageRoot = existsSync(path.join(repoRoot, "packages", "db", "prisma", "schema.prisma"))
  ? path.join(repoRoot, "packages", "db")
  : repoRoot;

type LoggerLike = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

type CategorySummary = {
  category: string;
  crawledExams: number;
  processedExams: number;
  importedQuestions: number;
  pendingReviewQuestions: number;
  rejectedQuestions: number;
  skippedExams: number;
  failedExams: number;
};

export type PciImportOptions = {
  categories: string[];
  maxPages: number;
  maxExamsPerCategory: number;
  delayMs: number;
  force: boolean;
  dryRun: boolean;
  trigger: ImportRunTrigger;
  logger?: Partial<LoggerLike>;
};

export type PciImportSummary = {
  runId: string | null;
  trigger: ImportRunTrigger;
  dryRun: boolean;
  categories: CategorySummary[];
  totals: {
    totalExamsDiscovered: number;
    processedExams: number;
    importedQuestions: number;
    pendingReviewQuestions: number;
    rejectedQuestions: number;
    skippedExams: number;
    failedExams: number;
  };
};

type CliOptions = {
  categories: string[];
  maxPages: number;
  maxExamsPerCategory: number;
  delayMs: number;
  force: boolean;
  dryRun: boolean;
  trigger: ImportRunTrigger;
};

type ExamListEntry = {
  title: string;
  year: number | null;
  instituicao: string | null;
  banca: string | null;
  pageUrl: string;
};

type ExamPageDetails = {
  title: string;
  cargo: string | null;
  year: number | null;
  instituicao: string | null;
  banca: string | null;
  pdfUrl: string | null;
  answerKeyUrl: string | null;
};

type ParsedPdfPayload = {
  cargoDetected?: string | null;
  nivelDetected?: string | null;
  questionCount: number;
  answerCount: number;
  questions: Array<{
    number: number;
    section?: string | null;
    page: number;
    statement: string;
    difficulty: "easy" | "medium" | "hard";
    lawTags: string[];
    correctOption?: string | null;
    options: Array<{
      optionLetter: string;
      content: string;
    }>;
  }>;
};

type ImportExamResult = {
  importedQuestions: number;
  pendingReviewQuestions: number;
  rejectedQuestions: number;
  skippedExam: boolean;
};

const defaultLogger: LoggerLike = {
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message)
};

function resolveLogger(logger?: Partial<LoggerLike>): LoggerLike {
  return {
    info: logger?.info ?? defaultLogger.info,
    warn: logger?.warn ?? defaultLogger.warn,
    error: logger?.error ?? defaultLogger.error
  };
}

function asciiFold(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function cleanText(value: string | null | undefined) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function compactStorageKey(value: string) {
  const sanitized = sanitizeFileName(value);
  const digest = createHash("sha1").update(value).digest("hex").slice(0, 10);
  return `${sanitized.slice(0, 60)}-${digest}`;
}

function normalizeStatementForHash(value: string) {
  return asciiFold(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashNormalizedStatement(value: string) {
  return createHash("sha1").update(normalizeStatementForHash(value)).digest("hex");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toAbsoluteUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  return new URL(value, PCI_BASE_URL).toString();
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parseArgs(argv: string[]): CliOptions {
  const categories: string[] = [];
  let useDailyPreset = false;
  const options: CliOptions = {
    categories,
    maxPages: 2,
    maxExamsPerCategory: 10,
    delayMs: 500,
    force: false,
    dryRun: false,
    trigger: ImportRunTrigger.manual
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--daily") {
      useDailyPreset = true;
      options.trigger = ImportRunTrigger.schedule;
      continue;
    }
    if ((arg === "--category" || arg === "--categories") && next) {
      const parsedCategories = next
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      categories.push(...parsedCategories);
      index += 1;
      continue;
    }
    if (arg === "--max-pages" && next) {
      options.maxPages = parsePositiveInt(next, options.maxPages);
      index += 1;
      continue;
    }
    if ((arg === "--max-exams" || arg === "--max-exams-per-category") && next) {
      options.maxExamsPerCategory = parsePositiveInt(next, options.maxExamsPerCategory);
      index += 1;
      continue;
    }
    if (arg === "--delay-ms" && next) {
      options.delayMs = Math.max(0, Number(next));
      index += 1;
      continue;
    }
    if (arg === "--trigger" && next) {
      options.trigger = next === "schedule" ? ImportRunTrigger.schedule : ImportRunTrigger.manual;
      index += 1;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
    }
  }

  if (!categories.length) {
    options.categories = useDailyPreset ? [...DEFAULT_PCI_LEGAL_CATEGORIES] : ["contratos"];
  }

  return options;
}

function buildCategoryPageUrl(category: string, page: number) {
  if (/^https?:\/\//i.test(category)) {
    return page <= 1 ? category : `${category.replace(/\/+$/, "")}/${page}`;
  }

  const slug = category.replace(/^\/+|\/+$/g, "");
  const baseUrl = `${PCI_BASE_URL}/provas/${slug}`;
  return page <= 1 ? baseUrl : `${baseUrl}/${page}`;
}

function resolveCategorySlug(category: string) {
  if (/^https?:\/\//i.test(category)) {
    return category.replace(/^https?:\/\/[^/]+\/provas\//i, "").replace(/\/+$/, "") || "provas";
  }
  return category.replace(/^\/+|\/+$/g, "") || "provas";
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "LexNexusBot/1.0 (+https://lexnexus.tech)"
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("latin1");
}

async function fetchBinary(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "LexNexusBot/1.0 (+https://lexnexus.tech)"
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function parseTotalPages(html: string) {
  const match = asciiFold(html).match(/Mostrando pagina\s+\d+\s+de\s+(\d+)/i);
  return match ? Number(match[1]) : 1;
}

function parseCategoryPage(html: string): ExamListEntry[] {
  const $ = cheerio.load(html);

  return $("#lista_provas tr.lk_link")
    .toArray()
    .map((row) => {
      const cells = $(row).find("td");
      const pageUrl = toAbsoluteUrl($(row).attr("data-url") ?? cells.eq(0).find("a").attr("href"));
      const title = cleanText(cells.eq(0).text());
      const yearText = cleanText(cells.eq(1).text());
      const year = yearText ? Number(yearText) : null;

      if (!pageUrl || !title) {
        return null;
      }

      return {
        title,
        year: Number.isFinite(year) ? year : null,
        instituicao: cleanText(cells.eq(2).text()),
        banca: cleanText(cells.eq(3).text()),
        pageUrl
      };
    })
    .filter((item): item is ExamListEntry => Boolean(item));
}

function parseMetadataValue($: cheerio.CheerioAPI, label: string) {
  const labels = $("#download strong").toArray();
  for (const element of labels) {
    const strongText = cleanText($(element).text()) ?? "";
    if (asciiFold(strongText).replace(/:$/, "").toUpperCase() !== label) {
      continue;
    }
    const parentText = cleanText($(element).parent().text()) ?? "";
    const value = cleanText(parentText.replace(strongText, ""));
    if (value) {
      return value;
    }
  }
  return null;
}

function parseExamPage(html: string, fallback: ExamListEntry): ExamPageDetails {
  const $ = cheerio.load(html);
  const dedupedUrls = new Set<string>();
  const pdfLinks = $("#download a[href$='.pdf'], #download a[data-pdf-share]")
    .toArray()
    .map((element) => {
      const href = $(element).attr("href") ?? $(element).attr("data-pdf-share");
      const absoluteUrl = toAbsoluteUrl(href);
      if (!absoluteUrl || dedupedUrls.has(absoluteUrl)) {
        return null;
      }
      dedupedUrls.add(absoluteUrl);
      return {
        url: absoluteUrl,
        text: cleanText($(element).text()) ?? path.basename(absoluteUrl)
      };
    })
    .filter((item): item is { url: string; text: string } => Boolean(item));

  const title =
    cleanText($("#download .breadcrumbs strong").first().text()) ??
    cleanText($("title").text()?.replace(/^Provas para Download -\s*/i, "")) ??
    fallback.title;

  const cargo = parseMetadataValue($, "CARGO") ?? fallback.title;
  const yearText = parseMetadataValue($, "ANO");
  const answerKey = pdfLinks.find((item) => /gabarito/i.test(item.url) || /gabarito/i.test(item.text))?.url ?? null;
  const proofPdf = pdfLinks.find((item) => item.url !== answerKey)?.url ?? null;

  return {
    title,
    cargo,
    year: yearText ? Number(yearText) : fallback.year,
    instituicao: parseMetadataValue($, "ORGAO") ?? fallback.instituicao,
    banca: parseMetadataValue($, "ORGANIZADORA") ?? fallback.banca,
    pdfUrl: proofPdf,
    answerKeyUrl: answerKey
  };
}

function resolvePythonCommand() {
  const candidates = process.platform === "win32" ? ["py", "python"] : ["python3", "python"];

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (result.status === 0) {
      return candidate;
    }
  }

  throw new Error("Nao foi possivel localizar uma instalacao Python para o parser de PDF");
}

function resolvePythonSitePackages() {
  const baseDir = process.env.LEXNEXUS_PCI_PYTHON_SITE_PACKAGES ?? path.join(process.cwd(), ".lexnexus-python");
  return path.resolve(baseDir);
}

function resolveSupportFile(fileName: string) {
  const candidates = [
    process.env[fileName === "parse-pci-exam.py" ? "LEXNEXUS_PCI_PARSER_PATH" : "LEXNEXUS_PCI_REQUIREMENTS_PATH"],
    path.join(packageRoot, "prisma", fileName),
    path.join(process.cwd(), fileName),
    path.join(process.cwd(), "packages", "db", "prisma", fileName)
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return path.resolve(candidate);
    } catch {
      // continue
    }
  }

  throw new Error(`Nao foi possivel localizar ${fileName}`);
}

function ensurePythonDependencies(logger: LoggerLike) {
  const pythonCommand = resolvePythonCommand();
  const sitePackages = resolvePythonSitePackages();
  const requirementsPath = resolveSupportFile("requirements-pci.txt");
  const basePythonPath = process.env.PYTHONPATH ? `${sitePackages}${path.delimiter}${process.env.PYTHONPATH}` : sitePackages;
  const probe = spawnSync(
    pythonCommand,
    ["-c", "import pdfplumber"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        PYTHONPATH: basePythonPath
      }
    }
  );

  if (probe.status === 0) {
    return { pythonCommand, pythonPath: basePythonPath };
  }

  logger.info("Instalando dependencias Python do parser do PCI.");
  const install = spawnSync(
    pythonCommand,
    ["-m", "pip", "install", "--disable-pip-version-check", "--target", sitePackages, "-r", requirementsPath],
    {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: process.env
    }
  );

  if (install.status !== 0) {
    throw new Error(install.stderr || install.stdout || "Falha ao instalar dependencias Python do parser");
  }

  return { pythonCommand, pythonPath: basePythonPath };
}

function runPdfParser(pdfPath: string, answerKeyPath: string | null | undefined, logger: LoggerLike): ParsedPdfPayload {
  const parserScriptPath = resolveSupportFile("parse-pci-exam.py");
  const { pythonCommand, pythonPath } = ensurePythonDependencies(logger);
  const args = [parserScriptPath, "--pdf", pdfPath];

  if (answerKeyPath) {
    args.push("--answer-key", answerKeyPath);
  }

  const result = spawnSync(pythonCommand, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    env: {
      ...process.env,
      PYTHONPATH: pythonPath,
      PYTHONIOENCODING: "utf-8"
    }
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Falha ao executar parser Python");
  }

  return JSON.parse(result.stdout) as ParsedPdfPayload;
}

async function ensureFile(filePath: string, url: string, force: boolean) {
  if (!force) {
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      // continue
    }
  }

  const buffer = await fetchBinary(url);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return filePath;
}

async function createIssue(
  prisma: PrismaClient,
  runId: string | null,
  payload: {
    examId?: string | null;
    questionId?: string | null;
    sourceKey?: string | null;
    stage: string;
    severity: ImportIssueSeverity;
    message: string;
    metadata?: Record<string, unknown>;
  }
) {
  if (!runId) {
    return;
  }

  await prisma.questionImportIssue.create({
    data: {
      runId,
      examId: payload.examId ?? null,
      questionId: payload.questionId ?? null,
      sourceKey: payload.sourceKey ?? null,
      stage: payload.stage,
      severity: payload.severity,
      message: payload.message,
      metadata: (payload.metadata ?? undefined) as any
    }
  });
}

async function getDisciplineId(prisma: PrismaClient, name: string, cache: Map<string, string>, dryRun: boolean) {
  if (cache.has(name)) {
    return cache.get(name)!;
  }

  if (dryRun) {
    const syntheticId = `dry-run:${name}`;
    cache.set(name, syntheticId);
    return syntheticId;
  }

  const discipline = await prisma.discipline.upsert({
    where: { name },
    update: {},
    create: { name }
  });

  cache.set(name, discipline.id);
  return discipline.id;
}

function computeQuestionConfidence(input: {
  statement: string;
  optionsCount: number;
  hasAnswerKey: boolean;
  section?: string | null;
  matchedDiscipline: string;
  lawTags: string[];
}) {
  let score = 0.25;
  if (input.statement.length >= 60) {
    score += 0.2;
  } else if (input.statement.length >= 30) {
    score += 0.1;
  }
  if (input.optionsCount === 5) {
    score += 0.2;
  }
  if (input.hasAnswerKey) {
    score += 0.2;
  }
  if (input.section) {
    score += 0.08;
  }
  if (input.matchedDiscipline !== "Conhecimentos Juridicos") {
    score += 0.08;
  }
  if (input.lawTags.length) {
    score += 0.04;
  }
  return Number(clamp(score, 0, 1).toFixed(2));
}

function computeQuestionReviewStatus(confidence: number, hasAnswerKey: boolean) {
  return confidence >= 0.72 && hasAnswerKey ? ImportReviewStatus.approved : ImportReviewStatus.pending_review;
}

function computeExamConfidence(input: {
  importedQuestions: number;
  pendingReviewQuestions: number;
  rejectedQuestions: number;
  parsedQuestionCount: number;
  answerCount: number;
  hasPdf: boolean;
  hasAnswerKey: boolean;
}) {
  if (!input.importedQuestions) {
    return 0.2;
  }

  const approvedQuestions = Math.max(input.importedQuestions - input.pendingReviewQuestions, 0);
  let score = 0.25;
  score += Math.min(0.2, input.importedQuestions / Math.max(input.parsedQuestionCount, 1) * 0.2);
  score += Math.min(0.2, approvedQuestions / Math.max(input.importedQuestions, 1) * 0.2);
  if (input.hasPdf) {
    score += 0.1;
  }
  if (input.hasAnswerKey) {
    score += 0.15;
  } else if (input.answerCount > 0) {
    score += 0.08;
  }
  if (input.rejectedQuestions > 0) {
    score -= Math.min(0.15, input.rejectedQuestions * 0.02);
  }
  return Number(clamp(score, 0, 1).toFixed(2));
}

function computeExamReviewStatus(confidence: number, importedQuestions: number) {
  if (!importedQuestions) {
    return ImportReviewStatus.rejected;
  }
  return confidence >= 0.72 ? ImportReviewStatus.approved : ImportReviewStatus.pending_review;
}

async function upsertQuestion(params: {
  prisma: PrismaClient;
  runId: string | null;
  examId: string;
  sourceKey: string;
  sourceCategory: string;
  question: ParsedPdfPayload["questions"][number];
  disciplineId: string;
  disciplineName: string;
  matchedBy: string;
  examDetails: ExamPageDetails;
  nivel: string | null;
  examPageUrl: string;
  reviewStatus: ImportReviewStatus;
  parseConfidence: number;
}) {
  const existing = await params.prisma.question.findUnique({
    where: {
      examId_questionNumber: {
        examId: params.examId,
        questionNumber: params.question.number
      }
    },
    select: { id: true }
  });

  const normalizedStatementHash = hashNormalizedStatement(params.question.statement);
  const duplicate = await params.prisma.question.findFirst({
    where: {
      normalizedStatementHash,
      id: existing ? { not: existing.id } : undefined
    },
    select: {
      id: true,
      year: true,
      banca: true,
      discipline: {
        select: { name: true }
      }
    }
  });

  if (duplicate) {
    await createIssue(params.prisma, params.runId, {
      examId: params.examId,
      sourceKey: params.sourceKey,
      stage: "dedupe",
      severity: ImportIssueSeverity.warning,
      message: "Questao semelhante ja existe na base e foi ignorada nesta importacao.",
      metadata: {
        duplicateQuestionId: duplicate.id,
        duplicateDiscipline: duplicate.discipline.name,
        duplicateYear: duplicate.year,
        duplicateBanca: duplicate.banca,
        questionNumber: params.question.number
      }
    });

    return { imported: false, questionId: null };
  }

  const subjectTags = Array.from(
    new Set(
      [params.question.section, params.disciplineName !== "Conhecimentos Juridicos" ? params.disciplineName : null]
        .map((value) => cleanText(value))
        .filter((value): value is string => Boolean(value))
    )
  );

  const data = {
    disciplineId: params.disciplineId,
    examId: params.examId,
    questionNumber: params.question.number,
    banca: params.examDetails.banca ?? "Nao informada",
    year: params.examDetails.year ?? new Date().getUTCFullYear(),
    instituicao: params.examDetails.instituicao,
    cargo: params.examDetails.cargo,
    nivel: params.nivel,
    modalidade: "Objetiva",
    areaFormacao: null,
    areaAtuacao: null,
    statement: params.question.statement,
    correctOption: params.question.correctOption ?? null,
    difficulty: params.question.difficulty,
    subjectTags,
    lawTags: Array.from(new Set(params.question.lawTags)),
    sourceSite: QuestionSource.pci_concursos,
    sourceName: params.examDetails.title,
    sourceUrl: params.examPageUrl,
    externalId: `${params.sourceKey}:${params.question.number}`,
    commentedAnswer: null,
    isOutdated: false,
    isAnnulled: false,
    reviewStatus: params.reviewStatus,
    parseConfidence: params.parseConfidence,
    normalizedStatementHash,
    metadata: {
      sourceCategory: params.sourceCategory,
      page: params.question.page,
      section: params.question.section ?? null,
      taxonomyMatchedBy: params.matchedBy
    }
  } as const;

  if (existing) {
    const updated = await params.prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({
        where: { questionId: existing.id }
      });

      return tx.question.update({
        where: { id: existing.id },
        data: {
          ...data,
          options: {
            create: params.question.options
          }
        }
      });
    });

    return { imported: true, questionId: updated.id };
  }

  const created = await params.prisma.question.create({
    data: {
      ...data,
      options: {
        create: params.question.options
      }
    }
  });

  return { imported: true, questionId: created.id };
}

async function importExam(params: {
  prisma: PrismaClient;
  runId: string | null;
  entry: ExamListEntry;
  options: Omit<PciImportOptions, "logger">;
  disciplineCache: Map<string, string>;
  categorySlug: string;
  logger: LoggerLike;
}): Promise<ImportExamResult> {
  const html = await fetchHtml(params.entry.pageUrl);
  const details = parseExamPage(html, params.entry);
  const sourceKey = params.entry.pageUrl.split("/").filter(Boolean).pop() ?? sanitizeFileName(params.entry.title);
  const storageKey = compactStorageKey(sourceKey);
  const storageDir = path.join(repoRoot, "tmp", "pci-import", sanitizeFileName(params.categorySlug), storageKey);

  if (!details.pdfUrl) {
    await createIssue(params.prisma, params.runId, {
      sourceKey,
      stage: "download",
      severity: ImportIssueSeverity.warning,
      message: "PDF principal nao encontrado na pagina da prova.",
      metadata: {
        pageUrl: params.entry.pageUrl
      }
    });
    params.logger.warn(`Pulando ${params.entry.pageUrl}: PDF principal nao encontrado.`);
    return { importedQuestions: 0, pendingReviewQuestions: 0, rejectedQuestions: 0, skippedExam: true };
  }

  const examPdfPath = await ensureFile(path.join(storageDir, `${storageKey}.pdf`), details.pdfUrl, params.options.force);
  const answerKeyPath = details.answerKeyUrl
    ? await ensureFile(path.join(storageDir, `${storageKey}-gabarito.pdf`), details.answerKeyUrl, params.options.force)
    : null;

  const parsed = runPdfParser(examPdfPath, answerKeyPath, params.logger);
  const cargo = details.cargo ?? parsed.cargoDetected ?? params.entry.title;
  const nivel = parsed.nivelDetected ?? null;

  let examId: string | null = null;
  if (!params.options.dryRun) {
    const exam = await params.prisma.exam.upsert({
      where: { sourceKey },
      update: {
        sourceSite: QuestionSource.pci_concursos,
        sourceCategory: params.categorySlug,
        title: details.title,
        cargo,
        year: details.year ?? params.entry.year,
        instituicao: details.instituicao ?? params.entry.instituicao,
        banca: details.banca ?? params.entry.banca,
        nivel,
        modalidade: "Objetiva",
        examPageUrl: params.entry.pageUrl,
        pdfUrl: details.pdfUrl,
        answerKeyUrl: details.answerKeyUrl,
        reviewStatus: ImportReviewStatus.pending_review,
        parseConfidence: 0,
        metadata: {
          importedFrom: "pci_concursos",
          parserQuestionCount: parsed.questionCount,
          parserAnswerCount: parsed.answerCount,
          sourceCategory: params.categorySlug
        }
      },
      create: {
        sourceSite: QuestionSource.pci_concursos,
        sourceKey,
        sourceCategory: params.categorySlug,
        title: details.title,
        cargo,
        year: details.year ?? params.entry.year,
        instituicao: details.instituicao ?? params.entry.instituicao,
        banca: details.banca ?? params.entry.banca,
        nivel,
        modalidade: "Objetiva",
        examPageUrl: params.entry.pageUrl,
        pdfUrl: details.pdfUrl,
        answerKeyUrl: details.answerKeyUrl,
        reviewStatus: ImportReviewStatus.pending_review,
        parseConfidence: 0,
        metadata: {
          importedFrom: "pci_concursos",
          parserQuestionCount: parsed.questionCount,
          parserAnswerCount: parsed.answerCount,
          sourceCategory: params.categorySlug
        }
      }
    });
    examId = exam.id;
  }

  let importedQuestions = 0;
  let pendingReviewQuestions = 0;
  let rejectedQuestions = 0;

  for (const question of parsed.questions) {
    if (question.options.length !== 5 || !question.statement || question.statement.length < 20) {
      rejectedQuestions += 1;
      await createIssue(params.prisma, params.runId, {
        examId,
        sourceKey,
        stage: "parse",
        severity: ImportIssueSeverity.warning,
        message: "Questao descartada por estrutura incompleta no parser.",
        metadata: {
          questionNumber: question.number,
          optionsCount: question.options.length,
          statementLength: question.statement.length
        }
      });
      continue;
    }

    const taxonomy = inferLegalDiscipline({
      section: question.section,
      categorySlug: params.categorySlug,
      title: details.title,
      cargo
    });

    const parseConfidence = computeQuestionConfidence({
      statement: question.statement,
      optionsCount: question.options.length,
      hasAnswerKey: Boolean(question.correctOption),
      section: question.section,
      matchedDiscipline: taxonomy.disciplineName,
      lawTags: question.lawTags
    });
    const reviewStatus = computeQuestionReviewStatus(parseConfidence, Boolean(question.correctOption));

    if (!params.options.dryRun && examId) {
      const disciplineId = await getDisciplineId(params.prisma, taxonomy.disciplineName, params.disciplineCache, params.options.dryRun);
      const result = await upsertQuestion({
        prisma: params.prisma,
        runId: params.runId,
        examId,
        sourceKey,
        sourceCategory: params.categorySlug,
        question,
        disciplineId,
        disciplineName: taxonomy.disciplineName,
        matchedBy: taxonomy.matchedBy,
        examDetails: details,
        nivel,
        examPageUrl: params.entry.pageUrl,
        reviewStatus,
        parseConfidence
      });

      if (!result.imported) {
        rejectedQuestions += 1;
        continue;
      }

      if (reviewStatus === ImportReviewStatus.pending_review) {
        pendingReviewQuestions += 1;
        await createIssue(params.prisma, params.runId, {
          examId,
          questionId: result.questionId,
          sourceKey,
          stage: "review",
          severity: ImportIssueSeverity.info,
          message: "Questao importada com curadoria pendente.",
          metadata: {
            questionNumber: question.number,
            parseConfidence,
            hasAnswerKey: Boolean(question.correctOption)
          }
        });
      }
    } else if (reviewStatus === ImportReviewStatus.pending_review) {
      pendingReviewQuestions += 1;
    }

    importedQuestions += 1;
  }

  const examConfidence = computeExamConfidence({
    importedQuestions,
    pendingReviewQuestions,
    rejectedQuestions,
    parsedQuestionCount: parsed.questionCount,
    answerCount: parsed.answerCount,
    hasPdf: Boolean(details.pdfUrl),
    hasAnswerKey: Boolean(details.answerKeyUrl)
  });
  const examReviewStatus = computeExamReviewStatus(examConfidence, importedQuestions);

  if (!params.options.dryRun && examId) {
    await params.prisma.exam.update({
      where: { id: examId },
      data: {
        reviewStatus: examReviewStatus,
        parseConfidence: examConfidence,
        metadata: {
          importedFrom: "pci_concursos",
          parserQuestionCount: parsed.questionCount,
          parserAnswerCount: parsed.answerCount,
          sourceCategory: params.categorySlug,
          importedQuestions,
          pendingReviewQuestions,
          rejectedQuestions
        }
      }
    });

    if (examReviewStatus !== ImportReviewStatus.approved) {
      await createIssue(params.prisma, params.runId, {
        examId,
        sourceKey,
        stage: "review",
        severity: ImportIssueSeverity.info,
        message: "Prova marcada para revisao editorial.",
        metadata: {
          parseConfidence: examConfidence,
          importedQuestions,
          pendingReviewQuestions,
          rejectedQuestions
        }
      });
    }
  }

  return {
    importedQuestions,
    pendingReviewQuestions,
    rejectedQuestions,
    skippedExam: false
  };
}

async function crawlCategory(category: string, maxPages: number, maxExamsPerCategory: number, delayMs: number, logger: LoggerLike) {
  const seenPageUrls = new Set<string>();
  const exams: ExamListEntry[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const pageUrl = buildCategoryPageUrl(category, page);
    logger.info(`Lendo lista ${pageUrl}`);
    const html = await fetchHtml(pageUrl);
    const entries = parseCategoryPage(html);

    if (!entries.length) {
      break;
    }

    for (const entry of entries) {
      if (seenPageUrls.has(entry.pageUrl)) {
        continue;
      }
      seenPageUrls.add(entry.pageUrl);
      exams.push(entry);
      if (exams.length >= maxExamsPerCategory) {
        break;
      }
    }

    const detectedTotalPages = parseTotalPages(html);
    if (page >= detectedTotalPages || exams.length >= maxExamsPerCategory) {
      break;
    }

    if (delayMs) {
      await sleep(delayMs);
    }
  }

  return exams;
}

function resolveOptions(options: Partial<PciImportOptions>): PciImportOptions {
  const categories = options.categories?.length ? options.categories : [...DEFAULT_PCI_LEGAL_CATEGORIES];
  return {
    categories,
    maxPages: options.maxPages ?? 2,
    maxExamsPerCategory: options.maxExamsPerCategory ?? 10,
    delayMs: options.delayMs ?? 500,
    force: options.force ?? false,
    dryRun: options.dryRun ?? false,
    trigger: options.trigger ?? ImportRunTrigger.manual,
    logger: options.logger
  };
}

export async function runPciImport(input: Partial<PciImportOptions>): Promise<PciImportSummary> {
  const options = resolveOptions(input);
  const logger = resolveLogger(options.logger);
  const prisma = new PrismaClient({ log: ["warn", "error"] });
  const disciplineCache = new Map<string, string>();
  let runId: string | null = null;

  const totals = {
    totalExamsDiscovered: 0,
    processedExams: 0,
    importedQuestions: 0,
    pendingReviewQuestions: 0,
    rejectedQuestions: 0,
    skippedExams: 0,
    failedExams: 0
  };
  const categorySummaries: CategorySummary[] = [];

  try {
    const run = await prisma.questionImportRun.create({
      data: {
        sourceSite: QuestionSource.pci_concursos,
        status: ImportRunStatus.running,
        trigger: options.trigger,
        categories: options.categories,
        maxPages: options.maxPages,
        maxExamsPerCategory: options.maxExamsPerCategory,
        delayMs: options.delayMs,
        dryRun: options.dryRun
      }
    });
    runId = run.id;

    for (const category of options.categories) {
      const categorySlug = resolveCategorySlug(category);
      const exams = await crawlCategory(category, options.maxPages, options.maxExamsPerCategory, options.delayMs, logger);
      const categorySummary: CategorySummary = {
        category: categorySlug,
        crawledExams: exams.length,
        processedExams: 0,
        importedQuestions: 0,
        pendingReviewQuestions: 0,
        rejectedQuestions: 0,
        skippedExams: 0,
        failedExams: 0
      };

      totals.totalExamsDiscovered += exams.length;

      for (const [index, exam] of exams.entries()) {
        logger.info(`[${categorySlug}] ${index + 1}/${exams.length} Importando ${exam.title}`);
        try {
          const result = await importExam({
            prisma,
            runId,
            entry: exam,
            options,
            disciplineCache,
            categorySlug,
            logger
          });

          categorySummary.processedExams += 1;
          categorySummary.importedQuestions += result.importedQuestions;
          categorySummary.pendingReviewQuestions += result.pendingReviewQuestions;
          categorySummary.rejectedQuestions += result.rejectedQuestions;
          if (result.skippedExam) {
            categorySummary.skippedExams += 1;
          }

          totals.processedExams += 1;
          totals.importedQuestions += result.importedQuestions;
          totals.pendingReviewQuestions += result.pendingReviewQuestions;
          totals.rejectedQuestions += result.rejectedQuestions;
          if (result.skippedExam) {
            totals.skippedExams += 1;
          }

          logger.info(`  -> ${result.importedQuestions} questoes sincronizadas`);
        } catch (error) {
          categorySummary.failedExams += 1;
          totals.failedExams += 1;
          logger.error(`  -> Falha em ${exam.pageUrl}`);
          logger.error(error instanceof Error ? error.stack ?? error.message : String(error));
          await createIssue(prisma, runId, {
            sourceKey: exam.pageUrl.split("/").filter(Boolean).pop() ?? sanitizeFileName(exam.title),
            stage: "exam",
            severity: ImportIssueSeverity.error,
            message: "Falha ao importar prova do PCI.",
            metadata: {
              pageUrl: exam.pageUrl,
              error: error instanceof Error ? error.message : String(error)
            }
          });
        }

        if (options.delayMs) {
          await sleep(options.delayMs);
        }
      }

      categorySummaries.push(categorySummary);
    }

    const status =
      totals.failedExams > 0
        ? ImportRunStatus.completed_with_errors
        : ImportRunStatus.completed;

    await prisma.questionImportRun.update({
      where: { id: runId },
      data: {
        status,
        totalExamsDiscovered: totals.totalExamsDiscovered,
        processedExams: totals.processedExams,
        importedQuestions: totals.importedQuestions,
        pendingReviewQuestions: totals.pendingReviewQuestions,
        rejectedQuestions: totals.rejectedQuestions,
        skippedExams: totals.skippedExams,
        failedExams: totals.failedExams,
        finishedAt: new Date(),
        summary: {
          categories: categorySummaries
        }
      }
    });

    return {
      runId,
      trigger: options.trigger,
      dryRun: options.dryRun,
      categories: categorySummaries,
      totals
    };
  } catch (error) {
    if (runId) {
      await prisma.questionImportRun.update({
        where: { id: runId },
        data: {
          status: ImportRunStatus.failed,
          totalExamsDiscovered: totals.totalExamsDiscovered,
          processedExams: totals.processedExams,
          importedQuestions: totals.importedQuestions,
          pendingReviewQuestions: totals.pendingReviewQuestions,
          rejectedQuestions: totals.rejectedQuestions,
          skippedExams: totals.skippedExams,
          failedExams: totals.failedExams + 1,
          finishedAt: new Date(),
          summary: {
            categories: categorySummaries,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      });
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function runPciImportFromCli(argv: string[]) {
  const options = parseArgs(argv);
  const summary = await runPciImport(options);

  console.log(
    JSON.stringify(
      {
        runId: summary.runId,
        trigger: summary.trigger,
        dryRun: summary.dryRun,
        totals: summary.totals,
        categories: summary.categories
      },
      null,
      2
    )
  );
}
