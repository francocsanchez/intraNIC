import api from "@/libs/axios";
import {
  minutaGroupResponseSchema,
  minutaGroupsListResponseSchema,
  minutaListResponseSchema,
  minutaParticipantsResponseSchema,
  minutaResponseSchema,
  type MinutaGroupResponse,
  type MinutaGroupsListResponse,
  type MinutaListResponse,
  type MinutaParticipantsResponse,
  type MinutaResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type MinutaTemarioPayload = {
  nombre: string;
  desarrollo: string;
};

export type MinutaPayload = {
  fecha: string;
  tema: string;
  participantes: string[];
  temario: MinutaTemarioPayload[];
};

export type MinutaGroupPayload = {
  nombre: string;
  participantes: string[];
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

export function getMinutas(): Promise<MinutaListResponse> {
  return parseResponse(api.get("/dms/minutas"), minutaListResponseSchema, "Error al obtener las minutas");
}

export function getMinutaById(id: string): Promise<MinutaResponse> {
  return parseResponse(api.get(`/dms/minutas/${id}`), minutaResponseSchema, "Error al obtener la minuta");
}

export function createMinuta(payload: MinutaPayload): Promise<MinutaResponse> {
  return parseResponse(api.post("/dms/minutas", payload), minutaResponseSchema, "Error al crear la minuta");
}

export function updateMinuta(id: string, payload: MinutaPayload): Promise<MinutaResponse> {
  return parseResponse(api.put(`/dms/minutas/${id}`, payload), minutaResponseSchema, "Error al actualizar la minuta");
}

export function deleteMinuta(id: string): Promise<MinutaResponse> {
  return parseResponse(api.delete(`/dms/minutas/${id}`), minutaResponseSchema, "Error al eliminar la minuta");
}

export function getMinutaParticipants(): Promise<MinutaParticipantsResponse> {
  return parseResponse(api.get("/dms/minutas/participants"), minutaParticipantsResponseSchema, "Error al obtener participantes");
}

export function getMinutaGroups(): Promise<MinutaGroupsListResponse> {
  return parseResponse(api.get("/dms/minutas/groups"), minutaGroupsListResponseSchema, "Error al obtener grupos de difusion");
}

export function createMinutaGroup(payload: MinutaGroupPayload): Promise<MinutaGroupResponse> {
  return parseResponse(api.post("/dms/minutas/groups", payload), minutaGroupResponseSchema, "Error al crear grupo de difusion");
}

export function updateMinutaGroup(id: string, payload: MinutaGroupPayload): Promise<MinutaGroupResponse> {
  return parseResponse(api.put(`/dms/minutas/groups/${id}`, payload), minutaGroupResponseSchema, "Error al actualizar grupo de difusion");
}

export function deleteMinutaGroup(id: string): Promise<MinutaGroupResponse> {
  return parseResponse(api.delete(`/dms/minutas/groups/${id}`), minutaGroupResponseSchema, "Error al eliminar grupo de difusion");
}

export async function exportMinutaPdf(id: string) {
  try {
    const response = await api.get(`/dms/minutas/${id}/pdf`, {
      responseType: "blob",
    });

    return response.data as Blob;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al exportar la minuta"));
  }
}

export function sendMinutaByEmail(id: string): Promise<MinutaResponse> {
  return parseResponse(api.post(`/dms/minutas/${id}/send`), minutaResponseSchema, "Error al enviar la minuta por email");
}
