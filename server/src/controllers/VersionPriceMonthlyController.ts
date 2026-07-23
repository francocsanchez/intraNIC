import { Request, Response } from "express";
import Version from "../models/Version";
import VersionPriceMonthly from "../models/VersionPriceMonthly";
import { logError } from "../utils/logError";

const parseActivo = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const normalizeMes = (value: unknown) => {
  const mes = typeof value === "string" ? value.trim() : "";
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mes) ? mes : "";
};

const normalizePrecio = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const normalizeDiscountPct = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const pricePopulate = [{ path: "version", select: "nombre activo" }];

const serializePriceRecord = <T extends { descuentoReferenciaPct?: unknown }>(record: T | null | undefined) => {
  if (!record) {
    return record;
  }

  const descuentoReferenciaPct = Number(record.descuentoReferenciaPct);

  return {
    ...record,
    descuentoReferenciaPct: Number.isFinite(descuentoReferenciaPct) ? descuentoReferenciaPct : 8,
  };
};

export class VersionPriceMonthlyController {
  static list = async (req: Request, res: Response) => {
    try {
      const activo = parseActivo(req.query.activo);
      const mes = normalizeMes(req.query.mes);
      const filter: Record<string, unknown> = {};

      if (typeof activo === "boolean") {
        filter.activo = activo;
      }

      if (mes) {
        filter.mes = mes;
      }

      const data = await VersionPriceMonthly.find(filter)
        .populate(pricePopulate)
        .sort({ mes: -1, createdAt: -1 })
        .lean();

      return res.status(200).json({ data: data.map((item) => serializePriceRecord(item)) });
    } catch (error) {
      logError("VersionPriceMonthlyController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar precios mensuales" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const versionId = typeof req.body?.version === "string" ? req.body.version.trim() : "";
    const mes = normalizeMes(req.body?.mes);
    const precio = normalizePrecio(req.body?.precio);
    const descuentoReferenciaPct = normalizeDiscountPct(req.body?.descuentoReferenciaPct);
    const activo = req.body?.activo ?? true;

    if (!versionId) {
      return res.status(400).json({ error: "La version es obligatoria" });
    }

    if (!mes) {
      return res.status(400).json({ error: "El mes debe tener formato YYYY-MM" });
    }

    if (precio === null) {
      return res.status(400).json({ error: "El precio debe ser mayor o igual a 0" });
    }

    if (descuentoReferenciaPct === null) {
      return res.status(400).json({ error: "El descuento de referencia debe ser mayor o igual a 0" });
    }

    try {
      const version = await Version.findById(versionId).lean();
      if (!version) {
        return res.status(404).json({ error: "Version no encontrada" });
      }

      const existing = await VersionPriceMonthly.findOne({ version: versionId, mes }).lean();
      if (existing) {
        return res.status(400).json({ error: "Ya existe un precio cargado para esa version y mes" });
      }

      const created = await VersionPriceMonthly.create({
        version: versionId,
        mes,
        precio,
        descuentoReferenciaPct,
        activo: Boolean(activo),
      });

      const data = serializePriceRecord(await VersionPriceMonthly.findById(created._id).populate(pricePopulate).lean());
      return res.status(201).json({ message: "Precio mensual creado correctamente", data });
    } catch (error) {
      logError("VersionPriceMonthlyController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al crear el precio mensual" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const versionId = typeof req.body?.version === "string" ? req.body.version.trim() : "";
    const mes = normalizeMes(req.body?.mes);
    const precio = normalizePrecio(req.body?.precio);
    const descuentoReferenciaPct = normalizeDiscountPct(req.body?.descuentoReferenciaPct);

    if (!versionId) {
      return res.status(400).json({ error: "La version es obligatoria" });
    }

    if (!mes) {
      return res.status(400).json({ error: "El mes debe tener formato YYYY-MM" });
    }

    if (precio === null) {
      return res.status(400).json({ error: "El precio debe ser mayor o igual a 0" });
    }

    if (descuentoReferenciaPct === null) {
      return res.status(400).json({ error: "El descuento de referencia debe ser mayor o igual a 0" });
    }

    try {
      const record = await VersionPriceMonthly.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Precio mensual no encontrado" });
      }

      const version = await Version.findById(versionId).lean();
      if (!version) {
        return res.status(404).json({ error: "Version no encontrada" });
      }

      const existing = await VersionPriceMonthly.findOne({
        _id: { $ne: record._id },
        version: versionId,
        mes,
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un precio cargado para esa version y mes" });
      }

      record.version = version._id;
      record.mes = mes;
      record.precio = precio;
      record.descuentoReferenciaPct = descuentoReferenciaPct;
      record.activo = Boolean(req.body?.activo ?? record.activo);
      await record.save();

      const data = serializePriceRecord(await VersionPriceMonthly.findById(record._id).populate(pricePopulate).lean());
      return res.status(200).json({ message: "Precio mensual actualizado correctamente", data });
    } catch (error) {
      logError("VersionPriceMonthlyController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el precio mensual" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const data = serializePriceRecord(await VersionPriceMonthly.findByIdAndDelete(req.params.id).populate(pricePopulate).lean());

      if (!data) {
        return res.status(404).json({ error: "Precio mensual no encontrado" });
      }

      return res.status(200).json({ message: "Precio mensual eliminado correctamente", data });
    } catch (error) {
      logError("VersionPriceMonthlyController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el precio mensual" });
    }
  };
}
