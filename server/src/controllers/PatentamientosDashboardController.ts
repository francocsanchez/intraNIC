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
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoPickupPais(year),
      "PatentamientosDashboardController.getSegmentoPickupPais",
    );
  }

  static getSegmentoPickupZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoPickupZonaNic(year),
      "PatentamientosDashboardController.getSegmentoPickupZonaNic",
    );
  }

  static getSegmentoSuvPais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoSuvPais(year),
      "PatentamientosDashboardController.getSegmentoSuvPais",
    );
  }

  static getSegmentoSuvZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoSuvZonaNic(year),
      "PatentamientosDashboardController.getSegmentoSuvZonaNic",
    );
  }

  static getSegmentoBSuvPais(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoBSuvPais(year),
      "PatentamientosDashboardController.getSegmentoBSuvPais",
    );
  }

  static getSegmentoBSuvZonaNic(req: Request, res: Response) {
    const year = parseYear(req.query.year);
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getSegmentoBSuvZonaNic(year),
      "PatentamientosDashboardController.getSegmentoBSuvZonaNic",
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
    if (!year) return res.status(400).json({ error: "Debes seleccionar un ano valido" });
    return handleDashboardRequest(
      res,
      () => PatentamientosDashboardService.getGeneralZonaNic(year),
      "PatentamientosDashboardController.getGeneralZonaNic",
    );
  }
}
