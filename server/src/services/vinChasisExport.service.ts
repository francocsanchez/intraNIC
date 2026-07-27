import fs from "fs/promises";
import os from "os";
import path from "path";
import { QueryTypes } from "sequelize";
import type { IImportExecutionErrorDetail } from "../models/ImportExecutionLog";
import { sequelizeNIC } from "../config/database";
import { ImportExecutionLoggerService } from "./imports/importExecutionLogger.service";
import type { JobExecutionResult, JobMonitorTrigger } from "./jobs/jobMonitor.types";
import { ReusableSftpClientService } from "./sftp/sftpClient.service";

const JOB_NAME = "vin-chasis-export";
const JOB_KEY = "vin-chasis-export";
const JOB_SCHEDULE_LABEL = "Lunes a viernes a las 21:30";
const JOB_TIMEZONE = "America/Argentina/Buenos_Aires";
const REMOTE_SUBDIRECTORY = "Chasis";

type ChasisRow = {
  chasis: string | null;
};

class VinChasisExportError extends Error {}
export class VinChasisExportAlreadyRunningError extends VinChasisExportError {}

const trimEnv = (value: string | undefined) => String(value ?? "").trim();

const parseIntegerEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const summarizeFatalError = (error: unknown): IImportExecutionErrorDetail[] => {
  const message = error instanceof Error ? error.message : "Error inesperado durante la exportacion";
  return [{ message }];
};

const formatDateSegment = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: JOB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getValue("year")}${getValue("month")}${getValue("day")}`;
};

const buildTempFilePath = async (directory: string, fileName: string) => {
  await fs.mkdir(directory, { recursive: true });
  const safeName = fileName.replace(/[^\w.-]+/g, "_");
  return path.join(directory, `${Date.now()}-${safeName}`);
};

const normalizeChasis = (value: unknown) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const exportQuery = `
  SELECT movnped.mnp_chasis AS chasis
  FROM movnped
  WHERE movnped.mnp_codigo > 8000
    AND movnped.mnp_chasis IS NOT NULL
`;

export class VinChasisExportService {
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

  static isJobRunning() {
    return VinChasisExportService.isRunning;
  }

  static async run(trigger: JobMonitorTrigger): Promise<JobExecutionResult> {
    if (VinChasisExportService.isRunning) {
      throw new VinChasisExportAlreadyRunningError("Ya hay una exportacion de VIN chasis en curso");
    }

    VinChasisExportService.isRunning = true;

    const startedAt = new Date();
    const host = trimEnv(process.env.SFTP_HOST);
    const user = trimEnv(process.env.SFTP_USER);
    const password = String(process.env.SFTP_PASSWORD ?? "");
    const remotePath = trimEnv(process.env.SFTP_REMOTE_PATH);
    const port = parseIntegerEnv(process.env.SFTP_PORT, 22);
    const connectTimeout = parseIntegerEnv(process.env.SFTP_CONNECT_TIMEOUT_MS, 15000);
    const readyTimeout = parseIntegerEnv(process.env.SFTP_READY_TIMEOUT_MS, 15000);
    const tempDirectory = path.join(os.tmpdir(), "intraNIC-vin-chasis");

    if (!host || !user || !password || !remotePath) {
      VinChasisExportService.isRunning = false;
      throw new VinChasisExportError("La configuracion SFTP esta incompleta");
    }

    const fileName = `vin_nic_${formatDateSegment(startedAt)}.csv`;
    const log = await ImportExecutionLoggerService.startExecution({
      jobKey: JOB_KEY,
      jobName: JOB_NAME,
      sourceType: "database",
      trigger,
      scheduleLabel: JOB_SCHEDULE_LABEL,
      sourcePath: `movnped -> SFTP /${REMOTE_SUBDIRECTORY}`,
      fileName,
      message: "Consultando chasis para exportar al SFTP",
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
      console.log(`[vin-chasis-export] inicio ${startedAt.toISOString()} (${trigger})`);

      const rows = await sequelizeNIC.query<ChasisRow>(exportQuery, {
        type: QueryTypes.SELECT,
      });
      const chasis = rows
        .map((row) => normalizeChasis(row.chasis))
        .filter(Boolean);

      if (!chasis.length) {
        const finishedAt = new Date();
        const message = "No hay chasis validos para exportar";

        await ImportExecutionLoggerService.finishExecution(String(log._id), {
          status: "skipped",
          fileName,
          message,
          totalRead: rows.length,
          discarded: rows.length,
          metrics: {
            registrosLeidos: rows.length,
            chasisExportados: 0,
          },
          sourceSummary: {
            title: "Origen",
            lines: [
              "Tabla: movnped",
              "Filtro: mnp_codigo > 8000 y mnp_chasis IS NOT NULL",
            ],
          },
          resultSummary: {
            title: "Resultado",
            lines: [message],
          },
        });

        return {
          status: "skipped",
          fileName,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString(),
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          message,
          errorSummary: [],
          metrics: {
            registrosLeidos: rows.length,
            chasisExportados: 0,
          },
          sourceSummary: {
            title: "Origen",
            lines: [
              "Tabla: movnped",
              "Filtro: mnp_codigo > 8000 y mnp_chasis IS NOT NULL",
            ],
          },
          resultSummary: {
            title: "Resultado",
            lines: [message],
          },
          requestSample: [],
          responseSample: [],
        };
      }

      localTempFilePath = await buildTempFilePath(tempDirectory, fileName);
      await fs.writeFile(localTempFilePath, `${chasis.join("\n")}\n`, "utf8");

      await sftpClient.connect();
      const rootDirectory = remotePath.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
      const targetDirectory = await sftpClient.resolveChildDirectory(rootDirectory, REMOTE_SUBDIRECTORY);
      await sftpClient.ensureDirectory(targetDirectory);
      const remoteFilePath = sftpClient.buildRemoteFilePath(targetDirectory, fileName);
      await sftpClient.upload(localTempFilePath, remoteFilePath);

      const finishedAt = new Date();
      const message = `Archivo ${fileName} exportado correctamente con ${chasis.length} chasis`;

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "success",
        fileName,
        message,
        totalRead: rows.length,
        inserted: chasis.length,
        discarded: rows.length - chasis.length,
        metrics: {
          registrosLeidos: rows.length,
          chasisExportados: chasis.length,
        },
        sourceSummary: {
          title: "Origen",
          lines: [
            "Tabla: movnped",
            "Filtro: mnp_codigo > 8000 y mnp_chasis IS NOT NULL",
            `Registros leidos: ${rows.length}`,
          ],
        },
        resultSummary: {
          title: "Resultado",
          lines: [
            `Archivo: ${fileName}`,
            `Destino: ${remoteFilePath}`,
            `Chasis exportados: ${chasis.length}`,
          ],
        },
        requestSample: rows.slice(0, 10).map((row) => ({
          chasis: normalizeChasis(row.chasis),
        })),
        responseSample: chasis.slice(0, 10).map((item) => ({
          chasis: item,
        })),
      });

      console.log(`[vin-chasis-export] registros leidos: ${rows.length}`);
      console.log(`[vin-chasis-export] chasis exportados: ${chasis.length}`);
      console.log(`[vin-chasis-export] archivo subido: ${remoteFilePath}`);

      return {
        status: "success",
        fileName,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        message,
        errorSummary: [],
        metrics: {
          registrosLeidos: rows.length,
          chasisExportados: chasis.length,
        },
        sourceSummary: {
          title: "Origen",
          lines: [
            "Tabla: movnped",
            "Filtro: mnp_codigo > 8000 y mnp_chasis IS NOT NULL",
            `Registros leidos: ${rows.length}`,
          ],
        },
        resultSummary: {
          title: "Resultado",
          lines: [
            `Archivo: ${fileName}`,
            `Destino: ${remoteFilePath}`,
            `Chasis exportados: ${chasis.length}`,
          ],
        },
        requestSample: rows.slice(0, 10).map((row) => ({
          chasis: normalizeChasis(row.chasis),
        })),
        responseSample: chasis.slice(0, 10).map((item) => ({
          chasis: item,
        })),
      };
    } catch (error) {
      const finishedAt = new Date();
      const message = error instanceof Error ? error.message : "No se pudo ejecutar la exportacion de VIN chasis";

      await ImportExecutionLoggerService.finishExecution(String(log._id), {
        status: "failed",
        fileName,
        message,
        errorSummary: [message],
        errorDetailsSample: summarizeFatalError(error),
        sourceSummary: {
          title: "Origen",
          lines: [
            "Tabla: movnped",
            "Filtro: mnp_codigo > 8000 y mnp_chasis IS NOT NULL",
          ],
        },
        resultSummary: {
          title: "Resultado",
          lines: [message],
        },
        responseSample: summarizeFatalError(error).map((item) => ({ message: item.message })),
      });

      console.error("[vin-chasis-export] error en la exportacion");
      console.error(error);

      return Promise.reject(error instanceof Error ? error : new Error(message));
    } finally {
      VinChasisExportService.isRunning = false;

      if (localTempFilePath) {
        await fs.rm(localTempFilePath, { force: true }).catch(() => undefined);
      }

      await sftpClient.disconnect();
    }
  }
}
