import type { Request, Response } from "express";
import Configuration from "../models/Config";

import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";

import { logError } from "../utils/logError";

import { StockRow } from "../utils/reportUnidadesConvencional";
import { buildResumenListaDeEspera, ListaEsperaRow } from "../utils/reportOperacionesConvencional";
import { buildResumenMisOperaciones, MisOperacionRow } from "../utils/reportMisOperacionesConvencional";
import {
  listaDeEsperaUsadoQuery,
  miListaDeEsperaUsadoQuery,
  misReservasUsadoQuery,
  stockUsadoQuery,
  misOperacionesQuery,
  reservasUsadoQuery,
  stockUsadoIngreso
} from "./querys/usados.query";
import { buildReportePorMarca, UnidadRow } from "../utils/reportUnidadesPorMarca";

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

export class UsadosController {
  static stockDisponible = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial" });
      }

      const vendedoresDisponibleUsados = normalizeNumericList(config.vendedoresDisponibleUsados);

      if (!vendedoresDisponibleUsados.length) {
        return res.status(200).json({ data: [], resumen: buildReportePorMarca([]) });
      }

      const data = await sequelizeNIC.query<UnidadRow>(stockUsadoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresDisponibleUsados },
      });

      const resumen = buildReportePorMarca(data);

      return res.status(200).json({ data,resumen });
    } catch (error) {
      logError("UsadosController.stockDisponible");
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

      const vendedoresStockGuardadoUsados = normalizeNumericList(config.vendedoresStockGuardadoUsados);

      if (!vendedoresStockGuardadoUsados.length) {
        return res.status(200).json({ data: [], resumen: buildReportePorMarca([]) });
      }

      const data = await sequelizeNIC.query<UnidadRow>(stockUsadoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresStockGuardadoUsados },
      });

      const resumen = buildReportePorMarca(data);

      return res.status(200).json({ data,resumen });
    } catch (error) {
      logError("UsadosController.stockDisponible");
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

      const vendedoresReservasUsados = normalizeNumericList(config.vendedoresReservasUsados);

      if (!vendedoresReservasUsados.length) {
        return res.status(200).json({
          data: {},
          resumen: {
            total: 0,
            sucursales: {},
          },
        });
      }

      const data = await sequelizeNIC.query<StockRow>(reservasUsadoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresReservasUsados },
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
      logError("UsadosController.stockReservado");
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

      const query = misReservasUsadoQuery();
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
        replacements: { numeroVendedor },
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("UsadosController.misReservas");
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

      const query = miListaDeEsperaUsadoQuery();
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
        replacements: { numeroVendedor },
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("UsadosController.misReservas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static listaDeEspera = async (req: Request, res: Response) => {
    try {
      const query = listaDeEsperaUsadoQuery();

      const data = await sequelizeNIC.query<ListaEsperaRow>(query, {
        type: QueryTypes.SELECT,
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("UsadosController.listaDeEspera");
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
      logError("UsadosController.misOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

    static stockIngreso = async (_req: Request, res: Response) => {
     try {
     
      const data = await sequelizeNIC.query<UnidadRow>(stockUsadoIngreso(), { type: QueryTypes.SELECT });

      const resumen = buildReportePorMarca(data);

      return res.status(200).json({ data,resumen });
    } catch (error) {
      logError("UsadosController.stockIngreso");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
