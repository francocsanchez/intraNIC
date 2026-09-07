import { Request, Response } from "express";
import ColorUnidad from "../models/ColorUnidad";
import { logError } from "../utils/logError";

const normalizeNombre = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeHex = (value: unknown) => (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value.trim()) ? value.trim().toUpperCase() : "");

export class ColorUnidadController {
  static badges = async (_req: Request, res: Response) => {
    try { return res.status(200).json({ data: await ColorUnidad.find().select("nombre hex activo").lean() }); }
    catch (error) { logError("ColorUnidadController.badges"); console.error(error); return res.status(500).json({ message: "Error al obtener los colores de unidades" }); }
  };

  static list = async (_req: Request, res: Response) => {
    try { return res.status(200).json({ data: await ColorUnidad.find().sort({ activo: -1, nombre: 1 }).lean() }); }
    catch (error) { logError("ColorUnidadController.list"); console.error(error); return res.status(500).json({ message: "Error al listar los colores de unidades" }); }
  };

  static save = async (req: Request, res: Response) => {
    const nombre = normalizeNombre(req.body?.nombre); const hex = normalizeHex(req.body?.hex);
    const id = typeof req.params.id === "string" ? req.params.id : "";
    if (!nombre || !hex) return res.status(400).json({ error: "El nombre y un color hexadecimal #RRGGBB son obligatorios" });
    try {
      const existing = await ColorUnidad.findOne({ nombre: new RegExp(`^${nombre}$`, "i"), _id: { $ne: id || undefined } }).lean();
      if (existing) return res.status(400).json({ error: "Ya existe un color de unidad con ese nombre" });
      const data = id
        ? await ColorUnidad.findByIdAndUpdate(id, { nombre, hex, activo: Boolean(req.body?.activo) }, { new: true, runValidators: true }).lean()
        : await ColorUnidad.create({ nombre, hex, activo: req.body?.activo ?? true });
      if (!data) return res.status(404).json({ error: "Color de unidad no encontrado" });
      return res.status(id ? 200 : 201).json({ data, message: id ? "Color de unidad actualizado correctamente" : "Color de unidad creado correctamente" });
    } catch (error) { logError("ColorUnidadController.save"); console.error(error); return res.status(500).json({ message: "Error al guardar el color de unidad" }); }
  };
}
