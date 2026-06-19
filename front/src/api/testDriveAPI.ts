import api from "@/libs/axios";
import {
  testDriveListResponseSchema,
  testDriveResponseSchema,
  type TestDriveListResponse,
  type TestDriveResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type TestDrivePayload = {
  dominio: string;
  modelo: string;
  versionId: string;
  chasis: string;
  colorId: string;
  negocio: "convencional" | "planAhorro";
  anio: number;
  permiteStarlink: boolean;
};

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

export function getTestDrives(): Promise<TestDriveListResponse> {
  return parseResponse(api.get("/test-drive"), testDriveListResponseSchema, "Error al obtener las unidades de TestDrive");
}

export function createTestDrive(payload: TestDrivePayload): Promise<TestDriveResponse> {
  return parseResponse(api.post("/test-drive", payload), testDriveResponseSchema, "Error al crear la unidad de TestDrive");
}

export function updateTestDrive(id: string, payload: TestDrivePayload): Promise<TestDriveResponse> {
  return parseResponse(api.put(`/test-drive/${id}`, payload), testDriveResponseSchema, "Error al actualizar la unidad de TestDrive");
}

export function changeStatusTestDrive(id: string): Promise<{ message: string; data: { activo: boolean } }> {
  return api
    .patch(`/test-drive/${id}/change-status`)
    .then(({ data }) => data)
    .catch((error) => {
      throw new Error(getErrorMessage(error, "Error al cambiar el estado de la unidad de TestDrive"));
    });
}
