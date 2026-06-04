import type { Request, Response } from "express";
import { UnidadesDealersService } from "../services/unidadesDealers.service";
import { logError } from "../utils/logError";

const handleError = (res: Response, error: unknown, context: string, fallback: string) => {
  logError(context);
  console.error(error);

  if (error instanceof Error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: fallback });
};

export class UnidadesDealersController {
  static async sincronizar(_req: Request, res: Response) {
    try {
      const summary = await UnidadesDealersService.syncFromSource();

      return res.status(200).json({
        message: "Sincronizacion finalizada correctamente",
        ...summary,
      });
    } catch (error) {
      return handleError(
        res,
        error,
        "UnidadesDealersController.sincronizar",
        "No se pudo sincronizar la base de unidades de dealers",
      );
    }
  }

  static async getResumen(_req: Request, res: Response) {
    try {
      const response = await UnidadesDealersService.getResumenPorDealerYEstado();
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

  static async getTreemap(_req: Request, res: Response) {
    try {
      const response = await UnidadesDealersService.getTreemapPorDealer();
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
