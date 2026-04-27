import { Response, Request } from "express";
import { sequelizeLIESS, sequelizeNIC } from "../config/database";
import { getAsignacionRecepcion, getControlUnidades, getFacturaReventasNic, getStockConsolidadoNic, getVendedoresActivosNic, getVendedoresNic } from "./querys/dms.query";
import { QueryTypes } from "sequelize";
import { logError } from "../utils/logError";
import { getReporteAsignacionRecepcion } from "../utils/reporteAsignacionRecepcion";
import { buildResumenLiessMarca, buildResumenStockConsolidado } from "../utils/reportStockConsolidado";
import { getStockConsolidadoLiess } from "./querys/liess.query";
import { buildResumenFacturasReventas } from "../utils/reportFacturaRevetnas";
import { buildReporteTrackingOperaciones, TrackingOperacionRow } from "../utils/reportTrackingOperaciones";

export class DmsController {
  static getVendedores = async (_req: Request, res: Response) => {
    try {
      const query = getVendedoresNic();

      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("ConvencionalController.getVendedores");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getVendedoresActivos = async (_req: Request, res: Response) => {
    try {
      const query = getVendedoresActivosNic();

      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("ConvencionalController.getVendedores");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAsignacion = async (req: Request, res: Response) => {
    const { mes, anio } = req.params;

    try {
      const query = getAsignacionRecepcion(String(mes), String(anio));

      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
      });

      const resumen = getReporteAsignacionRecepcion(data);
      
      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.getVendedores");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getStockConsolidado = async (req: Request, res: Response) => {
    try {
      const queryNIC = getStockConsolidadoNic();
      const queryLiess = getStockConsolidadoLiess();

      const dataNIC = await sequelizeNIC.query<any>(queryNIC, {
        type: QueryTypes.SELECT,
      });

      const dataLiess = await sequelizeLIESS.query<any>(queryLiess, {
        type: QueryTypes.SELECT,
      });

      const resumenNIC = buildResumenStockConsolidado(dataNIC);
      const resumenLiess = buildResumenLiessMarca(dataLiess);

      const resumenGeneral = {
        totales: {
          nic: resumenNIC.total ?? 0,
          liess: resumenLiess.total ?? 0,
          general: (resumenNIC.total ?? 0) + (resumenLiess.total ?? 0),
        },
        nic: resumenNIC,
        liess: resumenLiess,
      };

      return res.status(200).json({ resumen: resumenGeneral });
    } catch (error) {
      logError("ConvencionalController.getStockConsolidado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getFactuasReventas = async (req: Request, res: Response) => {
    try {
      const queryNIC = getFacturaReventasNic();

      const dataNIC = await sequelizeNIC.query<any>(queryNIC, {
        type: QueryTypes.SELECT,
      });
 
      const resumenNIC = buildResumenFacturasReventas(dataNIC);

      return res.status(200).json({
        data: dataNIC, 
        resumen: resumenNIC });
    } catch (error) {
      logError("ConvencionalController.getStockConsolidado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getTrackingOperaciones = async (req: Request, res: Response) => {
    const { mes, ano, anio } = req.params;

    try {
      const mesNumber = Number(mes);
      const anoNumber = Number(ano ?? anio);
      const query = getControlUnidades(mesNumber, anoNumber);

      const data = await sequelizeNIC.query<TrackingOperacionRow>(query, {
        type: QueryTypes.SELECT,
      });

      const resumen = buildReporteTrackingOperaciones(data, mesNumber, anoNumber);

      return res.status(200).json({ resumen });
    } catch (error) {
      logError("DmsController.getTrackingOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
