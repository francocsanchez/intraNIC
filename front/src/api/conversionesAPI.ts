import api from "@/libs/axios";
import {
  conversionListResponseSchema,
  conversionResponseSchema,
  type ConversionListResponse,
  type ConversionResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type ConversionPayload = { tipoConversion: string; proveedor: string };

async function parse<T>(request: Promise<{ data: unknown }>, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, fallback: string) {
  try {
    const response = await request;
    const result = schema.safeParse(response.data);
    if (result.success) return result.data;
    throw new Error(fallback);
  } catch (error) {
    if (isAxiosError(error)) throw new Error(error.response?.data?.error || error.response?.data?.message || fallback);
    throw error instanceof Error ? error : new Error(fallback);
  }
}

export const getConversiones = () => parse<ConversionListResponse>(api.get("/config/conversiones"), conversionListResponseSchema, "Error al listar las conversiones");
export const createConversion = (payload: ConversionPayload) => parse<ConversionResponse>(api.post("/config/conversiones", payload), conversionResponseSchema, "Error al crear la conversión");
export const updateConversion = (id: string, payload: ConversionPayload) => parse<ConversionResponse>(api.put(`/config/conversiones/${id}`, payload), conversionResponseSchema, "Error al actualizar la conversión");
