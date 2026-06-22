import type { Request, Response } from "express";
import mongoose from "mongoose";
import AgendaEntrega from "../models/AgendaEntrega";
import SucursalEntrega from "../models/SucursalEntrega";
import { logError } from "../utils/logError";

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isValidObjectId = (value: unknown) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const formatSucursal = (item: any) => ({
  _id: String(item._id),
  nombre: item.nombre,
  direccion: item.direccion ?? "",
  activa: Boolean(item.activa),
  observaciones: item.observaciones ?? "",
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const validatePayload = async (
  payload: Record<string, unknown>,
  currentId?: string,
) => {
  const nombre = normalizeText(payload.nombre);
  const direccion = normalizeText(payload.direccion);
  const observaciones = normalizeText(payload.observaciones);
  const activa =
    payload.activa === undefined ? true : Boolean(payload.activa);

  if (!nombre) {
    return { error: "El nombre de la sucursal es obligatorio" };
  }

  const existing = await SucursalEntrega.findOne({
    _id: currentId && isValidObjectId(currentId) ? { $ne: currentId } : { $exists: true },
    nombre: new RegExp(`^${nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  }).lean();

  if (existing) {
    return { error: "Ya existe una sucursal con ese nombre" };
  }

  return {
    data: {
      nombre,
      direccion,
      observaciones,
      activa,
    },
  };
};

export class SucursalEntregaController {
  static list = async (_req: Request, res: Response) => {
    try {
      const data = await SucursalEntrega.find({})
        .sort({ activa: -1, nombre: 1 })
        .lean();

      return res.status(200).json({ data: data.map(formatSucursal) });
    } catch (error) {
      logError("SucursalEntregaController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar sucursales de entrega" });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const validation = await validatePayload(req.body ?? {});
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const sucursal = await SucursalEntrega.create(validation.data);

      return res.status(201).json({
        message: "Sucursal creada correctamente",
        data: formatSucursal(sucursal.toObject()),
      });
    } catch (error: any) {
      logError("SucursalEntregaController.create");
      console.error(error);
      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ya existe una sucursal con ese nombre" });
      }

      return res.status(500).json({ message: "Error al crear la sucursal de entrega" });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const sucursalId = String(req.params.id);
      const sucursal = await SucursalEntrega.findById(sucursalId);

      if (!sucursal) {
        return res.status(404).json({ error: "Sucursal no encontrada" });
      }

      const validation = await validatePayload(req.body ?? {}, sucursalId);
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      Object.assign(sucursal, validation.data);
      await sucursal.save();

      return res.status(200).json({
        message: "Sucursal actualizada correctamente",
        data: formatSucursal(sucursal.toObject()),
      });
    } catch (error: any) {
      logError("SucursalEntregaController.update");
      console.error(error);
      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ya existe una sucursal con ese nombre" });
      }

      return res.status(500).json({ message: "Error al actualizar la sucursal de entrega" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const sucursalId = String(req.params.id);
      const sucursal = await SucursalEntrega.findById(sucursalId).lean();

      if (!sucursal) {
        return res.status(404).json({ error: "Sucursal no encontrada" });
      }

      const agendaExists = await AgendaEntrega.exists({ sucursal: sucursal._id });
      if (agendaExists) {
        return res.status(409).json({
          error: "No se puede eliminar una sucursal que ya tiene agendas asociadas",
        });
      }

      await SucursalEntrega.findByIdAndDelete(sucursalId);

      return res.status(200).json({ message: "Sucursal eliminada correctamente" });
    } catch (error) {
      logError("SucursalEntregaController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar la sucursal de entrega" });
    }
  };
}
