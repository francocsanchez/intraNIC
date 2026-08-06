import type { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import Configuration from "../models/Config";
import { sequelizeNIC } from "../config/database";
import { logError } from "../utils/logError";
import { buildReportePorMarca, type UnidadRow } from "../utils/reportUnidadesPorMarca";
import { stockUsadoQuery } from "./querys/usados.query";

const normalizeNumericList = (values: unknown): number[] => {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
};

export class BelgranoController {
  static stockDisponible = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuraciÃ³n inicial" });
      }

      const vendedores = normalizeNumericList(config.vendedoresDisponibleBelgrano);

      if (!vendedores.length) {
        return res.status(200).json({
          data: [],
          resumen: buildReportePorMarca([]),
        });
      }

      const data = await sequelizeNIC.query<UnidadRow>(stockUsadoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores },
      });

      return res.status(200).json({
        data,
        resumen: buildReportePorMarca(data),
      });
    } catch (error) {
      logError("BelgranoController.stockDisponible");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
