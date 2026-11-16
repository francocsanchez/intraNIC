import { Request, Response } from "express";
import Conversion from "../models/Conversion";
import { logError } from "../utils/logError";

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

export class ConversionController {
  static list = async (_req: Request, res: Response) => {
    try {
      const data = await Conversion.find().sort({ tipoConversion: 1, proveedor: 1 }).lean();
      return res.status(200).json({ data });
    } catch (error) {
      logError("ConversionController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar las conversiones" });
    }
  };

  static save = async (req: Request, res: Response) => {
    const tipoConversion = normalizeText(req.body?.tipoConversion);
    const proveedor = normalizeText(req.body?.proveedor);
    const id = typeof req.params.id === "string" ? req.params.id : "";

    if (!tipoConversion || !proveedor) {
      return res.status(400).json({ error: "El tipo de conversión y el proveedor son obligatorios" });
    }

    try {
      const existing = await Conversion.findOne({
        tipoConversion: new RegExp(`^${escapeRegExp(tipoConversion)}$`, "i"),
        proveedor: new RegExp(`^${escapeRegExp(proveedor)}$`, "i"),
        _id: { $ne: id || undefined },
      }).lean();
      if (existing) {
        return res.status(400).json({ error: "Ya existe una conversión con ese tipo y proveedor" });
      }

      const data = id
        ? await Conversion.findByIdAndUpdate(id, { tipoConversion, proveedor }, { new: true, runValidators: true }).lean()
        : await Conversion.create({ tipoConversion, proveedor });
      if (!data) return res.status(404).json({ error: "Conversión no encontrada" });

      return res.status(id ? 200 : 201).json({
        data,
        message: id ? "Conversión actualizada correctamente" : "Conversión creada correctamente",
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return res.status(400).json({ error: "Ya existe una conversión con ese tipo y proveedor" });
      }
      logError("ConversionController.save");
      console.error(error);
      return res.status(500).json({ message: "Error al guardar la conversión" });
    }
  };
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
