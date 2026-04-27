import { Request, Response } from "express";
import mongoose from "mongoose";
import PedidoMensual from "../models/PedidoMensual";
import Version from "../models/Version";
import { logError } from "../utils/logError";

const pedidoMensualPopulate = [{ path: "version", select: "nombre activo" }];

const normalizeCantidad = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const normalizeVersionId = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export class PedidoMensualController {
  static list = async (_req: Request, res: Response) => {
    try {
      const data = await PedidoMensual.find()
        .populate(pedidoMensualPopulate)
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();

      return res.status(200).json({ data });
    } catch (error) {
      logError("PedidoMensualController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar pedidos mensuales" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const data = await PedidoMensual.findById(req.params.id).populate(pedidoMensualPopulate).lean();

      if (!data) {
        return res.status(404).json({ error: "Pedido mensual no encontrado" });
      }

      return res.status(200).json({ data });
    } catch (error) {
      logError("PedidoMensualController.getById");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener el pedido mensual" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const versionId = normalizeVersionId(req.body?.version);
    const cantidad = normalizeCantidad(req.body?.cantidad);

    if (!mongoose.isValidObjectId(versionId)) {
      return res.status(400).json({ error: "La version es obligatoria" });
    }

    if (Number.isNaN(cantidad) || cantidad < 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor o igual a 0" });
    }

    try {
      const version = await Version.findOne({ _id: versionId, activo: true }).lean();

      if (!version) {
        return res.status(400).json({ error: "La version seleccionada no existe o esta inactiva" });
      }

      const data = await PedidoMensual.findOneAndUpdate(
        { version: version._id },
        { version: version._id, cantidad },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
        .populate(pedidoMensualPopulate)
        .lean();

      return res.status(201).json({
        message: "Pedido mensual guardado correctamente",
        data,
      });
    } catch (error) {
      logError("PedidoMensualController.create");
      console.error(error);
      return res.status(500).json({ message: "Error al guardar el pedido mensual" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const cantidad = normalizeCantidad(req.body?.cantidad);
    const versionId = req.body?.version ? normalizeVersionId(req.body.version) : null;

    if (Number.isNaN(cantidad) || cantidad < 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor o igual a 0" });
    }

    try {
      const pedidoMensual = await PedidoMensual.findById(req.params.id);

      if (!pedidoMensual) {
        return res.status(404).json({ error: "Pedido mensual no encontrado" });
      }

      if (versionId) {
        if (!mongoose.isValidObjectId(versionId)) {
          return res.status(400).json({ error: "La version es obligatoria" });
        }

        const version = await Version.findOne({ _id: versionId, activo: true }).lean();

        if (!version) {
          return res.status(400).json({ error: "La version seleccionada no existe o esta inactiva" });
        }

        const existing = await PedidoMensual.findOne({
          _id: { $ne: pedidoMensual._id },
          version: version._id,
        }).lean();

        if (existing) {
          return res.status(400).json({ error: "Ya existe un pedido mensual para esa version" });
        }

        pedidoMensual.version = version._id;
      }

      pedidoMensual.cantidad = cantidad;
      await pedidoMensual.save();

      const data = await PedidoMensual.findById(pedidoMensual._id).populate(pedidoMensualPopulate).lean();

      return res.status(200).json({
        message: "Pedido mensual actualizado correctamente",
        data,
      });
    } catch (error) {
      logError("PedidoMensualController.update");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el pedido mensual" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    try {
      const data = await PedidoMensual.findByIdAndDelete(req.params.id).populate(pedidoMensualPopulate).lean();

      if (!data) {
        return res.status(404).json({ error: "Pedido mensual no encontrado" });
      }

      return res.status(200).json({
        message: "Pedido mensual eliminado correctamente",
        data,
      });
    } catch (error) {
      logError("PedidoMensualController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el pedido mensual" });
    }
  };
}
