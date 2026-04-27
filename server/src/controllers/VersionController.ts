import { Request, Response } from "express";
import Version from "../models/Version";
import Preventa from "../models/Preventa";
import { logError } from "../utils/logError";

const parseActivo = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const normalizeNombre = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export class VersionController {
  static list = async (req: Request, res: Response) => {
    try {
      const activo = parseActivo(req.query.activo);
      const filter = typeof activo === "boolean" ? { activo } : {};
      const data = await Version.find(filter).sort({ activo: -1, nombre: 1 }).lean();

      return res.status(200).json({ data });
    } catch (error) {
      logError("VersionController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar versiones" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const nombre = normalizeNombre(req.body?.nombre);
    const activo = req.body?.activo ?? true;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    try {
      const existing = await Version.findOne({ nombre: new RegExp(`^${nombre}$`, "i") }).lean();
      if (existing) {
        return res.status(400).json({ error: "Ya existe una version con ese nombre" });
      }

      const data = await Version.create({ nombre, activo: Boolean(activo) });
      return res.status(201).json({ message: "Version creada correctamente", data });
    } catch (error) {
      logError("VersionController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al crear la version" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const nombre = normalizeNombre(req.body?.nombre);

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    try {
      const version = await Version.findById(req.params.id);

      if (!version) {
        return res.status(404).json({ error: "Version no encontrada" });
      }

      const existing = await Version.findOne({
        _id: { $ne: version._id },
        nombre: new RegExp(`^${nombre}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe una version con ese nombre" });
      }

      version.nombre = nombre;
      version.activo = Boolean(req.body?.activo ?? version.activo);
      await version.save();

      return res.status(200).json({ message: "Version actualizada correctamente", data: version });
    } catch (error) {
      logError("VersionController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar la version" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const isInUse = await Preventa.exists({ version: req.params.id });
      if (isInUse) {
        return res.status(400).json({ error: "No se puede eliminar una version asociada a preventas" });
      }

      const data = await Version.findByIdAndDelete(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Version no encontrada" });
      }

      return res.status(200).json({ message: "Version eliminada correctamente", data });
    } catch (error) {
      logError("VersionController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar la version" });
    }
  };
}
