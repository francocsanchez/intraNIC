import api from "@/libs/axios";
import {
  empresaGastoResponseSchema,
  rendicionGastoListResponseSchema,
  rendicionGastoResponseSchema,
  type RendicionGastoListResponse,
  type RendicionGastoResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type RendicionGastoPayload = {
  motivo: string;
  montoRetirado?: number;
  gastos: Array<{ fecha: string; empresaNombre: string; empresaCuit: string; descripcion: string; monto: number }>;
};

const errorMessage = (error: unknown, fallback: string) => isAxiosError(error)
  ? error.response?.data?.error || error.response?.data?.message || error.message || fallback
  : fallback;

async function parse<T>(request: Promise<{ data: unknown }>, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, fallback: string) {
  try { const response = await request; const parsed = schema.safeParse(response.data); if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado"); return parsed.data; }
  catch (error) { throw new Error(error instanceof Error && !isAxiosError(error) ? error.message : errorMessage(error, fallback)); }
}

export const getRendicionesGastos = (): Promise<RendicionGastoListResponse> => parse(api.get("/rendiciones-gastos"), rendicionGastoListResponseSchema, "Error al obtener las rendiciones");
export const getRendicionGasto = (id: string): Promise<RendicionGastoResponse> => parse(api.get(`/rendiciones-gastos/${id}`), rendicionGastoResponseSchema, "Error al obtener la rendición");
export const createRendicionGasto = (payload: RendicionGastoPayload): Promise<RendicionGastoResponse> => parse(api.post("/rendiciones-gastos", payload), rendicionGastoResponseSchema, "Error al guardar la rendición");
export const getEmpresaGasto = (cuit: string) => parse(api.get(`/rendiciones-gastos/empresas/${cuit}`), empresaGastoResponseSchema, "Error al buscar la empresa");
export const saveEmpresaGasto = (cuit: string, nombre: string) => parse(api.post("/rendiciones-gastos/empresas", { cuit, nombre }), empresaGastoResponseSchema, "Error al guardar la empresa");
export const exportRendicionGastoPdf = async (id: string) => {
  try { return (await api.get(`/rendiciones-gastos/${id}/pdf`, { responseType: "blob" })).data as Blob; }
  catch (error) { throw new Error(errorMessage(error, "Error al generar el PDF")); }
};
