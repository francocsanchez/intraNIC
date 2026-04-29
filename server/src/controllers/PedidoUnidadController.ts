import { Request, Response } from "express";
import { QueryTypes } from "sequelize";
import mongoose from "mongoose";
import { sequelizeNIC } from "../config/database";
import { infoInternoQuery } from "./querys/convencional.query";
import PedidoUnidad from "../models/PedidoUnidad";
import { logError } from "../utils/logError";

type InfoInternoRow = {
  interno: number;
  version: string;
  order: string;
  cliente: string;
  vendedor: string;
  chasis: string;
};

type PedidoUnidadPayloadItem = {
  interno: number;
  PDI?: boolean;
};

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") return "-";

  const normalized = value.trim();
  return normalized.length ? normalized : "-";
};

const isValidFecha = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const buildPedidoItems = async (items: PedidoUnidadPayloadItem[]) => {
  const internosUnicos = Array.from(
    new Set(
      items.map((item) => Number(item.interno)).filter((interno) => Number.isInteger(interno) && interno > 0),
    ),
  );

  if (!internosUnicos.length) {
    throw new Error("Debes ingresar al menos un interno valido");
  }

  if (internosUnicos.length > 8) {
    throw new Error("Solo se permiten hasta 8 unidades por pedido");
  }

  if (internosUnicos.length !== items.length) {
    throw new Error("No se pueden repetir internos dentro del mismo pedido");
  }

  const unidades = await Promise.all(
    internosUnicos.map(async (interno) => {
      const rows = await sequelizeNIC.query<InfoInternoRow>(infoInternoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { interno },
      });

      return rows[0] ?? null;
    }),
  );

  const faltantes = internosUnicos.filter((interno, index) => !unidades[index]);
  if (faltantes.length) {
    throw new Error(`No se encontro informacion para los internos: ${faltantes.join(", ")}`);
  }

  return items.map((item) => {
    const interno = Number(item.interno);
    const unidad = unidades.find((row) => row?.interno === interno);

    if (!unidad) {
      throw new Error(`No se encontro informacion para el interno ${interno}`);
    }

    return {
      interno: unidad.interno,
      version: normalizeText(unidad.version),
      order: normalizeText(unidad.order),
      cliente: normalizeText(unidad.cliente),
      vendedor: normalizeText(unidad.vendedor),
      chasis: normalizeText(unidad.chasis),
      PDI: Boolean(item.PDI),
    };
  });
};

export class PedidoUnidadController {
  static getInfoInterno = async (req: Request, res: Response) => {
    const interno = Number(req.params.interno);

    if (!Number.isInteger(interno) || interno <= 0) {
      return res.status(400).json({ error: "El interno ingresado no es valido" });
    }

    try {
      const data = await sequelizeNIC.query<InfoInternoRow>(infoInternoQuery(), {
        type: QueryTypes.SELECT,
        replacements: { interno },
      });

      const unidad = data[0];

      if (!unidad) {
        return res.status(404).json({ error: "No se encontro informacion para el interno solicitado" });
      }

      return res.status(200).json({
        data: {
          interno: unidad.interno,
          version: normalizeText(unidad.version),
          order: normalizeText(unidad.order),
          cliente: normalizeText(unidad.cliente),
          vendedor: normalizeText(unidad.vendedor),
          chasis: normalizeText(unidad.chasis),
        },
      });
    } catch (error) {
      logError("PedidoUnidadController.getInfoInterno");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        PedidoUnidad.find()
          .sort({ fecha: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        PedidoUnidad.countDocuments(),
      ]);

      return res.status(200).json({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      });
    } catch (error) {
      logError("PedidoUnidadController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar pedidos de unidades" });
    }
  };

  static getEstadoInternos = async (req: Request, res: Response) => {
    const internos = Array.isArray(req.body?.internos)
      ? req.body.internos
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      : [];

    if (!internos.length) {
      return res.status(200).json({ data: {} });
    }

    try {
      const encontrados = await PedidoUnidad.aggregate([
        { $unwind: "$items" },
        { $match: { "items.interno": { $in: internos } } },
        { $group: { _id: "$items.interno" } },
      ]) as Array<{ _id: number }>;

      const encontradosSet = new Set(encontrados.map((item) => item._id));
      const data = internos.reduce((acc: Record<number, boolean>, interno) => {
        acc[interno] = encontradosSet.has(interno);
        return acc;
      }, {});

      return res.status(200).json({ data });
    } catch (error) {
      logError("PedidoUnidadController.getEstadoInternos");
      console.error(error);
      return res.status(500).json({ message: "Error al consultar el estado de internos pedidos" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const data = await PedidoUnidad.findById(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      return res.status(200).json({ data });
    } catch (error) {
      logError("PedidoUnidadController.getById");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener el pedido de unidades" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const { fecha, items } = req.body as {
      fecha?: string;
      items?: PedidoUnidadPayloadItem[];
    };

    if (!req.user?._id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!isValidFecha(fecha)) {
      return res.status(400).json({ error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD" });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Debes ingresar al menos una unidad" });
    }

    try {
      const pedidoItems = await buildPedidoItems(items);

      const pedido = await PedidoUnidad.create({
        fecha,
        usuario_id: new mongoose.Types.ObjectId(req.user._id),
        usuarioNombre: `${req.user.lastName}, ${req.user.name}`,
        items: pedidoItems,
      });

      return res.status(201).json({
        message: "Pedido de unidades generado correctamente",
        data: pedido,
      });
    } catch (error) {
      logError("PedidoUnidadController.create");
      console.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo generar el pedido de unidades",
      });
    }
  };

  static update = async (req: Request, res: Response) => {
    const { fecha, items } = req.body as {
      fecha?: string;
      items?: PedidoUnidadPayloadItem[];
    };

    if (!isValidFecha(fecha)) {
      return res.status(400).json({ error: "La fecha es obligatoria y debe tener formato YYYY-MM-DD" });
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Debes ingresar al menos una unidad" });
    }

    try {
      const pedido = await PedidoUnidad.findById(req.params.id);

      if (!pedido) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const pedidoItems = await buildPedidoItems(items);

      pedido.fecha = fecha;
      pedido.items = pedidoItems;
      await pedido.save();

      return res.status(200).json({
        message: "Pedido de unidades actualizado correctamente",
        data: pedido,
      });
    } catch (error) {
      logError("PedidoUnidadController.update");
      console.error(error);
      return res.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo actualizar el pedido de unidades",
      });
    }
  };
}
