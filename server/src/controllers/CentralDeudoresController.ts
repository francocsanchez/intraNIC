import type { Request, Response } from "express";
import { CentralDeudoresError, CentralDeudoresService } from "../services/centralDeudores.service";
import { logError } from "../utils/logError";

export class CentralDeudoresController {
  static getByIdentificacion = async (req: Request, res: Response) => {
    const identificacion = String(req.params.identificacion ?? "").trim();

    try {
      const response = await CentralDeudoresService.getByIdentificacion(identificacion);
      return res.status(200).json({ data: response });
    } catch (error) {
      if (error instanceof CentralDeudoresError) {
        return res.status(error.statusCode).json({ message: error.message });
      }

      logError("CentralDeudoresController.getByIdentificacion");
      console.error(error);
      return res.status(500).json({ message: "Error temporal al consultar Central de Deudores" });
    }
  };
}
