import { SaldoOperacionSnapshotJobService } from "../services/jobs/saldoOperacionSnapshotJob.service";

const CHECK_INTERVAL_MS = 60 * 1000;
let lastRunKey = "";

const runIfNeeded = async () => {
  const now = new Date();
  const minuteKey = `${now.toISOString().slice(0, 16)}:${Math.floor(now.getUTCMinutes() / 2)}`;
  if (lastRunKey === minuteKey || SaldoOperacionSnapshotJobService.isJobRunning()) return;
  lastRunKey = minuteKey;
  try { await SaldoOperacionSnapshotJobService.run("cron"); }
  catch (error) { console.error("[saldo-operacion-snapshot-cron] ejecucion fallida", error); }
};

export const startSaldoOperacionSnapshotJob = () => {
  console.log("[saldo-operacion-snapshot-cron] sincronizacion inmediata y cada 2 minutos (America/Argentina/Buenos_Aires)");
  void SaldoOperacionSnapshotJobService.run("cron").catch((error) => console.error("[saldo-operacion-snapshot-cron] ejecucion inicial fallida", error));
  setInterval(() => { void runIfNeeded(); }, CHECK_INTERVAL_MS);
};
