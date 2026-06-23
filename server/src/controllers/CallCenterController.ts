import type { Request, Response } from "express";
import mongoose from "mongoose";
import { logError } from "../utils/logError";
import CallCenterDataOrigin from "../models/CallCenterDataOrigin";
import CallCenterSummaryOrigin from "../models/CallCenterSummaryOrigin";
import { CallCenterService } from "../services/callCenter.service";

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
  "text/html",
]);

const hasValidExcelExtension = (filename: string) => /\.(xls|xlsx|htm|html)$/i.test(filename);

const isExcelCompatibleFile = (file: Express.Multer.File) =>
  hasValidExcelExtension(file.originalname) || EXCEL_MIME_TYPES.has(file.mimetype);

const normalizeName = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const parseActivo = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const mapDataOriginResponse = (origin: any) => ({
  ...origin,
  origenResumidoId: origin?.origenResumidoId?._id?.toString?.() ?? null,
  origenResumido: origin?.origenResumidoId
    ? {
        _id: origin.origenResumidoId._id,
        nombre: origin.origenResumidoId.nombre,
        activo: origin.origenResumidoId.activo,
      }
    : null,
});

export class CallCenterController {
  static async importData(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: "Debes seleccionar un archivo para importar" });
    }

    if (!isExcelCompatibleFile(req.file)) {
      return res.status(400).json({ error: "El archivo debe ser .xls, .xlsx o una hoja HTML exportada" });
    }

    try {
      const result = await CallCenterService.importFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      return res.status(200).json({
        data: {
          worksheetName: result.worksheetName,
          importedRows: result.importedRows,
          createdOrigins: result.createdOrigins,
        },
        message: result.message,
      });
    } catch (error) {
      logError("CallCenterController.importData");
      console.error(error);

      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(500).json({ error: "No se pudo procesar el archivo de Call Center" });
    }
  }

  static async listDataOrigins(_req: Request, res: Response) {
    try {
      await CallCenterService.syncLegacySummaryOriginLinks();

      const origins = await CallCenterDataOrigin.find({})
        .populate("origenResumidoId", "nombre activo")
        .sort({ origen: 1 })
        .lean();

      return res.status(200).json({
        data: origins.map(mapDataOriginResponse),
        message: "Origenes de datos listados",
      });
    } catch (error) {
      logError("CallCenterController.listDataOrigins");
      console.error(error);
      return res.status(500).json({ error: "No se pudieron listar los origenes de datos" });
    }
  }

  static async updateDataOrigin(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const origenResumidoId =
        typeof req.body?.origenResumidoId === "string" ? req.body.origenResumidoId.trim() : "";

      let resumen = null;

      if (origenResumidoId) {
        if (!mongoose.isValidObjectId(origenResumidoId)) {
          return res.status(400).json({ error: "El origen resumido seleccionado no es valido" });
        }

        resumen = await CallCenterSummaryOrigin.findById(origenResumidoId).lean();

        if (!resumen) {
          return res.status(400).json({ error: "El origen resumido seleccionado no existe" });
        }

        if (!resumen.activo) {
          return res.status(400).json({ error: "No se puede asignar un origen resumido inactivo" });
        }
      }

      const origin = await CallCenterDataOrigin.findByIdAndUpdate(
        id,
        {
          $set: {
            origenResumidoId: resumen?._id ?? null,
            origenResumido: resumen?.nombre ?? "",
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
        .populate("origenResumidoId", "nombre activo")
        .lean();

      if (!origin) {
        return res.status(404).json({ error: "El origen de datos no existe" });
      }

      return res.status(200).json({
        data: mapDataOriginResponse(origin),
        message: "Origen de datos actualizado correctamente",
      });
    } catch (error) {
      logError("CallCenterController.updateDataOrigin");
      console.error(error);
      return res.status(500).json({ error: "No se pudo actualizar el origen de datos" });
    }
  }

  static async listSummaryOrigins(req: Request, res: Response) {
    try {
      const activo = parseActivo(req.query.activo);
      const filter = typeof activo === "boolean" ? { activo } : {};
      const data = await CallCenterSummaryOrigin.find(filter).sort({ activo: -1, nombre: 1 }).lean();

      return res.status(200).json({
        data,
        message: "Origenes resumidos listados",
      });
    } catch (error) {
      logError("CallCenterController.listSummaryOrigins");
      console.error(error);
      return res.status(500).json({ error: "No se pudieron listar los origenes resumidos" });
    }
  }

  static async createSummaryOrigin(req: Request, res: Response) {
    const nombre = normalizeName(req.body?.nombre);
    const activo = req.body?.activo ?? true;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    try {
      const existing = await CallCenterSummaryOrigin.findOne({
        nombre: new RegExp(`^${nombre}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un origen resumido con ese nombre" });
      }

      const data = await CallCenterSummaryOrigin.create({ nombre, activo: Boolean(activo) });

      return res.status(201).json({
        data,
        message: "Origen resumido creado correctamente",
      });
    } catch (error) {
      logError("CallCenterController.createSummaryOrigin");
      console.error(error);
      return res.status(500).json({ error: "No se pudo crear el origen resumido" });
    }
  }

  static async updateSummaryOrigin(req: Request, res: Response) {
    const nombre = normalizeName(req.body?.nombre);

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    try {
      const summaryOrigin = await CallCenterSummaryOrigin.findById(req.params.id);

      if (!summaryOrigin) {
        return res.status(404).json({ error: "Origen resumido no encontrado" });
      }

      const existing = await CallCenterSummaryOrigin.findOne({
        _id: { $ne: summaryOrigin._id },
        nombre: new RegExp(`^${nombre}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un origen resumido con ese nombre" });
      }

      summaryOrigin.nombre = nombre;
      summaryOrigin.activo = Boolean(req.body?.activo ?? summaryOrigin.activo);
      await summaryOrigin.save();

      await CallCenterDataOrigin.updateMany(
        { origenResumidoId: summaryOrigin._id },
        { $set: { origenResumido: summaryOrigin.nombre } },
      );

      return res.status(200).json({
        data: summaryOrigin,
        message: "Origen resumido actualizado correctamente",
      });
    } catch (error) {
      logError("CallCenterController.updateSummaryOrigin");
      console.error(error);
      return res.status(500).json({ error: "No se pudo actualizar el origen resumido" });
    }
  }

  static async changeSummaryOriginStatus(req: Request, res: Response) {
    try {
      const summaryOrigin = await CallCenterSummaryOrigin.findById(req.params.id);

      if (!summaryOrigin) {
        return res.status(404).json({ error: "Origen resumido no encontrado" });
      }

      summaryOrigin.activo = !summaryOrigin.activo;
      await summaryOrigin.save();

      return res.status(200).json({
        data: summaryOrigin,
        message: `Origen resumido ${summaryOrigin.activo ? "activado" : "desactivado"} correctamente`,
      });
    } catch (error) {
      logError("CallCenterController.changeSummaryOriginStatus");
      console.error(error);
      return res.status(500).json({ error: "No se pudo cambiar el estado del origen resumido" });
    }
  }
}
