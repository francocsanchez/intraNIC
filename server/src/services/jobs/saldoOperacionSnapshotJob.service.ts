import { ImportExecutionLoggerService } from "../imports/importExecutionLogger.service";
import { SaldoOperacionSnapshotService } from "../saldoOperacionSnapshot.service";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobMonitor.types";

const JOB_KEY = "saldo-operacion-snapshot";
const JOB_NAME = "saldo-operacion-snapshot";
const JOB_SCHEDULE_LABEL = "Cada 2 minutos, de 07:00 a 20:00";

export class SaldoOperacionSnapshotJobService {
  private static isRunning = false;
  static getJobKey() { return JOB_KEY; }
  static getJobName() { return JOB_NAME; }
  static getScheduleLabel() { return JOB_SCHEDULE_LABEL; }
  static isJobRunning() { return this.isRunning; }

  static async run(trigger: JobMonitorTrigger): Promise<JobExecutionResult> {
    if (this.isRunning) throw new Error("Ya hay una sincronizacion de saldo de operacion en curso");
    this.isRunning = true;
    const startedAt = new Date();
    const log = await ImportExecutionLoggerService.startExecution({
      jobKey: JOB_KEY, jobName: JOB_NAME, sourceType: "database", trigger,
      scheduleLabel: JOB_SCHEDULE_LABEL, sourcePath: "SIAC csqUnidades -> Mongo saldo_operacion_snapshots",
      message: "Iniciando sincronizacion de saldo de operacion",
    });
    try {
      const summary = await SaldoOperacionSnapshotService.syncFromSiac();
      const finishedAt = new Date();
      const message = `Sincronizacion finalizada: ${summary.total} leidos, ${summary.entregadas} entregadas ocultas`;
      const metrics = { totalReceived: summary.total, created: summary.createdOrUpdated, updated: 0, discarded: summary.entregadas, errors: 0 };
      const resultSummary = { title: "Resultado", lines: [`Snapshots procesados: ${summary.createdOrUpdated}`, `Entregadas ocultas: ${summary.entregadas}`] };
      await ImportExecutionLoggerService.finishExecution(String(log._id), { status: "success", message, totalRead: summary.total, inserted: summary.createdOrUpdated, discarded: summary.entregadas, metrics, sourceSummary: { title: "Origen", lines: ["SIAC: csqUnidades, opera, movnped"] }, resultSummary });
      return { status: "success", fileName: null, startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(), durationMs: finishedAt.getTime() - startedAt.getTime(), message, errorSummary: [], metrics, sourceSummary: { title: "Origen", lines: ["SIAC: csqUnidades, opera, movnped"] }, resultSummary, requestSample: [], responseSample: [] };
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : "No se pudo sincronizar saldo de operacion";
      await ImportExecutionLoggerService.finishExecution(String(log._id), { status: "failed", message, errored: 1, errorSummary: [message], resultSummary: { title: "Resultado", lines: [message] } });
      throw error;
    } finally { this.isRunning = false; }
  }
}
