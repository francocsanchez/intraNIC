import type { Request, Response } from "express";
import { logError } from "../utils/logError";
import { SegUnidadesFabricaService } from "../services/segUnidadesFabrica.service";

const isTxtFile = (file: Express.Multer.File) =>
  /\.txt$/i.test(file.originalname) || file.mimetype === "text/plain" || file.mimetype === "application/octet-stream";

export class SegUnidadesFabricaController {
  static async list(_req: Request, res: Response) {
    try {
      const data = await SegUnidadesFabricaService.list();

      return res.status(200).json({ data });
    } catch (error) {
      logError("SegUnidadesFabricaController.list");
      console.error(error);
      return res.status(500).json({ error: "No se pudieron obtener las unidades de fabrica" });
    }
  }

  static async importData(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: "Debes seleccionar un archivo para importar" });
    }

    if (!isTxtFile(req.file)) {
      return res.status(400).json({ error: "El archivo debe ser un .txt valido" });
    }

    try {
      const result = await SegUnidadesFabricaService.importFile(
        { buffer: req.file.buffer },
        req.user,
      );

      return res.status(200).json({
        data: {
          totalRows: result.totalRows,
          importedRows: result.importedRows,
          omittedRows: result.omittedRows,
          removedWithVin: result.removedWithVin,
          removedWithFinanzas: result.removedWithFinanzas,
          removedMissing: result.removedMissing,
        },
        message: result.message,
      });
    } catch (error) {
      logError("SegUnidadesFabricaController.importData");
      console.error(error);

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: "No se pudo procesar el archivo de unidades de fabrica" });
    }
  }
}
