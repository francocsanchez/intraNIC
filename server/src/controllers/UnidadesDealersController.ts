import type { Request, Response } from "express";
import { UnidadesDealersSyncAlreadyRunningError, UnidadesDealersSyncJobService } from "../services/jobs/unidadesDealersSyncJob.service";
import { UnidadesDealersService } from "../services/unidadesDealers.service";
import { logError } from "../utils/logError";

const parseYear = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 2000 ? parsed : null;
};

const handleError = (res: Response, error: unknown, context: string, fallback: string) => {
  logError(context);
  console.error(error);

  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: fallback });
};

export class UnidadesDealersController {
  static async getAvailableYears(_req: Request, res: Response) {
    try {
      const response = await UnidadesDealersService.getAvailableYears();
      return res.status(200).json(response);
    } catch (error) {
      return handleError(
        res,
        error,
        "UnidadesDealersController.getAvailableYears",
        "No se pudieron obtener los anos disponibles de Traslado Furlong",
      );
    }
  }

  static async sincronizar(_req: Request, res: Response) {
    try {
      const summary = await UnidadesDealersSyncJobService.run("manual");

      return res.status(200).json({
        message: summary.message,
        data: summary,
        total: summary.metrics.totalReceived ?? 0,
        created: summary.metrics.created ?? 0,
        updated: summary.metrics.updated ?? 0,
        errors: summary.metrics.errors ?? 0,
      });
    } catch (error) {
      if (error instanceof UnidadesDealersSyncAlreadyRunningError) {
        return res.status(409).json({ error: error.message });
      }

      return handleError(
        res,
        error,
        "UnidadesDealersController.sincronizar",
        "No se pudo sincronizar la base de unidades de dealers",
      );
    }
  }

  static async getResumen(req: Request, res: Response) {
    try {
      const year = parseYear(req.query.year);
      if (req.query.year !== undefined && req.query.year !== "" && year === null) {
        return res.status(400).json({ error: "Debes seleccionar un ano valido" });
      }

      const response = await UnidadesDealersService.getResumenPorDealerYEstado(year);
      return res.status(200).json(response);
    } catch (error) {
      return handleError(
        res,
        error,
        "UnidadesDealersController.getResumen",
        "No se pudo obtener el resumen de unidades por dealer",
      );
    }
  }

  static async getTreemap(req: Request, res: Response) {
    try {
      const year = parseYear(req.query.year);
      if (req.query.year !== undefined && req.query.year !== "" && year === null) {
        return res.status(400).json({ error: "Debes seleccionar un ano valido" });
      }

      const response = await UnidadesDealersService.getTreemapPorDealer(year);
      return res.status(200).json(response);
    } catch (error) {
      return handleError(
        res,
        error,
        "UnidadesDealersController.getTreemap",
        "No se pudo obtener el resumen del treemap por dealer",
      );
    }
  }
}
