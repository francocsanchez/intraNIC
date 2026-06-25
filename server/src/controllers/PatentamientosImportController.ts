import type { Request, Response } from "express";
import { logError } from "../utils/logError";
import {
  PatentamientosImportAlreadyRunningError,
  PatentamientosImportService,
} from "../services/patentamientosImport.service";
import { PatentamientosImportStatusService } from "../services/patentamientosImportStatus.service";

export class PatentamientosImportController {
  static async ejecutarImportacion(_req: Request, res: Response) {
    try {
      const result = await PatentamientosImportService.importLatestFile("manual");

      return res.status(200).json({
        data: result,
        message: result.message,
      });
    } catch (error) {
      logError("PatentamientosImportController.ejecutarImportacion");
      console.error(error);

      if (error instanceof PatentamientosImportAlreadyRunningError) {
        return res.status(409).json({ error: error.message });
      }

      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(500).json({ error: "No se pudo ejecutar la importacion de patentamientos" });
    }
  }

  static async getEstado(_req: Request, res: Response) {
    try {
      const status = await PatentamientosImportStatusService.getLatestStatus();
      return res.status(200).json({ data: status });
    } catch (error) {
      logError("PatentamientosImportController.getEstado");
      console.error(error);

      if (error instanceof Error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(500).json({ error: "No se pudo obtener el estado de la importacion" });
    }
  }
}
