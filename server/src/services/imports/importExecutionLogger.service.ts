import ImportExecutionLog, {
  type IImportExecutionErrorDetail,
  type IImportExecutionLog,
  type IJobMonitorSummaryBlock,
  type JobMonitorMetrics,
  type ImportExecutionStatus,
} from "../../models/ImportExecutionLog";
import ImportedSourceFile from "../../models/ImportedSourceFile";

type StartExecutionInput = {
  jobKey: string;
  jobName: string;
  sourceType: "sftp" | "http" | "database" | "internal";
  trigger: "cron" | "manual";
  scheduleLabel: string;
  sourcePath: string;
  fileName?: string | null;
  message?: string;
};

type FinishExecutionInput = {
  status: ImportExecutionStatus;
  fileName?: string | null;
  message: string;
  totalRead?: number;
  inserted?: number;
  updated?: number;
  discarded?: number;
  errored?: number;
  errorSummary?: string[];
  errorDetailsSample?: IImportExecutionErrorDetail[];
  metrics?: JobMonitorMetrics;
  sourceSummary?: IJobMonitorSummaryBlock | null;
  resultSummary?: IJobMonitorSummaryBlock | null;
  requestSample?: unknown[];
  responseSample?: unknown[];
};

export class ImportExecutionLoggerService {
  static async getProcessedFileNames(jobName: string) {
    const files = await ImportedSourceFile.find(
      {
        jobName,
      },
      { fileName: 1, _id: 0 },
    ).lean<Array<{ fileName: string }>>();

    return new Set(
      files
        .map((file) => file.fileName)
        .map((fileName) => String(fileName ?? "").trim())
        .filter(Boolean),
    );
  }

  static async registerProcessedFile(jobName: string, fileName: string) {
    await ImportedSourceFile.updateOne(
      { jobName, fileName },
      {
        $set: {
          processedAt: new Date(),
        },
        $setOnInsert: {
          jobName,
          fileName,
        },
      },
      { upsert: true },
    );
  }

  static async startExecution(input: StartExecutionInput) {
    return ImportExecutionLog.create({
      jobKey: input.jobKey,
      jobName: input.jobName,
      sourceType: input.sourceType,
      trigger: input.trigger,
      scheduleLabel: input.scheduleLabel,
      sourcePath: input.sourcePath,
      fileName: input.fileName ?? null,
      status: "running",
      startedAt: new Date(),
      message: input.message ?? "Ejecucion iniciada",
    });
  }

  static async finishExecution(logId: string, input: FinishExecutionInput) {
    const finishedAt = new Date();
    const currentLog = await ImportExecutionLog.findById(logId).lean<IImportExecutionLog | null>();
    const durationMs = currentLog?.startedAt ? finishedAt.getTime() - new Date(currentLog.startedAt).getTime() : null;

    await ImportExecutionLog.findByIdAndUpdate(logId, {
      status: input.status,
      fileName: input.fileName ?? currentLog?.fileName ?? null,
      message: input.message,
      totalRead: input.totalRead ?? 0,
      inserted: input.inserted ?? 0,
      updated: input.updated ?? 0,
      discarded: input.discarded ?? 0,
      errored: input.errored ?? 0,
      errorSummary: input.errorSummary ?? [],
      errorDetailsSample: input.errorDetailsSample ?? [],
      metrics: input.metrics ?? {},
      sourceSummary: input.sourceSummary ?? null,
      resultSummary: input.resultSummary ?? null,
      requestSample: input.requestSample ?? [],
      responseSample: input.responseSample ?? [],
      finishedAt,
      durationMs,
    });
  }
}
