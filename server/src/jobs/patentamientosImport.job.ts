import { PatentamientosImportService } from "../services/patentamientosImport.service";

const JOB_TIMEZONE = "America/Argentina/Buenos_Aires";
const JOB_SCHEDULES = new Set(["22:00"]);
const CHECK_INTERVAL_MS = 60 * 1000;

let isRunning = false;
const executedRunKeys = new Set<string>();

const getZonedParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JOB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getValue("year")),
    month: Number(getValue("month")),
    day: Number(getValue("day")),
    hour: Number(getValue("hour")),
    minute: Number(getValue("minute")),
  };
};

const buildRunKey = (date: Date) => {
  const { year, month, day, hour, minute } = getZonedParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const shouldRunNow = (date: Date) => {
  const { hour, minute } = getZonedParts(date);
  return JOB_SCHEDULES.has(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
};

const executeIfNeeded = async () => {
  const now = new Date();
  const runKey = buildRunKey(now);

  if (!shouldRunNow(now)) {
    return;
  }

  if (executedRunKeys.has(runKey)) {
    return;
  }

  if (isRunning) {
    console.warn("[patentamientos-import-cron] la ejecucion anterior sigue en curso, se omite este ciclo");
    return;
  }

  isRunning = true;
  executedRunKeys.add(runKey);

  try {
    await PatentamientosImportService.importLatestFile("cron");
  } catch (error) {
    console.error("[patentamientos-import-cron] la ejecucion termino con error");
    console.error(error);
  } finally {
    isRunning = false;
  }
};

export const startPatentamientosImportJob = () => {
  console.log("[patentamientos-import-cron] programado todos los dias a las 22:00 (America/Argentina/Buenos_Aires)");

  void executeIfNeeded();
  setInterval(() => {
    void executeIfNeeded();
  }, CHECK_INTERVAL_MS);
};
