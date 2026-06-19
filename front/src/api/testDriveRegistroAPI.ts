import api from "@/libs/axios";
import {
  testDriveOptionListResponseSchema,
  testDriveRegistroListResponseSchema,
  testDriveRegistroResponseSchema,
  type TestDriveOptionListResponse,
  type TestDriveRegistroListResponse,
  type TestDriveRegistroResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

export type TestDriveNegocio = "convencional" | "planAhorro";

export type TestDriveRegistroPayload = {
  negocio: TestDriveNegocio;
  unidadId: string;
  fechaRetiro: string;
  horaRetiro: string;
  fechaRegreso: string;
  horaRegreso: string;
  starlink: boolean;
  observacion?: string;
};

type GetTestDriveRegistrosParams = {
  negocio: TestDriveNegocio;
  from?: string;
  to?: string;
  unidadId?: string;
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

export function getTestDriveRegistros(params: GetTestDriveRegistrosParams): Promise<TestDriveRegistroListResponse> {
  return parseResponse(
    api.get("/test-drive-registros", {
      params,
    }),
    testDriveRegistroListResponseSchema,
    "Error al obtener los registros de TestDrive",
  );
}

export function createTestDriveRegistro(payload: TestDriveRegistroPayload): Promise<TestDriveRegistroResponse> {
  return parseResponse(
    api.post("/test-drive-registros", payload),
    testDriveRegistroResponseSchema,
    "Error al crear el registro de TestDrive",
  );
}

export function updateTestDriveRegistro(id: string, payload: TestDriveRegistroPayload): Promise<TestDriveRegistroResponse> {
  return parseResponse(
    api.put(`/test-drive-registros/${id}`, payload),
    testDriveRegistroResponseSchema,
    "Error al actualizar el registro de TestDrive",
  );
}

export function deleteTestDriveRegistro(id: string): Promise<TestDriveRegistroResponse> {
  return parseResponse(
    api.delete(`/test-drive-registros/${id}`),
    testDriveRegistroResponseSchema,
    "Error al eliminar el registro de TestDrive",
  );
}

export function getTestDriveOptions(negocio: TestDriveNegocio): Promise<TestDriveOptionListResponse> {
  return parseResponse(
    api.get("/test-drive/opciones", {
      params: { negocio },
    }),
    testDriveOptionListResponseSchema,
    "Error al obtener las unidades disponibles para TestDrive",
  );
}
