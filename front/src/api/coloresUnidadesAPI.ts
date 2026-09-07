import api from "@/libs/axios";
import { catalogoListResponseSchema, catalogoResponseSchema, type CatalogoListResponse, type CatalogoResponse } from "@/types/index";
import { isAxiosError } from "axios";

type ColorUnidadPayload = { nombre: string; hex: string; activo: boolean };

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

export const getColoresUnidades = () => parse<CatalogoListResponse>(api.get("/config/colores-unidades"), catalogoListResponseSchema, "Error al listar colores de unidades");
export const getColoresUnidadesBadges = () => parse<CatalogoListResponse>(api.get("/config/colores-unidades/badges"), catalogoListResponseSchema, "Error al obtener colores de unidades");
export const createColorUnidad = (payload: ColorUnidadPayload) => parse<CatalogoResponse>(api.post("/config/colores-unidades", payload), catalogoResponseSchema, "Error al crear color de unidad");
export const updateColorUnidad = (id: string, payload: ColorUnidadPayload) => parse<CatalogoResponse>(api.put(`/config/colores-unidades/${id}`, payload), catalogoResponseSchema, "Error al actualizar color de unidad");
