import type { Request, Response } from "express";
import mongoose from "mongoose";
import AgendaEntrega from "../models/AgendaEntrega";
import AgendaEntregaLog from "../models/AgendaEntregaLog";
import PendienteTurnar from "../models/PendienteTurnar";
import SucursalEntrega from "../models/SucursalEntrega";
import {
  lookupAgendaEntregaInterno,
  lookupAgendaEntregaInternos,
  type AgendaEntregaLookup,
} from "../services/agendaEntregaSiac.service";
import { normalizeRoles } from "../constants/roleAccess";
import { logError } from "../utils/logError";

type PendientePayload = {
  interno?: unknown;
  sucursal?: unknown;
  equipado?: unknown;
  entregaUsado?: unknown;
  siniestro?: unknown;
  observaciones?: unknown;
};

type TurnarPendientePayload = PendientePayload & {
  fechaAgenda?: unknown;
  horaAgenda?: unknown;
};

type SucursalValidationResult =
  | { error: string }
  | {
      data: {
        sucursalId: string;
        sucursalNombre: string;
        sucursal: any;
      };
    };

type PendienteValidationResult =
  | { error: string }
  | {
      data: {
        interno: number;
        tipoOperacion: string;
        sucursalId: string;
        sucursalNombre: string;
        equipado: boolean;
        entregaUsado: boolean;
        siniestro: boolean;
        observaciones: string;
        lookup: AgendaEntregaLookup;
      };
    };

type TurnarValidationResult =
  | { error: string }
  | {
      data: {
        interno: number;
        tipoOperacion: string;
        sucursalId: string;
        sucursalNombre: string;
        fechaAgenda: string;
        horaAgenda: string;
        equipado: boolean;
        entregaUsado: boolean;
        siniestro: boolean;
        observaciones: string;
        lookup: AgendaEntregaLookup;
      };
    };

type PendienteLean = {
  _id: mongoose.Types.ObjectId | string;
  interno: number;
  tipoOperacion?: string;
  sucursal: any;
  equipado?: boolean;
  entregaUsado?: boolean;
  siniestro?: boolean;
  observaciones?: string;
  createdBy: mongoose.Types.ObjectId | string;
  createdByName: string;
  updatedBy?: mongoose.Types.ObjectId | string | null;
  updatedByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const OBSERVACIONES_MAX_LENGTH = 1000;
const ENTREGADO_STATES = new Set([35, 40]);
const TIME_SLOT_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});
const ALLOWED_TIME_SLOTS = new Set(TIME_SLOT_OPTIONS);

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isValidObjectId = (value: unknown) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const isValidDateString = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTimeString = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const getSucursalHorariosHabilitados = (sucursal: any) => {
  if (!Array.isArray(sucursal?.horariosHabilitados)) {
    return TIME_SLOT_OPTIONS;
  }

  const available = new Set(
    sucursal.horariosHabilitados
      .map((entry: unknown) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry: string) => ALLOWED_TIME_SLOTS.has(entry)),
  );

  return TIME_SLOT_OPTIONS.filter((timeSlot) => available.has(timeSlot));
};

const buildUserName = (req: Request) =>
  req.user ? `${req.user.lastName}, ${req.user.name}` : "";

const getAssignedSucursalEntregaId = (req: Request) =>
  req.user?.sucursalEntrega?._id ? String(req.user.sucursalEntrega._id) : "";

const userHasAgendaWriteAccess = (req: Request) => {
  const roles = normalizeRoles(req.user?.role);
  return roles.includes("superadmin") || roles.includes("coordinador");
};

const ensureAgendaWriteAccess = (req: Request) => {
  if (!req.user?._id) {
    return "Usuario no autenticado";
  }

  if (!userHasAgendaWriteAccess(req)) {
    return "No tienes permisos para crear, editar o eliminar pendientes o turnos de entrega";
  }

  return null;
};

const ensureSucursalAllowedForMutation = (req: Request, sucursalId: string) => {
  const roles = normalizeRoles(req.user?.role);

  if (roles.includes("superadmin")) {
    return null;
  }

  if (!roles.includes("coordinador")) {
    return "No tienes permisos para operar registros de entrega";
  }

  const assignedSucursalId = getAssignedSucursalEntregaId(req);

  if (!assignedSucursalId) {
    return "El usuario coordinador no tiene una sucursal de entrega asignada";
  }

  if (assignedSucursalId !== sucursalId) {
    return "Solo puedes operar registros de tu sucursal de entrega asignada";
  }

  return null;
};

const buildAgendaDetailLabel = (
  sucursalNombre: string,
  fechaAgenda: string,
  horaAgenda: string,
  equipado: boolean,
  entregaUsado: boolean,
  siniestro: boolean,
  observaciones: string,
) => {
  const details = [
    `Sucursal: ${sucursalNombre}`,
    `Fecha: ${fechaAgenda}`,
    `Hora: ${horaAgenda}`,
    `Equipado: ${equipado ? "SI" : "NO"}`,
    `Entrega usado: ${entregaUsado ? "SI" : "NO"}`,
    `Siniestro: ${siniestro ? "SI" : "NO"}`,
  ];

  if (observaciones.trim()) {
    details.push(`Observaciones: ${observaciones.trim()}`);
  }

  return details.join(" | ");
};

const formatPendienteRow = (
  item: PendienteLean,
  lookup?: AgendaEntregaLookup | null,
  lookupError?: string,
) => ({
  _id: String(item._id),
  interno: item.interno,
  tipoOperacion: item.tipoOperacion ?? "",
  sucursal:
    item.sucursal && typeof item.sucursal === "object"
      ? {
          _id: String(item.sucursal._id),
          nombre: item.sucursal.nombre,
          direccion: item.sucursal.direccion ?? "",
          activa: Boolean(item.sucursal.activa),
        }
      : null,
  equipado: Boolean(item.equipado),
  entregaUsado: Boolean(item.entregaUsado),
  siniestro: Boolean(item.siniestro),
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
        telefono: lookup.telefono ?? null,
        vendedor: lookup.vendedor,
        version: lookup.version ?? null,
        modelo: lookup.modelo ?? null,
        chasis: lookup.chasis ?? null,
        serie: lookup.serie ?? null,
        nroFabricacion: lookup.nroFabricacion ?? null,
        color: lookup.color,
      }
    : null,
  siacSyncError: !lookup,
  siacSyncMessage: !lookup ? lookupError ?? "No se pudo obtener informacion actualizada desde SIAC" : "",
});

const validateSucursal = async (
  sucursalValue: unknown,
  currentSucursalId = "",
): Promise<SucursalValidationResult> => {
  const sucursalId = typeof sucursalValue === "string" ? sucursalValue.trim() : "";

  if (!isValidObjectId(sucursalId)) {
    return { error: "La sucursal seleccionada no es valida" };
  }

  const sucursal = await SucursalEntrega.findById(sucursalId).lean();
  if (!sucursal) {
    return { error: "La sucursal seleccionada no existe" };
  }

  const preservesCurrentSucursal = currentSucursalId && currentSucursalId === sucursalId;
  if (!sucursal.activa && !preservesCurrentSucursal) {
    return { error: "La sucursal seleccionada esta inactiva" };
  }

  return {
    data: {
      sucursalId,
      sucursalNombre: sucursal.nombre,
      sucursal,
    },
  };
};

const validatePendientePayload = async (
  payload: PendientePayload,
  currentId?: string,
): Promise<PendienteValidationResult> => {
  const interno = Number(payload.interno);
  const equipado = Boolean(payload.equipado);
  const entregaUsado = Boolean(payload.entregaUsado);
  const siniestro = Boolean(payload.siniestro);
  const observaciones = normalizeText(payload.observaciones);
  const currentPendiente = currentId ? await PendienteTurnar.findById(currentId).lean() : null;
  const currentSucursalId = currentPendiente ? String(currentPendiente.sucursal) : "";

  if (!Number.isInteger(interno) || interno <= 0) {
    return { error: "El interno ingresado no es valido" };
  }

  if (observaciones.length > OBSERVACIONES_MAX_LENGTH) {
    return { error: `Las observaciones no pueden superar los ${OBSERVACIONES_MAX_LENGTH} caracteres` };
  }

  const sucursalValidation = await validateSucursal(payload.sucursal, currentSucursalId);
  if ("error" in sucursalValidation) {
    return sucursalValidation;
  }

  const duplicatedPendiente = await PendienteTurnar.findOne(
    currentId ? { interno, _id: { $ne: currentId } } : { interno },
  ).lean();
  if (duplicatedPendiente) {
    return { error: "Ese interno ya esta cargado en pendientes de turnar" };
  }

  const duplicatedAgenda = await AgendaEntrega.findOne(
    currentId
      ? { tipoRegistro: "turno", interno }
      : { tipoRegistro: "turno", interno },
  ).lean();
  if (duplicatedAgenda) {
    return {
      error: `El interno ${interno} ya esta agendado para ${duplicatedAgenda.fechaAgenda} a las ${duplicatedAgenda.horaAgenda}`,
    };
  }

  const lookup = await lookupAgendaEntregaInterno(interno);
  if (!lookup) {
    return { error: "No se encontro informacion para el interno solicitado" };
  }

  if (ENTREGADO_STATES.has(Number(lookup.estado))) {
    return { error: `El interno ${interno} ya figura entregado en SIAC y no se puede cargar` };
  }

  return {
    data: {
      interno,
      tipoOperacion: lookup.tipoOperacion,
      sucursalId: sucursalValidation.data.sucursalId,
      sucursalNombre: sucursalValidation.data.sucursalNombre,
      equipado,
      entregaUsado,
      siniestro,
      observaciones,
      lookup,
    },
  };
};

const validateTurnarPayload = async (
  payload: TurnarPendientePayload,
  pendiente: any,
): Promise<TurnarValidationResult> => {
  const interno = Number(payload.interno);
  const equipado = Boolean(payload.equipado);
  const entregaUsado = Boolean(payload.entregaUsado);
  const siniestro = Boolean(payload.siniestro);
  const observaciones = normalizeText(payload.observaciones);
  const fechaAgenda = normalizeText(payload.fechaAgenda);
  const horaAgenda = normalizeText(payload.horaAgenda);
  const currentSucursalId = String((pendiente.sucursal as any)?._id ?? pendiente.sucursal ?? "");

  if (!Number.isInteger(interno) || interno <= 0) {
    return { error: "El interno ingresado no es valido" };
  }

  if (observaciones.length > OBSERVACIONES_MAX_LENGTH) {
    return { error: `Las observaciones no pueden superar los ${OBSERVACIONES_MAX_LENGTH} caracteres` };
  }

  const sucursalValidation = await validateSucursal(payload.sucursal, currentSucursalId);
  if ("error" in sucursalValidation) {
    return sucursalValidation;
  }

  if (!isValidDateString(fechaAgenda)) {
    return { error: "La fecha de agenda es obligatoria y debe tener formato YYYY-MM-DD" };
  }

  if (!isValidTimeString(horaAgenda)) {
    return { error: "La hora de agenda es obligatoria y debe tener formato HH:mm" };
  }

  if (!ALLOWED_TIME_SLOTS.has(horaAgenda)) {
    return { error: "La hora de agenda debe ser un turno valido entre 08:00 y 18:00 cada 30 minutos" };
  }

  const horariosHabilitados = getSucursalHorariosHabilitados(sucursalValidation.data.sucursal);
  if (!horariosHabilitados.includes(horaAgenda)) {
    return { error: `La hora ${horaAgenda} no esta habilitada para la sucursal seleccionada` };
  }

  const duplicatedAgenda = await AgendaEntrega.findOne({ tipoRegistro: "turno", interno }).lean();
  if (duplicatedAgenda) {
    return {
      error: `El interno ${interno} ya esta agendado para ${duplicatedAgenda.fechaAgenda} a las ${duplicatedAgenda.horaAgenda}`,
    };
  }

  const lookup = await lookupAgendaEntregaInterno(interno);
  if (!lookup) {
    return { error: "No se encontro informacion para el interno solicitado" };
  }

  if (ENTREGADO_STATES.has(Number(lookup.estado))) {
    return { error: `El interno ${interno} ya figura entregado en SIAC y no se puede agendar` };
  }

  return {
    data: {
      interno,
      tipoOperacion: lookup.tipoOperacion,
      sucursalId: sucursalValidation.data.sucursalId,
      sucursalNombre: sucursalValidation.data.sucursalNombre,
      fechaAgenda,
      horaAgenda,
      equipado,
      entregaUsado,
      siniestro,
      observaciones,
      lookup,
    },
  };
};

const createAgendaLog = async (params: {
  agendaEntrega: mongoose.Types.ObjectId | string;
  interno: number;
  usuario: string;
  usuarioNombre: string;
  detalle: string;
}) => {
  await AgendaEntregaLog.create({
    agendaEntrega: params.agendaEntrega,
    interno: params.interno,
    accion: "CREADA",
    usuario: new mongoose.Types.ObjectId(params.usuario),
    usuarioNombre: params.usuarioNombre,
    fecha: new Date(),
    detalle: params.detalle,
  });
};

export class PendienteTurnarController {
  static list = async (req: Request, res: Response) => {
    try {
      const sucursalId = typeof req.query.sucursalId === "string" ? req.query.sucursalId.trim() : "";
      const query: Record<string, unknown> = {};

      if (sucursalId && isValidObjectId(sucursalId)) {
        query.sucursal = sucursalId;
      }

      const pendientes = await PendienteTurnar.find(query)
        .populate("sucursal", "nombre direccion activa")
        .sort({ createdAt: 1, interno: 1 })
        .lean();

      const internos = pendientes
        .map((pendiente) => Number(pendiente.interno))
        .filter((interno) => Number.isInteger(interno) && interno > 0);
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
        data: pendientes.map((pendiente) =>
          formatPendienteRow(
            pendiente as PendienteLean,
            lookups.get(Number(pendiente.interno)) ?? null,
            missing.includes(Number(pendiente.interno))
              ? "No se pudo obtener informacion actualizada desde SIAC"
              : "",
          ),
        ),
      });
    } catch (error) {
      logError("PendienteTurnarController.list");
      console.error(error);
      return res.status(500).json({ message: "Error al listar pendientes de turnar" });
    }
  };

  static create = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const validation = await validatePendientePayload(req.body ?? {});
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const sucursalAccessError = ensureSucursalAllowedForMutation(req, validation.data.sucursalId);
      if (sucursalAccessError) {
        return res.status(403).json({ error: sucursalAccessError });
      }

      const usuarioNombre = buildUserName(req);
      const pendiente = await PendienteTurnar.create({
        interno: validation.data.interno,
        tipoOperacion: validation.data.tipoOperacion,
        sucursal: new mongoose.Types.ObjectId(validation.data.sucursalId),
        equipado: validation.data.equipado,
        entregaUsado: validation.data.entregaUsado,
        siniestro: validation.data.siniestro,
        observaciones: validation.data.observaciones,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        createdByName: usuarioNombre,
      });

      const populated = await PendienteTurnar.findById(pendiente._id)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      return res.status(201).json({
        message: "Pendiente de turnar creado correctamente",
        data: populated ? formatPendienteRow(populated as PendienteLean, validation.data.lookup) : null,
      });
    } catch (error: any) {
      logError("PendienteTurnarController.create");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ese interno ya esta cargado en pendientes de turnar" });
      }

      return res.status(500).json({ message: "Error al crear el pendiente de turnar" });
    }
  };

  static update = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const pendienteId = String(req.params.id);
      const pendiente = await PendienteTurnar.findById(pendienteId)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      if (!pendiente) {
        return res.status(404).json({ error: "Pendiente de turnar no encontrado" });
      }

      const currentSucursalId = String((pendiente.sucursal as any)?._id ?? pendiente.sucursal ?? "");
      const currentSucursalAccessError = ensureSucursalAllowedForMutation(req, currentSucursalId);
      if (currentSucursalAccessError) {
        return res.status(403).json({ error: currentSucursalAccessError });
      }

      const validation = await validatePendientePayload(req.body ?? {}, pendienteId);
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const nextSucursalAccessError = ensureSucursalAllowedForMutation(req, validation.data.sucursalId);
      if (nextSucursalAccessError) {
        return res.status(403).json({ error: nextSucursalAccessError });
      }

      const updated = await PendienteTurnar.findByIdAndUpdate(
        pendienteId,
        {
          interno: validation.data.interno,
          tipoOperacion: validation.data.tipoOperacion,
          sucursal: new mongoose.Types.ObjectId(validation.data.sucursalId),
          equipado: validation.data.equipado,
          entregaUsado: validation.data.entregaUsado,
          siniestro: validation.data.siniestro,
          observaciones: validation.data.observaciones,
          updatedBy: new mongoose.Types.ObjectId(req.user._id),
          updatedByName: buildUserName(req),
        },
        { new: true },
      )
        .populate("sucursal", "nombre direccion activa")
        .lean();

      return res.status(200).json({
        message: "Pendiente de turnar actualizado correctamente",
        data: updated ? formatPendienteRow(updated as PendienteLean, validation.data.lookup) : null,
      });
    } catch (error: any) {
      logError("PendienteTurnarController.update");
      console.error(error);

      if (error?.code === 11000) {
        return res.status(409).json({ error: "Ese interno ya esta cargado en pendientes de turnar" });
      }

      return res.status(500).json({ message: "Error al actualizar el pendiente de turnar" });
    }
  };

  static remove = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const pendienteId = String(req.params.id);
      const pendiente = await PendienteTurnar.findById(pendienteId)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      if (!pendiente) {
        return res.status(404).json({ error: "Pendiente de turnar no encontrado" });
      }

      const sucursalAccessError = ensureSucursalAllowedForMutation(
        req,
        String((pendiente.sucursal as any)?._id ?? pendiente.sucursal ?? ""),
      );
      if (sucursalAccessError) {
        return res.status(403).json({ error: sucursalAccessError });
      }

      await PendienteTurnar.findByIdAndDelete(pendienteId);

      return res.status(200).json({
        message: "Pendiente de turnar eliminado correctamente",
      });
    } catch (error) {
      logError("PendienteTurnarController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el pendiente de turnar" });
    }
  };

  static turnar = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const pendienteId = String(req.params.id);
      const pendiente = await PendienteTurnar.findById(pendienteId)
        .populate("sucursal", "nombre direccion activa horariosHabilitados")
        .lean();

      if (!pendiente) {
        return res.status(404).json({ error: "Pendiente de turnar no encontrado" });
      }

      const currentSucursalId = String((pendiente.sucursal as any)?._id ?? pendiente.sucursal ?? "");
      const currentSucursalAccessError = ensureSucursalAllowedForMutation(req, currentSucursalId);
      if (currentSucursalAccessError) {
        return res.status(403).json({ error: currentSucursalAccessError });
      }

      const validation = await validateTurnarPayload(req.body ?? {}, pendiente);
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const nextSucursalAccessError = ensureSucursalAllowedForMutation(req, validation.data.sucursalId);
      if (nextSucursalAccessError) {
        return res.status(403).json({ error: nextSucursalAccessError });
      }

      const usuarioNombre = buildUserName(req);
      const agenda = await AgendaEntrega.create({
        tipoRegistro: "turno",
        interno: validation.data.interno,
        tipoOperacion: validation.data.lookup.tipoOperacion,
        sucursal: new mongoose.Types.ObjectId(validation.data.sucursalId),
        fechaAgenda: validation.data.fechaAgenda,
        horaAgenda: validation.data.horaAgenda,
        equipado: validation.data.equipado,
        entregaUsado: validation.data.entregaUsado,
        siniestro: validation.data.siniestro,
        observaciones: validation.data.observaciones,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        createdByName: usuarioNombre,
      });

      await PendienteTurnar.findByIdAndDelete(pendienteId);

      await createAgendaLog({
        agendaEntrega: agenda._id,
        interno: validation.data.interno,
        usuario: req.user._id,
        usuarioNombre,
        detalle: `${buildAgendaDetailLabel(
          validation.data.sucursalNombre,
          validation.data.fechaAgenda,
          validation.data.horaAgenda,
          validation.data.equipado,
          validation.data.entregaUsado,
          validation.data.siniestro,
          validation.data.observaciones,
        )} | Origen: Pendiente de turnar`,
      });

      const populated = await AgendaEntrega.findById(agenda._id)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      return res.status(200).json({
        message: "Turno agendado correctamente desde pendientes",
        data: populated
          ? {
              _id: String(populated._id),
              tipoRegistro: populated.tipoRegistro === "reserva" ? "reserva" : "turno",
              interno: populated.interno ?? null,
              tipoOperacion: populated.tipoOperacion ?? "",
              sucursal: populated.sucursal && typeof populated.sucursal === "object"
                ? {
                    _id: String((populated.sucursal as any)._id),
                    nombre: (populated.sucursal as any).nombre,
                    direccion: (populated.sucursal as any).direccion ?? "",
                    activa: Boolean((populated.sucursal as any).activa),
                  }
                : null,
              fechaAgenda: populated.fechaAgenda,
              horaAgenda: populated.horaAgenda,
              equipado: Boolean(populated.equipado),
              entregaUsado: Boolean(populated.entregaUsado),
              siniestro: Boolean((populated as any).siniestro),
              entregadaPorMarcada: Boolean(populated.entregadaPorMarcada),
              entregadaPorUser: populated.entregadaPorUser ? String(populated.entregadaPorUser) : null,
              entregadaPorNombre: populated.entregadaPorNombre ?? "",
              entregadaPorFecha: populated.entregadaPorFecha ?? null,
              observaciones: populated.observaciones ?? "",
              createdBy: String(populated.createdBy),
              createdByName: populated.createdByName,
              updatedBy: populated.updatedBy ? String(populated.updatedBy) : null,
              updatedByName: populated.updatedByName ?? "",
              createdAt: populated.createdAt,
              updatedAt: populated.updatedAt,
              siac: {
                interno: validation.data.lookup.interno,
                estado: validation.data.lookup.estado,
                tipoOperacion: validation.data.lookup.tipoOperacion,
                operacion: validation.data.lookup.operacion ?? null,
                grupo: validation.data.lookup.grupo ?? null,
                orden: validation.data.lookup.orden ?? null,
                cliente: validation.data.lookup.cliente,
                telefono: validation.data.lookup.telefono ?? null,
                vendedor: validation.data.lookup.vendedor,
                version: validation.data.lookup.version ?? null,
                modelo: validation.data.lookup.modelo ?? null,
                chasis: validation.data.lookup.chasis ?? null,
                serie: validation.data.lookup.serie ?? null,
                nroFabricacion: validation.data.lookup.nroFabricacion ?? null,
                color: validation.data.lookup.color,
              },
              siacSyncError: false,
              siacSyncMessage: "",
            }
          : null,
      });
    } catch (error: any) {
      logError("PendienteTurnarController.turnar");
      console.error(error);

      if (error?.code === 11000 && error?.keyPattern?.interno) {
        return res.status(409).json({ error: "Ese interno ya esta agendado" });
      }

      return res.status(500).json({ message: "Error al turnar el pendiente seleccionado" });
    }
  };
}
