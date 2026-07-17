import type { Request, Response } from "express";
import { AgendaEntregaEnvioAlreadyRunningError } from "../services/agendaEntregaEnvioCron.service";
import { FacturasAnticipoAlreadyRunningError } from "../services/facturasAnticipoCron.service";
import { JobMonitorNotFoundError, JobMonitorService } from "../services/jobs/jobMonitor.service";
import { UnidadesDealersSyncAlreadyRunningError } from "../services/jobs/unidadesDealersSyncJob.service";
import { PatentamientosImportAlreadyRunningError } from "../services/patentamientosImport.service";
import { TransferenciasImportAlreadyRunningError } from "../services/transferenciasImport.service";
import { logError } from "../utils/logError";

const handleError = (res: Response, context: string, error: unknown, fallback: string) => {
  logError(context);
  console.error(error);

  if (
    error instanceof AgendaEntregaEnvioAlreadyRunningError
    || error instanceof PatentamientosImportAlreadyRunningError
    || error instanceof TransferenciasImportAlreadyRunningError
    || error instanceof UnidadesDealersSyncAlreadyRunningError
    || error instanceof FacturasAnticipoAlreadyRunningError
  ) {
    return res.status(409).json({ error: error.message });
  }

  if (error instanceof JobMonitorNotFoundError) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof Error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(500).json({ error: fallback });
};

export class JobMonitorController {
  static async list(_req: Request, res: Response) {
    try {
      const data = await JobMonitorService.listJobs();
      return res.status(200).json({ data });
    } catch (error) {
      return handleError(res, "JobMonitorController.list", error, "No se pudo obtener el listado de jobs");
    }
  }

  static async getByKey(req: Request, res: Response) {
    try {
      const data = await JobMonitorService.getJobDetail(String(req.params.jobKey));
      return res.status(200).json({ data });
    } catch (error) {
      return handleError(res, "JobMonitorController.getByKey", error, "No se pudo obtener el detalle del job");
    }
  }

  static async run(req: Request, res: Response) {
    try {
      const data = await JobMonitorService.runJob(String(req.params.jobKey));
      return res.status(200).json({
        data,
        message: data.message,
      });
    } catch (error) {
      return handleError(res, "JobMonitorController.run", error, "No se pudo ejecutar el job");
    }
  }
}
