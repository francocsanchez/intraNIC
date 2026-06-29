import type {
  IImportExecutionErrorDetail,
  IJobMonitorSummaryBlock,
  JobMonitorMetrics,
  ImportExecutionStatus,
} from "../../models/ImportExecutionLog";

export type JobMonitorTrigger = "cron" | "manual";

export type JobMonitorStatus = Exclude<ImportExecutionStatus, "running">;

export type JobExecutionResult = {
  status: JobMonitorStatus;
  fileName: string | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  message: string;
  errorSummary: string[];
  errorDetailsSample?: IImportExecutionErrorDetail[];
  metrics: JobMonitorMetrics;
  sourceSummary: IJobMonitorSummaryBlock | null;
  resultSummary: IJobMonitorSummaryBlock | null;
  requestSample: unknown[];
  responseSample: unknown[];
};

export type JobMonitorCatalogItem = {
  jobKey: string;
  title: string;
  scheduleLabel: string;
  jobName: string;
  sourceType: "sftp" | "http" | "database" | "internal";
  sourcePath: string;
  isRunning: () => boolean;
  run: (trigger: JobMonitorTrigger) => Promise<JobExecutionResult>;
};
