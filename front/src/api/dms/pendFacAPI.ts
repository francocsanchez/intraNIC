import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { pendFacResponseSchema, type PendFacResponse } from "@/types/index";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getPendFac(): Promise<PendFacResponse> {
  try {
    const { data } = await api.get("/dms/pend-fac");
    const parsed = pendFacResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener Pend Fac"));
  }
}

export async function exportPendFac(): Promise<Blob> {
  try {
    const { data } = await api.get("/dms/pend-fac/export", {
      responseType: "blob",
    });

    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al exportar Pend Fac"));
  }
}
