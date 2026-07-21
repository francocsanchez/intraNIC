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

const parseStrictPositiveInt = (value: unknown) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export class OperacionesController {
  static getDashboard = async (req: Request, res: Response) => {
    const anios = parseNumericList(req.query.anios);

    if (!anios.length) {
      return res.status(400).json({ message: "Debes seleccionar al menos un ano" });
    }

    const meses = parseNumericList(req.query.meses).filter((mes) => mes >= 1 && mes <= 12);
    const dias = parseNumericList(req.query.dias).filter((dia) => dia >= 1 && dia <= 31);
    const sucursales = parseStringList(req.query.sucursales);
    const modelos = parseStringList(req.query.modelos);

    try {
      const response = await OperacionesDashboardService.getDashboard({
        anios,
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

  static getAnalisisPreventa = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);
    const mes = parseStrictPositiveInt(req.query.mes);

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({ message: "El parametro mes es obligatorio y debe estar entre 1 y 12" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventa({
        anio,
        mes,
        tipo: "Cero",
      });

      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventa");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventaFormaPago = async (req: Request, res: Response) => {
    const numero = parsePositiveInt(req.params.numero);

    if (!numero) {
      return res.status(400).json({ message: "El numero de operacion es obligatorio y debe ser un entero valido" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventaFormaPago(numero);

      if (!response) {
        return res.status(404).json({ message: "No se encontro la forma de pago para la operacion solicitada" });
      }

      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventaFormaPago");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisPreventaDescuentoMensual = async (req: Request, res: Response) => {
    const anio = parseStrictPositiveInt(req.query.anio);

    if (!anio) {
      return res.status(400).json({ message: "El parametro anio es obligatorio y debe ser un entero valido" });
    }

    try {
      const response = await OperacionesDashboardService.getAnalisisPreventaDescuentoMensual(anio);
      return res.status(200).json(response);
    } catch (error) {
      logError("OperacionesController.getAnalisisPreventaDescuentoMensual");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
