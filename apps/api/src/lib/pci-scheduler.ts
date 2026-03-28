import { ImportRunTrigger, DEFAULT_PCI_LEGAL_CATEGORIES, runPciImport } from "@lexnexus/db";

let currentRun: Promise<void> | null = null;
let timer: NodeJS.Timeout | null = null;

type SchedulerLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }
  return value === "true" || value === "1";
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function getScheduleConfig() {
  const enabled = parseBoolean(process.env.PCI_IMPORT_SCHEDULE_ENABLED, process.env.NODE_ENV === "production");
  const categories = (process.env.PCI_IMPORT_LEGAL_CATEGORIES ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    enabled,
    hourUtc: parsePositiveInt(process.env.PCI_IMPORT_DAILY_HOUR_UTC, 4),
    minuteUtc: parsePositiveInt(process.env.PCI_IMPORT_DAILY_MINUTE_UTC, 10),
    maxPages: parsePositiveInt(process.env.PCI_IMPORT_MAX_PAGES, 2),
    maxExamsPerCategory: parsePositiveInt(process.env.PCI_IMPORT_MAX_EXAMS_PER_CATEGORY, 4),
    delayMs: parsePositiveInt(process.env.PCI_IMPORT_DELAY_MS, 500),
    categories: categories.length ? categories : DEFAULT_PCI_LEGAL_CATEGORIES,
    force: parseBoolean(process.env.PCI_IMPORT_FORCE, false),
    runOnBoot: parseBoolean(process.env.PCI_IMPORT_RUN_ON_BOOT, false)
  };
}

function nextRunAt(hourUtc: number, minuteUtc: number) {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(hourUtc, minuteUtc, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

async function executeScheduledImport(log: SchedulerLogger) {
  if (currentRun) {
    log.warn("Ingestao PCI ja esta em andamento; pulando disparo concorrente.");
    return;
  }

  const config = getScheduleConfig();
  currentRun = runPciImport({
    categories: config.categories,
    maxPages: config.maxPages,
    maxExamsPerCategory: config.maxExamsPerCategory,
    delayMs: config.delayMs,
    force: config.force,
    dryRun: false,
    trigger: ImportRunTrigger.schedule,
    logger: {
      info: (message) => log.info(message),
      warn: (message) => log.warn(message),
      error: (message) => log.error(message)
    }
  })
    .then((summary) => {
      log.info(`Ingestao PCI concluida. ${summary.totals.importedQuestions} questoes sincronizadas.`);
    })
    .catch((error) => {
      log.error(`Falha na ingestao diaria do PCI: ${error instanceof Error ? error.message : String(error)}`);
    })
    .finally(() => {
      currentRun = null;
      scheduleNext(log);
    });

  await currentRun;
}

function scheduleNext(log: SchedulerLogger) {
  const config = getScheduleConfig();
  if (!config.enabled) {
    return;
  }

  if (timer) {
    clearTimeout(timer);
  }

  const next = nextRunAt(config.hourUtc, config.minuteUtc);
  const waitMs = Math.max(next.getTime() - Date.now(), 1_000);
  log.info(`Proxima ingestao PCI agendada para ${next.toISOString()}.`);
  timer = setTimeout(() => {
    void executeScheduledImport(log);
  }, waitMs);
}

export function startPciScheduler(log: SchedulerLogger) {
  const config = getScheduleConfig();
  if (!config.enabled) {
    log.info("Ingestao diaria do PCI desabilitada nesta instancia.");
    return;
  }

  scheduleNext(log);

  if (config.runOnBoot) {
    log.info("Ingestao PCI configurada para executar logo apos o boot.");
    timer = setTimeout(() => {
      void executeScheduledImport(log);
    }, 15_000);
  }
}
