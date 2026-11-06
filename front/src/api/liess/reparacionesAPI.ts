import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { liessPresupuestoV2ResponseSchema, liessPresupuestosV2ResponseSchema, liessTallerResponseSchema, liessTalleresResponseSchema, liessUnidadReparacionResponseSchema, type LiessPresupuestoV2, type LiessReparacionEstado, type LiessReparacionPrioridad, type LiessTaller } from "@/types/index";

const message = (error: unknown, fallback: string) => isAxiosError(error) ? error.response?.data?.error || error.response?.data?.message || fallback : fallback;
const read = async <T>(request: Promise<{ data: unknown }>, schema: { parse: (data: unknown) => T }, fallback: string) => { try { return schema.parse((await request).data); } catch (error) { throw new Error(message(error, fallback)); } };

export type LiessPresupuestoV2Payload = { fecha: string; interno: number; tipoUnidad: "nuevo" | "usado"; kmInformado: number; tallerId: string; numeroPresupuesto: string; costo: number; prioridad: LiessReparacionPrioridad; detalles: string };
export type LiessGestionPresupuestoPayload = { estado: LiessReparacionEstado; fechaIngreso?: string | null; fechaEgreso?: string | null; etapasReparacion: [boolean, boolean, boolean, boolean, boolean, boolean] };

export const getLiessTalleres = (all = false) => read(api.get("/dms/liess/reparaciones/talleres", { params: { incluirInactivos: all } }), liessTalleresResponseSchema, "No se pudieron cargar los talleres");
export const saveLiessTaller = (payload: Pick<LiessTaller, "nombre" | "tipoTrabajo">, id?: string) => read(id ? api.patch(`/dms/liess/reparaciones/talleres/${id}`, payload) : api.post("/dms/liess/reparaciones/talleres", payload), liessTallerResponseSchema, "No se pudo guardar el taller");
export const setLiessTallerActivo = (id: string, activo: boolean) => read(api.patch(`/dms/liess/reparaciones/talleres/${id}/activo`, { activo }), liessTallerResponseSchema, "No se pudo actualizar el taller");
export const getLiessUnidad = (interno: number, tipo: "nuevo" | "usado") => read(api.get(`/dms/liess/reparaciones/unidades/${interno}`, { params: { tipo } }), liessUnidadReparacionResponseSchema, "No se pudo buscar el interno");
export const getLiessPresupuestos = () => read(api.get("/dms/liess/reparaciones/presupuestos"), liessPresupuestosV2ResponseSchema, "No se pudieron cargar los presupuestos");
export const createLiessPresupuesto = (payload: LiessPresupuestoV2Payload) => read(api.post("/dms/liess/reparaciones/presupuestos", payload), liessPresupuestoV2ResponseSchema, "No se pudo cargar el presupuesto");
export const manageLiessPresupuesto = (id: string, payload: LiessGestionPresupuestoPayload) => read(api.patch(`/dms/liess/reparaciones/presupuestos/${id}/gestion`, payload), liessPresupuestoV2ResponseSchema, "No se pudo actualizar el presupuesto");
export type { LiessPresupuestoV2 };
