import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { kintoMatafuegosHistoryResponseSchema, kintoMatafuegosListResponseSchema, kintoMatafuegosRecargaResponseSchema, type KintoMatafuegosHistoryResponse, type KintoMatafuegosRecargaResponse } from "@/types/index";

const message = (error: unknown, fallback: string) => isAxiosError(error) ? error.response?.data?.error || error.response?.data?.message || fallback : fallback;
async function parse<T>(promise: Promise<{ data: unknown }>, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, fallback: string): Promise<T> { try { const { data } = await promise; const parsed = schema.safeParse(data); if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado"); return parsed.data; } catch (error) { if (error instanceof Error && error.message.includes("formato esperado")) throw error; throw new Error(message(error, fallback)); } }

export const getKintoMatafuegos = () => parse(api.get("/kinto/matafuegos"), kintoMatafuegosListResponseSchema, "No se pudo cargar Matafuegos");
export const getKintoMatafuegosHistory = (flotaId: string): Promise<KintoMatafuegosHistoryResponse> => parse(api.get(`/kinto/matafuegos/${flotaId}/historial`), kintoMatafuegosHistoryResponseSchema, "No se pudo cargar el historial");
export const createKintoMatafuegosRecarga = (flotaId: string, payload: { fechaRecarga: string; fechaVencimiento: string; observaciones: string }): Promise<KintoMatafuegosRecargaResponse> => parse(api.post(`/kinto/matafuegos/${flotaId}/recargas`, payload), kintoMatafuegosRecargaResponseSchema, "No se pudo registrar la recarga");
