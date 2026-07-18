import api from "@/libs/axios";
import {
  unidadNegocioListResponseSchema,
  unidadNegocioResponseSchema,
  type UnidadNegocioListResponse,
  type UnidadNegocioResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type UnidadNegocioPayload = {
  nombre: string;
  activo?: boolean;
  orden?: number;
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

export function getUnidadesNegocio(includeInactive = false): Promise<UnidadNegocioListResponse> {
  return parseResponse(
    api.get("/unidades-negocio", { params: includeInactive ? { includeInactive: 1 } : undefined }),
    unidadNegocioListResponseSchema,
    "Error al obtener unidades de negocio",
  );
}

export function createUnidadNegocio(payload: UnidadNegocioPayload): Promise<UnidadNegocioResponse> {
  return parseResponse(
    api.post("/unidades-negocio", payload),
    unidadNegocioResponseSchema,
    "Error al crear la unidad de negocio",
  );
}

export function updateUnidadNegocio(
  idUnidadNegocio: string,
  payload: UnidadNegocioPayload,
): Promise<UnidadNegocioResponse> {
  return parseResponse(
    api.put(`/unidades-negocio/${idUnidadNegocio}`, payload),
    unidadNegocioResponseSchema,
    "Error al actualizar la unidad de negocio",
  );
}

export function deleteUnidadNegocio(idUnidadNegocio: string): Promise<UnidadNegocioResponse> {
  return parseResponse(
    api.delete(`/unidades-negocio/${idUnidadNegocio}`),
    unidadNegocioResponseSchema,
    "Error al desactivar la unidad de negocio",
  );
}
