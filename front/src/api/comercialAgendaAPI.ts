import api from "@/libs/axios";
import {
  comercialAgendaCellResponseSchema,
  comercialAgendaPuestosResponseSchema,
  comercialAgendaSemanaResponseSchema,
  comercialAgendaUsersResponseSchema,
  unidadNegocioListResponseSchema,
  type ComercialAgendaCellResponse,
  type ComercialAgendaPuestosResponse,
  type ComercialAgendaSemanaResponse,
  type ComercialAgendaUsersResponse,
  type UnidadNegocioListResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type ComercialAgendaPuestoPayload = {
  _id?: string;
  nombre: string;
  activo: boolean;
};

export type ComercialAgendaCellPayload = {
  unidadNegocioId: string;
  fecha: string;
  puestoId: string;
  asistentes: string[];
};

type UnidadNegocioScopedPayload = {
  unidadNegocioId: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

async function parseResponse<T>(
  promise: Promise<{ data: unknown }>,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { issues: unknown } } },
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

export function getComercialAgendaUnidadesNegocio(): Promise<UnidadNegocioListResponse> {
  return parseResponse(
    api.get("/dms/comercial-agenda/unidades-negocio"),
    unidadNegocioListResponseSchema,
    "Error al obtener unidades de negocio",
  );
}

export function getComercialAgendaUsers({
  unidadNegocioId,
}: UnidadNegocioScopedPayload): Promise<ComercialAgendaUsersResponse> {
  return parseResponse(
    api.get("/dms/comercial-agenda/users", { params: { unidadNegocioId } }),
    comercialAgendaUsersResponseSchema,
    "Error al obtener usuarios elegibles",
  );
}

export function getComercialAgendaPuestos(
  unidadNegocioId: string,
  includeInactive = false,
): Promise<ComercialAgendaPuestosResponse> {
  return parseResponse(
    api.get("/dms/comercial-agenda/puestos", {
      params: { unidadNegocioId, ...(includeInactive ? { includeInactive: 1 } : {}) },
    }),
    comercialAgendaPuestosResponseSchema,
    "Error al obtener puestos",
  );
}

export function saveComercialAgendaPuestos(
  unidadNegocioId: string,
  puestos: ComercialAgendaPuestoPayload[],
): Promise<ComercialAgendaPuestosResponse> {
  return parseResponse(
    api.put("/dms/comercial-agenda/puestos", { unidadNegocioId, puestos }),
    comercialAgendaPuestosResponseSchema,
    "Error al guardar puestos",
  );
}

export function getComercialAgendaWeek(
  from: string,
  unidadNegocioId: string,
): Promise<ComercialAgendaSemanaResponse> {
  return parseResponse(
    api.get("/dms/comercial-agenda/week", { params: { from, unidadNegocioId } }),
    comercialAgendaSemanaResponseSchema,
    "Error al obtener la agenda semanal",
  );
}

export function saveComercialAgendaCell(
  payload: ComercialAgendaCellPayload,
): Promise<ComercialAgendaCellResponse> {
  return parseResponse(
    api.put("/dms/comercial-agenda/cell", payload),
    comercialAgendaCellResponseSchema,
    "Error al guardar la asignacion",
  );
}
