import type { Request, Response } from "express";
import AgendaEntregaLog from "../models/AgendaEntregaLog";
import { logError } from "../utils/logError";

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatLog = (item: any) => ({
  _id: String(item._id),
  agendaEntrega: item.agendaEntrega ? String(item.agendaEntrega) : null,
  interno: item.interno,
  accion: item.accion,
  usuario: item.usuario ? String(item.usuario) : null,
  usuarioNombre: item.usuarioNombre,
  fecha: item.fecha,
  detalle: item.detalle ?? "",
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export class AgendaEntregaLogController {
  static list = async (req: Request, res: Response) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const skip = (page - 1) * limit;
      const interno = typeof req.query.interno === "string" ? req.query.interno.trim() : "";
      const usuario = typeof req.query.usuario === "string" ? req.query.usuario.trim() : "";
      const from = typeof req.query.from === "string" ? req.query.from.trim() : "";
      const to = typeof req.query.to === "string" ? req.query.to.trim() : "";

      const query: Record<string, unknown> = {};

      if (interno) {
        const internoNumber = Number(interno);
        if (Number.isInteger(internoNumber) && internoNumber > 0) {
          query.interno = internoNumber;
        }
      }

      if (usuario) {
        query.usuarioNombre = { $regex: escapeRegex(usuario), $options: "i" };
      }

      if (from || to) {
        query.fecha = {};

        if (from) {
          (query.fecha as Record<string, unknown>).$gte = new Date(`${from}T00:00:00.000Z`);
        }

        if (to) {
          (query.fecha as Record<string, unknown>).$lte = new Date(`${to}T23:59:59.999Z`);
        }
      }

      const [data, total] = await Promise.all([
        AgendaEntregaLog.find(query)
          .sort({ fecha: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AgendaEntregaLog.countDocuments(query),
      ]);

      return res.status(200).json({
        data: data.map(formatLog),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
      });
    } catch (error) {
      logError("AgendaEntregaLogController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar registros de auditoria" });
    }
  };
}
