import { runAgendaEntregaEnvioCron } from "../services/agendaEntregaEnvioCron.service";

const JOB_TIMEZONE = "America/Argentina/Buenos_Aires";
const JOB_HOUR = 20;
const JOB_MINUTE = 0;
const CHECK_INTERVAL_MS = 60 * 1000;

let isRunning = false;
let lastRunKey = "";

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
  const { year, month, day } = getZonedParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const shouldRunNow = (date: Date) => {
  const { hour, minute } = getZonedParts(date);
  return hour === JOB_HOUR && minute === JOB_MINUTE;
};

const executeIfNeeded = async () => {
  const now = new Date();
  const runKey = buildRunKey(now);

  if (!shouldRunNow(now)) {
    return;
  }

  if (lastRunKey === runKey) {
    return;
  }

  if (isRunning) {
    console.warn("[agenda-entrega-envio-cron] la ejecucion anterior sigue en curso, se omite este ciclo");
    return;
  }

  isRunning = true;
  lastRunKey = runKey;

  try {
    await runAgendaEntregaEnvioCron();
  } finally {
    isRunning = false;
  }
};

export const startAgendaEntregaEnvioJob = () => {
  console.log(
    `[agenda-entrega-envio-cron] programado todos los dias a las ${String(JOB_HOUR).padStart(2, "0")}:${String(JOB_MINUTE).padStart(2, "0")} (${JOB_TIMEZONE})`,
  );

  void executeIfNeeded();
  setInterval(() => {
    void executeIfNeeded();
  }, CHECK_INTERVAL_MS);
};
