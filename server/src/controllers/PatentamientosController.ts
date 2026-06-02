import type { Request, Response } from "express";
import { PatentamientosService, type PatentamientosDatasetType } from "../services/patentamientos.service";
import { logError } from "../utils/logError";

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

const hasValidExcelExtension = (filename: string) => /\.(xls|xlsx)$/i.test(filename);

const isExcelCompatibleFile = (file: Express.Multer.File) =>
  hasValidExcelExtension(file.originalname) || EXCEL_MIME_TYPES.has(file.mimetype);

export class PatentamientosController {
  private static async handleImport(
    req: Request,
    res: Response,
    dataset: PatentamientosDatasetType,
  ) {
    if (!req.file) {
      return res.status(400).json({ error: "Debes seleccionar un archivo para importar" });
    }

    if (!isExcelCompatibleFile(req.file)) {
      return res.status(400).json({ error: "El archivo debe ser .xls o Excel compatible" });
    }

    try {
      const response = await PatentamientosService.importDataset(dataset, {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      return res.status(200).json({ message: response.message });
    } catch (error) {
      logError(`PatentamientosController.${dataset}`);
      console.error(error);

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: "No se pudo procesar el archivo de patentamientos" });
    }
  }

  static importPaisMarcas(req: Request, res: Response) {
    return PatentamientosController.handleImport(req, res, "pais-marcas");
  }

  static importZonaNicMarcas(req: Request, res: Response) {
    return PatentamientosController.handleImport(req, res, "zona-nic-marcas");
  }

  static importPaisModelos(req: Request, res: Response) {
    return PatentamientosController.handleImport(req, res, "pais-modelos");
  }

  static importZonaNicModelos(req: Request, res: Response) {
    return PatentamientosController.handleImport(req, res, "zona-nic-modelos");
  }
}
