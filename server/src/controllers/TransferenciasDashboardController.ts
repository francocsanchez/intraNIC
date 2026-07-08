import type { Request, Response } from "express";
import { TransferenciasDashboardService } from "../services/transferenciasDashboard.service";
import { logError } from "../utils/logError";

const parseYear = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 2000 ? parsed : null;
};

const parsePositiveInteger = (value: unknown, fallback: number) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const handleDashboardRequest = async (
  res: Response,
  action: () => Promise<unknown>,
  context: string,
) => {
  try {
    const response = await action();
    return res.status(200).json(response);
  } catch (error) {
    logError(context);
    console.error(error);

    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: "No se pudo obtener la informacion del dashboard de transferencias" });
  }
};

export class TransferenciasDashboardController {
  static getAvailableYears(_req: Request, res: Response) {
    return handleDashboardRequest(
      res,
      () => TransferenciasDashboardService.getAvailableYears(),
      "TransferenciasDashboardController.getAvailableYears",
    );
  }

  static getGeneralZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const page = parsePositiveInteger(req.query.page, 1);
    const pageSize = parsePositiveInteger(req.query.pageSize, 15);

    if (!year) {
      return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    }

    return handleDashboardRequest(
      res,
      () => TransferenciasDashboardService.getGeneralZonaNic(year, page, pageSize),
      "TransferenciasDashboardController.getGeneralZonaNic",
    );
  }
}
