import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  licitacionAdministracionListResponseSchema,
  licitacionAdministracionResponseSchema,
  licitacionCatalogosResponseSchema,
  licitacionUnidadesMutationResponseSchema,
  licitacionUnidadesResponseSchema,
  type LicitacionAdministracionListResponse,
  type LicitacionAdministracionResponse,
  type LicitacionCatalogosResponse,
  type LicitacionUnidadesMutationResponse,
  type LicitacionUnidadesResponse,
} from "@/types/index";

const message = (error: unknown, fallback: string) =>
  isAxiosError(error)
    ? error.response?.data?.error || error.response?.data?.message || fallback
    : fallback;
async function parse<T>(
  promise: Promise<{ data: unknown }>,
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false };
  },
  fallback: string,
): Promise<T> {
  try {
    const { data } = await promise;
    const parsed = schema.safeParse(data);
    if (!parsed.success)
      throw new Error("La respuesta del servidor no tiene el formato esperado");
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("formato esperado"))
      throw error;
    throw new Error(message(error, fallback));
  }
}

export type LicitacionAdministracionPayload = {
  entidad: string;
  cuit: string;
  contactoNombre: string;
  contactoApellido: string;
  contactoTelefono: string;
  fechaApertura: string;
  diasMantenimientoOferta: number;
};
export const getLicitacionesAdministracion =
  (): Promise<LicitacionAdministracionListResponse> =>
    parse(
      api.get("/licitaciones/administracion"),
      licitacionAdministracionListResponseSchema,
      "No se pudieron cargar las licitaciones",
    );
export const createLicitacionAdministracion = (
  payload: LicitacionAdministracionPayload,
): Promise<LicitacionAdministracionResponse> =>
  parse(
    api.post("/licitaciones/administracion", payload),
    licitacionAdministracionResponseSchema,
    "No se pudo registrar la licitación",
  );
export const updateLicitacionAdministracion = (
  id: string,
  payload: LicitacionAdministracionPayload,
): Promise<LicitacionAdministracionResponse> =>
  parse(
    api.patch(`/licitaciones/administracion/${id}`, payload),
    licitacionAdministracionResponseSchema,
    "No se pudo actualizar la licitación",
  );
export const removeLicitacionAdministracion = (
  id: string,
): Promise<LicitacionAdministracionResponse> =>
  parse(
    api.delete(`/licitaciones/administracion/${id}`),
    licitacionAdministracionResponseSchema,
    "No se pudo eliminar la licitación",
  );
export const updateLicitacionFlow = (
  id: string,
  field: "tecnica" | "preAdjudicado" | "pagare" | "oc",
  value: boolean | null,
): Promise<LicitacionAdministracionResponse> =>
  parse(
    api.patch(`/licitaciones/administracion/${id}/flujo`, { field, value }),
    licitacionAdministracionResponseSchema,
    "No se pudo actualizar el flujo",
  );
export const extendLicitacionMaintenance = (
  id: string,
  dias: number,
): Promise<LicitacionAdministracionResponse> =>
  parse(
    api.patch(`/licitaciones/administracion/${id}/prorroga`, { dias }),
    licitacionAdministracionResponseSchema,
    "No se pudo registrar la prórroga",
  );
export type LicitacionUnidadPayload = { versionId: string; cantidad: number };
export const getLicitacionCatalogos =
  (): Promise<LicitacionCatalogosResponse> =>
    parse(
      api.get("/licitaciones/administracion/catalogos"),
      licitacionCatalogosResponseSchema,
      "No se pudieron cargar versiones y colores",
    );
export const getLicitacionUnidades = (
  id: string,
): Promise<LicitacionUnidadesResponse> =>
  parse(
    api.get(`/licitaciones/administracion/${id}/unidades`),
    licitacionUnidadesResponseSchema,
    "No se pudieron cargar las unidades",
  );
export const exportLicitacionAdministracionPdf = async (
  id: string,
): Promise<Blob> => {
  try {
    return (
      await api.get(`/licitaciones/administracion/${id}/pdf`, {
        responseType: "blob",
      })
    ).data as Blob;
  } catch (error) {
    throw new Error(
      message(error, "No se pudo generar el PDF de la licitación"),
    );
  }
};
export const addLicitacionUnidad = (
  id: string,
  payload: LicitacionUnidadPayload,
): Promise<LicitacionUnidadesMutationResponse> =>
  parse(
    api.post(`/licitaciones/administracion/${id}/unidades`, payload),
    licitacionUnidadesMutationResponseSchema,
    "No se pudo agregar la unidad",
  );
export const updateLicitacionUnidad = (
  id: string,
  unitId: string,
  payload: LicitacionUnidadPayload,
): Promise<LicitacionUnidadesMutationResponse> =>
  parse(
    api.patch(`/licitaciones/administracion/${id}/unidades/${unitId}`, payload),
    licitacionUnidadesMutationResponseSchema,
    "No se pudo actualizar la unidad",
  );
export type LicitacionUnidadProgressField = "asignada" | "equipadaTransformada" | "arribada" | "patentada" | "pagada" | "entregada";
export const updateLicitacionUnidadProgress = (
  id: string,
  unitId: string,
  field: LicitacionUnidadProgressField,
  value: boolean,
): Promise<LicitacionUnidadesMutationResponse> =>
  parse(
    api.patch(
      `/licitaciones/administracion/${id}/unidades/${unitId}/avance`,
      { field, value },
    ),
    licitacionUnidadesMutationResponseSchema,
    "No se pudo actualizar el avance de la unidad",
  );
export type LicitacionUnidadBulkProgressField = Exclude<
  LicitacionUnidadProgressField,
  "asignada"
>;
export const updateLicitacionUnidadesProgress = (
  id: string,
  field: LicitacionUnidadBulkProgressField,
  value: boolean,
): Promise<LicitacionUnidadesMutationResponse> =>
  parse(
    api.patch(`/licitaciones/administracion/${id}/unidades/avance`, {
      field,
      value,
    }),
    licitacionUnidadesMutationResponseSchema,
    "No se pudo actualizar la columna",
  );
export const assignLicitacionUnidadInterno = (
  id: string,
  unitId: string,
  interno: number,
): Promise<LicitacionUnidadesMutationResponse> =>
  parse(
    api.patch(`/licitaciones/administracion/${id}/unidades/${unitId}/interno`, {
      interno,
    }),
    licitacionUnidadesMutationResponseSchema,
    "No se pudo asignar el interno",
  );
export const releaseLicitacionUnidadInterno = (
  id: string,
  unitId: string,
): Promise<LicitacionUnidadesMutationResponse> =>
  parse(
    api.delete(`/licitaciones/administracion/${id}/unidades/${unitId}/interno`),
    licitacionUnidadesMutationResponseSchema,
    "No se pudo liberar el interno",
  );
export const removeLicitacionUnidad = (
  id: string,
  unitId: string,
  rowIndex: number,
): Promise<LicitacionUnidadesMutationResponse> =>
  parse(
    api.delete(`/licitaciones/administracion/${id}/unidades/${unitId}`, {
      data: { rowIndex },
    }),
    licitacionUnidadesMutationResponseSchema,
    "No se pudo quitar la unidad",
  );
