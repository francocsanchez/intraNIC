import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  kintoMultaDomainsResponseSchema, kintoMultaHistoryResponseSchema, kintoMultaListResponseSchema, kintoMultaResponseSchema,
  type KintoMultaDomainsResponse, type KintoMultaHistoryResponse, type KintoMultaListResponse, type KintoMultaResponse, type KintoMultaStatus,
} from "@/types/index";

const message = (error: unknown, fallback: string) => isAxiosError(error) ? error.response?.data?.error || error.response?.data?.message || fallback : fallback;
async function parse<T>(promise: Promise<{ data: unknown }>, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, fallback: string): Promise<T> { try { const { data } = await promise; const parsed = schema.safeParse(data); if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado"); return parsed.data; } catch (error) { if (error instanceof Error && error.message.includes("formato esperado")) throw error; throw new Error(message(error, fallback)); } }

export type KintoMultaPayload = { flotaId: string; fecha: string; booking: string; monto: number };
export const getKintoMultas = (estado: KintoMultaStatus): Promise<KintoMultaListResponse> => parse(api.get("/kinto/multas", { params: { estado } }), kintoMultaListResponseSchema, "No se pudieron cargar las multas");
export const searchKintoMultaDomains = (q: string): Promise<KintoMultaDomainsResponse> => parse(api.get("/kinto/multas/dominios", { params: { q } }), kintoMultaDomainsResponseSchema, "No se pudieron buscar dominios");
export const createKintoMulta = (payload: KintoMultaPayload): Promise<KintoMultaResponse> => parse(api.post("/kinto/multas", payload), kintoMultaResponseSchema, "No se pudo registrar la multa");
export const updateKintoMulta = (id: string, payload: KintoMultaPayload): Promise<KintoMultaResponse> => parse(api.patch(`/kinto/multas/${id}`, payload), kintoMultaResponseSchema, "No se pudo actualizar la multa");
export const updateKintoMultaStatus = (id: string, field: "cobrado" | "facturado" | "pagado", value: boolean): Promise<KintoMultaResponse> => parse(api.patch(`/kinto/multas/${id}/estado`, { field, value }), kintoMultaResponseSchema, "No se pudo actualizar el estado");
export const getKintoMultaHistory = (id: string): Promise<KintoMultaHistoryResponse> => parse(api.get(`/kinto/multas/${id}/historial`), kintoMultaHistoryResponseSchema, "No se pudo cargar el historial");
export const deleteKintoMulta = (id: string): Promise<{ message: string }> => parse(api.delete(`/kinto/multas/${id}`), { safeParse: (value: unknown) => { const parsed = (value && typeof value === "object" && typeof (value as { message?: unknown }).message === "string") ? { success: true as const, data: value as { message: string } } : { success: false as const }; return parsed; } }, "No se pudo eliminar la multa");
