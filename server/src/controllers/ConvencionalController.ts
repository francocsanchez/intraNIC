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
} from "./querys/convencional.query";

import { buildResumen, StockRow } from "../utils/reportUnidadesConvencional";
import { buildResumenListaDeEspera, ListaEsperaRow } from "../utils/reportOperacionesConvencional";

export class ConvencionalController {
  static stockDisponible = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res
          .status(404)
          .json({ message: "No existe configuración inicial" });
      }

      const vendedoresDisponibleConvencional =
        config.vendedoresDisponibleConvencional ?? [];

      const data = await sequelizeNIC.query<StockRow>(
        stockConvencionalQuery(vendedoresDisponibleConvencional),
        { type: QueryTypes.SELECT },
      );

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
        return res
          .status(404)
          .json({ message: "No existe configuración inicial" });
      }

      const vendedoresStockGuardadoConvencional =
        config.vendedoresStockGuardadoConvencional ?? [];

      const data = await sequelizeNIC.query<StockRow>(
        stockConvencionalQuery(vendedoresStockGuardadoConvencional),
        { type: QueryTypes.SELECT },
      );

      const resumen = buildResumen(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.stockGuardado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockReservado = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res
          .status(404)
          .json({ message: "No existe configuración inicial" });
      }

      const vendedoresReservasConvencional =
        config.vendedoresReservasConvencional ?? [];

      const data = await sequelizeNIC.query<StockRow>(
        reservasConvencionalQuery(vendedoresReservasConvencional),
        { type: QueryTypes.SELECT },
      );

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
      const { numeroVendedor } = req.params;

      const query = misReservasConvencionalQuery(Number(numeroVendedor));
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("ConvencionalController.misReservas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static miListaDeEspera = async (req: Request, res: Response) => {
    try {
      const { numeroVendedor } = req.params;

      const query = miListaDeEsperaConvencionalQuery(Number(numeroVendedor));
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("ConvencionalController.misReservas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static listaDeEspera = async (_req: Request, res: Response) => {
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

}
