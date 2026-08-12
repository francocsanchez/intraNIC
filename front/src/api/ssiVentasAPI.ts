import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  ssiVentasAdministrativasResponseSchema,
  ssiVentasCaseActionResponseSchema,
  ssiVentasCaseUpdateResponseSchema,
  ssiVentasDetailResponseSchema,
  hotAlertMailConfigResponseSchema,
  ssiVentasImportResponseSchema,
  ssiVentasListResponseSchema,
  type SsiVentasAdministrativasResponse,
  type SsiVentasBinaryAnswers,
  type SsiVentasCaseActionResponse,
  type SsiVentasCaseUpdateResponse,
  type SsiVentasDetailResponse,
  type HotAlertMailConfigResponse,
  type SsiVentasImportResponse,
  type SsiVentasListResponse,
  type SsiVentasNumericAnswers,
} from "@/types/index";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

async function parseResponse<T>(
  promise: Promise<{ data: unknown }>,
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false; error: { issues: unknown } };
  },
  fallback: string,
) {
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

export type SsiVentasSurveyPayload = {
  numeric: SsiVentasNumericAnswers;
  binary: SsiVentasBinaryAnswers;
  hotAlert: boolean;
  observaciones?: string;
  administrativaId?: string;
};

export type SsiVentasNoAnswerPayload = {
  observaciones?: string;
  administrativaId?: string;
};

export type SsiVentasAdministrativaPayload = {
  administrativaId: string;
};

export type HotAlertMailConfigPayload = {
  emails: string[];
  activo?: boolean;
};

export function getSsiVentasAdministrativas(): Promise<SsiVentasAdministrativasResponse> {
  return parseResponse(
    api.get("/calidad/ssi-ventas/administrativas"),
    ssiVentasAdministrativasResponseSchema,
    "No se pudo obtener la lista de administrativas",
  );
}

export function getSsiVentasHotAlertConfig(): Promise<HotAlertMailConfigResponse> {
  return parseResponse(
    api.get("/calidad/ssi-ventas/hot-alert-config"),
    hotAlertMailConfigResponseSchema,
    "No se pudo obtener la configuracion de Hot Alert",
  );
}

export function updateSsiVentasHotAlertConfig(
  payload: HotAlertMailConfigPayload,
): Promise<HotAlertMailConfigResponse> {
  return parseResponse(
    api.put("/calidad/ssi-ventas/hot-alert-config", payload),
    hotAlertMailConfigResponseSchema,
    "No se pudo guardar la configuracion de Hot Alert",
  );
}

export async function importSsiVentasCsv(file: File): Promise<SsiVentasImportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return parseResponse(
    api.post("/calidad/ssi-ventas/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
    ssiVentasImportResponseSchema,
    "No se pudo importar el archivo SSI",
  );
}

export function getSsiVentasList(params?: {
  page?: number;
  limit?: number;
  deliveryDate?: string;
}): Promise<SsiVentasListResponse> {
  return parseResponse(
    api.get("/calidad/ssi-ventas", { params }),
    ssiVentasListResponseSchema,
    "No se pudo obtener el listado de SSI Ventas",
  );
}

export function getSsiVentasDetail(operacion: number): Promise<SsiVentasDetailResponse> {
  return parseResponse(
    api.get(`/calidad/ssi-ventas/${operacion}`),
    ssiVentasDetailResponseSchema,
    "No se pudo obtener el detalle del caso SSI",
  );
}

export function registerSsiVentasSurvey(
  operacion: number,
  payload: SsiVentasSurveyPayload,
): Promise<SsiVentasCaseActionResponse> {
  return parseResponse(
    api.post(`/calidad/ssi-ventas/${operacion}/encuesta`, payload),
    ssiVentasCaseActionResponseSchema,
    "No se pudo guardar la encuesta SSI",
  );
}

export function registerSsiVentasNoAnswer(
  operacion: number,
  payload: SsiVentasNoAnswerPayload,
): Promise<SsiVentasCaseActionResponse> {
  return parseResponse(
    api.post(`/calidad/ssi-ventas/${operacion}/no-atendio`, payload),
    ssiVentasCaseActionResponseSchema,
    "No se pudo registrar el intento no atendido",
  );
}

export function updateSsiVentasAdministrativa(
  operacion: number,
  payload: SsiVentasAdministrativaPayload,
): Promise<SsiVentasCaseUpdateResponse> {
  return parseResponse(
    api.patch(`/calidad/ssi-ventas/${operacion}/administrativa`, payload),
    ssiVentasCaseUpdateResponseSchema,
    "No se pudo actualizar la ADM",
  );
}
