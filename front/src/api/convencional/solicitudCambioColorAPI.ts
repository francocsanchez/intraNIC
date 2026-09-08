import api from "@/libs/axios";
import {
  solicitudCambioColorListResponseSchema,
  solicitudCambioColorResponseSchema,
  solicitudCambioColorUnidadResponseSchema,
  vendedoresResponseSchema,
} from "@/types/index";
import { isAxiosError } from "axios";

export type SolicitudCambioColorPayload = { interno: number; solicitadoPorCodigo: number; versionDestinoId: string; colorDestinoId: string; colorDestino2Id?: string; observaciones?: string };
export type SolicitudCambioColorEstado = "solicitudPedida" | "solicitudCompletada";

const parse = async <T>(request: Promise<{ data: unknown }>, schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false } }, fallback: string) => {
  try {
    const { data } = await request;
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new Error("La respuesta del endpoint no tiene el formato esperado");
    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) throw new Error(error.response?.data?.error || error.response?.data?.message || fallback);
    throw error instanceof Error ? error : new Error(fallback);
  }
};

export const getSolicitudesCambioColor = (params?: { interno?: string; estado?: string }) => parse(api.get("/dms/solicitudes-cambio-color", { params }), solicitudCambioColorListResponseSchema, "Error al obtener solicitudes");
export const getUnidadCambioColor = (interno: number) => parse(api.get(`/dms/solicitudes-cambio-color/unidad/${interno}`), solicitudCambioColorUnidadResponseSchema, "Error al consultar el interno");
export const getVendedoresSolicitudCambioColor = () => parse(api.get("/dms/solicitudes-cambio-color/vendedores"), vendedoresResponseSchema, "Error al obtener vendedores");
export const createSolicitudCambioColor = (payload: SolicitudCambioColorPayload) => parse(api.post("/dms/solicitudes-cambio-color", payload), solicitudCambioColorResponseSchema, "Error al crear la solicitud");
export const updateSolicitudCambioColor = (id: string, payload: Omit<SolicitudCambioColorPayload, "interno" | "solicitadoPorCodigo">) => parse(api.put(`/dms/solicitudes-cambio-color/${id}`, payload), solicitudCambioColorResponseSchema, "Error al actualizar la solicitud");
export const updateSolicitudCambioColorEstado = (id: string, field: SolicitudCambioColorEstado, value: boolean) => parse(api.patch(`/dms/solicitudes-cambio-color/${id}/estado`, { field, value }), solicitudCambioColorResponseSchema, "Error al actualizar el estado");
export const rejectSolicitudCambioColor = (id: string) => parse(api.patch(`/dms/solicitudes-cambio-color/${id}/rechazar`), solicitudCambioColorResponseSchema, "Error al rechazar la solicitud");
