import { Response, Request } from "express";
import { sequelizeNIC } from "../config/database";
import { getAsignacionRecepcion, getVendedoresActivosNic, getVendedoresNic } from "./querys/dms.query";
import { QueryTypes } from "sequelize";
import { logError } from "../utils/logError";
import { getReporteAsignacionRecepcion } from "../utils/reporteAsignacionRecepcion";

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
}
