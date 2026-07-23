import api from "@/libs/axios";
import {
  cotizadorCatalogoResponseSchema,
  planFinancieroListResponseSchema,
  planFinancieroResponseSchema,
  versionPrecioMensualListResponseSchema,
  versionPrecioMensualResponseSchema,
  type CotizadorCatalogoResponse,
  type PlanFinancieroListResponse,
  type PlanFinancieroResponse,
  type VersionPrecioMensualListResponse,
  type VersionPrecioMensualResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type VersionPrecioMensualPayload = {
  version: string;
  mes: string;
  precio: number;
  descuentoReferenciaPct: number;
  activo: boolean;
};

export type PlanFinancieroPayload = {
  entidad: string;
  nombre: string;
  activo: boolean;
  plazos: Array<{
    plazo: number;
    tna: number;
    quebrantoTipo: "porcentaje" | "monto";
    quebrantoValor: number;
    maxFinanciacionTipo: "porcentaje" | "monto";
    maxFinanciacionValor: number;
    activo: boolean;
  }>;
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

export function getVersionesPreciosMensuales(mes?: string, activo?: boolean): Promise<VersionPrecioMensualListResponse> {
  return parseResponse(
    api.get("/dms/versiones-precios", {
      params: {
        ...(mes ? { mes } : {}),
        ...(typeof activo === "boolean" ? { activo } : {}),
      },
    }),
    versionPrecioMensualListResponseSchema,
    "Error al obtener los precios mensuales",
  );
}

export function createVersionPrecioMensual(payload: VersionPrecioMensualPayload): Promise<VersionPrecioMensualResponse> {
  return parseResponse(
    api.post("/dms/versiones-precios", payload),
    versionPrecioMensualResponseSchema,
    "Error al crear el precio mensual",
  );
}

export function updateVersionPrecioMensual(id: string, payload: VersionPrecioMensualPayload): Promise<VersionPrecioMensualResponse> {
  return parseResponse(
    api.put(`/dms/versiones-precios/${id}`, payload),
    versionPrecioMensualResponseSchema,
    "Error al actualizar el precio mensual",
  );
}

export function deleteVersionPrecioMensual(id: string): Promise<VersionPrecioMensualResponse> {
  return parseResponse(
    api.delete(`/dms/versiones-precios/${id}`),
    versionPrecioMensualResponseSchema,
    "Error al eliminar el precio mensual",
  );
}

export function getPlanesFinancieros(activo?: boolean): Promise<PlanFinancieroListResponse> {
  return parseResponse(
    api.get("/dms/planes-financieros", {
      params: typeof activo === "boolean" ? { activo } : undefined,
    }),
    planFinancieroListResponseSchema,
    "Error al obtener los planes financieros",
  );
}

export function createPlanFinanciero(payload: PlanFinancieroPayload): Promise<PlanFinancieroResponse> {
  return parseResponse(
    api.post("/dms/planes-financieros", payload),
    planFinancieroResponseSchema,
    "Error al crear el plan financiero",
  );
}

export function updatePlanFinanciero(id: string, payload: PlanFinancieroPayload): Promise<PlanFinancieroResponse> {
  return parseResponse(
    api.put(`/dms/planes-financieros/${id}`, payload),
    planFinancieroResponseSchema,
    "Error al actualizar el plan financiero",
  );
}

export function deletePlanFinanciero(id: string): Promise<PlanFinancieroResponse> {
  return parseResponse(
    api.delete(`/dms/planes-financieros/${id}`),
    planFinancieroResponseSchema,
    "Error al eliminar el plan financiero",
  );
}

export function getCotizadorCatalogo(mes?: string): Promise<CotizadorCatalogoResponse> {
  return parseResponse(
    api.get("/dms/cotizador/catalogo", {
      params: mes ? { mes } : undefined,
    }),
    cotizadorCatalogoResponseSchema,
    "Error al obtener el catalogo del cotizador",
  );
}
