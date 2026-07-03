import api from "@/libs/axios";
import {
  planNegocioListResponseSchema,
  planNegocioModelosResponseSchema,
  planNegocioResponseSchema,
  planNegocioResumenResponseSchema,
  type PlanNegocioListResponse,
  type PlanNegocioModelosResponse,
  type PlanNegocioResponse,
  type PlanNegocioResumenResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

type PlanNegocioPayload = {
  modelo: string;
  anio: number;
  objetivo: number;
  activo: boolean;
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

export function getPlanesNegocio(anio?: number): Promise<PlanNegocioListResponse> {
  return parseResponse(
    api.get("/dms/plan-negocio", {
      params: typeof anio === "number" ? { anio } : undefined,
    }),
    planNegocioListResponseSchema,
    "Error al obtener el plan de negocio",
  );
}

export function getPlanNegocioModelos(): Promise<PlanNegocioModelosResponse> {
  return parseResponse(
    api.get("/dms/plan-negocio/modelos"),
    planNegocioModelosResponseSchema,
    "Error al obtener los modelos del plan de negocio",
  );
}

export function createPlanNegocio(payload: PlanNegocioPayload): Promise<PlanNegocioResponse> {
  return parseResponse(
    api.post("/dms/plan-negocio", payload),
    planNegocioResponseSchema,
    "Error al crear el plan de negocio",
  );
}

export function updatePlanNegocio(id: string, payload: PlanNegocioPayload): Promise<PlanNegocioResponse> {
  return parseResponse(
    api.put(`/dms/plan-negocio/${id}`, payload),
    planNegocioResponseSchema,
    "Error al actualizar el plan de negocio",
  );
}

export function deletePlanNegocio(id: string): Promise<PlanNegocioResponse> {
  return parseResponse(
    api.delete(`/dms/plan-negocio/${id}`),
    planNegocioResponseSchema,
    "Error al eliminar el plan de negocio",
  );
}

export function getPlanNegocioResumen(anio: number): Promise<PlanNegocioResumenResponse> {
  return parseResponse(
    api.get(`/dms/plan-negocio/resumen/${anio}`),
    planNegocioResumenResponseSchema,
    "Error al obtener el resumen del plan de negocio",
  );
}
