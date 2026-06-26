import type { Request, Response } from "express";
import { PatentamientosDashboardService } from "../services/patentamientosDashboard.service";
import { logError } from "../utils/logError";

const parseYear = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 2000 ? parsed : null;
};

const parsePlanFilter = (value: unknown) => {
  const normalized = String(value ?? "with-plan").trim().toLowerCase();
  return normalized === "without-plan" ? "without-plan" : "with-plan";
};

const parseMonth = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
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

    return res.status(500).json({ error: "No se pudo obtener la informacion del dashboard de patentamientos" });
  }
};

export class PatentamientosDashboardController {
  static getAvailableYears(_req: Request, res: Response) {
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getAvailableYears(),
      "PatentamientosDashboardController.getAvailableYears",
    );
  }

  static getTopMarcasPais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getTopMarcasPais(year, planFilter),
      "PatentamientosDashboardController.getTopMarcasPais",
    );
  }

  static getTopMarcasZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getTopMarcasZonaNic(year, planFilter),
      "PatentamientosDashboardController.getTopMarcasZonaNic",
    );
  }

  static getSegmentoPickupPais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoPickupPais(year, planFilter),
      "PatentamientosDashboardController.getSegmentoPickupPais",
    );
  }

  static getSegmentoPickupZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoPickupZonaNic(year, planFilter),
      "PatentamientosDashboardController.getSegmentoPickupZonaNic",
    );
  }

  static getSegmentoSw4Pais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoSw4Pais(year, planFilter),
      "PatentamientosDashboardController.getSegmentoSw4Pais",
    );
  }

  static getSegmentoSw4ZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoSw4ZonaNic(year, planFilter),
      "PatentamientosDashboardController.getSegmentoSw4ZonaNic",
    );
  }

  static getSegmentoCCrossPais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoCCrossPais(year, planFilter),
      "PatentamientosDashboardController.getSegmentoCCrossPais",
    );
  }

  static getSegmentoCCrossZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoCCrossZonaNic(year, planFilter),
      "PatentamientosDashboardController.getSegmentoCCrossZonaNic",
    );
  }

  static getSegmentoYarisPais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoYarisPais(year, planFilter),
      "PatentamientosDashboardController.getSegmentoYarisPais",
    );
  }

  static getSegmentoYarisZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoYarisZonaNic(year, planFilter),
      "PatentamientosDashboardController.getSegmentoYarisZonaNic",
    );
  }

  static getSegmentoYCrossPais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoYCrossPais(year, planFilter),
      "PatentamientosDashboardController.getSegmentoYCrossPais",
    );
  }

  static getSegmentoYCrossZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoYCrossZonaNic(year, planFilter),
      "PatentamientosDashboardController.getSegmentoYCrossZonaNic",
    );
  }

  static getToyotaEvolution(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const planFilter = parsePlanFilter(req.query.planFilter);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getToyotaEvolution(year, planFilter),
      "PatentamientosDashboardController.getToyotaEvolution",
    );
  }

  static getGeneralZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    const month = parseMonth(req.query.month);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    if (req.query.month !== undefined && req.query.month !== "" && month === null) {
      return res.status(400).json({ error: "Debes seleccionar un mes valido" });
    }
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getGeneralZonaNic(year, month),
      "PatentamientosDashboardController.getGeneralZonaNic",
    );
  }
}
