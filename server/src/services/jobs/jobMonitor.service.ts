import ImportExecutionLog, { type IImportExecutionLog, type JobMonitorMetrics } from "../../models/ImportExecutionLog";
import { JobMonitorRegistryService } from "./jobMonitorRegistry.service";
import type { JobExecutionResult } from "./jobMonitor.types";

type JobExecutionHistoryItem = {
  id: string;
  status: IImportExecutionLog["status"];
  trigger: IImportExecutionLog["trigger"];
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  fileName: string | null;
  message: string;
  metrics: JobMonitorMetrics;
};

const toIsoString = (value: Date | null | undefined) => value?.toISOString?.() ?? null;

const mapExecution = (execution: Partial<IImportExecutionLog>): JobExecutionHistoryItem => ({
  id: String(execution._id ?? ""),
  status: (execution.status ?? "failed") as IImportExecutionLog["status"],
  trigger: (execution.trigger ?? "manual") as IImportExecutionLog["trigger"],
  startedAt: toIsoString(execution.startedAt as Date) ?? new Date(0).toISOString(),
  finishedAt: toIsoString(execution.finishedAt as Date | null),
  durationMs: execution.durationMs ?? null,
  fileName: execution.fileName ?? null,
  message: execution.message ?? "",
  metrics: execution.metrics ?? {},
});

export class JobMonitorNotFoundError extends Error {}

export class JobMonitorService {
  static async listJobs() {
    const jobs = JobMonitorRegistryService.listJobs();
    const logs = await ImportExecutionLog.find({
      jobKey: { $in: jobs.map((job) => job.jobKey) },
    })
      .sort({ startedAt: -1 })
      .lean();

    return jobs.map((job) => {
      const jobLogs = logs.filter((log) => log.jobKey === job.jobKey);
      const latest = jobLogs[0] ?? null;
      const latestSuccessful = jobLogs.find((log) => log.status === "success" || log.status === "partial") ?? null;

      return {
        jobKey: job.jobKey,
        title: job.title,
        scheduleLabel: job.scheduleLabel,
        canRun: true,
        isRunning: job.isRunning(),
        lastStatus: latest?.status === "running" ? null : latest?.status ?? null,
        lastExecutionAt: toIsoString(latest?.finishedAt ?? latest?.startedAt) ?? null,
        lastSuccessfulExecutionAt: toIsoString(latestSuccessful?.finishedAt ?? latestSuccessful?.startedAt) ?? null,
        lastTrigger: latest?.trigger ?? null,
        message: latest?.message ?? "Todavia no hay ejecuciones registradas",
        headlineMetrics: latest?.metrics ?? {},
      };
    });
  }

  static async getJobDetail(jobKey: string) {
    const job = JobMonitorRegistryService.getJob(jobKey);

    if (!job) {
      throw new JobMonitorNotFoundError("El job solicitado no existe");
    }

    const [latest, latestSuccessful, history] = await Promise.all([
      ImportExecutionLog.findOne({ jobKey }).sort({ startedAt: -1 }).lean(),
      ImportExecutionLog.findOne({ jobKey, status: { $in: ["success", "partial"] } }).sort({ startedAt: -1 }).lean(),
      ImportExecutionLog.find({ jobKey }).sort({ startedAt: -1 }).limit(10).lean(),
    ]);

    return {
      jobKey: job.jobKey,
      title: job.title,
      scheduleLabel: job.scheduleLabel,
      canRun: true,
      isRunning: job.isRunning(),
      lastStatus: latest?.status === "running" ? null : latest?.status ?? null,
      lastExecutionAt: toIsoString(latest?.finishedAt ?? latest?.startedAt) ?? null,
      lastSuccessfulExecutionAt: toIsoString(latestSuccessful?.finishedAt ?? latestSuccessful?.startedAt) ?? null,
      lastTrigger: latest?.trigger ?? null,
      message: latest?.message ?? "Todavia no hay ejecuciones registradas",
      fileName: latest?.fileName ?? null,
      metrics: latest?.metrics ?? {},
      sourceSummary: latest?.sourceSummary ?? null,
      resultSummary: latest?.resultSummary ?? null,
      errorSummary: latest?.errorSummary ?? [],
      requestSample: latest?.requestSample ?? [],
      responseSample: latest?.responseSample ?? [],
      executionHistory: history.map(mapExecution),
    };
  }

  static async runJob(jobKey: string): Promise<JobExecutionResult> {
    const job = JobMonitorRegistryService.getJob(jobKey);

    if (!job) {
      throw new JobMonitorNotFoundError("El job solicitado no existe");
    }

    return job.run("manual");
  }
}
