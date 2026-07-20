import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  fsanchezOperacionEstadoResponseSchema,
  fsanchezOperacionesResponseSchema,
  type FsanchezOperacionEstadoResponse,
  type FsanchezOperacionesResponse,
} from "@/types/index";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getFsanchezOperaciones(): Promise<FsanchezOperacionesResponse> {
  try {
    const { data } = await api.get("/dms/fsanchez/operaciones");
    const parsed = fsanchezOperacionesResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint FSANCHEZ no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener operaciones FSANCHEZ"));
  }
}

export async function updateFsanchezOperacionEstado(
  opera: string,
  payload: { cancelada?: boolean; alerta?: "normal" | "media" | "alta"; comentario?: string },
): Promise<FsanchezOperacionEstadoResponse> {
  try {
    const { data } = await api.patch(`/dms/fsanchez/operaciones/${encodeURIComponent(opera)}`, payload);
    const parsed = fsanchezOperacionEstadoResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta al actualizar FSANCHEZ no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar la operacion"));
  }
}
