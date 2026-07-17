import AgendaEntrega from "../models/AgendaEntrega";
import SucursalEntrega from "../models/SucursalEntrega";
import {
  lookupAgendaEntregaInternos,
  type AgendaEntregaLookup,
} from "./agendaEntregaSiac.service";

export const AGENDA_TIME_SLOT_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

const ALLOWED_TIME_SLOTS = new Set(AGENDA_TIME_SLOT_OPTIONS);

const normalizeHorariosHabilitados = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [...AGENDA_TIME_SLOT_OPTIONS];
  }

  const unique = new Set(
    value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean),
  );

  return AGENDA_TIME_SLOT_OPTIONS.filter((timeSlot) => unique.has(timeSlot));
};

export type AgendaEntregaReportItem = {
  _id: string;
  tipoRegistro: "turno" | "reserva";
  interno: number | null;
  horaAgenda: string;
  fechaAgenda: string;
  equipado: boolean;
  entregaUsado: boolean;
  siniestro: boolean;
  observaciones: string;
  siac: AgendaEntregaLookup | null;
  siacSyncError: boolean;
  siacSyncMessage: string;
};

export type AgendaEntregaDailyReport = {
  fecha: string;
  sucursal: {
    _id: string;
    nombre: string;
    direccion: string;
    activa: boolean;
    horariosHabilitados: string[];
  };
  items: AgendaEntregaReportItem[];
};

export const getAgendaEntregaDailyReport = async (
  sucursalId: string,
  fecha: string,
): Promise<AgendaEntregaDailyReport | null> => {
  const [sucursal, agendas] = await Promise.all([
    SucursalEntrega.findById(sucursalId).lean(),
    AgendaEntrega.find({
      sucursal: sucursalId,
      fechaAgenda: fecha,
    })
      .sort({ horaAgenda: 1, createdAt: 1 })
      .lean(),
  ]);

  if (!sucursal) {
    return null;
  }

  const turnos = agendas.filter((agenda) => agenda.tipoRegistro !== "reserva");
  const internos = turnos
    .map((agenda) => Number(agenda.interno))
    .filter((interno) => Number.isInteger(interno) && interno > 0);

  let lookups = new Map<number, AgendaEntregaLookup>();
  let missing: number[] = [];

  if (internos.length) {
    try {
      const lookupResult = await lookupAgendaEntregaInternos(internos);
      lookups = lookupResult.data;
      missing = lookupResult.missing;
    } catch (error) {
      console.error(error);
      missing = internos;
    }
  }

  return {
    fecha,
    sucursal: {
      _id: String(sucursal._id),
      nombre: sucursal.nombre,
      direccion: sucursal.direccion ?? "",
      activa: Boolean(sucursal.activa),
      horariosHabilitados: normalizeHorariosHabilitados(sucursal.horariosHabilitados),
    },
    items: agendas.map((agenda) => {
      const tipoRegistro = agenda.tipoRegistro === "reserva" ? "reserva" : "turno";
      const interno = tipoRegistro === "turno" ? Number(agenda.interno) : null;
      const lookup = interno && lookups.has(interno) ? lookups.get(interno) ?? null : null;
      const siacSyncError = tipoRegistro === "turno" ? !lookup : false;
      const siacSyncMessage =
        tipoRegistro === "turno" && missing.includes(Number(interno))
          ? "No se pudo obtener informacion actualizada desde SIAC"
          : "";

      return {
        _id: String(agenda._id),
        tipoRegistro,
        interno: tipoRegistro === "turno" ? Number(agenda.interno ?? 0) || null : null,
        horaAgenda: agenda.horaAgenda,
        fechaAgenda: agenda.fechaAgenda,
        equipado: tipoRegistro === "turno" ? Boolean(agenda.equipado) : false,
        entregaUsado: tipoRegistro === "turno" ? Boolean(agenda.entregaUsado) : false,
        siniestro: tipoRegistro === "turno" ? Boolean(agenda.siniestro) : false,
        observaciones: agenda.observaciones ?? "",
        siac: lookup,
        siacSyncError,
        siacSyncMessage,
      };
    }),
  };
};

export const isAgendaTimeSlotEnabled = (horariosHabilitados: string[], timeSlot: string) =>
  normalizeHorariosHabilitados(horariosHabilitados).includes(timeSlot) && ALLOWED_TIME_SLOTS.has(timeSlot);
