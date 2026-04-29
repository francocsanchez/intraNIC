import type { Request, Response } from "express";
import Configuration from "../models/Config";

import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";

import { logError } from "../utils/logError";

import {
  miListaDeEsperaConvencionalQuery,
  misReservasConvencionalQuery,
  reservasConvencionalQuery,
  stockConvencionalQuery,
  listaDeEsperaConvencionalQuery,
  misOperacionesQuery,
  operacionesConvencional,
  operacionesConvencionalRanking,
  stockReventaQuery,
} from "./querys/convencional.query";

import { buildResumen, StockRow } from "../utils/reportUnidadesConvencional";
import { buildResumenListaDeEspera, ListaEsperaRow } from "../utils/reportOperacionesConvencional";
import { buildResumenMisOperaciones, MisOperacionRow } from "../utils/reportMisOperacionesConvencional";
import { buildReportePromedioOperaciones, PromedioOperacionRow } from "../utils/reportPromedioOperacionesConvencional";
import { buildReporteRankingOperaciones, RankingOperacionRow } from "../utils/reportRankingOperacionesConvencional";

const normalizeNumericList = (values: unknown): number[] => {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
};

const parsePositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseMonth = (value: unknown) => {
  const parsed = parsePositiveInt(value);
  return parsed && parsed <= 12 ? parsed : null;
};

export class ConvencionalController {
  static stockDisponible = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial" });
      }

      const vendedoresDisponibleConvencional = normalizeNumericList(config.vendedoresDisponibleConvencional);

      if (!vendedoresDisponibleConvencional.length) {
        return res.status(200).json({ data: [], resumen: buildResumen([]) });
      }

      const data = await sequelizeNIC.query<StockRow>(stockConvencionalQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresDisponibleConvencional },
      });

      const resumen = buildResumen(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.stockDisponible");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockGuardado = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial" });
      }

      const vendedoresStockGuardadoConvencional = normalizeNumericList(config.vendedoresStockGuardadoConvencional);

      if (!vendedoresStockGuardadoConvencional.length) {
        return res.status(200).json({ data: [], resumen: buildResumen([]) });
      }

      const data = await sequelizeNIC.query<StockRow>(stockConvencionalQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresStockGuardadoConvencional },
      });

      const resumen = buildResumen(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.stockGuardado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockReventa = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuraciÃ³n inicial" });
      }

      const vendedorReventasConvencional = normalizeNumericList(config.vendedorReventasConvencional);

      if (!vendedorReventasConvencional.length) {
        return res.status(200).json({ data: [], resumen: buildResumen([]) });
      }

      const data = await sequelizeNIC.query<StockRow>(stockReventaQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedorReventasConvencional },
      });

      const resumen = buildResumen(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.stockReventa");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockReservado = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial" });
      }

      const vendedoresReservasConvencional = normalizeNumericList(config.vendedoresReservasConvencional);

      if (!vendedoresReservasConvencional.length) {
        return res.status(200).json({
          data: {},
          resumen: {
            total: 0,
            sucursales: {},
          },
        });
      }

      const data = await sequelizeNIC.query<StockRow>(reservasConvencionalQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresReservasConvencional },
      });

      const resumenPorSucursal: Record<string, number> = {};
      const tablasPorSucursal: Record<string, StockRow[]> = {};

      for (const row of data) {
        const sucursal = row.sucursal ?? "SIN ASIGNAR";

        if (!resumenPorSucursal[sucursal]) {
          resumenPorSucursal[sucursal] = 0;
        }

        if (!tablasPorSucursal[sucursal]) {
          tablasPorSucursal[sucursal] = [];
        }

        resumenPorSucursal[sucursal] += 1;
        tablasPorSucursal[sucursal].push(row);
      }

      return res.status(200).json({
        data: tablasPorSucursal,
        resumen: {
          total: data.length,
          sucursales: resumenPorSucursal,
        },
      });
    } catch (error) {
      logError("ConvencionalController.stockReservado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static misReservas = async (req: Request, res: Response) => {
    try {
      const { numberSaleNic } = req.user;
      const numeroVendedor = parsePositiveInt(numberSaleNic);

      if (!numeroVendedor) {
        return res.status(400).json({ message: "Numero de vendedor no valido" });
      }

      const query = misReservasConvencionalQuery();
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
        replacements: { numeroVendedor },
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.misReservas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static miListaDeEspera = async (req: Request, res: Response) => {
    try {
      const numeroVendedor = parsePositiveInt(req.user.numberSaleNic);

      if (!numeroVendedor) {
        return res.status(400).json({ message: "Numero de vendedor no valido" });
      }

      const query = miListaDeEsperaConvencionalQuery();
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
        replacements: { numeroVendedor },
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.misReservas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static listaDeEspera = async (req: Request, res: Response) => {
    try {
      const query = listaDeEsperaConvencionalQuery();

      const data = await sequelizeNIC.query<ListaEsperaRow>(query, {
        type: QueryTypes.SELECT,
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.listaDeEspera");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static misOperaciones = async (req: Request, res: Response) => {
    const { mes, ano } = req.params;
    const mesNumber = parseMonth(mes);
    const anoNumber = parsePositiveInt(ano);

    if (!mesNumber || !anoNumber) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    const numberSaleNic = parsePositiveInt(req.user.numberSaleNic);

    if (!numberSaleNic) {
      return res.status(400).json({ message: "Numero de vendedor no valido" });
    }

    try {
      const query = misOperacionesQuery();

      const data = await sequelizeNIC.query<MisOperacionRow>(query, {
        type: QueryTypes.SELECT,
        replacements: { mes: mesNumber, ano: anoNumber, numberSaleNic },
      });

      const resumen = buildResumenMisOperaciones(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.misOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static promedioOperaciones = async (req: Request, res: Response) => {
    const { mes, ano } = req.params;
    const mesNumber = parseMonth(mes);
    const anoNumber = parsePositiveInt(ano);

    if (!mesNumber || !anoNumber) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    try {
      const query = operacionesConvencional();

      const data = await sequelizeNIC.query<PromedioOperacionRow>(query, {
        type: QueryTypes.SELECT,
        replacements: { mes: mesNumber, ano: anoNumber },
      });

      const resumen = buildReportePromedioOperaciones(data, mesNumber, anoNumber);

      return res.status(200).json({ resumen });
    } catch (error) {
      logError("ConvencionalController.promedioOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

   static rankingOperaciones = async (req: Request, res: Response) => {
    const { ano } = req.params;
    const anoNumber = parsePositiveInt(ano);

    if (!anoNumber) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    try {
      const query = operacionesConvencionalRanking();

      const data = await sequelizeNIC.query<RankingOperacionRow>(query, {
        type: QueryTypes.SELECT,
        replacements: { ano: anoNumber },
      });

      const resumen = buildReporteRankingOperaciones(data, anoNumber);

      return res.status(200).json({ resumen });
    } catch (error) {
      logError("ConvencionalController.rankingOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
