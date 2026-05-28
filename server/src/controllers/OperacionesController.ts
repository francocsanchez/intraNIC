import type { Request, Response } from "express";
import { OperacionesDashboardService } from "../services/operacionesDashboard.service";
import { logError } from "../utils/logError";

const parsePositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseStringList = (value: unknown) => {
  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseNumericList = (value: unknown) =>
  parseStringList(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

export class OperacionesController {
  static getDashboard = async (req: Request, res: Response) => {
    const anio = parsePositiveInt(req.query.anio);

    if (!anio) {
      return res.status(400).json({ message: "Ano no valido" });
    }

    const meses = parseNumericList(req.query.meses).filter((mes) => mes >= 1 && mes <= 12);
    const dias = parseNumericList(req.query.dias).filter((dia) => dia >= 1 && dia <= 31);
    const sucursales = parseStringList(req.query.sucursales);
    const modelos = parseStringList(req.query.modelos);

    try {
      const response = await OperacionesDashboardService.getDashboard({
        anio,
        meses,
        sucursales,
        modelos,
        dias,
      });

      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getDashboard");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
