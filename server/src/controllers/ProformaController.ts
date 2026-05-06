import { Request, Response } from "express";
import Proforma from "../models/Proforma";
import { logError } from "../utils/logError";
import {
  buildProformaResponse,
  getNextProformaNumber,
  validateAndCalculateProforma,
} from "../utils/proforma";
import { generateProformaPdfBuffer } from "../utils/proformaPdf";

export class ProformaController {
  static list = async (_req: Request, res: Response) => {
    try {
      const data = await Proforma.find()
        .sort({ numeroProforma: -1, createdAt: -1 })
        .lean();

      return res.status(200).json({
        data: data.map((item) => buildProformaResponse(item)),
      });
    } catch (error) {
      logError("ProformaController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar proformas" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const data = await Proforma.findById(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Proforma no encontrada" });
      }

      return res.status(200).json({ data: buildProformaResponse(data) });
    } catch (error) {
      logError("ProformaController.getById");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener la proforma" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const calculated = await validateAndCalculateProforma(req.body);
      const numeroProforma = await getNextProformaNumber();
      const asesorComercial = `${req.user.lastName}, ${req.user.name}`;

      const data = await Proforma.create({
        numeroProforma,
        fecha: new Date(),
        senores: calculated.senores,
        cliente: calculated.cliente,
        cuit: calculated.cuit,
        observaciones: calculated.observaciones,
        asesorComercial,
        emailAsesor: req.user.email,
        usuarioId: req.user._id,
        unidades: calculated.unidades.map((unidad) => ({
          versionId: unidad.versionId,
          versionNombre: unidad.versionNombre,
          cantidad: unidad.cantidad,
          ivaUnidad: unidad.ivaUnidad,
          totalUnidad: unidad.totalUnidad,
          descuentoUnidad: unidad.descuentoUnidad,
          totalPatentamiento: unidad.totalPatentamiento,
          totalFlete: unidad.totalFlete,
        })),
      });

      return res.status(201).json({
        message: "Proforma creada correctamente",
        data: buildProformaResponse(data.toObject()),
      });
    } catch (error) {
      logError("ProformaController.create");
      console.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo crear la proforma",
      });
    }
  };

  static exportPdf = async (req: Request, res: Response) => {
    try {
      const data = await Proforma.findById(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Proforma no encontrada" });
      }

      const response = buildProformaResponse(data);
      const pdfBuffer = await generateProformaPdfBuffer(response);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="proforma-${response.numeroProforma}.pdf"`,
      );

      return res.status(200).send(pdfBuffer);
    } catch (error) {
      logError("ProformaController.exportPdf");
      console.error(error);
      return res.status(500).json({ message: "Error al exportar la proforma a PDF" });
    }
  };
}
