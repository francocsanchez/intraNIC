import { Request, Response } from "express";
import mongoose from "mongoose";
import UnidadNegocio from "../models/UnidadNegocio";
import { logError } from "../utils/logError";

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const normalizeOrden = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildUnidadNegocioResponse = (item: any) => ({
  _id: String(item._id),
  nombre: item.nombre ?? "",
  activo: Boolean(item.activo),
  orden: Number(item.orden ?? 0),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export class UnidadNegocioController {
  static ensureAuthenticated(req: Request, res: Response) {
    if (!req.user?._id) {
      res.status(401).json({ error: "Usuario no autenticado" });
      return false;
    }

    return true;
  }

  static list = async (req: Request, res: Response) => {
    try {
      if (!UnidadNegocioController.ensureAuthenticated(req, res)) {
        return;
      }

      const includeInactive = String(req.query.includeInactive ?? "0") === "1";
      const query = includeInactive ? {} : { activo: true };

      const unidades = await UnidadNegocio.find(query).sort({ orden: 1, nombre: 1 }).lean();

      return res.status(200).json({
        data: unidades.map(buildUnidadNegocioResponse),
      });
    } catch (error) {
      logError("UnidadNegocioController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar unidades de negocio" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      if (!UnidadNegocioController.ensureAuthenticated(req, res)) {
        return;
      }

      const nombre = normalizeText(req.body?.nombre);
      if (!nombre) {
        return res.status(400).json({ error: "El nombre de la unidad de negocio es obligatorio" });
      }

      const unidad = await UnidadNegocio.create({
        nombre,
        activo: req.body?.activo !== false,
        orden: normalizeOrden(req.body?.orden, 0),
      });

      return res.status(201).json({
        data: buildUnidadNegocioResponse(unidad),
        message: "Unidad de negocio creada correctamente",
      });
    } catch (error) {
      logError("UnidadNegocioController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al crear la unidad de negocio" });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      if (!UnidadNegocioController.ensureAuthenticated(req, res)) {
        return;
      }

      const { idUnidadNegocio } = req.params;
      if (!mongoose.isValidObjectId(idUnidadNegocio)) {
        return res.status(400).json({ error: "La unidad de negocio no es valida" });
      }

      const unidad = await UnidadNegocio.findById(idUnidadNegocio);
      if (!unidad) {
        return res.status(404).json({ error: "La unidad de negocio no existe" });
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "nombre")) {
        const nombre = normalizeText(req.body?.nombre);
        if (!nombre) {
          return res.status(400).json({ error: "El nombre de la unidad de negocio es obligatorio" });
        }

        unidad.nombre = nombre;
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "activo")) {
        unidad.activo = req.body.activo !== false;
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "orden")) {
        unidad.orden = normalizeOrden(req.body?.orden, unidad.orden);
      }

      await unidad.save();

      return res.status(200).json({
        data: buildUnidadNegocioResponse(unidad),
        message: "Unidad de negocio actualizada correctamente",
      });
    } catch (error) {
      logError("UnidadNegocioController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar la unidad de negocio" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      if (!UnidadNegocioController.ensureAuthenticated(req, res)) {
        return;
      }

      const { idUnidadNegocio } = req.params;
      if (!mongoose.isValidObjectId(idUnidadNegocio)) {
        return res.status(400).json({ error: "La unidad de negocio no es valida" });
      }

      const unidad = await UnidadNegocio.findById(idUnidadNegocio);
      if (!unidad) {
        return res.status(404).json({ error: "La unidad de negocio no existe" });
      }

      unidad.activo = false;
      await unidad.save();

      return res.status(200).json({
        data: buildUnidadNegocioResponse(unidad),
        message: "Unidad de negocio desactivada correctamente",
      });
    } catch (error) {
      logError("UnidadNegocioController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al desactivar la unidad de negocio" });
    }
  };
}
