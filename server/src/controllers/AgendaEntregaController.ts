import type { Request, Response } from "express";
import mongoose from "mongoose";
import AgendaEntrega from "../models/AgendaEntrega";
import AgendaEntregaLog, { type AgendaEntregaLogAction } from "../models/AgendaEntregaLog";
import SucursalEntrega from "../models/SucursalEntrega";
import {
  lookupAgendaEntregaInterno,
  lookupAgendaEntregaInternos,
  type AgendaEntregaLookup,
} from "../services/agendaEntregaSiac.service";
import { normalizeRoles } from "../constants/roleAccess";
import { logError } from "../utils/logError";

type AgendaPayload = {
  interno?: unknown;
  sucursal?: unknown;
  fechaAgenda?: unknown;
  horaAgenda?: unknown;
  equipado?: unknown;
  entregaUsado?: unknown;
  observaciones?: unknown;
};

const OBSERVACIONES_MAX_LENGTH = 1000;
const ENTREGADO_STATES = new Set([35, 40]);
const ALLOWED_TIME_SLOTS = new Set(
  Array.from({ length: 18 }, (_, index) => {
    const totalMinutes = 9 * 60 + index * 30;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
  }),
);

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isValidObjectId = (value: unknown) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const isValidDateString = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTimeString = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const buildUserName = (req: Request) =>
  req.user ? `${req.user.lastName}, ${req.user.name}` : "";

const userHasAgendaWriteAccess = (req: Request) => {
  const roles = normalizeRoles(req.user?.role);
  return roles.includes("superadmin") || roles.includes("entregador");
};

const getAssignedSucursalEntregaId = (req: Request) =>
  req.user?.sucursalEntrega?._id ? String(req.user.sucursalEntrega._id) : "";

const ensureAgendaWriteAccess = (req: Request) => {
  if (!req.user?._id) {
    return "Usuario no autenticado";
  }

  if (!userHasAgendaWriteAccess(req)) {
    return "No tienes permisos para crear, editar o eliminar turnos de entrega";
  }

  return null;
};

const ensureSucursalAllowedForMutation = (req: Request, sucursalId: string) => {
  const roles = normalizeRoles(req.user?.role);

  if (roles.includes("superadmin")) {
    return null;
  }

  if (!roles.includes("entregador")) {
    return "No tienes permisos para operar sobre turnos de entrega";
  }

  const assignedSucursalId = getAssignedSucursalEntregaId(req);

  if (!assignedSucursalId) {
    return "El usuario entregador no tiene una sucursal de entrega asignada";
  }

  if (assignedSucursalId !== sucursalId) {
    return "Solo puedes operar turnos de tu sucursal de entrega asignada";
  }

  return null;
};

const formatLookupWithFallback = (interno: number) => ({
  siac: {
    interno,
    estado: null,
    tipoOperacion: "-",
    cliente: "-",
    vendedor: "-",
    version: null,
    modelo: null,
    color: "-",
  },
  siacSyncError: true,
  siacSyncMessage: "No se pudo obtener informacion actualizada desde SIAC",
});

const formatAgendaRow = (item: any, lookup?: AgendaEntregaLookup | null, lookupError?: string) => ({
  _id: String(item._id),
  interno: item.interno,
  tipoOperacion: item.tipoOperacion,
  sucursal: item.sucursal && typeof item.sucursal === "object"
    ? {
        _id: String(item.sucursal._id),
        nombre: item.sucursal.nombre,
        direccion: item.sucursal.direccion ?? "",
        activa: Boolean(item.sucursal.activa),
      }
    : null,
  fechaAgenda: item.fechaAgenda,
  horaAgenda: item.horaAgenda,
  equipado: Boolean(item.equipado),
  entregaUsado: Boolean(item.entregaUsado),
  observaciones: item.observaciones ?? "",
  createdBy: String(item.createdBy),
  createdByName: item.createdByName,
  updatedBy: item.updatedBy ? String(item.updatedBy) : null,
  updatedByName: item.updatedByName ?? "",
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  siac: lookup
    ? {
        interno: lookup.interno,
        estado: lookup.estado,
        tipoOperacion: lookup.tipoOperacion,
        operacion: lookup.operacion ?? null,
        grupo: lookup.grupo ?? null,
        orden: lookup.orden ?? null,
        cliente: lookup.cliente,
        vendedor: lookup.vendedor,
        version: lookup.version ?? null,
        modelo: lookup.modelo ?? null,
        chasis: lookup.chasis ?? null,
        serie: lookup.serie ?? null,
        nroFabricacion: lookup.nroFabricacion ?? null,
        color: lookup.color,
      }
    : formatLookupWithFallback(item.interno).siac,
  siacSyncError: !lookup,
  siacSyncMessage: !lookup ? lookupError ?? formatLookupWithFallback(item.interno).siacSyncMessage : "",
});

const buildAgendaDetailLabel = (
  sucursalNombre: string,
  fechaAgenda: string,
  horaAgenda: string,
  equipado: boolean,
  entregaUsado: boolean,
) =>
  `Sucursal: ${sucursalNombre} | Fecha: ${fechaAgenda} | Hora: ${horaAgenda} | Equipado: ${equipado ? "SI" : "NO"} | Entrega usado: ${entregaUsado ? "SI" : "NO"}`;

const createAgendaLog = async (params: {
  agendaEntrega: mongoose.Types.ObjectId | string | null;
  interno: number;
  accion: AgendaEntregaLogAction;
  usuario: string;
  usuarioNombre: string;
  detalle: string;
}) => {
  await AgendaEntregaLog.create({
    agendaEntrega: params.agendaEntrega,
    interno: params.interno,
    accion: params.accion,
    usuario: new mongoose.Types.ObjectId(params.usuario),
    usuarioNombre: params.usuarioNombre,
    fecha: new Date(),
    detalle: params.detalle,
  });
};

const validateAgendaPayload = async (
  payload: AgendaPayload,
  currentId?: string,
) => {
  const interno = Number(payload.interno);
  const sucursalId = typeof payload.sucursal === "string" ? payload.sucursal.trim() : "";
  const fechaAgenda = normalizeText(payload.fechaAgenda);
  const horaAgenda = normalizeText(payload.horaAgenda);
  const equipado = Boolean(payload.equipado);
  const entregaUsado = Boolean(payload.entregaUsado);
  const observaciones = normalizeText(payload.observaciones);

  if (!Number.isInteger(interno) || interno <= 0) {
    return { error: "El interno ingresado no es valido" };
  }

  if (!isValidObjectId(sucursalId)) {
    return { error: "La sucursal seleccionada no es valida" };
  }

  if (!isValidDateString(fechaAgenda)) {
    return { error: "La fecha de agenda es obligatoria y debe tener formato YYYY-MM-DD" };
  }

  if (!isValidTimeString(horaAgenda)) {
    return { error: "La hora de agenda es obligatoria y debe tener formato HH:mm" };
  }

  if (!ALLOWED_TIME_SLOTS.has(horaAgenda)) {
    return { error: "La hora de agenda debe ser un turno valido entre 09:00 y 17:30 cada 30 minutos" };
  }

  if (observaciones.length > OBSERVACIONES_MAX_LENGTH) {
    return {
      error: `Las observaciones no pueden superar los ${OBSERVACIONES_MAX_LENGTH} caracteres`,
    };
  }

  const [lookup, sucursal, duplicated] = await Promise.all([
    lookupAgendaEntregaInterno(interno),
    SucursalEntrega.findById(sucursalId).lean(),
    AgendaEntrega.findOne(
      currentId
        ? { interno, _id: { $ne: currentId } }
        : { interno },
    ).lean(),
  ]);

  if (!lookup) {
    return { error: "No se encontro informacion para el interno solicitado" };
  }

  if (ENTREGADO_STATES.has(Number(lookup.estado))) {
    return {
      error: `El interno ${interno} ya figura entregado en SIAC y no se puede agendar`,
    };
  }

  if (!sucursal) {
    return { error: "La sucursal seleccionada no existe" };
  }

  if (!sucursal.activa) {
    return { error: "La sucursal seleccionada esta inactiva" };
  }

  if (duplicated) {
    return {
      error: `El interno ${interno} ya esta agendado para ${duplicated.fechaAgenda} a las ${duplicated.horaAgenda}`,
    };
  }

  return {
    data: {
      interno,
      tipoOperacion: lookup.tipoOperacion,
      sucursalId,
      sucursalNombre: sucursal.nombre,
      fechaAgenda,
      horaAgenda,
      equipado,
      entregaUsado,
      observaciones,
      lookup,
    },
  };
};

export class AgendaEntregaController {
  static getInterno = async (req: Request, res: Response) => {
    const interno = Number(req.params.interno);

    if (!Number.isInteger(interno) || interno <= 0) {
      return res.status(400).json({ error: "El interno ingresado no es valido" });
    }

    try {
      const data = await lookupAgendaEntregaInterno(interno);

      if (!data) {
        return res.status(404).json({ error: "No se encontro el interno en Convencional ni en Plan de Ahorro" });
      }

      return res.status(200).json({ data });
    } catch (error) {
      logError("AgendaEntregaController.getInterno");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static list = async (req: Request, res: Response) => {
    try {
      const fecha = typeof req.query.fecha === "string" ? req.query.fecha.trim() : "";
      const sucursalId = typeof req.query.sucursalId === "string" ? req.query.sucursalId.trim() : "";
      const query: Record<string, unknown> = {};

      if (fecha && isValidDateString(fecha)) {
        query.fechaAgenda = fecha;
      }

      if (sucursalId && isValidObjectId(sucursalId)) {
        query.sucursal = sucursalId;
      }

      const agendas = await AgendaEntrega.find(query)
        .populate("sucursal", "nombre direccion activa")
        .sort({ fechaAgenda: 1, horaAgenda: 1, interno: 1 })
        .lean();

      const internos = agendas.map((agenda) => agenda.interno);
      let lookups = new Map<number, AgendaEntregaLookup>();
      let missing: number[] = [];

      try {
        const lookupResult = await lookupAgendaEntregaInternos(internos);
        lookups = lookupResult.data;
        missing = lookupResult.missing;
      } catch (error) {
        console.error(error);
        missing = internos;
      }

      return res.status(200).json({
        data: agendas.map((agenda) =>
          formatAgendaRow(
            agenda,
            lookups.get(agenda.interno) ?? null,
            missing.includes(agenda.interno)
              ? "No se pudo obtener informacion actualizada desde SIAC"
              : "",
          ),
        ),
      });
    } catch (error) {
      logError("AgendaEntregaController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar agendas de entrega" });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const agendaId = String(req.params.id);
      const agenda = await AgendaEntrega.findById(agendaId)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      if (!agenda) {
        return res.status(404).json({ error: "Agenda no encontrada" });
      }

      let lookup: AgendaEntregaLookup | null = null;
      let lookupError = "";

      try {
        lookup = await lookupAgendaEntregaInterno(agenda.interno);
        if (!lookup) {
          lookupError = "No se pudo obtener informacion actualizada desde SIAC";
        }
      } catch (error) {
        console.error(error);
        lookupError = "No se pudo obtener informacion actualizada desde SIAC";
      }

      return res.status(200).json({
        data: formatAgendaRow(agenda, lookup, lookupError),
      });
    } catch (error) {
      logError("AgendaEntregaController.getById");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener la agenda de entrega" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const validation = await validateAgendaPayload(req.body ?? {});
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const sucursalAccessError = ensureSucursalAllowedForMutation(req, validation.data.sucursalId);
      if (sucursalAccessError) {
        return res.status(403).json({ error: sucursalAccessError });
      }

      const usuarioNombre = buildUserName(req);

      const agenda = await AgendaEntrega.create({
        interno: validation.data.interno,
        tipoOperacion: validation.data.lookup.tipoOperacion,
        sucursal: new mongoose.Types.ObjectId(validation.data.sucursalId),
        fechaAgenda: validation.data.fechaAgenda,
        horaAgenda: validation.data.horaAgenda,
        equipado: validation.data.equipado,
        entregaUsado: validation.data.entregaUsado,
        observaciones: validation.data.observaciones,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        createdByName: usuarioNombre,
      });

      await createAgendaLog({
        agendaEntrega: agenda._id,
        interno: agenda.interno,
        accion: "CREADA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: buildAgendaDetailLabel(
          validation.data.sucursalNombre,
          validation.data.fechaAgenda,
          validation.data.horaAgenda,
          validation.data.equipado,
          validation.data.entregaUsado,
        ),
      });

      const populated = await AgendaEntrega.findById(agenda._id)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      return res.status(201).json({
        message: "Agenda de entrega creada correctamente",
        data: populated ? formatAgendaRow(populated, validation.data.lookup) : null,
      });
    } catch (error: any) {
      logError("AgendaEntregaController.create");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ese interno ya esta agendado" });
      }

      return res.status(500).json({ message: "Error al crear la agenda de entrega" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const agendaId = String(req.params.id);
      const agenda = await AgendaEntrega.findById(agendaId)
        .populate("sucursal", "nombre")
        .lean();

      if (!agenda) {
        return res.status(404).json({ error: "Agenda no encontrada" });
      }

      const currentSucursalId = String((agenda.sucursal as any)?._id ?? agenda.sucursal ?? "");
      const currentSucursalAccessError = ensureSucursalAllowedForMutation(req, currentSucursalId);
      if (currentSucursalAccessError) {
        return res.status(403).json({ error: currentSucursalAccessError });
      }

      const validation = await validateAgendaPayload(req.body ?? {}, agendaId);
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const nextSucursalAccessError = ensureSucursalAllowedForMutation(req, validation.data.sucursalId);
      if (nextSucursalAccessError) {
        return res.status(403).json({ error: nextSucursalAccessError });
      }

      const usuarioNombre = buildUserName(req);
      const changes: string[] = [];

      if (agenda.interno !== validation.data.interno) {
        changes.push(`Interno: ${agenda.interno} -> ${validation.data.interno}`);
      }
      if (String((agenda.sucursal as any)?._id ?? agenda.sucursal) !== validation.data.sucursalId) {
        changes.push(
          `Sucursal: ${((agenda.sucursal as any)?.nombre ?? "-")} -> ${validation.data.sucursalNombre}`,
        );
      }
      if (agenda.fechaAgenda !== validation.data.fechaAgenda) {
        changes.push(`Fecha: ${agenda.fechaAgenda} -> ${validation.data.fechaAgenda}`);
      }
      if (agenda.horaAgenda !== validation.data.horaAgenda) {
        changes.push(`Hora: ${agenda.horaAgenda} -> ${validation.data.horaAgenda}`);
      }
      if (Boolean(agenda.equipado) !== validation.data.equipado) {
        changes.push(`Equipado: ${agenda.equipado ? "SI" : "NO"} -> ${validation.data.equipado ? "SI" : "NO"}`);
      }
      if (Boolean(agenda.entregaUsado) !== validation.data.entregaUsado) {
        changes.push(`Entrega usado: ${agenda.entregaUsado ? "SI" : "NO"} -> ${validation.data.entregaUsado ? "SI" : "NO"}`);
      }
      if ((agenda.observaciones ?? "") !== validation.data.observaciones) {
        changes.push("Observaciones actualizadas");
      }

      const updated = await AgendaEntrega.findByIdAndUpdate(
        agendaId,
        {
          interno: validation.data.interno,
          tipoOperacion: validation.data.lookup.tipoOperacion,
          sucursal: new mongoose.Types.ObjectId(validation.data.sucursalId),
          fechaAgenda: validation.data.fechaAgenda,
          horaAgenda: validation.data.horaAgenda,
          equipado: validation.data.equipado,
          entregaUsado: validation.data.entregaUsado,
          observaciones: validation.data.observaciones,
          updatedBy: new mongoose.Types.ObjectId(req.user._id),
          updatedByName: usuarioNombre,
        },
        { new: true },
      )
        .populate("sucursal", "nombre direccion activa")
        .lean();

      await createAgendaLog({
        agendaEntrega: agendaId,
        interno: validation.data.interno,
        accion: "MODIFICADA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: changes.length ? changes.join(" | ") : "Sin cambios relevantes en campos visibles",
      });

      return res.status(200).json({
        message: "Agenda de entrega actualizada correctamente",
        data: updated ? formatAgendaRow(updated, validation.data.lookup) : null,
      });
    } catch (error: any) {
      logError("AgendaEntregaController.update");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ese interno ya esta agendado" });
      }

      return res.status(500).json({ message: "Error al actualizar la agenda de entrega" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const agendaId = String(req.params.id);
      const agenda = await AgendaEntrega.findById(agendaId)
        .populate("sucursal", "nombre")
        .lean();

      if (!agenda) {
        return res.status(404).json({ error: "Agenda no encontrada" });
      }

      const sucursalAccessError = ensureSucursalAllowedForMutation(
        req,
        String((agenda.sucursal as any)?._id ?? agenda.sucursal ?? ""),
      );
      if (sucursalAccessError) {
        return res.status(403).json({ error: sucursalAccessError });
      }

      const lookup = await lookupAgendaEntregaInterno(agenda.interno);
      if (lookup && ENTREGADO_STATES.has(Number(lookup.estado))) {
        return res.status(400).json({
          error: `El interno ${agenda.interno} ya figura entregado en SIAC y no se puede eliminar de la agenda`,
        });
      }

      await AgendaEntrega.findByIdAndDelete(agendaId);

      await createAgendaLog({
        agendaEntrega: agenda._id,
        interno: agenda.interno,
        accion: "ELIMINADA",
        usuario: req.user._id,
        usuarioNombre: buildUserName(req),
        detalle: buildAgendaDetailLabel(
          (agenda.sucursal as any)?.nombre ?? "-",
          agenda.fechaAgenda,
          agenda.horaAgenda,
          Boolean(agenda.equipado),
          Boolean(agenda.entregaUsado),
        ),
      });

      return res.status(200).json({ message: "Agenda de entrega eliminada correctamente" });
    } catch (error) {
      logError("AgendaEntregaController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar la agenda de entrega" });
    }
  };
}
