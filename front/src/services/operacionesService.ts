import api from "@/libs/axios";
import {
  operacionesDashboardResponseSchema,
  type OperacionesDashboardResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

type OperacionesDashboardParams = {
  anios: number[];
  meses?: number[];
  sucursales?: string[];
  modelos?: string[];
  dias?: number[];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getOperacionesDashboard(
  params: OperacionesDashboardParams,
): Promise<OperacionesDashboardResponse> {
  try {
    const { data } = await api.get("/operaciones/dashboard", {
      params: {
        anios: params.anios.join(","),
        meses: params.meses?.length ? params.meses.join(",") : undefined,
        sucursales: params.sucursales?.length ? params.sucursales.join(",") : undefined,
        modelos: params.modelos?.length ? params.modelos.join(",") : undefined,
        dias: params.dias?.length ? params.dias.join(",") : undefined,
      },
    });

    const parsed = operacionesDashboardResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el dashboard de operaciones"));
  }
}
