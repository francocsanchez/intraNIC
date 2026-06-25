import ImportExecutionLog, {
  type IImportExecutionErrorDetail,
  type IImportExecutionLog,
  type ImportExecutionStatus,
} from "../../models/ImportExecutionLog";

type StartExecutionInput = {
  jobName: string;
  sourceType: "sftp";
  trigger: "cron" | "manual";
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
};

export class ImportExecutionLoggerService {
  static async startExecution(input: StartExecutionInput) {
    return ImportExecutionLog.create({
      jobName: input.jobName,
      sourceType: input.sourceType,
      trigger: input.trigger,
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
      finishedAt,
      durationMs,
    });
  }
}
