import { Request, Response } from "express";
import Color from "../models/Color";
import Preventa from "../models/Preventa";
import { logError } from "../utils/logError";

const parseActivo = (value: unknown) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const normalizeNombre = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export class ColorController {
  static list = async (req: Request, res: Response) => {
    try {
      const activo = parseActivo(req.query.activo);
      const filter = typeof activo === "boolean" ? { activo } : {};
      const data = await Color.find(filter).sort({ activo: -1, nombre: 1 }).lean();

      return res.status(200).json({ data });
    } catch (error) {
      logError("ColorController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar colores" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const nombre = normalizeNombre(req.body?.nombre);
    const activo = req.body?.activo ?? true;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    try {
      const existing = await Color.findOne({ nombre: new RegExp(`^${nombre}$`, "i") }).lean();
      if (existing) {
        return res.status(400).json({ error: "Ya existe un color con ese nombre" });
      }

      const data = await Color.create({ nombre, activo: Boolean(activo) });
      return res.status(201).json({ message: "Color creado correctamente", data });
    } catch (error) {
      logError("ColorController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al crear el color" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const nombre = normalizeNombre(req.body?.nombre);

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    try {
      const color = await Color.findById(req.params.id);

      if (!color) {
        return res.status(404).json({ error: "Color no encontrado" });
      }

      const existing = await Color.findOne({
        _id: { $ne: color._id },
        nombre: new RegExp(`^${nombre}$`, "i"),
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un color con ese nombre" });
      }

      color.nombre = nombre;
      color.activo = Boolean(req.body?.activo ?? color.activo);
      await color.save();

      return res.status(200).json({ message: "Color actualizado correctamente", data: color });
    } catch (error) {
      logError("ColorController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el color" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const isInUse = await Preventa.exists({ colores: req.params.id });
      if (isInUse) {
        return res.status(400).json({ error: "No se puede eliminar un color asociado a preventas" });
      }

      const data = await Color.findByIdAndDelete(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Color no encontrado" });
      }

      return res.status(200).json({ message: "Color eliminado correctamente", data });
    } catch (error) {
      logError("ColorController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el color" });
    }
  };
}
