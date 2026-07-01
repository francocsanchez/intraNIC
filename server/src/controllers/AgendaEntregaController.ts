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
  siniestro?: unknown;
  observaciones?: unknown;
};

type ReservaPayload = {
  sucursal?: unknown;
  fechaAgenda?: unknown;
  horaAgenda?: unknown;
  observaciones?: unknown;
};

type ConvertReservaPayload = {
  interno?: unknown;
  equipado?: unknown;
  entregaUsado?: unknown;
  siniestro?: unknown;
  observaciones?: unknown;
};

type ToggleEntregadaPorPayload = {
  checked?: unknown;
};

type SlotValidationResult =
  | { error: string }
  | {
      data: {
        sucursalId: string;
        sucursalNombre: string;
        fechaAgenda: string;
        horaAgenda: string;
        currentAgenda: any;
      };
    };

type AgendaValidationResult =
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

type ReservaValidationResult =
  | { error: string }
  | {
      data: {
        sucursalId: string;
        sucursalNombre: string;
        fechaAgenda: string;
        horaAgenda: string;
        observaciones: string;
      };
    };

type AgendaLean = {
  _id: mongoose.Types.ObjectId | string;
  tipoRegistro?: "turno" | "reserva";
  interno?: number | null;
  tipoOperacion?: string;
  sucursal: any;
  fechaAgenda: string;
  horaAgenda: string;
  equipado?: boolean;
  entregaUsado?: boolean;
  siniestro?: boolean;
  entregadaPorMarcada?: boolean;
  entregadaPorUser?: mongoose.Types.ObjectId | string | null;
  entregadaPorNombre?: string;
  entregadaPorFecha?: Date | null;
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

const userHasEntregadaPorToggleAccess = (req: Request) => {
  const roles = normalizeRoles(req.user?.role);
  return roles.includes("superadmin") || roles.includes("entrega");
};

const ensureAgendaWriteAccess = (req: Request) => {
  if (!req.user?._id) {
    return "Usuario no autenticado";
  }

  if (!userHasAgendaWriteAccess(req)) {
    return "No tienes permisos para crear, editar o eliminar turnos o reservas de entrega";
  }

  return null;
};

const ensureEntregadaPorToggleAccess = (req: Request, sucursalId: string) => {
  if (!req.user?._id) {
    return "Usuario no autenticado";
  }

  if (!userHasEntregadaPorToggleAccess(req)) {
    return "No tienes permisos para marcar quien entrego la unidad";
  }

  const roles = normalizeRoles(req.user?.role);

  if (roles.includes("superadmin")) {
    return null;
  }

  if (!roles.includes("entrega")) {
    return "No tienes permisos para marcar quien entrego la unidad";
  }

  const assignedSucursalId = getAssignedSucursalEntregaId(req);

  if (!assignedSucursalId) {
    return "El usuario entrega no tiene una sucursal de entrega asignada";
  }

  if (assignedSucursalId !== sucursalId) {
    return "Solo puedes marcar entregas de tu sucursal de entrega asignada";
  }

  return null;
};

const ensureSucursalAllowedForMutation = (req: Request, sucursalId: string) => {
  const roles = normalizeRoles(req.user?.role);

  if (roles.includes("superadmin")) {
    return null;
  }

  if (!roles.includes("coordinador")) {
    return "No tienes permisos para operar sobre turnos o reservas de entrega";
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

const getAgendaTipoRegistro = (item: AgendaLean | any) =>
  item?.tipoRegistro === "reserva" ? "reserva" : "turno";

const isReservaAgenda = (item: AgendaLean | any) =>
  getAgendaTipoRegistro(item) === "reserva";

const formatAgendaRow = (item: AgendaLean, lookup?: AgendaEntregaLookup | null, lookupError?: string) => {
  const tipoRegistro = getAgendaTipoRegistro(item);
  const hasLookup = tipoRegistro === "turno" && Boolean(lookup);

  return {
    _id: String(item._id),
    tipoRegistro,
    interno: tipoRegistro === "turno" ? item.interno ?? null : null,
    tipoOperacion: tipoRegistro === "turno" ? item.tipoOperacion ?? "" : "",
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
    equipado: tipoRegistro === "turno" ? Boolean(item.equipado) : false,
    entregaUsado: tipoRegistro === "turno" ? Boolean(item.entregaUsado) : false,
    siniestro: tipoRegistro === "turno" ? Boolean(item.siniestro) : false,
    entregadaPorMarcada: tipoRegistro === "turno" ? Boolean(item.entregadaPorMarcada) : false,
    entregadaPorUser:
      tipoRegistro === "turno" && item.entregadaPorUser ? String(item.entregadaPorUser) : null,
    entregadaPorNombre: tipoRegistro === "turno" ? item.entregadaPorNombre ?? "" : "",
    entregadaPorFecha: tipoRegistro === "turno" ? item.entregadaPorFecha ?? null : null,
    observaciones: item.observaciones ?? "",
    createdBy: String(item.createdBy),
    createdByName: item.createdByName,
    updatedBy: item.updatedBy ? String(item.updatedBy) : null,
    updatedByName: item.updatedByName ?? "",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    siac: hasLookup
      ? {
          interno: lookup!.interno,
          estado: lookup!.estado,
          tipoOperacion: lookup!.tipoOperacion,
          operacion: lookup!.operacion ?? null,
          grupo: lookup!.grupo ?? null,
          orden: lookup!.orden ?? null,
          cliente: lookup!.cliente,
          telefono: lookup!.telefono ?? null,
          vendedor: lookup!.vendedor,
          version: lookup!.version ?? null,
          modelo: lookup!.modelo ?? null,
          chasis: lookup!.chasis ?? null,
          serie: lookup!.serie ?? null,
          nroFabricacion: lookup!.nroFabricacion ?? null,
          color: lookup!.color,
        }
      : null,
    siacSyncError: tipoRegistro === "turno" ? !lookup : false,
    siacSyncMessage:
      tipoRegistro === "turno" && !lookup
        ? lookupError ?? "No se pudo obtener informacion actualizada desde SIAC"
        : "",
  };
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

const buildReservaDetailLabel = (
  sucursalNombre: string,
  fechaAgenda: string,
  horaAgenda: string,
  observaciones: string,
) =>
  [
    `Sucursal: ${sucursalNombre}`,
    `Fecha: ${fechaAgenda}`,
    `Hora: ${horaAgenda}`,
    `Detalle: ${observaciones.trim()}`,
  ].join(" | ");

const createAgendaLog = async (params: {
  agendaEntrega: mongoose.Types.ObjectId | string | null;
  interno?: number | null;
  accion: AgendaEntregaLogAction;
  usuario: string;
  usuarioNombre: string;
  detalle: string;
}) => {
  await AgendaEntregaLog.create({
    agendaEntrega: params.agendaEntrega,
    interno: params.interno ?? null,
    accion: params.accion,
    usuario: new mongoose.Types.ObjectId(params.usuario),
    usuarioNombre: params.usuarioNombre,
    fecha: new Date(),
    detalle: params.detalle,
  });
};

const validateSlot = async (params: {
  sucursal: unknown;
  fechaAgenda: unknown;
  horaAgenda: unknown;
  currentId?: string;
}): Promise<SlotValidationResult> => {
  const sucursalId = typeof params.sucursal === "string" ? params.sucursal.trim() : "";
  const fechaAgenda = normalizeText(params.fechaAgenda);
  const horaAgenda = normalizeText(params.horaAgenda);
  const currentAgenda = params.currentId
    ? await AgendaEntrega.findById(params.currentId).lean()
    : null;

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
    return { error: "La hora de agenda debe ser un turno valido entre 08:00 y 18:00 cada 30 minutos" };
  }

  const sucursal = await SucursalEntrega.findById(sucursalId).lean();

  if (!sucursal) {
    return { error: "La sucursal seleccionada no existe" };
  }

  if (!sucursal.activa) {
    return { error: "La sucursal seleccionada esta inactiva" };
  }

  const horariosHabilitados = getSucursalHorariosHabilitados(sucursal);
  const preservesCurrentDisabledSlot =
    currentAgenda &&
    String(currentAgenda.sucursal) === sucursalId &&
    currentAgenda.horaAgenda === horaAgenda;

  if (!horariosHabilitados.includes(horaAgenda) && !preservesCurrentDisabledSlot) {
    return {
      error: `La hora ${horaAgenda} no esta habilitada para la sucursal seleccionada`,
    };
  }

  return {
    data: {
      sucursalId,
      sucursalNombre: sucursal.nombre,
      fechaAgenda,
      horaAgenda,
      currentAgenda,
    },
  };
};

const validateAgendaPayload = async (
  payload: AgendaPayload,
  currentId?: string,
): Promise<AgendaValidationResult> => {
  const interno = Number(payload.interno);
  const equipado = Boolean(payload.equipado);
  const entregaUsado = Boolean(payload.entregaUsado);
  const siniestro = Boolean(payload.siniestro);
  const observaciones = normalizeText(payload.observaciones);

  if (!Number.isInteger(interno) || interno <= 0) {
    return { error: "El interno ingresado no es valido" };
  }

  if (observaciones.length > OBSERVACIONES_MAX_LENGTH) {
    return {
      error: `Las observaciones no pueden superar los ${OBSERVACIONES_MAX_LENGTH} caracteres`,
    };
  }

  const slotValidation = await validateSlot({
    sucursal: payload.sucursal,
    fechaAgenda: payload.fechaAgenda,
    horaAgenda: payload.horaAgenda,
    currentId,
  });

  if ("error" in slotValidation) {
    return slotValidation;
  }

  const duplicated = await AgendaEntrega.findOne(
    currentId
      ? { tipoRegistro: "turno", interno, _id: { $ne: currentId } }
      : { tipoRegistro: "turno", interno },
  ).lean();

  if (duplicated) {
    return {
      error: `El interno ${interno} ya esta agendado para ${duplicated.fechaAgenda} a las ${duplicated.horaAgenda}`,
    };
  }

  const lookup = await lookupAgendaEntregaInterno(interno);

  if (!lookup) {
    return { error: "No se encontro informacion para el interno solicitado" };
  }

  if (ENTREGADO_STATES.has(Number(lookup.estado))) {
    return {
      error: `El interno ${interno} ya figura entregado en SIAC y no se puede agendar`,
    };
  }

  return {
    data: {
      interno,
      tipoOperacion: lookup.tipoOperacion,
      sucursalId: slotValidation.data.sucursalId,
      sucursalNombre: slotValidation.data.sucursalNombre,
      fechaAgenda: slotValidation.data.fechaAgenda,
      horaAgenda: slotValidation.data.horaAgenda,
      equipado,
      entregaUsado,
      siniestro,
      observaciones,
      lookup,
    },
  };
};

const validateReservaPayload = async (
  payload: ReservaPayload,
  currentId?: string,
): Promise<ReservaValidationResult> => {
  const observaciones = normalizeText(payload.observaciones);

  if (!observaciones) {
    return { error: "Las observaciones son obligatorias para crear una reserva" };
  }

  if (observaciones.length > OBSERVACIONES_MAX_LENGTH) {
    return {
      error: `Las observaciones no pueden superar los ${OBSERVACIONES_MAX_LENGTH} caracteres`,
    };
  }

  const slotValidation = await validateSlot({
    sucursal: payload.sucursal,
    fechaAgenda: payload.fechaAgenda,
    horaAgenda: payload.horaAgenda,
    currentId,
  });

  if ("error" in slotValidation) {
    return slotValidation;
  }

  return {
    data: {
      sucursalId: slotValidation.data.sucursalId,
      sucursalNombre: slotValidation.data.sucursalNombre,
      fechaAgenda: slotValidation.data.fechaAgenda,
      horaAgenda: slotValidation.data.horaAgenda,
      observaciones,
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
        .sort({ fechaAgenda: 1, horaAgenda: 1, createdAt: 1 })
        .lean();

      const turnos = agendas.filter((agenda) => !isReservaAgenda(agenda));
      const internos = turnos
        .map((agenda) => Number(agenda.interno))
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
        data: agendas.map((agenda) => {
          if (isReservaAgenda(agenda)) {
            return formatAgendaRow(agenda);
          }

          const interno = Number(agenda.interno);
          return formatAgendaRow(
            agenda,
            lookups.get(interno) ?? null,
            missing.includes(interno)
              ? "No se pudo obtener informacion actualizada desde SIAC"
              : "",
          );
        }),
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

      if (isReservaAgenda(agenda)) {
        return res.status(200).json({
          data: formatAgendaRow(agenda),
        });
      }

      let lookup: AgendaEntregaLookup | null = null;
      let lookupError = "";

      try {
        lookup = await lookupAgendaEntregaInterno(Number(agenda.interno));
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

      await createAgendaLog({
        agendaEntrega: agenda._id,
        interno: validation.data.interno,
        accion: "CREADA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: buildAgendaDetailLabel(
          validation.data.sucursalNombre,
          validation.data.fechaAgenda,
          validation.data.horaAgenda,
          validation.data.equipado,
          validation.data.entregaUsado,
          validation.data.siniestro,
          validation.data.observaciones,
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
        if (error?.keyPattern?.interno) {
          return res.status(409).json({ error: "Ese interno ya esta agendado" });
        }
      }

      return res.status(500).json({ message: "Error al crear la agenda de entrega" });
    }
  };

  static createReserva = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const validation = await validateReservaPayload(req.body ?? {});
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const sucursalAccessError = ensureSucursalAllowedForMutation(req, validation.data.sucursalId);
      if (sucursalAccessError) {
        return res.status(403).json({ error: sucursalAccessError });
      }

      const usuarioNombre = buildUserName(req);

      const reserva = await AgendaEntrega.create({
        tipoRegistro: "reserva",
        interno: null,
        tipoOperacion: "",
        sucursal: new mongoose.Types.ObjectId(validation.data.sucursalId),
        fechaAgenda: validation.data.fechaAgenda,
        horaAgenda: validation.data.horaAgenda,
        observaciones: validation.data.observaciones,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        createdByName: usuarioNombre,
      });

      await createAgendaLog({
        agendaEntrega: reserva._id,
        accion: "RESERVA_CREADA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: buildReservaDetailLabel(
          validation.data.sucursalNombre,
          validation.data.fechaAgenda,
          validation.data.horaAgenda,
          validation.data.observaciones,
        ),
      });

      const populated = await AgendaEntrega.findById(reserva._id)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      return res.status(201).json({
        message: "Reserva creada correctamente",
        data: populated ? formatAgendaRow(populated) : null,
      });
    } catch (error: any) {
      logError("AgendaEntregaController.createReserva");
      console.error(error);

      return res.status(500).json({ message: "Error al crear la reserva de entrega" });
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
        .populate("sucursal", "nombre direccion activa")
        .lean();

      if (!agenda) {
        return res.status(404).json({ error: "Agenda no encontrada" });
      }

      if (isReservaAgenda(agenda)) {
        return res.status(400).json({ error: "La reserva debe editarse desde su endpoint especifico" });
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
        changes.push(`Sucursal: ${((agenda.sucursal as any)?.nombre ?? "-")} -> ${validation.data.sucursalNombre}`);
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
      if (Boolean(agenda.siniestro) !== validation.data.siniestro) {
        changes.push(`Siniestro: ${agenda.siniestro ? "SI" : "NO"} -> ${validation.data.siniestro ? "SI" : "NO"}`);
      }
      if ((agenda.observaciones ?? "") !== validation.data.observaciones) {
        changes.push("Observaciones actualizadas");
      }

      const updated = await AgendaEntrega.findByIdAndUpdate(
        agendaId,
        {
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
        if (error?.keyPattern?.interno) {
          return res.status(409).json({ error: "Ese interno ya esta agendado" });
        }
      }

      return res.status(500).json({ message: "Error al actualizar la agenda de entrega" });
    }
  };

  static updateReserva = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const agendaId = String(req.params.id);
      const agenda = await AgendaEntrega.findById(agendaId)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      if (!agenda) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (!isReservaAgenda(agenda)) {
        return res.status(400).json({ error: "El registro seleccionado no es una reserva" });
      }

      const currentSucursalId = String((agenda.sucursal as any)?._id ?? agenda.sucursal ?? "");
      const currentSucursalAccessError = ensureSucursalAllowedForMutation(req, currentSucursalId);
      if (currentSucursalAccessError) {
        return res.status(403).json({ error: currentSucursalAccessError });
      }

      const validation = await validateReservaPayload(req.body ?? {}, agendaId);
      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const nextSucursalAccessError = ensureSucursalAllowedForMutation(req, validation.data.sucursalId);
      if (nextSucursalAccessError) {
        return res.status(403).json({ error: nextSucursalAccessError });
      }

      const usuarioNombre = buildUserName(req);
      const changes: string[] = [];

      if (String((agenda.sucursal as any)?._id ?? agenda.sucursal) !== validation.data.sucursalId) {
        changes.push(`Sucursal: ${((agenda.sucursal as any)?.nombre ?? "-")} -> ${validation.data.sucursalNombre}`);
      }
      if (agenda.fechaAgenda !== validation.data.fechaAgenda) {
        changes.push(`Fecha: ${agenda.fechaAgenda} -> ${validation.data.fechaAgenda}`);
      }
      if (agenda.horaAgenda !== validation.data.horaAgenda) {
        changes.push(`Hora: ${agenda.horaAgenda} -> ${validation.data.horaAgenda}`);
      }
      if ((agenda.observaciones ?? "") !== validation.data.observaciones) {
        changes.push("Detalle de reserva actualizado");
      }

      const updated = await AgendaEntrega.findByIdAndUpdate(
        agendaId,
        {
          tipoRegistro: "reserva",
          interno: null,
          tipoOperacion: "",
          sucursal: new mongoose.Types.ObjectId(validation.data.sucursalId),
          fechaAgenda: validation.data.fechaAgenda,
          horaAgenda: validation.data.horaAgenda,
          equipado: false,
          entregaUsado: false,
          siniestro: false,
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
        accion: "RESERVA_MODIFICADA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: changes.length ? changes.join(" | ") : "Sin cambios relevantes en campos visibles",
      });

      return res.status(200).json({
        message: "Reserva actualizada correctamente",
        data: updated ? formatAgendaRow(updated) : null,
      });
    } catch (error: any) {
      logError("AgendaEntregaController.updateReserva");
      console.error(error);

      return res.status(500).json({ message: "Error al actualizar la reserva de entrega" });
    }
  };

  static convertReserva = async (req: Request, res: Response) => {
    const accessError = ensureAgendaWriteAccess(req);
    if (accessError) {
      return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
    }

    try {
      const agendaId = String(req.params.id);
      const reserva = await AgendaEntrega.findById(agendaId)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      if (!reserva) {
        return res.status(404).json({ error: "Reserva no encontrada" });
      }

      if (!isReservaAgenda(reserva)) {
        return res.status(400).json({ error: "El registro seleccionado no es una reserva" });
      }

      const sucursalId = String((reserva.sucursal as any)?._id ?? reserva.sucursal ?? "");
      const sucursalAccessError = ensureSucursalAllowedForMutation(req, sucursalId);
      if (sucursalAccessError) {
        return res.status(403).json({ error: sucursalAccessError });
      }

      const validation = await validateAgendaPayload(
        {
          interno: req.body?.interno,
          sucursal: sucursalId,
          fechaAgenda: reserva.fechaAgenda,
          horaAgenda: reserva.horaAgenda,
          equipado: req.body?.equipado,
          entregaUsado: req.body?.entregaUsado,
          siniestro: req.body?.siniestro,
          observaciones:
            typeof req.body?.observaciones === "string" ? req.body.observaciones : reserva.observaciones ?? "",
        },
        agendaId,
      );

      if ("error" in validation) {
        return res.status(400).json({ error: validation.error });
      }

      const usuarioNombre = buildUserName(req);

      const converted = await AgendaEntrega.findByIdAndUpdate(
        agendaId,
        {
          tipoRegistro: "turno",
          interno: validation.data.interno,
          tipoOperacion: validation.data.lookup.tipoOperacion,
          equipado: validation.data.equipado,
          entregaUsado: validation.data.entregaUsado,
          siniestro: validation.data.siniestro,
          observaciones: validation.data.observaciones,
          entregadaPorMarcada: false,
          entregadaPorUser: null,
          entregadaPorNombre: "",
          entregadaPorFecha: null,
          updatedBy: new mongoose.Types.ObjectId(req.user._id),
          updatedByName: usuarioNombre,
        },
        { new: true },
      )
        .populate("sucursal", "nombre direccion activa")
        .lean();

      await createAgendaLog({
        agendaEntrega: agendaId,
        accion: "RESERVA_CONVERTIDA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: `Reserva convertida a turno | Interno: ${validation.data.interno} | ${buildReservaDetailLabel(
          validation.data.sucursalNombre,
          validation.data.fechaAgenda,
          validation.data.horaAgenda,
          reserva.observaciones ?? "",
        )}`,
      });

      await createAgendaLog({
        agendaEntrega: agendaId,
        interno: validation.data.interno,
        accion: "CREADA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: buildAgendaDetailLabel(
          validation.data.sucursalNombre,
          validation.data.fechaAgenda,
          validation.data.horaAgenda,
          validation.data.equipado,
          validation.data.entregaUsado,
          validation.data.siniestro,
          validation.data.observaciones,
        ),
      });

      return res.status(200).json({
        message: "Turno agendado correctamente a partir de la reserva",
        data: converted ? formatAgendaRow(converted, validation.data.lookup) : null,
      });
    } catch (error: any) {
      logError("AgendaEntregaController.convertReserva");
      console.error(error);

      if (error?.code === 11000) {
        if (error?.keyPattern?.interno) {
          return res.status(409).json({ error: "Ese interno ya esta agendado" });
        }
      }

      return res.status(500).json({ message: "Error al convertir la reserva en turno" });
    }
  };

  static toggleEntregadaPor = async (req: Request, res: Response) => {
    if (!req.user?._id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const agendaId = String(req.params.id);
    const { checked } = (req.body ?? {}) as ToggleEntregadaPorPayload;

    if (typeof checked !== "boolean") {
      return res.status(400).json({ error: "El campo checked es obligatorio" });
    }

    try {
      const agenda = await AgendaEntrega.findById(agendaId)
        .populate("sucursal", "nombre direccion activa")
        .lean();

      if (!agenda) {
        return res.status(404).json({ error: "Agenda no encontrada" });
      }

      if (isReservaAgenda(agenda)) {
        return res.status(400).json({ error: "Las reservas no pueden marcarse como entregadas por" });
      }

      const sucursalId = String((agenda.sucursal as any)?._id ?? agenda.sucursal ?? "");
      const accessError = ensureEntregadaPorToggleAccess(req, sucursalId);
      if (accessError) {
        return res.status(accessError === "Usuario no autenticado" ? 401 : 403).json({ error: accessError });
      }

      const lookup = await lookupAgendaEntregaInterno(Number(agenda.interno));
      if (!lookup) {
        return res.status(400).json({ error: "No se pudo obtener informacion actualizada desde SIAC" });
      }

      if (!ENTREGADO_STATES.has(Number(lookup.estado))) {
        return res.status(400).json({
          error: `El interno ${agenda.interno} todavia no figura entregado en SIAC`,
        });
      }

      const alreadyChecked = Boolean(agenda.entregadaPorMarcada);
      if (alreadyChecked === checked) {
        const current = formatAgendaRow(agenda, lookup);
        return res.status(200).json({
          message: checked ? "La entrega ya estaba marcada" : "La entrega ya estaba desmarcada",
          data: current,
        });
      }

      const usuarioNombre = buildUserName(req);
      const updatePayload = checked
        ? {
            entregadaPorMarcada: true,
            entregadaPorUser: new mongoose.Types.ObjectId(req.user._id),
            entregadaPorNombre: usuarioNombre,
            entregadaPorFecha: new Date(),
          }
        : {
            entregadaPorMarcada: false,
            entregadaPorUser: null,
            entregadaPorNombre: "",
            entregadaPorFecha: null,
          };

      const updated = await AgendaEntrega.findByIdAndUpdate(agendaId, updatePayload, { new: true })
        .populate("sucursal", "nombre direccion activa")
        .lean();

      await createAgendaLog({
        agendaEntrega: agendaId,
        interno: Number(agenda.interno),
        accion: checked ? "ENTREGA_MARCADA" : "ENTREGA_DESMARCADA",
        usuario: req.user._id,
        usuarioNombre,
        detalle: checked
          ? `Entrega marcada por ${usuarioNombre}`
          : `Entrega desmarcada por ${usuarioNombre}`,
      });

      return res.status(200).json({
        message: checked ? "Entrega marcada correctamente" : "Entrega desmarcada correctamente",
        data: updated ? formatAgendaRow(updated, lookup) : null,
      });
    } catch (error) {
      logError("AgendaEntregaController.toggleEntregadaPor");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar la marca de entrega" });
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
        .populate("sucursal", "nombre direccion activa")
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

      if (!isReservaAgenda(agenda)) {
        const lookup = await lookupAgendaEntregaInterno(Number(agenda.interno));
        if (lookup && ENTREGADO_STATES.has(Number(lookup.estado))) {
          return res.status(400).json({
            error: `El interno ${agenda.interno} ya figura entregado en SIAC y no se puede eliminar de la agenda`,
          });
        }
      }

      await AgendaEntrega.findByIdAndDelete(agendaId);

      await createAgendaLog({
        agendaEntrega: agenda._id,
        interno: isReservaAgenda(agenda) ? null : Number(agenda.interno),
        accion: isReservaAgenda(agenda) ? "RESERVA_ELIMINADA" : "ELIMINADA",
        usuario: req.user._id,
        usuarioNombre: buildUserName(req),
        detalle: isReservaAgenda(agenda)
          ? buildReservaDetailLabel(
              (agenda.sucursal as any)?.nombre ?? "-",
              agenda.fechaAgenda,
              agenda.horaAgenda,
              agenda.observaciones ?? "",
            )
          : buildAgendaDetailLabel(
              (agenda.sucursal as any)?.nombre ?? "-",
              agenda.fechaAgenda,
              agenda.horaAgenda,
              Boolean(agenda.equipado),
              Boolean(agenda.entregaUsado),
              Boolean(agenda.siniestro),
              agenda.observaciones ?? "",
            ),
      });

      return res.status(200).json({
        message: isReservaAgenda(agenda)
          ? "Reserva eliminada correctamente"
          : "Agenda de entrega eliminada correctamente",
      });
    } catch (error) {
      logError("AgendaEntregaController.remove");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar la agenda de entrega" });
    }
  };
}
