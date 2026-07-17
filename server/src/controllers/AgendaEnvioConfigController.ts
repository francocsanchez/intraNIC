import type { Request, Response } from "express";
import mongoose from "mongoose";
import AgendaEnvioConfig from "../models/AgendaEnvioConfig";
import SucursalEntrega from "../models/SucursalEntrega";
import { hasSuperAdminRole } from "../constants/roleAccess";
import { logError } from "../utils/logError";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const normalizeEmail = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const isValidObjectId = (value: unknown) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const ensureAccess = (req: Request) => {
  if (!req.user?._id) {
    return "Usuario no autenticado";
  }

  if (!hasSuperAdminRole(req.user.role)) {
    return "Solo superAdmin puede administrar el envio automatico de agendas";
  }

  return null;
};

const formatConfig = (item: any) => ({
  _id: String(item._id),
  sucursal: item.sucursal && typeof item.sucursal === "object"
    ? {
        _id: String(item.sucursal._id),
        nombre: item.sucursal.nombre,
        direccion: item.sucursal.direccion ?? "",
        activa: Boolean(item.sucursal.activa),
      }
    : null,
  emails: Array.isArray(item.emails)
    ? item.emails
      .map((email: unknown) => normalizeEmail(email))
      .filter(Boolean)
    : [],
  activo: Boolean(item.activo),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const parseEmails = (value: unknown) => {
  if (!Array.isArray(value)) {
    return { error: "Debes enviar una lista de emails" as const };
  }

  const normalized = value.map((entry) => normalizeEmail(entry));

  if (normalized.some((email) => !email)) {
    return { error: "No se permiten emails vacios" as const };
  }

  if (normalized.some((email) => !EMAIL_REGEX.test(email))) {
    return { error: "Uno o mas emails no tienen un formato valido" as const };
  }

  const uniqueEmails = Array.from(new Set(normalized));

  if (uniqueEmails.length !== normalized.length) {
    return { error: "No se permiten emails duplicados" as const };
  }

  return { data: uniqueEmails };
};

export class AgendaEnvioConfigController {
  static list = async (_req: Request, res: Response) => {
    try {
      const [sucursales, configs] = await Promise.all([
        SucursalEntrega.find({}).sort({ activa: -1, nombre: 1 }).lean(),
        AgendaEnvioConfig.find({})
          .populate("sucursal", "nombre direccion activa")
          .lean(),
      ]);

      const configBySucursalId = new Map(
        configs
          .filter((item) => item.sucursal)
          .map((item) => [String((item.sucursal as any)._id ?? item.sucursal), item]),
      );

      const data = sucursales.map((sucursal) => {
        const existing = configBySucursalId.get(String(sucursal._id));

        if (existing) {
          return formatConfig(existing);
        }

        return {
          _id: `virtual-${String(sucursal._id)}`,
          sucursal: {
            _id: String(sucursal._id),
            nombre: sucursal.nombre,
            direccion: sucursal.direccion ?? "",
            activa: Boolean(sucursal.activa),
          },
          emails: [],
          activo: true,
          createdAt: sucursal.createdAt,
          updatedAt: sucursal.updatedAt,
        };
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("AgendaEnvioConfigController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener la configuracion de envio de agenda" });
    }
  };

  static upsert = async (req: Request, res: Response) => {
    const accessError = ensureAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const sucursalId = String(req.params.sucursalId ?? "").trim();

      if (!isValidObjectId(sucursalId)) {
        return res.status(400).json({ error: "La sucursal seleccionada no es valida" });
      }

      const sucursal = await SucursalEntrega.findById(sucursalId).lean();

      if (!sucursal) {
        return res.status(404).json({ error: "La sucursal seleccionada no existe" });
      }

      const emailsResult = parseEmails(req.body?.emails);
      if ("error" in emailsResult) {
        return res.status(400).json({ error: emailsResult.error });
      }

      const activo = req.body?.activo === undefined ? true : Boolean(req.body.activo);

      const config = await AgendaEnvioConfig.findOneAndUpdate(
        { sucursal: new mongoose.Types.ObjectId(sucursalId) },
        {
          sucursal: new mongoose.Types.ObjectId(sucursalId),
          emails: emailsResult.data,
          activo,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
        .populate("sucursal", "nombre direccion activa")
        .lean();

      return res.status(200).json({
        message: "Configuracion de envio de agenda guardada correctamente",
        data: config ? formatConfig(config) : null,
      });
    } catch (error: any) {
      logError("AgendaEnvioConfigController.upsert");
      console.error(error);
      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ya existe una configuracion para esa sucursal" });
      }

      return res.status(500).json({ message: "Error al guardar la configuracion de envio de agenda" });
    }
  };
}
