import api from "@/libs/axios";
import {
  proformaListResponseSchema,
  proformaResponseSchema,
  type ProformaListResponse,
  type ProformaResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type ProformaUnidadPayload = {
  version: string;
  cantidad: number;
  ivaUnidad: number;
  totalUnidad: number;
  descuentoUnidad: number;
  totalPatentamiento: number;
  totalFlete: number;
};

export type ProformaPayload = {
  senores: string;
  cliente?: string;
  cuit?: string;
  observaciones?: string;
  unidades: ProformaUnidadPayload[];
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

export function getProformas(): Promise<ProformaListResponse> {
  return parseResponse(api.get("/dms/proformas"), proformaListResponseSchema, "Error al obtener las proformas");
}

export function getProformaById(id: string): Promise<ProformaResponse> {
  return parseResponse(api.get(`/dms/proformas/${id}`), proformaResponseSchema, "Error al obtener la proforma");
}

export function createProforma(payload: ProformaPayload): Promise<ProformaResponse> {
  return parseResponse(api.post("/dms/proformas", payload), proformaResponseSchema, "Error al crear la proforma");
}

export async function exportProformaPdf(id: string) {
  try {
    const response = await api.get(`/dms/proformas/${id}/pdf`, {
      responseType: "blob",
    });

    return response.data as Blob;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al exportar la proforma"));
  }
}
