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

export class UsadosController {
  static stockDisponible = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuración inicial" });
      }

      const vendedoresDisponibleUsados = config.vendedoresDisponibleUsados ?? [];

      const data = await sequelizeNIC.query<UnidadRow>(stockUsadoQuery(vendedoresDisponibleUsados), { type: QueryTypes.SELECT });

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

      const vendedoresStockGuardadoUsados = config.vendedoresStockGuardadoUsados ?? [];

      const data = await sequelizeNIC.query<UnidadRow>(stockUsadoQuery(vendedoresStockGuardadoUsados), { type: QueryTypes.SELECT });

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

      const vendedoresReservasUsados = config.vendedoresReservasUsados ?? [];

      const data = await sequelizeNIC.query<StockRow>(reservasUsadoQuery(vendedoresReservasUsados), { type: QueryTypes.SELECT });

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

      const query = misReservasUsadoQuery(Number(numberSaleNic));
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
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
      const query = miListaDeEsperaUsadoQuery(Number(req.user.numberSaleNic));
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
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

    try {
      const query = misOperacionesQuery(Number(mes), Number(ano), Number(req.user.numberSaleNic));

      const data = await sequelizeNIC.query<MisOperacionRow>(query, {
        type: QueryTypes.SELECT,
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
