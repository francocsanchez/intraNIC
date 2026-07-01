import api from "@/libs/axios";
import {
  agendaEntregaListResponseSchema,
  agendaEntregaLogListResponseSchema,
  agendaEntregaLookupResponseSchema,
  agendaEntregaResponseSchema,
  pendienteTurnarListResponseSchema,
  pendienteTurnarResponseSchema,
  sucursalEntregaListResponseSchema,
  sucursalEntregaResponseSchema,
  type AgendaEntregaListResponse,
  type AgendaEntregaLogListResponse,
  type AgendaEntregaLookup,
  type AgendaEntregaResponse,
  type PendienteTurnarListResponse,
  type PendienteTurnarResponse,
  type SucursalEntregaListResponse,
  type SucursalEntregaResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type AgendaEntregaPayload = {
  interno: number;
  sucursal: string;
  fechaAgenda: string;
  horaAgenda: string;
  equipado: boolean;
  entregaUsado: boolean;
  siniestro: boolean;
  observaciones?: string;
};

export type ReservaEntregaPayload = {
  sucursal: string;
  fechaAgenda: string;
  horaAgenda: string;
  observaciones: string;
};

export type ReservaEntregaConvertPayload = {
  interno: number;
  equipado: boolean;
  entregaUsado: boolean;
  siniestro: boolean;
  observaciones?: string;
};

export type PendienteTurnarPayload = {
  interno: number;
  sucursal: string;
  equipado: boolean;
  entregaUsado: boolean;
  siniestro: boolean;
  observaciones?: string;
};

export type SucursalEntregaPayload = {
  nombre: string;
  direccion?: string;
  activa?: boolean;
  horariosHabilitados?: string[];
  observaciones?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

const isEmptyDataError = (error: unknown) =>
  isAxiosError(error) &&
  (error.response?.status === 400 || error.response?.status === 404);

async function parseResponse<T>(
  promise: Promise<{ data: unknown }>,
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false; error: { issues: unknown } };
  },
  fallback: string,
) {
  try {
    const { data } = await promise;
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
}

export function getAgendaEntregaLookup(interno: number): Promise<AgendaEntregaLookup> {
  return parseResponse(
    api.get(`/entregas/interno/${interno}`),
    agendaEntregaLookupResponseSchema,
    "Error al buscar el interno en SIAC",
  ).then((response) => response.data);
}

export function getAgendasEntrega(params?: {
  fecha?: string;
  sucursalId?: string;
}): Promise<AgendaEntregaListResponse> {
  return parseResponse(
    api.get("/entregas/agendas", { params }),
    agendaEntregaListResponseSchema,
    "Error al obtener la agenda de entrega",
  ).catch((error) => {
    if (isEmptyDataError(error)) {
      return { data: [] };
    }

    throw error;
  });
}

export function createAgendaEntrega(payload: AgendaEntregaPayload): Promise<AgendaEntregaResponse> {
  return parseResponse(
    api.post("/entregas/agendas", payload),
    agendaEntregaResponseSchema,
    "Error al crear la agenda de entrega",
  );
}

export function updateAgendaEntrega(id: string, payload: AgendaEntregaPayload): Promise<AgendaEntregaResponse> {
  return parseResponse(
    api.put(`/entregas/agendas/${id}`, payload),
    agendaEntregaResponseSchema,
    "Error al actualizar la agenda de entrega",
  );
}

export function createReservaEntrega(payload: ReservaEntregaPayload): Promise<AgendaEntregaResponse> {
  return parseResponse(
    api.post("/entregas/agendas/reservas", payload),
    agendaEntregaResponseSchema,
    "Error al crear la reserva de entrega",
  );
}

export function updateReservaEntrega(id: string, payload: ReservaEntregaPayload): Promise<AgendaEntregaResponse> {
  return parseResponse(
    api.put(`/entregas/agendas/reservas/${id}`, payload),
    agendaEntregaResponseSchema,
    "Error al actualizar la reserva de entrega",
  );
}

export function convertReservaEntrega(id: string, payload: ReservaEntregaConvertPayload): Promise<AgendaEntregaResponse> {
  return parseResponse(
    api.post(`/entregas/agendas/reservas/${id}/convertir`, payload),
    agendaEntregaResponseSchema,
    "Error al convertir la reserva en turno",
  );
}

export function toggleAgendaEntregaEntregadaPor(id: string, checked: boolean): Promise<AgendaEntregaResponse> {
  return parseResponse(
    api.patch(`/entregas/agendas/${id}/entregada-por`, { checked }),
    agendaEntregaResponseSchema,
    "Error al actualizar quien entrego la unidad",
  );
}

export async function deleteAgendaEntrega(id: string): Promise<{ message: string }> {
  try {
    const { data } = await api.delete(`/entregas/agendas/${id}`);
    return data as { message: string };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al eliminar la agenda de entrega"));
  }
}

export async function deleteReservaEntrega(id: string): Promise<{ message: string }> {
  try {
    const { data } = await api.delete(`/entregas/agendas/reservas/${id}`);
    return data as { message: string };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al eliminar la reserva de entrega"));
  }
}

export function getSucursalesEntrega(): Promise<SucursalEntregaListResponse> {
  return parseResponse(
    api.get("/entregas/sucursales"),
    sucursalEntregaListResponseSchema,
    "Error al obtener sucursales de entrega",
  ).catch((error) => {
    if (isEmptyDataError(error)) {
      return { data: [] };
    }

    throw error;
  });
}

export function getPendientesTurnar(params?: {
  sucursalId?: string;
}): Promise<PendienteTurnarListResponse> {
  return parseResponse(
    api.get("/entregas/pendientes-turnar", { params }),
    pendienteTurnarListResponseSchema,
    "Error al obtener pendientes de turnar",
  ).catch((error) => {
    if (isEmptyDataError(error)) {
      return { data: [] };
    }

    throw error;
  });
}

export function createPendienteTurnar(payload: PendienteTurnarPayload): Promise<PendienteTurnarResponse> {
  return parseResponse(
    api.post("/entregas/pendientes-turnar", payload),
    pendienteTurnarResponseSchema,
    "Error al crear el pendiente de turnar",
  );
}

export function updatePendienteTurnar(id: string, payload: PendienteTurnarPayload): Promise<PendienteTurnarResponse> {
  return parseResponse(
    api.put(`/entregas/pendientes-turnar/${id}`, payload),
    pendienteTurnarResponseSchema,
    "Error al actualizar el pendiente de turnar",
  );
}

export function turnarPendienteTurnar(id: string, payload: AgendaEntregaPayload): Promise<AgendaEntregaResponse> {
  return parseResponse(
    api.post(`/entregas/pendientes-turnar/${id}/turnar`, payload),
    agendaEntregaResponseSchema,
    "Error al turnar la unidad pendiente",
  );
}

export async function deletePendienteTurnar(id: string): Promise<{ message: string }> {
  try {
    const { data } = await api.delete(`/entregas/pendientes-turnar/${id}`);
    return data as { message: string };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al eliminar el pendiente de turnar"));
  }
}

export function createSucursalEntrega(payload: SucursalEntregaPayload): Promise<SucursalEntregaResponse> {
  return parseResponse(
    api.post("/entregas/sucursales", payload),
    sucursalEntregaResponseSchema,
    "Error al crear la sucursal de entrega",
  );
}

export function updateSucursalEntrega(id: string, payload: SucursalEntregaPayload): Promise<SucursalEntregaResponse> {
  return parseResponse(
    api.put(`/entregas/sucursales/${id}`, payload),
    sucursalEntregaResponseSchema,
    "Error al actualizar la sucursal de entrega",
  );
}

export async function deleteSucursalEntrega(id: string): Promise<{ message: string }> {
  try {
    const { data } = await api.delete(`/entregas/sucursales/${id}`);
    return data as { message: string };
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al eliminar la sucursal de entrega"));
  }
}

export function getAgendaEntregaLogs(params?: {
  page?: number;
  limit?: number;
  interno?: string;
  usuario?: string;
  from?: string;
  to?: string;
}): Promise<AgendaEntregaLogListResponse> {
  return parseResponse(
    api.get("/entregas/registros", { params }),
    agendaEntregaLogListResponseSchema,
    "Error al obtener registros de auditoria",
  );
}
