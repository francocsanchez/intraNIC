import api from "@/libs/axios";
import {
  pedidoUnidadInternosEstadoResponseSchema,
  pedidoUnidadInfoInternoResponseSchema,
  pedidoUnidadListResponseSchema,
  pedidoUnidadPreviaListResponseSchema,
  pedidoUnidadPreviaResponseSchema,
  pedidoUnidadResponseSchema,
  type PedidoUnidadInfoInterno,
  type PedidoUnidadListResponse,
  type PedidoUnidadPrevia,
  type PedidoUnidadPrioridad,
} from "@/types/index";
import { isAxiosError } from "axios";

type PedidoUnidadPayload = {
  fecha: string;
  items: Array<{
    interno: number;
    PDI: boolean;
    prioridad: PedidoUnidadPrioridad;
    listaPreviaCreatedAt?: string | null;
  }>;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getPedidoUnidadInfoInterno(interno: number): Promise<PedidoUnidadInfoInterno> {
  try {
    const { data } = await api.get(`/dms/pedido-unidades/unidad/${interno}`);
    const parsed = pedidoUnidadInfoInternoResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener la unidad solicitada"));
  }
}

export async function getPedidosUnidades(page = 1, limit = 20): Promise<PedidoUnidadListResponse> {
  try {
    const { data } = await api.get("/dms/pedido-unidades", {
      params: { page, limit },
    });
    const parsed = pedidoUnidadListResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener los pedidos de unidades"));
  }
}

export async function getEstadoInternosPedido(internos: number[]) {
  try {
    const { data } = await api.post("/dms/pedido-unidades/estado-internos", { internos });
    const parsed = pedidoUnidadInternosEstadoResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el estado de pedido por interno"));
  }
}

export async function createPedidoUnidad(payload: PedidoUnidadPayload) {
  try {
    const { data } = await api.post("/dms/pedido-unidades", payload);
    const parsed = pedidoUnidadResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al crear el pedido de unidades"));
  }
}

export async function updatePedidoUnidad(id: string, payload: PedidoUnidadPayload) {
  try {
    const { data } = await api.put(`/dms/pedido-unidades/${id}`, payload);
    const parsed = pedidoUnidadResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar el pedido de unidades"));
  }
}

export async function getPedidoUnidadesPrevias(): Promise<PedidoUnidadPrevia[]> {
  try {
    const { data } = await api.get("/dms/pedido-unidades/previas");
    const parsed = pedidoUnidadPreviaListResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener la lista previa"));
  }
}

export async function createPedidoUnidadPrevia(interno: number) {
  try {
    const { data } = await api.post("/dms/pedido-unidades/previas", { interno });
    const parsed = pedidoUnidadPreviaResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al agregar la unidad a la lista previa"));
  }
}

export async function updatePedidoUnidadPreviaPrioridad(id: string, prioridad: PedidoUnidadPrioridad) {
  try {
    const { data } = await api.patch(`/dms/pedido-unidades/previas/${id}/prioridad`, { prioridad });
    const parsed = pedidoUnidadPreviaResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar la prioridad"));
  }
}

export async function deletePedidoUnidadPrevia(id: string) {
  try {
    const { data } = await api.delete(`/dms/pedido-unidades/previas/${id}`);
    const parsed = pedidoUnidadPreviaResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al eliminar el registro previo"));
  }
}
