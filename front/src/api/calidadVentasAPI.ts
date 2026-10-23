import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  calidadVentasListResponseSchema,
  calidadVentasSaveResponseSchema,
  calidadVentasSellersResponseSchema,
  type CalidadVentasListResponse,
  type CalidadVentasResultadoValor,
  type CalidadVentasSaveResponse,
  type CalidadVentasSellersResponse,
} from "@/types/index";

export type CalidadVentasPayload = {
  vendedorCodigo: number;
  anio: number;
  mes: number;
  oportunidadesPresupuesto: CalidadVentasResultadoValor;
  entregaUsado: CalidadVentasResultadoValor;
  tcfa: CalidadVentasResultadoValor;
  ssiInterno: CalidadVentasResultadoValor;
  ssiValor: number;
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

export function getCalidadVentasResultados(anio: number, mes: number): Promise<CalidadVentasListResponse> {
  return parseResponse(api.get("/calidad/ventas", { params: { anio, mes } }), calidadVentasListResponseSchema, "No se pudieron obtener los resultados de Ventas");
}

export function searchCalidadVentasVendedores(buscar: string): Promise<CalidadVentasSellersResponse> {
  return parseResponse(api.get("/calidad/ventas/vendedores", { params: { buscar } }), calidadVentasSellersResponseSchema, "No se pudieron buscar los vendedores");
}

export function saveCalidadVentasResultado(payload: CalidadVentasPayload): Promise<CalidadVentasSaveResponse> {
  return parseResponse(api.put("/calidad/ventas", payload), calidadVentasSaveResponseSchema, "No se pudo guardar el resultado");
}
