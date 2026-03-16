import type { Request, Response } from "express";

import { QueryTypes } from "sequelize";
import { sequelizeLIESS } from "../config/database";

import { logError } from "../utils/logError";
import Configuration from "../models/Config";
import { stockLiessQuery, StockLiessRow } from "./querys/liess.query";
import { buildResumenLiess } from "../utils/reportUnidadesLiess";

export class LieesController {
  static stockDisponible = async (req: Request, res: Response) => {
    const { tipo } = req.params;
    let tipoFiltro = tipo === "nuevos" ? 5 : 10;
    
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial" });
      }

      const data = await sequelizeLIESS.query<StockLiessRow>(stockLiessQuery(Number(tipoFiltro)), {
        type: QueryTypes.SELECT,
      });

      const resumen = buildResumenLiess(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("LieesController.stockDisponible");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
