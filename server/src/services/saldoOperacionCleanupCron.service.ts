import { logError } from "../utils/logError";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobs/jobMonitor.types";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";
import { OperacionesDashboardService } from "./operacionesDashboard.service";

const JOB_LOG_PREFIX = "[saldo-operacion-cleanup-cron]";
const JOB_KEY = "saldo-operacion-cleanup";
const JOB_NAME = "saldo-operacion-cleanup";
const JOB_SCHEDULE_LABEL = "Todos los dias a las 20:30";

export class SaldoOperacionCleanupAlreadyRunningError extends Error {}

let isRunning = false;

export const isSaldoOperacionCleanupJobRunning = () => isRunning;
export const getSaldoOperacionCleanupJobKey = () => JOB_KEY;
export const getSaldoOperacionCleanupJobName = () => JOB_NAME;
export const getSaldoOperacionCleanupScheduleLabel = () => JOB_SCHEDULE_LABEL;

export const runSaldoOperacionCleanupCron = async () => runSaldoOperacionCleanupJob("cron");

export const runSaldoOperacionCleanupJob = async (trigger: JobMonitorTrigger): Promise<JobExecutionResult> => {
  if (isRunning) {
    throw new SaldoOperacionCleanupAlreadyRunningError("Ya hay una ejecucion de limpieza de saldo de operacion en curso");
  }

  isRunning = true;
  const startedAt = new Date();
  const log = await ImportExecutionLoggerService.startExecution({
    jobKey: JOB_KEY,
    jobName: JOB_NAME,
    sourceType: "database",
    trigger,
    scheduleLabel: JOB_SCHEDULE_LABEL,
    sourcePath: "saldo_operacion_canceladas",
    message: "Iniciando limpieza de operaciones canceladas ya facturadas",
  });

  try {
    const result = await OperacionesDashboardService.cleanupSaldoOperacionCanceladasFacturadas();
    const finishedAt = new Date();
    const message = result.eliminados
      ? `Limpieza completada: ${result.eliminados} registros eliminados`
      : result.codigosRevisados
        ? "No hay operaciones facturadas para depurar"
        : "No hay registros de saldo operacion para revisar";
    const status = result.codigosRevisados === 0 ? "skipped" : "success";

    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status,
      message,
      totalRead: result.codigosRevisados,
      discarded: result.eliminados,
      metrics: {
        registrosRevisados: result.codigosRevisados,
        operacionesFacturadas: result.codigosFacturados.length,
        registrosEliminados: result.eliminados,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [`saldo_operacion_canceladas: ${result.codigosRevisados} registros`],
      },
      resultSummary: {
        title: "Resultado",
        lines: [message],
      },
      requestSample: [],
      responseSample: result.codigosFacturados.slice(0, 10).map((codigoOperacion) => ({ codigoOperacion })),
    });

    return {
      status,
      fileName: null,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message,
      errorSummary: [],
      metrics: {
        registrosRevisados: result.codigosRevisados,
        operacionesFacturadas: result.codigosFacturados.length,
        registrosEliminados: result.eliminados,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [`saldo_operacion_canceladas: ${result.codigosRevisados} registros`],
      },
      resultSummary: {
        title: "Resultado",
        lines: [message],
      },
      requestSample: [],
      responseSample: result.codigosFacturados.slice(0, 10).map((codigoOperacion) => ({ codigoOperacion })),
    };
  } catch (error) {
    logError("saldoOperacionCleanupCron.run");
    console.error(error);
    const message = error instanceof Error ? error.message : "No se pudo ejecutar la limpieza de saldo de operacion";
    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status: "failed",
      message,
      errorSummary: [message],
      sourceSummary: {
        title: "Recibido",
        lines: ["saldo_operacion_canceladas"],
      },
      resultSummary: {
        title: "Resultado",
        lines: [message],
      },
      responseSample: [{ message }],
    });
    throw error;
  } finally {
    isRunning = false;
  }
};
