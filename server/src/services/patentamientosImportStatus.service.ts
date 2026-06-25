import ImportExecutionLog from "../models/ImportExecutionLog";
import { PatentamientosImportService } from "./patentamientosImport.service";

export type PatentamientosImportStatusResponse = {
  isRunning: boolean;
  lastExecutionAt: string | null;
  lastSuccessfulExecutionAt: string | null;
  lastStatus: "success" | "partial" | "failed" | "skipped" | null;
  lastFileName: string | null;
  durationMs: number | null;
  totalRead: number;
  inserted: number;
  updated: number;
  discarded: number;
  errored: number;
  message: string;
};

export class PatentamientosImportStatusService {
  static async getLatestStatus(): Promise<PatentamientosImportStatusResponse> {
    const [latestExecution, latestSuccessfulExecution] = await Promise.all([
      ImportExecutionLog.findOne({ jobName: PatentamientosImportService.getJobName() })
        .sort({ startedAt: -1 })
        .lean(),
      ImportExecutionLog.findOne({
        jobName: PatentamientosImportService.getJobName(),
        status: { $in: ["success", "partial"] },
      })
        .sort({ finishedAt: -1, startedAt: -1 })
        .lean(),
    ]);

    return {
      isRunning: PatentamientosImportService.isImportRunning(),
      lastExecutionAt: latestExecution?.finishedAt?.toISOString?.() ?? latestExecution?.startedAt?.toISOString?.() ?? null,
      lastSuccessfulExecutionAt:
        latestSuccessfulExecution?.finishedAt?.toISOString?.()
        ?? latestSuccessfulExecution?.startedAt?.toISOString?.()
        ?? null,
      lastStatus:
        latestExecution?.status && latestExecution.status !== "running"
          ? latestExecution.status
          : null,
      lastFileName: latestExecution?.fileName ?? null,
      durationMs: latestExecution?.durationMs ?? null,
      totalRead: latestExecution?.totalRead ?? 0,
      inserted: latestExecution?.inserted ?? 0,
      updated: latestExecution?.updated ?? 0,
      discarded: latestExecution?.discarded ?? 0,
      errored: latestExecution?.errored ?? 0,
      message: latestExecution?.message ?? "Todavia no hay ejecuciones registradas",
    };
  }
}
