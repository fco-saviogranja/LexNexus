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
import { inferLegalDiscipline } from "./legal-taxonomy.js";

const OAB_BASE_URL = "https://examedeordem.oab.org.br";
const USER_AGENT = "LexNexusBot/1.0 (+https://lexnexus.tech)";

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

type ResourcePhase = "first_phase" | "second_phase" | "administrative";

type ResourceType =
  | "opening_notice"
  | "supplemental_notice"
  | "communication"
  | "objective_booklet"
  | "objective_answer_key_preliminary"
  | "objective_answer_key_definitive"
  | "objective_result_preliminary"
  | "objective_result_definitive"
  | "objective_location_notice"
  | "objective_location_lookup"
  | "objective_appeal_answers"
  | "second_phase_booklet"
  | "second_phase_answer_pattern_preliminary"
  | "second_phase_answer_pattern_definitive"
  | "second_phase_result_preliminary"
  | "second_phase_result_definitive"
  | "second_phase_location_notice"
  | "second_phase_location_lookup"
  | "other";

type OabResource = {
  title: string;
  url: string;
  resourceType: ResourceType;
  phase: ResourcePhase;
  resourceArea: string | null;
  proofType: number | null;
  publishedAt: Date | null;
  metadata: Record<string, unknown>;
};

type OabExamEntry = {
  examId: string;
  title: string;
  pageUrl: string;
};

type OabExamDetails = {
  examId: string;
  title: string;
  year: number | null;
  resources: OabResource[];
  primaryBooklet: OabResource | null;
  primaryAnswerKey: OabResource | null;
};

type ParsedOabPayload = {
  expectedQuestionCount?: number | null;
  questionCount: number;
  answerCount: number;
  questions: Array<{
    number: number;
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

type OabCategorySummary = {
  category: string;
  crawledExams: number;
  processedExams: number;
  importedQuestions: number;
  pendingReviewQuestions: number;
  rejectedQuestions: number;
  skippedExams: number;
  failedExams: number;
};

export type OabImportOptions = {
  examIds: string[];
  maxExams: number;
  delayMs: number;
  force: boolean;
  dryRun: boolean;
  trigger: ImportRunTrigger;
  importQuestions: boolean;
  logger?: Partial<LoggerLike>;
};

export type OabImportSummary = {
  runId: string | null;
  trigger: ImportRunTrigger;
  dryRun: boolean;
  categories: OabCategorySummary[];
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

type CliOptions = Omit<OabImportOptions, "logger">;

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

function toAbsoluteUrl(value: string | null | undefined, baseUrl = OAB_BASE_URL) {
  if (!value) {
    return null;
  }
  const url = new URL(value, baseUrl);
  if (url.protocol === "http:" && url.hostname === "s.oab.org.br") {
    url.protocol = "https:";
  }
  return url.toString();
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parseArgs(argv: string[]): CliOptions {
  const examIds: string[] = [];
  const options: CliOptions = {
    examIds,
    maxExams: 999,
    delayMs: 400,
    force: false,
    dryRun: false,
    trigger: ImportRunTrigger.manual,
    importQuestions: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if ((arg === "--exam-id" || arg === "--exam-ids") && next) {
      examIds.push(
        ...next
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      );
      index += 1;
      continue;
    }
    if (arg === "--max-exams" && next) {
      options.maxExams = parsePositiveInt(next, options.maxExams);
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
      continue;
    }
    if (arg === "--metadata-only" || arg === "--skip-question-import") {
      options.importQuestions = false;
      continue;
    }
  }

  return options;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${url}: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("utf8");
}

async function fetchBinary(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function parseExamList(html: string): OabExamEntry[] {
  const $ = cheerio.load(html);

  return $("#cmb-edital option")
    .toArray()
    .map((element) => {
      const examId = cleanText($(element).attr("value"));
      const title = cleanText($(element).text());
      if (!examId || examId === "0" || !title || /^Selecione o exame$/i.test(title)) {
        return null;
      }

      return {
        examId,
        title,
        pageUrl: `${OAB_BASE_URL}/EditaisProvas?NumeroExame=${examId}`
      };
    })
    .filter((item): item is OabExamEntry => Boolean(item));
}

function parseBrazilianDate(value: string | null) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0));
}

function extractResourceArea(title: string) {
  const match = title.match(/\(([^)]+)\)\s*$/);
  return cleanText(match?.[1] ?? null);
}

function extractProofType(title: string) {
  const normalized = asciiFold(title).toLowerCase();
  const typeMatch = normalized.match(/tipo\s+([1-4])/);
  if (typeMatch) {
    return Number(typeMatch[1]);
  }

  const proofMatch = normalized.match(/caderno de prova\s+0?([1-4])/);
  if (proofMatch) {
    return Number(proofMatch[1]);
  }

  return null;
}

function classifyResource(label: string): Pick<OabResource, "resourceType" | "phase" | "resourceArea" | "proofType" | "metadata"> {
  const normalized = asciiFold(label).toLowerCase();
  const proofType = extractProofType(label);
  const resourceArea = extractResourceArea(label);
  const mentionsSecondPhase =
    normalized.includes("2a fase") ||
    normalized.includes("2ª fase") ||
    normalized.includes("pratico-profissional") ||
    normalized.includes("prático-profissional") ||
    normalized.includes("padrao de respostas") ||
    normalized.includes("padrão de respostas") ||
    (normalized.includes("caderno de prova") && Boolean(resourceArea));
  const mentionsFirstPhase =
    normalized.includes("1a fase") ||
    normalized.includes("1ª fase") ||
    normalized.includes("prova objetiva") ||
    normalized.includes("gabarito") ||
    proofType !== null;

  let phase: ResourcePhase = mentionsSecondPhase
    ? "second_phase"
    : mentionsFirstPhase
      ? "first_phase"
      : "administrative";

  let resourceType: ResourceType = "other";

  if (normalized.includes("edital de abertura")) {
    resourceType = "opening_notice";
    phase = "administrative";
  } else if (normalized.includes("edital complementar")) {
    resourceType = "supplemental_notice";
    phase = "administrative";
  } else if (normalized.includes("comunicado")) {
    resourceType = "communication";
  } else if (normalized.includes("consulta local") && phase === "first_phase") {
    resourceType = "objective_location_lookup";
  } else if (normalized.includes("locais") && normalized.includes("horario") && phase === "first_phase") {
    resourceType = "objective_location_notice";
  } else if (normalized.includes("consulta local") && phase === "second_phase") {
    resourceType = "second_phase_location_lookup";
  } else if (normalized.includes("locais") && normalized.includes("horario") && phase === "second_phase") {
    resourceType = "second_phase_location_notice";
  } else if (normalized.includes("resultado preliminar") && phase === "first_phase") {
    resourceType = "objective_result_preliminary";
  } else if ((normalized.includes("resultado definitivo") || normalized.includes("resultado final")) && phase === "first_phase") {
    resourceType = "objective_result_definitive";
  } else if (normalized.includes("resultado preliminar") && phase === "second_phase") {
    resourceType = "second_phase_result_preliminary";
  } else if ((normalized.includes("resultado definitivo") || normalized.includes("resultado final")) && phase === "second_phase") {
    resourceType = "second_phase_result_definitive";
  } else if (normalized.includes("respostas aos recursos") && phase === "first_phase") {
    resourceType = "objective_appeal_answers";
  } else if (normalized.includes("gabarito") && normalized.includes("definitiv")) {
    resourceType = "objective_answer_key_definitive";
    phase = "first_phase";
  } else if (normalized.includes("gabarito")) {
    resourceType = "objective_answer_key_preliminary";
    phase = "first_phase";
  } else if (normalized.includes("caderno de prova") && proofType !== null) {
    resourceType = "objective_booklet";
    phase = "first_phase";
  } else if (normalized.includes("padrao de respostas") || normalized.includes("padrão de respostas")) {
    resourceType = normalized.includes("definitiv")
      ? "second_phase_answer_pattern_definitive"
      : "second_phase_answer_pattern_preliminary";
    phase = "second_phase";
  } else if (normalized.includes("caderno de prova") && resourceArea) {
    resourceType = "second_phase_booklet";
    phase = "second_phase";
  }

  return {
    resourceType,
    phase,
    resourceArea,
    proofType,
    metadata: {
      classifiedFrom: label
    }
  };
}

function parseResource(rawTitle: string, href: string): OabResource | null {
  const title = cleanText(rawTitle);
  const url = toAbsoluteUrl(href, OAB_BASE_URL);
  if (!title || !url) {
    return null;
  }

  const datedMatch = title.match(/^(\d{2}\/\d{2}\/\d{4})\s*-\s*(.+)$/);
  const publishedAt = parseBrazilianDate(datedMatch?.[1] ?? null);
  const label = cleanText(datedMatch?.[2] ?? title) ?? title;
  const classification = classifyResource(label);

  return {
    title: label,
    url,
    publishedAt,
    resourceType: classification.resourceType,
    phase: classification.phase,
    resourceArea: classification.resourceArea,
    proofType: classification.proofType,
    metadata: {
      rawTitle: title,
      ...classification.metadata
    }
  };
}

function choosePrimaryBooklet(resources: OabResource[]) {
  const candidates = resources.filter((resource) => resource.resourceType === "objective_booklet");
  if (!candidates.length) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    const score = (resource: OabResource) => {
      if (resource.proofType === 1) return 100;
      if (resource.proofType === null) return 50;
      return 10 - (resource.proofType ?? 9);
    };
    return score(right) - score(left);
  })[0];
}

function choosePrimaryAnswerKey(resources: OabResource[]) {
  const candidates = resources.filter(
    (resource) =>
      resource.resourceType === "objective_answer_key_definitive" ||
      resource.resourceType === "objective_answer_key_preliminary"
  );

  if (!candidates.length) {
    return null;
  }

  return [...candidates].sort((left, right) => {
    const score = (resource: OabResource) => {
      let total = 0;
      if (resource.resourceType === "objective_answer_key_definitive") total += 100;
      if (resource.proofType === 1) total += 50;
      if (resource.proofType === null) total += 25;
      if (resource.publishedAt) total += resource.publishedAt.getTime() / 1_000_000_000_000;
      return total;
    };
    return score(right) - score(left);
  })[0];
}

function inferExamYear(entry: OabExamEntry, resources: OabResource[]) {
  const legacyMatch = entry.title.match(/(20\d{2})\.\d/);
  if (legacyMatch) {
    return Number(legacyMatch[1]);
  }

  const openingNotice = resources.find((resource) => resource.resourceType === "opening_notice" && resource.publishedAt);
  if (openingNotice?.publishedAt) {
    return openingNotice.publishedAt.getUTCFullYear();
  }

  const firstDated = resources
    .map((resource) => resource.publishedAt?.getUTCFullYear() ?? null)
    .find((year): year is number => year !== null);
  return firstDated ?? null;
}

function parseExamPage(html: string, entry: OabExamEntry): OabExamDetails {
  const $ = cheerio.load(html);
  const seenUrls = new Set<string>();
  const resources = $("a[target='_blank']")
    .toArray()
    .map((element) => {
      const text = cleanText($(element).text());
      const href = cleanText($(element).attr("href"));
      if (!text || !href || !/^\d{2}\/\d{2}\/\d{4}\s*-/.test(text)) {
        return null;
      }
      const absoluteUrl = toAbsoluteUrl(href, entry.pageUrl);
      if (!absoluteUrl || seenUrls.has(absoluteUrl)) {
        return null;
      }
      seenUrls.add(absoluteUrl);
      return parseResource(text, absoluteUrl);
    })
    .filter((item): item is OabResource => Boolean(item));

  const primaryBooklet = choosePrimaryBooklet(resources);
  const primaryAnswerKey = choosePrimaryAnswerKey(resources);
  const year = inferExamYear(entry, resources);

  return {
    examId: entry.examId,
    title: entry.title,
    year,
    resources,
    primaryBooklet,
    primaryAnswerKey
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
  const baseDir = process.env.LEXNEXUS_OAB_PYTHON_SITE_PACKAGES ?? path.join(process.cwd(), ".lexnexus-python");
  return path.resolve(baseDir);
}

function resolveSupportFile(fileName: string) {
  const candidates = [
    process.env[fileName === "parse-oab-exam.py" ? "LEXNEXUS_OAB_PARSER_PATH" : "LEXNEXUS_PCI_REQUIREMENTS_PATH"],
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

  logger.info("Instalando dependencias Python do parser da OAB.");
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

function runPdfParser(pdfPath: string, answerKeyPath: string | null | undefined, proofType: number | null, logger: LoggerLike): ParsedOabPayload {
  const parserScriptPath = resolveSupportFile("parse-oab-exam.py");
  const { pythonCommand, pythonPath } = ensurePythonDependencies(logger);
  const args = [parserScriptPath, "--pdf", pdfPath];

  if (answerKeyPath) {
    args.push("--answer-key", answerKeyPath);
  }
  if (proofType) {
    args.push("--proof-type", String(proofType));
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
    throw new Error(result.stderr || result.stdout || "Falha ao executar parser Python da OAB");
  }

  return JSON.parse(result.stdout) as ParsedOabPayload;
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
  matchedDiscipline: string;
  lawTags: string[];
}) {
  let score = 0.3;
  if (input.statement.length >= 80) {
    score += 0.22;
  } else if (input.statement.length >= 40) {
    score += 0.12;
  }
  if (input.optionsCount === 4 || input.optionsCount === 5) {
    score += 0.18;
  }
  if (input.hasAnswerKey) {
    score += 0.18;
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
  return confidence >= 0.7 && hasAnswerKey ? ImportReviewStatus.approved : ImportReviewStatus.pending_review;
}

function computeExamConfidence(input: {
  importedQuestions: number;
  pendingReviewQuestions: number;
  rejectedQuestions: number;
  parsedQuestionCount: number;
  expectedQuestionCount: number | null;
  answerCount: number;
  hasBooklet: boolean;
  hasAnswerKey: boolean;
}) {
  if (!input.importedQuestions) {
    return 0.2;
  }

  const approvedQuestions = Math.max(input.importedQuestions - input.pendingReviewQuestions, 0);
  const expected = input.expectedQuestionCount ?? input.parsedQuestionCount;
  let score = 0.25;
  score += Math.min(0.2, (input.importedQuestions / Math.max(expected, 1)) * 0.2);
  score += Math.min(0.18, (approvedQuestions / Math.max(input.importedQuestions, 1)) * 0.18);
  if (input.hasBooklet) {
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

function inferOabDiscipline(question: ParsedOabPayload["questions"][number]) {
  return inferLegalDiscipline({
    statement: question.statement,
    lawTags: question.lawTags
  });
}

async function upsertQuestion(params: {
  prisma: PrismaClient;
  runId: string | null;
  examId: string;
  sourceKey: string;
  question: ParsedOabPayload["questions"][number];
  disciplineId: string;
  disciplineName: string;
  matchedBy: string;
  examDetails: OabExamDetails;
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
      [params.disciplineName !== "Conhecimentos Juridicos" ? params.disciplineName : null, "OAB", "Primeira fase"]
        .map((value) => cleanText(value))
        .filter((value): value is string => Boolean(value))
    )
  );

  const data = {
    disciplineId: params.disciplineId,
    examId: params.examId,
    questionNumber: params.question.number,
    banca: "FGV",
    year: params.examDetails.year ?? new Date().getUTCFullYear(),
    instituicao: "Ordem dos Advogados do Brasil",
    cargo: "Exame de Ordem Unificado",
    nivel: "Superior",
    modalidade: "Objetiva - 1ª fase OAB",
    areaFormacao: "Direito",
    areaAtuacao: "Advocacia",
    statement: params.question.statement,
    correctOption: params.question.correctOption ?? null,
    difficulty: params.question.difficulty,
    subjectTags,
    lawTags: Array.from(new Set(params.question.lawTags)),
    sourceSite: QuestionSource.oab_oficial,
    sourceName: params.examDetails.title,
    sourceUrl: `${OAB_BASE_URL}/EditaisProvas?NumeroExame=${params.examDetails.examId}`,
    externalId: `${params.sourceKey}:${params.question.number}`,
    commentedAnswer: null,
    isOutdated: false,
    isAnnulled: false,
    reviewStatus: params.reviewStatus,
    parseConfidence: params.parseConfidence,
    normalizedStatementHash,
    metadata: {
      importedFrom: "oab_oficial",
      page: params.question.page,
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
  entry: OabExamEntry;
  options: Omit<OabImportOptions, "logger">;
  disciplineCache: Map<string, string>;
  logger: LoggerLike;
}): Promise<ImportExamResult> {
  const html = await fetchHtml(params.entry.pageUrl);
  const details = parseExamPage(html, params.entry);
  const sourceKey = `oab:${params.entry.examId}`;
  const storageKey = compactStorageKey(sourceKey);
  const storageDir = path.join(repoRoot, "tmp", "oab-import", storageKey);

  let examId: string | null = null;
  const examMetadata = {
    importedFrom: "oab_oficial",
    totalResources: details.resources.length,
    firstPhaseResources: details.resources.filter((resource) => resource.phase === "first_phase").length,
    secondPhaseResources: details.resources.filter((resource) => resource.phase === "second_phase").length,
    proofType: details.primaryBooklet?.proofType ?? 1
  };

  if (!params.options.dryRun) {
    const exam = await params.prisma.exam.upsert({
      where: { sourceKey },
      update: {
        sourceSite: QuestionSource.oab_oficial,
        sourceCategory: "oab-primeira-fase",
        title: details.title,
        cargo: "Exame de Ordem Unificado",
        year: details.year,
        instituicao: "Ordem dos Advogados do Brasil",
        banca: "FGV",
        nivel: "Superior",
        modalidade: "Objetiva - 1ª fase OAB",
        areaFormacao: "Direito",
        areaAtuacao: "Advocacia",
        examPageUrl: params.entry.pageUrl,
        pdfUrl: details.primaryBooklet?.url ?? null,
        answerKeyUrl: details.primaryAnswerKey?.url ?? null,
        reviewStatus: ImportReviewStatus.pending_review,
        parseConfidence: 0,
        metadata: examMetadata
      },
      create: {
        sourceSite: QuestionSource.oab_oficial,
        sourceKey,
        sourceCategory: "oab-primeira-fase",
        title: details.title,
        cargo: "Exame de Ordem Unificado",
        year: details.year,
        instituicao: "Ordem dos Advogados do Brasil",
        banca: "FGV",
        nivel: "Superior",
        modalidade: "Objetiva - 1ª fase OAB",
        areaFormacao: "Direito",
        areaAtuacao: "Advocacia",
        examPageUrl: params.entry.pageUrl,
        pdfUrl: details.primaryBooklet?.url ?? null,
        answerKeyUrl: details.primaryAnswerKey?.url ?? null,
        reviewStatus: ImportReviewStatus.pending_review,
        parseConfidence: 0,
        metadata: examMetadata
      }
    });
    examId = exam.id;

    await params.prisma.$transaction(async (tx) => {
      await tx.examResource.deleteMany({
        where: { examId: exam.id }
      });

      if (details.resources.length) {
        await tx.examResource.createMany({
          data: details.resources.map((resource) => ({
            examId: exam.id,
            title: resource.title,
            url: resource.url,
            resourceType: resource.resourceType,
            phase: resource.phase,
            resourceArea: resource.resourceArea,
            proofType: resource.proofType,
            publishedAt: resource.publishedAt,
            isPrimary:
              resource.url === details.primaryBooklet?.url ||
              resource.url === details.primaryAnswerKey?.url,
            metadata: resource.metadata as any
          }))
        });
      }
    });
  }

  if (!params.options.importQuestions) {
    return {
      importedQuestions: 0,
      pendingReviewQuestions: 0,
      rejectedQuestions: 0,
      skippedExam: false
    };
  }

  if (!details.primaryBooklet) {
    await createIssue(params.prisma, params.runId, {
      examId,
      sourceKey,
      stage: "download",
      severity: ImportIssueSeverity.warning,
      message: "Caderno da prova objetiva principal nao encontrado para o exame da OAB.",
      metadata: {
        examPageUrl: params.entry.pageUrl
      }
    });
    params.logger.warn(`Pulando ${params.entry.pageUrl}: caderno da prova objetiva principal nao encontrado.`);
    return { importedQuestions: 0, pendingReviewQuestions: 0, rejectedQuestions: 0, skippedExam: true };
  }

  const examPdfPath = await ensureFile(path.join(storageDir, `${storageKey}.pdf`), details.primaryBooklet.url, params.options.force);
  const answerKeyPath = details.primaryAnswerKey
    ? await ensureFile(path.join(storageDir, `${storageKey}-gabarito.pdf`), details.primaryAnswerKey.url, params.options.force)
    : null;

  const parsed = runPdfParser(examPdfPath, answerKeyPath, details.primaryBooklet.proofType ?? 1, params.logger);
  const minimumQuestionThreshold = parsed.expectedQuestionCount
    ? Math.max(10, Math.floor(parsed.expectedQuestionCount * 0.6))
    : 10;

  if (parsed.questionCount < minimumQuestionThreshold) {
    await createIssue(params.prisma, params.runId, {
      examId,
      sourceKey,
      stage: "parse",
      severity: ImportIssueSeverity.warning,
      message: "A estrutura desta prova da OAB nao atingiu o minimo de confianca para importar questoes.",
      metadata: {
        expectedQuestionCount: parsed.expectedQuestionCount ?? null,
        parsedQuestionCount: parsed.questionCount,
        answerCount: parsed.answerCount,
        minimumQuestionThreshold
      }
    });

    if (!params.options.dryRun && examId) {
      await params.prisma.exam.update({
        where: { id: examId },
        data: {
          reviewStatus: ImportReviewStatus.pending_review,
          parseConfidence: 0.25,
          metadata: {
            ...examMetadata,
            expectedQuestionCount: parsed.expectedQuestionCount ?? null,
            parserQuestionCount: parsed.questionCount,
            parserAnswerCount: parsed.answerCount,
            importSkippedReason: "parse_threshold_not_met"
          }
        }
      });
    }

    return {
      importedQuestions: 0,
      pendingReviewQuestions: 0,
      rejectedQuestions: 0,
      skippedExam: true
    };
  }

  let importedQuestions = 0;
  let pendingReviewQuestions = 0;
  let rejectedQuestions = 0;

  for (const question of parsed.questions) {
    if (question.options.length < 4 || !question.statement || question.statement.length < 20) {
      rejectedQuestions += 1;
      await createIssue(params.prisma, params.runId, {
        examId,
        sourceKey,
        stage: "parse",
        severity: ImportIssueSeverity.warning,
        message: "Questao descartada por estrutura incompleta no parser da OAB.",
        metadata: {
          questionNumber: question.number,
          optionsCount: question.options.length,
          statementLength: question.statement.length
        }
      });
      continue;
    }

    const taxonomy = inferOabDiscipline(question);
    const parseConfidence = computeQuestionConfidence({
      statement: question.statement,
      optionsCount: question.options.length,
      hasAnswerKey: Boolean(question.correctOption),
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
        question,
        disciplineId,
        disciplineName: taxonomy.disciplineName,
        matchedBy: taxonomy.matchedBy,
        examDetails: details,
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
          message: "Questao da OAB importada com curadoria pendente.",
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
    expectedQuestionCount: parsed.expectedQuestionCount ?? null,
    answerCount: parsed.answerCount,
    hasBooklet: Boolean(details.primaryBooklet),
    hasAnswerKey: Boolean(details.primaryAnswerKey)
  });
  const examReviewStatus = computeExamReviewStatus(examConfidence, importedQuestions);

  if (!params.options.dryRun && examId) {
    await params.prisma.exam.update({
      where: { id: examId },
      data: {
        reviewStatus: examReviewStatus,
        parseConfidence: examConfidence,
        metadata: {
          ...examMetadata,
          expectedQuestionCount: parsed.expectedQuestionCount ?? null,
          parserQuestionCount: parsed.questionCount,
          parserAnswerCount: parsed.answerCount,
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
        message: "Prova da OAB marcada para revisao editorial.",
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

function resolveOptions(options: Partial<OabImportOptions>): OabImportOptions {
  return {
    examIds: options.examIds ?? [],
    maxExams: options.maxExams ?? 999,
    delayMs: options.delayMs ?? 400,
    force: options.force ?? false,
    dryRun: options.dryRun ?? false,
    trigger: options.trigger ?? ImportRunTrigger.manual,
    importQuestions: options.importQuestions ?? true,
    logger: options.logger
  };
}

export async function runOabImport(input: Partial<OabImportOptions>): Promise<OabImportSummary> {
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
  const categorySummaries: OabCategorySummary[] = [];

  try {
    const listHtml = await fetchHtml(`${OAB_BASE_URL}/EditaisProvas?NumeroExame=0`);
    const allExams = parseExamList(listHtml);
    const selectedExams = options.examIds.length
      ? allExams.filter((entry) => options.examIds.includes(entry.examId))
      : allExams.slice(0, options.maxExams);

    const run = await prisma.questionImportRun.create({
      data: {
        sourceSite: QuestionSource.oab_oficial,
        status: ImportRunStatus.running,
        trigger: options.trigger,
        categories: ["oab_oficial"],
        maxPages: 1,
        maxExamsPerCategory: selectedExams.length,
        delayMs: options.delayMs,
        dryRun: options.dryRun
      }
    });
    runId = run.id;

    const categorySummary: OabCategorySummary = {
      category: "oab_oficial",
      crawledExams: selectedExams.length,
      processedExams: 0,
      importedQuestions: 0,
      pendingReviewQuestions: 0,
      rejectedQuestions: 0,
      skippedExams: 0,
      failedExams: 0
    };

    totals.totalExamsDiscovered = selectedExams.length;

    for (const [index, exam] of selectedExams.entries()) {
      logger.info(`[oab] ${index + 1}/${selectedExams.length} Importando ${exam.title}`);
      try {
        const result = await importExam({
          prisma,
          runId,
          entry: exam,
          options,
          disciplineCache,
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
          sourceKey: `oab:${exam.examId}`,
          stage: "exam",
          severity: ImportIssueSeverity.error,
          message: "Falha ao importar prova oficial da OAB.",
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
          categories: categorySummaries,
          importQuestions: options.importQuestions
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

export async function runOabImportFromCli(argv: string[]) {
  const options = parseArgs(argv);
  const summary = await runOabImport(options);

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
