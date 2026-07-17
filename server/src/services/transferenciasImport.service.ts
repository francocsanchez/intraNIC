import fs from "fs/promises";
import os from "os";
import path from "path";
import type { ImportExecutionStatus } from "../models/ImportExecutionLog";
import type { IImportExecutionErrorDetail } from "../models/ImportExecutionLog";
import ImportedSourceFile from "../models/ImportedSourceFile";
import ImportedTransferenciaIdentifier from "../models/ImportedTransferenciaIdentifier";
import TransferenciaTotalizada from "../models/TransferenciaTotalizada";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobs/jobMonitor.types";
import { ReusableSftpClientService } from "./sftp/sftpClient.service";
import { SftpFileDiscoveryService } from "./sftp/sftpFileDiscovery.service";
import { TransferenciasPrendasCsvService } from "./transferenciasPrendasCsv.service";

const JOB_NAME = "transferencias-transf-prendas-import";
const JOB_KEY = "transferencias-import";
const JOB_SCHEDULE_LABEL = "Lunes a viernes a las 03:00";
const REMOTE_FILE_PREFIX = "Transf_Prendas";
const MIN_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 5000;

class TransferenciasImportError extends Error {}
class TransferenciasImportAlreadyRunningError extends TransferenciasImportError {}
class TransferenciasImportSkippedError extends TransferenciasImportError {}

const trimEnv = (value: string | undefined) => String(value ?? "").trim();

const parseIntegerEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const buildTempFilePath = async (directory: string, fileName: string) => {
  await fs.mkdir(directory, { recursive: true });

  const safeName = fileName.replace(/[^\w.-]+/g, "_");
  return path.join(directory, `${Date.now()}-${safeName}`);
};

const summarizeFatalError = (error: unknown): IImportExecutionErrorDetail[] => {
  const message = error instanceof Error ? error.message : "Error inesperado durante la importacion";

  return [{ message }];
};

const resolveStatus = (
  totalRead: number,
  inserted: number,
  updated: number,
  errored: number,
): "success" | "partial" | "failed" => {
  if (totalRead > 0 && inserted === 0 && updated === 0 && errored >= totalRead) {
    return "failed";
  }

  return errored > 0 ? "partial" : "success";
};

const formatFileList = (fileNames: string[]) =>
  fileNames.length === 1 ? fileNames[0] : `${fileNames.length} archivos`;

export class TransferenciasImportService {
  private static isRunning = false;

  static getJobName() {
    return JOB_NAME;
  }

  static getJobKey() {
    return JOB_KEY;
  }

  static getScheduleLabel() {
    return JOB_SCHEDULE_LABEL;
  }

  static isImportRunning() {
    return TransferenciasImportService.isRunning;
  }

  static async importLatestFile(trigger: JobMonitorTrigger): Promise<JobExecutionResult> {
    if (TransferenciasImportService.isRunning) {
      throw new TransferenciasImportAlreadyRunningError("Ya hay una importacion de transferencias en curso");
    }

    TransferenciasImportService.isRunning = true;

    const startedAt = new Date();
    const host = trimEnv(process.env.SFTP_HOST);
    const user = trimEnv(process.env.SFTP_USER);
    const password = String(process.env.SFTP_PASSWORD ?? "");
    const remotePath = trimEnv(process.env.SFTP_REMOTE_PATH);
    const port = parseIntegerEnv(process.env.SFTP_PORT, 22);
    const connectTimeout = parseIntegerEnv(process.env.SFTP_CONNECT_TIMEOUT_MS, 15000);
    const readyTimeout = parseIntegerEnv(process.env.SFTP_READY_TIMEOUT_MS, 15000);
    const batchSize = clamp(
      parseIntegerEnv(process.env.TRANSFERENCIAS_IMPORT_BATCH_SIZE, 500),
      MIN_BATCH_SIZE,
      MAX_BATCH_SIZE,
    );
    const tempDirectory = trimEnv(process.env.TRANSFERENCIAS_IMPORT_TMP_DIR) || path.join(os.tmpdir(), "intraNIC-transferencias");

    if (!host || !user || !password || !remotePath) {
      TransferenciasImportService.isRunning = false;
      throw new TransferenciasImportError("La configuracion SFTP esta incompleta");
    }

    const log = await ImportExecutionLoggerService.startExecution({
      jobKey: JOB_KEY,
      jobName: JOB_NAME,
      sourceType: "sftp",
      trigger,
      scheduleLabel: JOB_SCHEDULE_LABEL,
      sourcePath: remotePath,
      message: "Buscando archivos Transf_Prendas en el SFTP",
    });

    const sftpClient = new ReusableSftpClientService({
      host,
      port,
      username: user,
      password,
      readyTimeout,
      connectTimeout,
    });

    let localTempFilePath = "";

    try {
      console.log(`[transferencias-import] inicio ${startedAt.toISOString()} (${trigger})`);
      await sftpClient.connect();

      const remoteFiles = await sftpClient.list(remotePath);
      const matchingFiles = SftpFileDiscoveryService.listByPrefixSorted(
        remoteFiles,
        remotePath,
        REMOTE_FILE_PREFIX,
        (directory, fileName) => sftpClient.buildRemoteFilePath(directory, fileName),
      );
      const [trackedIdentifiersCount, totalizadosCount] = await Promise.all([
        ImportedTransferenciaIdentifier.estimatedDocumentCount(),
        TransferenciaTotalizada.estimatedDocumentCount(),
      ]);
      let shouldRebuildFromScratch = false;

      if (!matchingFiles.length) {
        throw new TransferenciasImportSkippedError("No se encontro ningun archivo Transf_Prendas para importar");
      }

      if (trackedIdentifiersCount === 0 && totalizadosCount > 0) {
        console.warn("[transferencias-import] base legacy detectada sin huella de IdentificadorUnico; se reinicia para reconstruir");
        await Promise.all([
          TransferenciaTotalizada.deleteMany({}),
          ImportedTransferenciaIdentifier.deleteMany({}),
          ImportedSourceFile.deleteMany({ jobName: JOB_NAME }),
        ]);
        shouldRebuildFromScratch = true;
      }

      const processedFileNames = shouldRebuildFromScratch
        ? new Set<string>()
        : await ImportExecutionLoggerService.getProcessedFileNames(JOB_NAME);
      const pendingFiles = matchingFiles.filter((file) => !processedFileNames.has(file.fileName));

      if (!pendingFiles.length) {
        throw new TransferenciasImportSkippedError("No hay archivos Transf_Prendas pendientes para acumular");
      }

      const aggregatedSummary = {
        totalRead: 0,
        inserted: 0,
        updated: 0,
        discarded: 0,
        errored: 0,
        totalizedRows: 0,
        errorSummary: [] as string[],
        errorDetailsSample: [] as IImportExecutionErrorDetail[],
      };
      const emptyFileNames: string[] = [];
      let lastProcessedFileName = pendingFiles[0].fileName;

      for (const pendingFile of pendingFiles) {
        localTempFilePath = await buildTempFilePath(tempDirectory, pendingFile.fileName);
        await sftpClient.download(pendingFile.remotePath, localTempFilePath);

        const csvSummary = await TransferenciasPrendasCsvService.processFile(localTempFilePath, {
          batchSize,
          sourceFileName: pendingFile.fileName,
        });
        lastProcessedFileName = pendingFile.fileName;

        aggregatedSummary.totalRead += csvSummary.totalRead;
        aggregatedSummary.inserted += csvSummary.inserted;
        aggregatedSummary.updated += csvSummary.updated;
        aggregatedSummary.discarded += csvSummary.discarded;
        aggregatedSummary.errored += csvSummary.errored;
        aggregatedSummary.totalizedRows += csvSummary.totalizedRows;
        aggregatedSummary.errorSummary.push(...csvSummary.errorSummary);
        aggregatedSummary.errorDetailsSample.push(...csvSummary.errorDetailsSample);

        if (csvSummary.isEmptyFile) {
          emptyFileNames.push(pendingFile.fileName);
        }

        console.log(`[transferencias-import] archivo acumulado: ${pendingFile.fileName}`);
        await ImportExecutionLoggerService.registerProcessedFile(JOB_NAME, pendingFile.fileName);

        await fs.rm(localTempFilePath, { force: true }).catch(() => undefined);
        localTempFilePath = "";
      }

      const finishedAt = new Date();
      const onlyEmptyFiles = emptyFileNames.length === pendingFiles.length && aggregatedSummary.totalRead === 0;
      const status: ImportExecutionStatus = onlyEmptyFiles
        ? "skipped"
        : resolveStatus(
          aggregatedSummary.totalRead,
          aggregatedSummary.inserted,
          aggregatedSummary.updated,
          aggregatedSummary.errored,
        );
      const message =
        status === "skipped"
          ? `${formatFileList(emptyFileNames)} sin registros para importar`
          : status === "failed"
            ? `Se leyeron ${pendingFiles.length} archivos, pero no se pudo acumular ningun registro valido`
            : pendingFiles.length === 1
              ? `Archivo ${lastProcessedFileName} acumulado correctamente (${aggregatedSummary.totalizedRows} grupos actualizados)`
              : `${pendingFiles.length} archivos acumulados correctamente hasta ${lastProcessedFileName} (${aggregatedSummary.totalizedRows} grupos actualizados)`;
      const resultLines =
        status === "skipped"
          ? [
            `Archivos sin registros: ${emptyFileNames.length}`,
            `Ultimo archivo: ${lastProcessedFileName}`,
          ]
          : [
            `Grupos acumulados: ${aggregatedSummary.totalizedRows}`,
            `Insertados: ${aggregatedSummary.inserted}`,
            `Actualizados: ${aggregatedSummary.updated}`,
          ];

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status,
        fileName: lastProcessedFileName,
        message,
        totalRead: aggregatedSummary.totalRead,
        inserted: aggregatedSummary.inserted,
        updated: aggregatedSummary.updated,
        discarded: aggregatedSummary.discarded,
        errored: aggregatedSummary.errored,
        errorSummary: aggregatedSummary.errorSummary.slice(0, 20),
        errorDetailsSample: aggregatedSummary.errorDetailsSample.slice(0, 20),
        metrics: {
          totalRead: aggregatedSummary.totalRead,
          inserted: aggregatedSummary.inserted,
          updated: aggregatedSummary.updated,
          discarded: aggregatedSummary.discarded,
          errored: aggregatedSummary.errored,
          totalizedRows: aggregatedSummary.totalizedRows,
          filesProcessed: pendingFiles.length,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [
            `Origen SFTP: ${remotePath}`,
            `Archivos acumulados: ${pendingFiles.length}`,
            `Ultimo archivo: ${lastProcessedFileName}`,
          ],
        },
        resultSummary: {
          title: "Resultado",
          lines: resultLines,
        },
        requestSample: pendingFiles.slice(0, 5).map((pendingFile) => ({
          fileName: pendingFile.fileName,
          remotePath: pendingFile.remotePath,
        })),
        responseSample: aggregatedSummary.errorDetailsSample.slice(0, 10).map((item) => ({
          line: item.line ?? null,
          identificadorUnico: item.identificadorUnico ?? "",
          message: item.message,
        })),
      });

      console.log(`[transferencias-import] archivos acumulados: ${pendingFiles.length}`);
      console.log(`[transferencias-import] ultimo archivo procesado: ${lastProcessedFileName}`);
      console.log(`[transferencias-import] leidos: ${aggregatedSummary.totalRead}`);
      console.log(`[transferencias-import] insertados: ${aggregatedSummary.inserted}`);
      console.log(`[transferencias-import] actualizados: ${aggregatedSummary.updated}`);
      console.log(`[transferencias-import] descartados: ${aggregatedSummary.discarded}`);
      console.log(`[transferencias-import] con error: ${aggregatedSummary.errored}`);
      console.log(`[transferencias-import] grupos acumulados: ${aggregatedSummary.totalizedRows}`);

      return {
        status,
        fileName: lastProcessedFileName,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: aggregatedSummary.errorSummary.slice(0, 20),
        errorDetailsSample: aggregatedSummary.errorDetailsSample.slice(0, 20),
        metrics: {
          totalRead: aggregatedSummary.totalRead,
          inserted: aggregatedSummary.inserted,
          updated: aggregatedSummary.updated,
          discarded: aggregatedSummary.discarded,
          errored: aggregatedSummary.errored,
          totalizedRows: aggregatedSummary.totalizedRows,
          filesProcessed: pendingFiles.length,
        },
        sourceSummary: {
          title: "Recibido",
          lines: [
            `Origen SFTP: ${remotePath}`,
            `Archivos acumulados: ${pendingFiles.length}`,
            `Ultimo archivo: ${lastProcessedFileName}`,
          ],
        },
        resultSummary: {
          title: "Resultado",
          lines: resultLines,
        },
        requestSample: pendingFiles.slice(0, 5).map((pendingFile) => ({
          fileName: pendingFile.fileName,
          remotePath: pendingFile.remotePath,
        })),
        responseSample: aggregatedSummary.errorDetailsSample.slice(0, 10).map((item) => ({
          line: item.line ?? null,
          identificadorUnico: item.identificadorUnico ?? "",
          message: item.message,
        })),
      };
    } catch (error) {
      const finishedAt = new Date();
      const isSkipped = error instanceof TransferenciasImportSkippedError;
      const message = error instanceof Error ? error.message : "No se pudo ejecutar la importacion";

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: isSkipped ? "skipped" : "failed",
        message,
        errorSummary: [message],
        errorDetailsSample: summarizeFatalError(error),
        metrics: {},
        sourceSummary: {
          title: "Recibido",
          lines: [`Origen SFTP: ${remotePath}`],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        requestSample: [],
        responseSample: summarizeFatalError(error).map((item) => ({ message: item.message })),
      });

      if (isSkipped) {
        console.log(`[transferencias-import] sin novedades: ${message}`);
        return {
          status: "skipped",
          fileName: null,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          message,
          errorSummary: [message],
          errorDetailsSample: summarizeFatalError(error),
          metrics: {},
          sourceSummary: {
            title: "Recibido",
            lines: [`Origen SFTP: ${remotePath}`],
          },
          resultSummary: {
            title: "Resultado",
            lines: [message],
          },
          requestSample: [],
          responseSample: [],
        };
      }

      console.error("[transferencias-import] error en la importacion");
      console.error(error);

      throw error;
    } finally {
      TransferenciasImportService.isRunning = false;

      if (localTempFilePath) {
        await fs.rm(localTempFilePath, { force: true }).catch(() => undefined);
      }

      await sftpClient.disconnect();
    }
  }
}

export { TransferenciasImportAlreadyRunningError };
