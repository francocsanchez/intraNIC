import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  licitacionResumenListResponseSchema,
  licitacionResumenUnidadesResponseSchema,
  type LicitacionResumenListResponse,
  type LicitacionResumenUnidadesResponse,
} from "@/types/index";

const message = (error: unknown, fallback: string) =>
  isAxiosError(error)
    ? error.response?.data?.error || error.response?.data?.message || fallback
    : fallback;

async function parse<T>(
  promise: Promise<{ data: unknown }>,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
  fallback: string,
): Promise<T> {
  try {
    const { data } = await promise;
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado");
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("formato esperado")) throw error;
    throw new Error(message(error, fallback));
  }
}

export const getLicitacionesResumen = (): Promise<LicitacionResumenListResponse> =>
  parse(
    api.get("/licitaciones/resumen"),
    licitacionResumenListResponseSchema,
    "No se pudieron cargar los resúmenes de licitaciones",
  );

export const getLicitacionResumenUnidades = (
  id: string,
): Promise<LicitacionResumenUnidadesResponse> =>
  parse(
    api.get(`/licitaciones/resumen/${id}/unidades`),
    licitacionResumenUnidadesResponseSchema,
    "No se pudieron cargar las unidades de la licitación",
  );
