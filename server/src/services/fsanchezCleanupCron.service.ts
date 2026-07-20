import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import FsanchezOperacionEstado from "../models/FsanchezOperacionEstado";
import { getFsanchezOperacionesFacturadasQuery } from "../controllers/querys/dms.query";
import { logError } from "../utils/logError";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobs/jobMonitor.types";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";

type OperacionFacturadaRow = {
  opera: string | number | null;
};

const JOB_LOG_PREFIX = "[fsanchez-cleanup-cron]";
const JOB_KEY = "fsanchez-cleanup";
const JOB_NAME = "fsanchez-cleanup";
const JOB_SCHEDULE_LABEL = "Todos los dias a las 20:30";

const normalizeOpera = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return /^\d+$/.test(normalized) ? normalized : "";
};

const buildOperasCsv = (operas: string[]) => operas.join(", ");

export class FsanchezCleanupAlreadyRunningError extends Error {}

let isRunning = false;

export const isFsanchezCleanupJobRunning = () => isRunning;
export const getFsanchezCleanupJobKey = () => JOB_KEY;
export const getFsanchezCleanupJobName = () => JOB_NAME;
export const getFsanchezCleanupScheduleLabel = () => JOB_SCHEDULE_LABEL;

export const runFsanchezCleanupCron = async () => {
  return runFsanchezCleanupJob("cron");
};

export const runFsanchezCleanupJob = async (trigger: JobMonitorTrigger): Promise<JobExecutionResult> => {
  if (isRunning) {
    throw new FsanchezCleanupAlreadyRunningError("Ya hay una ejecucion de limpieza FSANCHEZ en curso");
  }

  isRunning = true;
  const startedAt = new Date();
  console.log(`${JOB_LOG_PREFIX} inicio ${startedAt.toISOString()}`);
  const log = await ImportExecutionLoggerService.startExecution({
    jobKey: JOB_KEY,
    jobName: JOB_NAME,
    sourceType: "database",
    trigger,
    scheduleLabel: JOB_SCHEDULE_LABEL,
    sourcePath: "fsanchez_operaciones_estado",
    message: "Iniciando limpieza de operaciones FSANCHEZ facturadas",
  });

  try {
    const estados = await FsanchezOperacionEstado.find({}, { opera: 1 }).lean();
    const operas = Array.from(new Set(estados.map((item) => normalizeOpera(item.opera)).filter(Boolean)));

    console.log(`${JOB_LOG_PREFIX} registros revisados: ${operas.length}`);

    if (!operas.length) {
      const finishedAt = new Date();
      const message = "No hay registros FSANCHEZ para revisar";
      console.log(`${JOB_LOG_PREFIX} sin registros para limpiar`);
      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "skipped",
        message,
        metrics: {
          registrosRevisados: 0,
          operacionesFacturadas: 0,
          registrosEliminados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: ["fsanchez_operaciones_estado: 0 registros"],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
      });
      return {
        status: "skipped",
        fileName: null,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: [],
        metrics: {
          registrosRevisados: 0,
          operacionesFacturadas: 0,
          registrosEliminados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: ["fsanchez_operaciones_estado: 0 registros"],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: [],
        responseSample: [],
      };
    }

    const facturadasRows = await sequelizeNIC.query<OperacionFacturadaRow>(
      getFsanchezOperacionesFacturadasQuery(buildOperasCsv(operas)),
      {
        type: QueryTypes.SELECT,
      },
    );

    const facturadas = Array.from(
      new Set(facturadasRows.map((row) => normalizeOpera(row.opera)).filter(Boolean)),
    );

    console.log(`${JOB_LOG_PREFIX} operaciones facturadas detectadas: ${facturadas.length}`);

    if (!facturadas.length) {
      const finishedAt = new Date();
      const message = "No hay operaciones facturadas para depurar";
      console.log(`${JOB_LOG_PREFIX} no hay operaciones facturadas para depurar`);
      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "success",
        message,
        totalRead: operas.length,
        metrics: {
          registrosRevisados: operas.length,
          operacionesFacturadas: 0,
          registrosEliminados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`fsanchez_operaciones_estado: ${operas.length} registros`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: operas.slice(0, 5).map((opera) => ({ opera })),
      });
      return {
        status: "success",
        fileName: null,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: [],
        metrics: {
          registrosRevisados: operas.length,
          operacionesFacturadas: 0,
          registrosEliminados: 0,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [`fsanchez_operaciones_estado: ${operas.length} registros`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: operas.slice(0, 5).map((opera) => ({ opera })),
        responseSample: [],
      };
    }

    const deleteResult = await FsanchezOperacionEstado.deleteMany({
      opera: { $in: facturadas },
    });
    const deletedCount = deleteResult.deletedCount ?? 0;
    const finishedAt = new Date();
    const message = `Limpieza completada: ${deletedCount} registros eliminados`;

    console.log(`${JOB_LOG_PREFIX} ${message}`);
    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status: "success",
      message,
      totalRead: operas.length,
      discarded: deletedCount,
      metrics: {
        registrosRevisados: operas.length,
        operacionesFacturadas: facturadas.length,
        registrosEliminados: deletedCount,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [
          `fsanchez_operaciones_estado: ${operas.length} registros`,
          `Operaciones facturadas detectadas: ${facturadas.length}`,
        ],
      },
      resultSummary: {
        title: "Resultado",
        lines: [message],
      },
      requestSample: operas.slice(0, 5).map((opera) => ({ opera })),
      responseSample: facturadas.slice(0, 10).map((opera) => ({ opera })),
    });
    return {
      status: "success",
      fileName: null,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      message,
      errorSummary: [],
      metrics: {
        registrosRevisados: operas.length,
        operacionesFacturadas: facturadas.length,
        registrosEliminados: deletedCount,
      },
      sourceSummary: {
        title: "Recibido",
        lines: [
          `fsanchez_operaciones_estado: ${operas.length} registros`,
          `Operaciones facturadas detectadas: ${facturadas.length}`,
        ],
      },
      resultSummary: {
        title: "Resultado",
        lines: [message],
      },
      requestSample: operas.slice(0, 5).map((opera) => ({ opera })),
      responseSample: facturadas.slice(0, 10).map((opera) => ({ opera })),
    };
  } catch (error) {
    logError("fsanchezCleanupCron.run");
    console.error(error);
    const message = error instanceof Error ? error.message : "No se pudo ejecutar la limpieza FSANCHEZ";
    await ImportExecutionLoggerService.finishExecution(String(log._id), {
      status: "failed",
      message,
      errorSummary: [message],
      sourceSummary: {
        title: "Recibido",
        lines: ["fsanchez_operaciones_estado"],
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
