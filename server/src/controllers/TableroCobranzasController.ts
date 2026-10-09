import type { Request, Response } from "express";
import { TableroCobranzasService } from "../services/tableroCobranzas.service";
import { logError } from "../utils/logError";

const parseInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

export class TableroCobranzasController {
  static getDiario = async (req: Request, res: Response) => {
    const anio = parseInteger(req.query.anio);
    const mes = parseInteger(req.query.mes);

    if (!anio || anio < 2000 || anio > 2100 || !mes || mes < 1 || mes > 12) {
      return res.status(400).json({ message: "Ingresar un año y mes válidos." });
    }

    try {
      const data = await TableroCobranzasService.getDiario(anio, mes);
      return res.status(200).json({ data });
    } catch (error) {
      logError("TableroCobranzasController.getDiario");
      console.error(error);
      return res.status(500).json({ message: "No se pudo obtener la cobranza diaria." });
    }
  };

  static getDetalleDiario = async (req: Request, res: Response) => {
    const anio = parseInteger(req.query.anio);
    const mes = parseInteger(req.query.mes);
    const dia = parseInteger(req.query.dia);

    if (!anio || anio < 2000 || anio > 2100 || !mes || mes < 1 || mes > 12 || !dia || dia < 1 || dia > 31) {
      return res.status(400).json({ message: "Ingresar un año, mes y día válidos." });
    }

    try {
      const data = await TableroCobranzasService.getDetalleDiario(anio, mes, dia);
      return res.status(200).json({ data });
    } catch (error) {
      logError("TableroCobranzasController.getDetalleDiario");
      console.error(error);
      return res.status(500).json({ message: "No se pudo obtener el detalle diario de cobranzas." });
    }
  };
}
