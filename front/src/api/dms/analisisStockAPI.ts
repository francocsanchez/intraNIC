import api from "@/libs/axios";
import {
  analisisStockDictionaryListResponseSchema,
  analisisStockDictionaryResponseSchema,
  analisisStockPedResponseSchema,
  analisisStockResponseSchema,
  analisisStockVersionesDisponiblesResponseSchema,
  type AnalisisStockDictionaryListResponse,
  type AnalisisStockDictionaryResponse,
  type AnalisisStockPedResponse,
  type AnalisisStockResponse,
  type AnalisisStockVersionesDisponiblesResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getAnalisisStock(): Promise<AnalisisStockResponse> {
  try {
    const { data } = await api.get("/dms/analisis-stock");
    const parsed = analisisStockResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el analisis de stock"));
  }
}

export async function saveAnalisisStockPed(payload: {
  modelo: string;
  version: string;
  cantidad: number;
}): Promise<AnalisisStockPedResponse> {
  try {
    const { data } = await api.post("/dms/analisis-stock/ped", payload);
    const parsed = analisisStockPedResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al guardar el PED"));
  }
}

export async function getAnalisisStockVersionDictionary(): Promise<AnalisisStockDictionaryListResponse> {
  try {
    const { data } = await api.get("/dms/analisis-stock/diccionario-versiones");
    const parsed = analisisStockDictionaryListResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el diccionario de versiones"));
  }
}

export async function createAnalisisStockVersionDictionary(payload: {
  modelo: string;
  versionRaw: string;
  versionCanonica: string;
}): Promise<AnalisisStockDictionaryResponse> {
  try {
    const { data } = await api.post("/dms/analisis-stock/diccionario-versiones", payload);
    const parsed = analisisStockDictionaryResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al crear la version unificada"));
  }
}

export async function updateAnalisisStockVersionDictionary(
  id: string,
  payload: {
    modelo: string;
    versionRaw: string;
    versionCanonica: string;
  },
): Promise<AnalisisStockDictionaryResponse> {
  try {
    const { data } = await api.put(`/dms/analisis-stock/diccionario-versiones/${id}`, payload);
    const parsed = analisisStockDictionaryResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al actualizar la version unificada"));
  }
}

export async function deleteAnalisisStockVersionDictionary(id: string): Promise<AnalisisStockDictionaryResponse> {
  try {
    const { data } = await api.delete(`/dms/analisis-stock/diccionario-versiones/${id}`);
    const parsed = analisisStockDictionaryResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al eliminar la version unificada"));
  }
}

export async function getAnalisisStockVersionesDisponibles(): Promise<AnalisisStockVersionesDisponiblesResponse> {
  try {
    const { data } = await api.get("/dms/analisis-stock/versiones-disponibles");
    const parsed = analisisStockVersionesDisponiblesResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener las versiones disponibles"));
  }
}
