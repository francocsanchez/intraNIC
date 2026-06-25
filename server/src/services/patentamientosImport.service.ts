import fs from "fs/promises";
import os from "os";
import path from "path";
import type { IImportExecutionErrorDetail, ImportExecutionStatus } from "../models/ImportExecutionLog";
import ImportedSourceFile from "../models/ImportedSourceFile";
import ImportedPatentamientoIdentifier from "../models/ImportedPatentamientoIdentifier";
import PatentamientoTotalizado from "../models/PatentamientoTotalizado";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";
import { PatentamientosPrendasCsvService } from "./patentamientosPrendasCsv.service";
import { ReusableSftpClientService } from "./sftp/sftpClient.service";
import { SftpFileDiscoveryService } from "./sftp/sftpFileDiscovery.service";

const JOB_NAME = "patentamientos-patent-prendas-import";
const REMOTE_FILE_PREFIX = "Patent_Prendas";
const MIN_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 5000;

type ImportTrigger = "cron" | "manual";

export type PatentamientosImportExecutionResult = {
  status: Exclude<ImportExecutionStatus, "running">;
  fileName: string | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totalRead: number;
  inserted: number;
  updated: number;
  discarded: number;
  errored: number;
  message: string;
  errorSummary: string[];
};

class PatentamientosImportError extends Error {}
class PatentamientosImportAlreadyRunningError extends PatentamientosImportError {}
class PatentamientosImportSkippedError extends PatentamientosImportError {}

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

export class PatentamientosImportService {
  private static isRunning = false;

  static getJobName() {
    return JOB_NAME;
  }

  static isImportRunning() {
    return PatentamientosImportService.isRunning;
  }

  static async importLatestFile(trigger: ImportTrigger): Promise<PatentamientosImportExecutionResult> {
    if (PatentamientosImportService.isRunning) {
      throw new PatentamientosImportAlreadyRunningError("Ya hay una importacion de patentamientos en curso");
    }

    PatentamientosImportService.isRunning = true;

    const startedAt = new Date();
    const host = trimEnv(process.env.SFTP_HOST);
    const user = trimEnv(process.env.SFTP_USER);
    const password = String(process.env.SFTP_PASSWORD ?? "");
    const remotePath = trimEnv(process.env.SFTP_REMOTE_PATH);
    const port = parseIntegerEnv(process.env.SFTP_PORT, 22);
    const connectTimeout = parseIntegerEnv(process.env.SFTP_CONNECT_TIMEOUT_MS, 15000);
    const readyTimeout = parseIntegerEnv(process.env.SFTP_READY_TIMEOUT_MS, 15000);
    const batchSize = clamp(
      parseIntegerEnv(process.env.PATENTAMIENTOS_IMPORT_BATCH_SIZE, 500),
      MIN_BATCH_SIZE,
      MAX_BATCH_SIZE,
    );
    const tempDirectory = trimEnv(process.env.PATENTAMIENTOS_IMPORT_TMP_DIR) || path.join(os.tmpdir(), "intraNIC-patentamientos");

    if (!host || !user || !password || !remotePath) {
      PatentamientosImportService.isRunning = false;
      throw new PatentamientosImportError("La configuracion SFTP esta incompleta");
    }

    const log = await ImportExecutionLoggerService.startExecution({
      jobName: JOB_NAME,
      sourceType: "sftp",
      trigger,
      sourcePath: remotePath,
      message: "Buscando el ultimo archivo Patent_Prendas en el SFTP",
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
      console.log(`[patentamientos-import] inicio ${startedAt.toISOString()} (${trigger})`);
      await sftpClient.connect();

      const remoteFiles = await sftpClient.list(remotePath);
      const matchingFiles = SftpFileDiscoveryService.listByPrefixSorted(
        remoteFiles,
        remotePath,
        REMOTE_FILE_PREFIX,
        (directory, fileName) => sftpClient.buildRemoteFilePath(directory, fileName),
      );
      const [trackedIdentifiersCount, totalizadosCount] = await Promise.all([
        ImportedPatentamientoIdentifier.estimatedDocumentCount(),
        PatentamientoTotalizado.estimatedDocumentCount(),
      ]);
      let shouldRebuildFromScratch = false;

      if (!matchingFiles.length) {
        throw new PatentamientosImportSkippedError("No se encontro ningun archivo Patent_Prendas para importar");
      }

      if (trackedIdentifiersCount === 0 && totalizadosCount > 0) {
        console.warn("[patentamientos-import] base legacy detectada sin huella de IdentificadorUnico; se reinicia para reconstruir");
        await Promise.all([
          PatentamientoTotalizado.deleteMany({}),
          ImportedPatentamientoIdentifier.deleteMany({}),
          ImportedSourceFile.deleteMany({ jobName: JOB_NAME }),
        ]);
        shouldRebuildFromScratch = true;
      }

      const processedFileNames = shouldRebuildFromScratch
        ? new Set<string>()
        : await ImportExecutionLoggerService.getProcessedFileNames(JOB_NAME);
      const pendingFiles = matchingFiles.filter((file) => !processedFileNames.has(file.fileName));

      if (!pendingFiles.length) {
        throw new PatentamientosImportSkippedError("No hay archivos Patent_Prendas pendientes para acumular");
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
      let lastProcessedFileName = pendingFiles[0].fileName;

      for (const pendingFile of pendingFiles) {
        localTempFilePath = await buildTempFilePath(tempDirectory, pendingFile.fileName);
        await sftpClient.download(pendingFile.remotePath, localTempFilePath);

        const csvSummary = await PatentamientosPrendasCsvService.processFile(localTempFilePath, {
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

        console.log(`[patentamientos-import] archivo acumulado: ${pendingFile.fileName}`);
        await ImportExecutionLoggerService.registerProcessedFile(JOB_NAME, pendingFile.fileName);

        await fs.rm(localTempFilePath, { force: true }).catch(() => undefined);
        localTempFilePath = "";
      }

      const finishedAt = new Date();
      const status = resolveStatus(
        aggregatedSummary.totalRead,
        aggregatedSummary.inserted,
        aggregatedSummary.updated,
        aggregatedSummary.errored,
      );
      const message =
        status === "failed"
          ? `Se leyeron ${pendingFiles.length} archivos, pero no se pudo acumular ningun registro valido`
          : pendingFiles.length === 1
            ? `Archivo ${lastProcessedFileName} acumulado correctamente (${aggregatedSummary.totalizedRows} grupos actualizados)`
            : `${pendingFiles.length} archivos acumulados correctamente hasta ${lastProcessedFileName} (${aggregatedSummary.totalizedRows} grupos actualizados)`;

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
      });

      console.log(`[patentamientos-import] archivos acumulados: ${pendingFiles.length}`);
      console.log(`[patentamientos-import] ultimo archivo procesado: ${lastProcessedFileName}`);
      console.log(`[patentamientos-import] leidos: ${aggregatedSummary.totalRead}`);
      console.log(`[patentamientos-import] insertados: ${aggregatedSummary.inserted}`);
      console.log(`[patentamientos-import] actualizados: ${aggregatedSummary.updated}`);
      console.log(`[patentamientos-import] descartados: ${aggregatedSummary.discarded}`);
      console.log(`[patentamientos-import] con error: ${aggregatedSummary.errored}`);
      console.log(`[patentamientos-import] grupos acumulados: ${aggregatedSummary.totalizedRows}`);

      return {
        status,
        fileName: lastProcessedFileName,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        totalRead: aggregatedSummary.totalRead,
        inserted: aggregatedSummary.inserted,
        updated: aggregatedSummary.updated,
        discarded: aggregatedSummary.discarded,
        errored: aggregatedSummary.errored,
        message,
        errorSummary: aggregatedSummary.errorSummary.slice(0, 20),
      };
    } catch (error) {
      const finishedAt = new Date();
      const isSkipped = error instanceof PatentamientosImportSkippedError;
      const message = error instanceof Error ? error.message : "No se pudo ejecutar la importacion";

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: isSkipped ? "skipped" : "failed",
        message,
        errorSummary: [message],
        errorDetailsSample: summarizeFatalError(error),
      });

      if (isSkipped) {
        console.log(`[patentamientos-import] sin novedades: ${message}`);
        return {
          status: "skipped",
          fileName: null,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          totalRead: 0,
          inserted: 0,
          updated: 0,
          discarded: 0,
          errored: 0,
          message,
          errorSummary: [message],
        };
      }

      console.error("[patentamientos-import] error en la importacion");
      console.error(error);

      throw error;
    } finally {
      PatentamientosImportService.isRunning = false;

      if (localTempFilePath) {
        await fs.rm(localTempFilePath, { force: true }).catch(() => undefined);
      }

      await sftpClient.disconnect();
    }
  }
}

export { PatentamientosImportAlreadyRunningError };
