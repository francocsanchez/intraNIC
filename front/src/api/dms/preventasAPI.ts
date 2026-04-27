import api from "@/libs/axios";
import {
  catalogoListResponseSchema,
  catalogoResponseSchema,
  pedidoMensualListResponseSchema,
  pedidoMensualResponseSchema,
  preventaListResponseSchema,
  preventaResponseSchema,
  preventaResumenResponseSchema,
  resumenPedidoMensualResponseSchema,
  type CatalogoListResponse,
  type CatalogoResponse,
  type PedidoMensualListResponse,
  type PedidoMensualResponse,
  type PreventaListResponse,
  type PreventaResponse,
  type PreventaResumenResponse,
  type ResumenPedidoMensualResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

type CatalogoPayload = {
  nombre: string;
  activo: boolean;
};

type PedidoMensualPayload = {
  version: string;
  cantidad: number;
};

export type PreventaPayload = {
  vendedor: number;
  numero_op?: number | null;
  cliente: string;
  version: string;
  colores: string[];
  monto_reserva?: number | null;
  observaciones?: string;
  mes_asigna: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

async function parseResponse<T>(promise: Promise<{ data: unknown }>, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false; error: { issues: unknown } } }, fallback: string) {
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

export function getPreventas(asignado?: boolean): Promise<PreventaListResponse> {
  return parseResponse(
    api.get("/dms/preventas", {
      params: typeof asignado === "boolean" ? { asignado } : undefined,
    }),
    preventaListResponseSchema,
    "Error al obtener las preventas",
  );
}

export function getPreventaById(id: string): Promise<PreventaResponse> {
  return parseResponse(api.get(`/dms/preventas/${id}`), preventaResponseSchema, "Error al obtener la preventa");
}

export function createPreventa(payload: PreventaPayload): Promise<PreventaResponse> {
  return parseResponse(api.post("/dms/preventas", payload), preventaResponseSchema, "Error al crear la preventa");
}

export function updatePreventa(id: string, payload: PreventaPayload): Promise<PreventaResponse> {
  return parseResponse(api.put(`/dms/preventas/${id}`, payload), preventaResponseSchema, "Error al actualizar la preventa");
}

export function deletePreventa(id: string): Promise<PreventaResponse> {
  return parseResponse(api.delete(`/dms/preventas/${id}`), preventaResponseSchema, "Error al eliminar la preventa");
}

export function patchPreventaAsignado(id: string, asignado: boolean): Promise<PreventaResponse> {
  return parseResponse(
    api.patch(`/dms/preventas/${id}/asignado`, { asignado }),
    preventaResponseSchema,
    "Error al actualizar el estado de la preventa",
  );
}

export function getPreventasResumenPendientes(): Promise<PreventaResumenResponse> {
  return parseResponse(
    api.get("/dms/preventas/resumen-pendientes"),
    preventaResumenResponseSchema,
    "Error al obtener el resumen de preventas",
  );
}

export function getPedidoMensual(): Promise<PedidoMensualListResponse> {
  return parseResponse(
    api.get("/dms/pedido-mensual"),
    pedidoMensualListResponseSchema,
    "Error al obtener el pedido mensual",
  );
}

export function createPedidoMensual(payload: PedidoMensualPayload): Promise<PedidoMensualResponse> {
  return parseResponse(
    api.post("/dms/pedido-mensual", payload),
    pedidoMensualResponseSchema,
    "Error al guardar el pedido mensual",
  );
}

export function updatePedidoMensual(id: string, payload: PedidoMensualPayload): Promise<PedidoMensualResponse> {
  return parseResponse(
    api.put(`/dms/pedido-mensual/${id}`, payload),
    pedidoMensualResponseSchema,
    "Error al actualizar el pedido mensual",
  );
}

export function deletePedidoMensual(id: string): Promise<PedidoMensualResponse> {
  return parseResponse(
    api.delete(`/dms/pedido-mensual/${id}`),
    pedidoMensualResponseSchema,
    "Error al eliminar el pedido mensual",
  );
}

export function getResumenPedidoMensual(): Promise<ResumenPedidoMensualResponse> {
  return parseResponse(
    api.get("/dms/preventas/resumen-pedido-mensual"),
    resumenPedidoMensualResponseSchema,
    "Error al obtener el resumen de pedido mensual",
  );
}

export function getColores(activo?: boolean): Promise<CatalogoListResponse> {
  return parseResponse(
    api.get("/dms/colores", {
      params: typeof activo === "boolean" ? { activo } : undefined,
    }),
    catalogoListResponseSchema,
    "Error al obtener los colores",
  );
}

export function createColor(payload: CatalogoPayload): Promise<CatalogoResponse> {
  return parseResponse(api.post("/dms/colores", payload), catalogoResponseSchema, "Error al crear el color");
}

export function updateColor(id: string, payload: CatalogoPayload): Promise<CatalogoResponse> {
  return parseResponse(api.put(`/dms/colores/${id}`, payload), catalogoResponseSchema, "Error al actualizar el color");
}

export function deleteColor(id: string): Promise<CatalogoResponse> {
  return parseResponse(api.delete(`/dms/colores/${id}`), catalogoResponseSchema, "Error al eliminar el color");
}

export function getVersiones(activo?: boolean): Promise<CatalogoListResponse> {
  return parseResponse(
    api.get("/dms/versiones", {
      params: typeof activo === "boolean" ? { activo } : undefined,
    }),
    catalogoListResponseSchema,
    "Error al obtener las versiones",
  );
}

export function createVersion(payload: CatalogoPayload): Promise<CatalogoResponse> {
  return parseResponse(api.post("/dms/versiones", payload), catalogoResponseSchema, "Error al crear la version");
}

export function updateVersion(id: string, payload: CatalogoPayload): Promise<CatalogoResponse> {
  return parseResponse(api.put(`/dms/versiones/${id}`, payload), catalogoResponseSchema, "Error al actualizar la version");
}

export function deleteVersion(id: string): Promise<CatalogoResponse> {
  return parseResponse(api.delete(`/dms/versiones/${id}`), catalogoResponseSchema, "Error al eliminar la version");
}
