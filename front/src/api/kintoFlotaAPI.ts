import api from "@/libs/axios";
import {
  kintoFlotaListResponseSchema,
  kintoFlotaLookupResponseSchema,
  kintoFlotaResponseSchema,
  sucursalEntregaListResponseSchema,
  type KintoFlotaListResponse,
  type KintoFlotaLookupResponse,
  type KintoFlotaResponse,
  type SucursalEntregaListResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type KintoFlotaPayload = {
  dominio: string;
  modelo: string;
  anio: number;
  vin: string;
  kmIniciales: number;
  geotab: "Reportando" | "Sin Conexion";
};

const message = (error: unknown, fallback: string) =>
  isAxiosError(error)
    ? error.response?.data?.error || error.response?.data?.message || error.message || fallback
    : fallback;

async function parse<T>(promise: Promise<{ data: unknown }>, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, fallback: string): Promise<T> {
  try {
    const { data } = await promise;
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado");
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.message === "La respuesta del servidor no tiene el formato esperado") throw error;
    throw new Error(message(error, fallback));
  }
}

export const getKintoFlota = (): Promise<KintoFlotaListResponse> =>
  parse(api.get("/kinto/flota"), kintoFlotaListResponseSchema, "No se pudo cargar la flota");

export const lookupKintoVehicle = (patente: string): Promise<KintoFlotaLookupResponse> =>
  parse(api.get("/kinto/flota/buscar", { params: { patente } }), kintoFlotaLookupResponseSchema, "No se pudo buscar la patente en SIAC");

export const createKintoFlota = (payload: KintoFlotaPayload): Promise<KintoFlotaResponse> =>
  parse(api.post("/kinto/flota", payload), kintoFlotaResponseSchema, "No se pudo agregar la unidad a la flota");

export const getKintoSucursales = (): Promise<SucursalEntregaListResponse> =>
  parse(api.get("/kinto/flota/sucursales"), sucursalEntregaListResponseSchema, "No se pudieron cargar las sucursales");

export const updateKintoFlotaSucursal = (id: string, sucursalEntregaId: string | null): Promise<KintoFlotaResponse> =>
  parse(api.patch(`/kinto/flota/${id}/sucursal`, { sucursalEntregaId }), kintoFlotaResponseSchema, "No se pudo actualizar la sucursal");

export const updateKintoFlotaKm = (id: string, kmActual: number): Promise<KintoFlotaResponse> =>
  parse(api.patch(`/kinto/flota/${id}/km`, { kmActual }), kintoFlotaResponseSchema, "No se pudo actualizar el KM actual");

export const deactivateKintoFlota = (id: string): Promise<KintoFlotaResponse> =>
  parse(api.patch(`/kinto/flota/${id}/desactivar`), kintoFlotaResponseSchema, "No se pudo desactivar la unidad");

export const reactivateKintoFlota = (id: string): Promise<KintoFlotaResponse> =>
  parse(api.patch(`/kinto/flota/${id}/reactivar`), kintoFlotaResponseSchema, "No se pudo reactivar la unidad");

export const updateKintoFlotaGeotab = (id: string, geotab: "Reportando" | "Sin Conexion"): Promise<KintoFlotaResponse> =>
  parse(api.patch(`/kinto/flota/${id}/geotab`, { geotab }), kintoFlotaResponseSchema, "No se pudo actualizar Geotab");
