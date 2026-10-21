import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { kintoNpsShareListResponseSchema, kintoNpsShareResponseSchema, type KintoNpsShareListResponse, type KintoNpsShareResponse } from "@/types/index";

const message = (error: unknown, fallback: string) => isAxiosError(error) ? error.response?.data?.error || error.response?.data?.message || fallback : fallback;
async function parse<T>(promise: Promise<{ data: unknown }>, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, fallback: string): Promise<T> { try { const { data } = await promise; const parsed = schema.safeParse(data); if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado"); return parsed.data; } catch (error) { if (error instanceof Error && error.message.includes("formato esperado")) throw error; throw new Error(message(error, fallback)); } }

export type KintoNpsSharePayload = { anio: number; mes: number; promotores: number; pasivos: number; detractores: number };
export const getKintoNpsShare = (anio: number): Promise<KintoNpsShareListResponse> => parse(api.get("/kinto/nps-share", { params: { anio } }), kintoNpsShareListResponseSchema, "No se pudieron cargar los indicadores NPS Share");
export const saveKintoNpsShare = (payload: KintoNpsSharePayload): Promise<KintoNpsShareResponse> => parse(api.put("/kinto/nps-share", payload), kintoNpsShareResponseSchema, "No se pudo guardar el indicador NPS Share");
