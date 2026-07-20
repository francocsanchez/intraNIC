import { PatentamientosImportService } from "../patentamientosImport.service";
import {
  getAgendaEntregaEnvioJobKey,
  getAgendaEntregaEnvioJobName,
  getAgendaEntregaEnvioScheduleLabel,
  isAgendaEntregaEnvioJobRunning,
  runAgendaEntregaEnvioJob,
} from "../agendaEntregaEnvioCron.service";
import {
  getFacturasAnticipoJobKey,
  getFacturasAnticipoJobName,
  getFacturasAnticipoScheduleLabel,
  isFacturasAnticipoJobRunning,
  runFacturasAnticipoJob,
} from "../facturasAnticipoCron.service";
import {
  getFsanchezCleanupJobKey,
  getFsanchezCleanupJobName,
  getFsanchezCleanupScheduleLabel,
  isFsanchezCleanupJobRunning,
  runFsanchezCleanupJob,
} from "../fsanchezCleanupCron.service";
import { TransferenciasImportService } from "../transferenciasImport.service";
import { UnidadesDealersService } from "../unidadesDealers.service";
import { UnidadesDealersSyncJobService } from "./unidadesDealersSyncJob.service";
import type { JobMonitorCatalogItem } from "./jobMonitor.types";

const JOB_CATALOG: JobMonitorCatalogItem[] = [
  {
    jobKey: getAgendaEntregaEnvioJobKey(),
    title: "Envio agenda de entrega",
    scheduleLabel: getAgendaEntregaEnvioScheduleLabel(),
    jobName: getAgendaEntregaEnvioJobName(),
    sourceType: "internal",
    sourcePath: "AgendaEntrega",
    isRunning: () => isAgendaEntregaEnvioJobRunning(),
    run: (trigger) => runAgendaEntregaEnvioJob(trigger),
  },
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
    jobKey: TransferenciasImportService.getJobKey(),
    title: "Importacion de transferencias",
    scheduleLabel: TransferenciasImportService.getScheduleLabel(),
    jobName: TransferenciasImportService.getJobName(),
    sourceType: "sftp",
    sourcePath: String(process.env.SFTP_REMOTE_PATH ?? "").trim(),
    isRunning: () => TransferenciasImportService.isImportRunning(),
    run: (trigger) => TransferenciasImportService.importLatestFile(trigger),
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
  {
    jobKey: getFsanchezCleanupJobKey(),
    title: "Limpieza FSANCHEZ",
    scheduleLabel: getFsanchezCleanupScheduleLabel(),
    jobName: getFsanchezCleanupJobName(),
    sourceType: "database",
    sourcePath: "fsanchez_operaciones_estado",
    isRunning: () => isFsanchezCleanupJobRunning(),
    run: (trigger) => runFsanchezCleanupJob(trigger),
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
