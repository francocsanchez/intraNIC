import { PatentamientosImportService } from "../patentamientosImport.service";
import {
  getFacturasAnticipoJobKey,
  getFacturasAnticipoJobName,
  getFacturasAnticipoScheduleLabel,
  isFacturasAnticipoJobRunning,
  runFacturasAnticipoJob,
} from "../facturasAnticipoCron.service";
import { UnidadesDealersService } from "../unidadesDealers.service";
import { UnidadesDealersSyncJobService } from "./unidadesDealersSyncJob.service";
import type { JobMonitorCatalogItem } from "./jobMonitor.types";

const JOB_CATALOG: JobMonitorCatalogItem[] = [
  {
    jobKey: PatentamientosImportService.getJobKey(),
    title: "Importacion de patentamientos",
    scheduleLabel: PatentamientosImportService.getScheduleLabel(),
    jobName: PatentamientosImportService.getJobName(),
    sourceType: "sftp",
    sourcePath: String(process.env.SFTP_REMOTE_PATH ?? "").trim(),
    isRunning: () => PatentamientosImportService.isImportRunning(),
    run: (trigger) => PatentamientosImportService.importLatestFile(trigger),
  },
  {
    jobKey: UnidadesDealersSyncJobService.getJobKey(),
    title: "Sincronizacion unidades dealers",
    scheduleLabel: UnidadesDealersSyncJobService.getScheduleLabel(),
    jobName: UnidadesDealersSyncJobService.getJobName(),
    sourceType: "http",
    sourcePath: UnidadesDealersService.getSourceUrl(),
    isRunning: () => UnidadesDealersSyncJobService.isJobRunning(),
    run: (trigger) => UnidadesDealersSyncJobService.run(trigger),
  },
  {
    jobKey: getFacturasAnticipoJobKey(),
    title: "Facturas anticipo",
    scheduleLabel: getFacturasAnticipoScheduleLabel(),
    jobName: getFacturasAnticipoJobName(),
    sourceType: "database",
    sourcePath: "OperacionFacturaAnticipo",
    isRunning: () => isFacturasAnticipoJobRunning(),
    run: (trigger) => runFacturasAnticipoJob(trigger),
  },
];

export class JobMonitorRegistryService {
  static listJobs() {
    return JOB_CATALOG;
  }

  static getJob(jobKey: string) {
    return JOB_CATALOG.find((job) => job.jobKey === jobKey) ?? null;
  }
}
