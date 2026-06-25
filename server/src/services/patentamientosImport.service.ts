import fs from "fs/promises";
import os from "os";
import path from "path";
import type { IImportExecutionErrorDetail, ImportExecutionStatus } from "../models/ImportExecutionLog";
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
      const latestFile = SftpFileDiscoveryService.selectLatestByPrefix(
        remoteFiles,
        remotePath,
        REMOTE_FILE_PREFIX,
        (directory, fileName) => sftpClient.buildRemoteFilePath(directory, fileName),
      );

      if (!latestFile) {
        throw new PatentamientosImportSkippedError("No se encontro ningun archivo Patent_Prendas para importar");
      }

      localTempFilePath = await buildTempFilePath(tempDirectory, latestFile.fileName);
      await sftpClient.download(latestFile.remotePath, localTempFilePath);

      const csvSummary = await PatentamientosPrendasCsvService.processFile(localTempFilePath);

      const finishedAt = new Date();
      const status = resolveStatus(
        csvSummary.totalRead,
        csvSummary.inserted,
        csvSummary.updated,
        csvSummary.errored,
      );
      const message =
        status === "failed"
          ? `Archivo ${latestFile.fileName} leido, pero no se pudo importar ningun registro valido`
          : `Archivo ${latestFile.fileName} procesado correctamente y totalizacion regenerada (${csvSummary.totalizedRows} filas)`;

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status,
        fileName: latestFile.fileName,
        message,
        totalRead: csvSummary.totalRead,
        inserted: csvSummary.inserted,
        updated: csvSummary.updated,
        discarded: csvSummary.discarded,
        errored: csvSummary.errored,
        errorSummary: csvSummary.errorSummary,
        errorDetailsSample: csvSummary.errorDetailsSample,
      });

      console.log(`[patentamientos-import] archivo procesado: ${latestFile.fileName}`);
      console.log(`[patentamientos-import] leidos: ${csvSummary.totalRead}`);
      console.log(`[patentamientos-import] insertados: ${csvSummary.inserted}`);
      console.log(`[patentamientos-import] actualizados: ${csvSummary.updated}`);
      console.log(`[patentamientos-import] descartados: ${csvSummary.discarded}`);
      console.log(`[patentamientos-import] con error: ${csvSummary.errored}`);
      console.log(`[patentamientos-import] totalizacion regenerada: ${csvSummary.totalizedRows}`);

      return {
        status,
        fileName: latestFile.fileName,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        totalRead: csvSummary.totalRead,
        inserted: csvSummary.inserted,
        updated: csvSummary.updated,
        discarded: csvSummary.discarded,
        errored: csvSummary.errored,
        message,
        errorSummary: csvSummary.errorSummary,
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

      console.error("[patentamientos-import] error en la importacion");
      console.error(error);

      if (isSkipped) {
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
