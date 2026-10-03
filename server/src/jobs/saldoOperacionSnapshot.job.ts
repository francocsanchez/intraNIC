import { SaldoOperacionSnapshotJobService } from "../services/jobs/saldoOperacionSnapshotJob.service";

const CHECK_INTERVAL_MS = 60 * 1000;
const JOB_TIMEZONE = "America/Argentina/Buenos_Aires";
const FIRST_HOUR = 7;
const LAST_HOUR = 20;
let lastRunKey = "";

const getZonedParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JOB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: value("year"), month: value("month"), day: value("day"), hour: Number(value("hour")), minute: Number(value("minute")) };
};

const runIfNeeded = async () => {
  const { year, month, day, hour, minute } = getZonedParts(new Date());
  const isOperationalTime = (hour > FIRST_HOUR && hour < LAST_HOUR) || hour === FIRST_HOUR || (hour === LAST_HOUR && minute === 0);
  if (!isOperationalTime || minute % 2 !== 0) return;
  const minuteKey = `${year}-${month}-${day} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  if (lastRunKey === minuteKey || SaldoOperacionSnapshotJobService.isJobRunning()) return;
  lastRunKey = minuteKey;
  try { await SaldoOperacionSnapshotJobService.run("cron"); }
  catch (error) { console.error("[saldo-operacion-snapshot-cron] ejecucion fallida", error); }
};

export const startSaldoOperacionSnapshotJob = () => {
  console.log("[saldo-operacion-snapshot-cron] cada 2 minutos de 07:00 a 20:00 (America/Argentina/Buenos_Aires)");
  void runIfNeeded();
  setInterval(() => { void runIfNeeded(); }, CHECK_INTERVAL_MS);
};
