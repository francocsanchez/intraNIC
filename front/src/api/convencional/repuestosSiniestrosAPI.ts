import api from "@/libs/axios";
import { repuestoSiniestroListResponseSchema, repuestoSiniestroNotaResponseSchema, repuestoSiniestroNotasResponseSchema, repuestoSiniestroResponseSchema, repuestoSiniestroUnidadResponseSchema } from "@/types/index";
import { isAxiosError } from "axios";

const parse = async <T>(request: Promise<{ data: unknown }>, schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false } }, fallback: string) => {
  try { const { data } = await request; const parsed = schema.safeParse(data); if (!parsed.success) throw new Error("La respuesta del endpoint no tiene el formato esperado"); return parsed.data; }
  catch (error) { if (isAxiosError(error)) throw new Error(error.response?.data?.error || error.response?.data?.message || fallback); throw error instanceof Error ? error : new Error(fallback); }
};

export const getRepuestosSiniestros = (params?: { estado?: string; etapa?: "pendiente" | "pedido" | "arribado" | "retirado"; interno?: string }) => parse(api.get("/dms/repuestos-siniestros", { params }), repuestoSiniestroListResponseSchema, "Error al obtener los casos");
export const getRepuestoSiniestroUnidad = (interno: number) => parse(api.get(`/dms/repuestos-siniestros/unidad/${interno}`), repuestoSiniestroUnidadResponseSchema, "Error al consultar el interno");
export const buscarNotasPedidoSiniestro = (numero: number) => parse(api.get("/dms/repuestos-siniestros/notas-pedido", { params: { numero } }), repuestoSiniestroNotasResponseSchema, "Error al buscar las notas de pedido");
export const getNotaPedidoSiniestro = (mscNroope: number) => parse(api.get(`/dms/repuestos-siniestros/notas-pedido/${mscNroope}`), repuestoSiniestroNotaResponseSchema, "Error al consultar la Nota de Pedido");
export const createRepuestoSiniestro = (payload: { interno: number; mscNroope: number }) => parse(api.post("/dms/repuestos-siniestros", payload), repuestoSiniestroResponseSchema, "Error al crear el caso");
export const updateRepuestoSiniestro = (id: string, mscNroope: number) => parse(api.put(`/dms/repuestos-siniestros/${id}`, { mscNroope }), repuestoSiniestroResponseSchema, "Error al actualizar el caso");
export const updateRepuestoSiniestroArticuloEstado = (id: string, renglon: number, field: "pedido" | "arribado" | "retirado", value: boolean) => parse(api.patch(`/dms/repuestos-siniestros/${id}/articulos/${renglon}/estado`, { field, value }), repuestoSiniestroResponseSchema, "Error al actualizar el estado del repuesto");
export const deleteRepuestoSiniestro = (id: string) => parse(api.delete(`/dms/repuestos-siniestros/${id}`), repuestoSiniestroResponseSchema, "Error al eliminar el caso");
