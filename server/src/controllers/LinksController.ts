import mongoose from "mongoose";
import type { Request, Response } from "express";
import Link from "../models/Link";
import { logError } from "../utils/logError";

const format = (item: any) => ({
  _id: String(item._id),
  url: item.url,
  descripcion: item.descripcion,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const validate = (body: Record<string, unknown>) => {
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const descripcion = typeof body.descripcion === "string" ? body.descripcion.trim() : "";

  if (!url) return { error: "La URL es obligatoria" };
  if (!descripcion) return { error: "La descripción es obligatoria" };
  if (url.length > 2048) return { error: "La URL no puede superar los 2048 caracteres" };
  if (descripcion.length > 500) return { error: "La descripción no puede superar los 500 caracteres" };

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { error: "La URL debe comenzar con http:// o https://" };
    }
  } catch {
    return { error: "La URL ingresada no es válida" };
  }

  return { data: { url, descripcion } };
};

export class LinksController {
  static list = async (_req: Request, res: Response) => {
    try {
      const data = await Link.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({ data: data.map(format) });
    } catch (error) {
      logError("LinksController.list");
      console.error(error);
      return res.status(500).json({ message: "No se pudieron cargar los links" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const validation = validate(req.body ?? {});
    if ("error" in validation) return res.status(400).json({ error: validation.error });

    try {
      const item = await Link.create(validation.data);
      return res.status(201).json({ message: "Link creado correctamente", data: format(item) });
    } catch (error) {
      logError("LinksController.create");
      console.error(error);
      return res.status(500).json({ message: "No se pudo crear el link" });
    }
  };

  static update = async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "El link indicado no existe" });

    const validation = validate(req.body ?? {});
    if ("error" in validation) return res.status(400).json({ error: validation.error });

    try {
      const item = await Link.findByIdAndUpdate(req.params.id, { $set: validation.data }, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ error: "El link indicado no existe" });
      return res.status(200).json({ message: "Link actualizado correctamente", data: format(item) });
    } catch (error) {
      logError("LinksController.update");
      console.error(error);
      return res.status(500).json({ message: "No se pudo actualizar el link" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "El link indicado no existe" });

    try {
      const item = await Link.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: "El link indicado no existe" });
      return res.status(200).json({ message: "Link eliminado correctamente" });
    } catch (error) {
      logError("LinksController.remove");
      console.error(error);
      return res.status(500).json({ message: "No se pudo eliminar el link" });
    }
  };
}
