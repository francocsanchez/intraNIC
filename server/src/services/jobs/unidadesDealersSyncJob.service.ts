import { ImportExecutionLoggerService } from "../imports/importExecutionLogger.service";
import { UnidadesDealersService } from "../unidadesDealers.service";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobMonitor.types";

const JOB_KEY = "unidades-dealers-sync";
const JOB_NAME = "unidades-dealers-sync";
const JOB_SCHEDULE_LABEL = "Todos los dias a las 07:00 y 20:00";

export class UnidadesDealersSyncAlreadyRunningError extends Error {}

export class UnidadesDealersSyncJobService {
  private static isRunning = false;

  static getJobKey() {
    return JOB_KEY;
  }

  static getJobName() {
    return JOB_NAME;
  }

  static getScheduleLabel() {
    return JOB_SCHEDULE_LABEL;
  }

  static isJobRunning() {
    return UnidadesDealersSyncJobService.isRunning;
  }

  static async run(trigger: JobMonitorTrigger): Promise<JobExecutionResult> {
    if (UnidadesDealersSyncJobService.isRunning) {
      throw new UnidadesDealersSyncAlreadyRunningError("Ya hay una sincronizacion de unidades dealers en curso");
    }

    UnidadesDealersSyncJobService.isRunning = true;
    const startedAt = new Date();

    const log = await ImportExecutionLoggerService.startExecution({
      jobKey: JOB_KEY,
      jobName: JOB_NAME,
      sourceType: "http",
      trigger,
      scheduleLabel: JOB_SCHEDULE_LABEL,
      sourcePath: UnidadesDealersService.getSourceUrl(),
      message: "Iniciando sincronizacion de unidades dealers",
    });

    try {
      const summary = await UnidadesDealersService.syncFromSource();
      const finishedAt = new Date();
      const status = summary.errors > 0 ? "partial" : "success";
      const message = `Sincronizacion finalizada: ${summary.created} creados, ${summary.updated} actualizados, ${summary.errors} con error`;

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status,
        message,
        totalRead: summary.total,
        inserted: summary.created,
        updated: summary.updated,
        errored: summary.errors,
        errorSummary: summary.errorMessages.slice(0, 20),
        metrics: {
          totalReceived: summary.total,
          created: summary.created,
          updated: summary.updated,
          errors: summary.errors,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [
            `Origen HTTP: ${UnidadesDealersService.getSourceUrl()}`,
            `Registros recibidos: ${summary.total}`,
          ],
        },
        resultSummary: {
          title: "Resultado",
          lines: [
            `Creados: ${summary.created}`,
            `Actualizados: ${summary.updated}`,
            `Errores: ${summary.errors}`,
          ],
        },
        requestSample: summary.requestSample,
        responseSample: summary.errorSamples,
      });

      return {
        status,
        fileName: null,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: summary.errorMessages.slice(0, 20),
        metrics: {
          totalReceived: summary.total,
          created: summary.created,
          updated: summary.updated,
          errors: summary.errors,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [
            `Origen HTTP: ${UnidadesDealersService.getSourceUrl()}`,
            `Registros recibidos: ${summary.total}`,
          ],
        },
        resultSummary: {
          title: "Resultado",
          lines: [
            `Creados: ${summary.created}`,
            `Actualizados: ${summary.updated}`,
            `Errores: ${summary.errors}`,
          ],
        },
        requestSample: summary.requestSample,
        responseSample: summary.errorSamples,
      };
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : "No se pudo sincronizar unidades dealers";

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "failed",
        message,
        errorSummary: [message],
        responseSample: [{ message }],
        sourceSummary: {
          title: "Recibido",
          lines: [`Origen HTTP: ${UnidadesDealersService.getSourceUrl()}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
      });

      throw error;
    } finally {
      UnidadesDealersSyncJobService.isRunning = false;
    }
  }
}
