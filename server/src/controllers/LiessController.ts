import type { Request, Response } from "express";

import { QueryTypes } from "sequelize";
import { sequelizeLIESS } from "../config/database";

import { logError } from "../utils/logError";
import Configuration from "../models/Config";
import LiessStockUsadoAccionModel, { liessStockUsadoAcciones, type LiessStockUsadoAccion } from "../models/LiessStockUsadoAccion";
import { hasSuperAdminRole, normalizeRoles } from "../constants/roleAccess";
import { stockLiessQuery, stockLiessUsadoByInternoQuery, StockLiessRow } from "./querys/liess.query";
import { buildResumenLiess } from "../utils/reportUnidadesLiess";

type StockLiessRowConAccion = StockLiessRow & { accion: LiessStockUsadoAccion };

const isVendedorSinGestion = (roles: unknown) => {
  const normalizedRoles = normalizeRoles(roles);
  return normalizedRoles.includes("vendedor")
    && !hasSuperAdminRole(roles)
    && !normalizedRoles.includes("supervisor")
    && !normalizedRoles.includes("gerente");
};

export class LieesController {
  static stockDisponible = async (req: Request, res: Response) => {
    const { tipo } = req.params;
    let tipoFiltro = tipo === "nuevos" ? 5 : 10;
    
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial" });
      }

      const rows = await sequelizeLIESS.query<StockLiessRow>(stockLiessQuery(Number(tipoFiltro)), {
        type: QueryTypes.SELECT,
      });

      const acciones = tipoFiltro === 10
        ? await LiessStockUsadoAccionModel.find({ interno: { $in: rows.map((row) => row.interno) } }).lean()
        : [];
      const accionesPorInterno = new Map(acciones.map((item) => [item.interno, item.accion]));
      const data: StockLiessRowConAccion[] = rows.map((row) => ({
        ...row,
        accion: accionesPorInterno.get(row.interno) ?? "OK",
      }));
      const dataVisible = tipoFiltro === 10 && isVendedorSinGestion(req.user?.role)
        ? data.filter((row) => row.accion === "OK")
        : data;

      const resumen = buildResumenLiess(dataVisible);

      return res.status(200).json({ data: dataVisible, resumen });
    } catch (error) {
      logError("LieesController.stockDisponible");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static actualizarAccionUsado = async (req: Request, res: Response) => {
    const interno = Number(req.params.interno);
    const accion = typeof req.body?.accion === "string" ? req.body.accion.trim() : "";

    if (!Number.isInteger(interno) || interno <= 0) {
      return res.status(400).json({ error: "El interno no es válido" });
    }
    if (!liessStockUsadoAcciones.includes(accion as LiessStockUsadoAccion)) {
      return res.status(400).json({ error: "Seleccioná una acción válida" });
    }

    try {
      const unidad = await sequelizeLIESS.query<{ interno: number }>(stockLiessUsadoByInternoQuery(), {
        replacements: { interno },
        type: QueryTypes.SELECT,
      });
      if (!unidad.length) {
        return res.status(404).json({ error: "No se encontró una unidad usada LIESS disponible para ese interno" });
      }

      const item = await LiessStockUsadoAccionModel.findOneAndUpdate(
        { interno },
        { accion },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).lean();
      return res.status(200).json({
        message: "Acción actualizada correctamente",
        data: { interno: item!.interno, accion: item!.accion },
      });
    } catch (error) {
      logError("LieesController.actualizarAccionUsado");
      console.error(error);
      return res.status(500).json({ message: "No se pudo actualizar la acción" });
    }
  };
}
