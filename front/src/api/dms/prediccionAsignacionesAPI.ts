import api from "@/libs/axios";
import {
  prediccionAsignacionesResponseSchema,
  type PrediccionAsignacionesResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export async function getPrediccionAsignaciones(): Promise<PrediccionAsignacionesResponse> {
  try {
    const { data } = await api.get("/dms/prediccion-asignaciones");
    const parsed = prediccionAsignacionesResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Error al obtener las predicciones de asignacion",
      );
    }

    throw new Error("Error inesperado al obtener las predicciones de asignacion");
  }
}
