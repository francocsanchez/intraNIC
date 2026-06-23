import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  callCenterDataOriginsResponseSchema,
  callCenterImportResponseSchema,
  callCenterOriginResponseSchema,
  callCenterSummaryOriginResponseSchema,
  callCenterSummaryOriginsResponseSchema,
} from "@/types/index";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function importCallCenterFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await api.post("/call-center/importar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const parsed = callCenterImportResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del importador no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "No se pudo importar el archivo de Call Center"));
  }
}

export async function getCallCenterDataOrigins() {
  try {
    const { data } = await api.get("/call-center/origenes");
    const parsed = callCenterDataOriginsResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta de origenes no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "No se pudieron cargar los origenes de datos"));
  }
}

export async function updateCallCenterDataOrigin(id: string, origenResumidoId: string | null) {
  try {
    const { data } = await api.patch(`/call-center/origenes/${id}`, {
      origenResumidoId,
    });

    const parsed = callCenterOriginResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta de actualizacion no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "No se pudo actualizar el origen de datos"));
  }
}

type SummaryOriginPayload = {
  nombre: string;
  activo: boolean;
};

export async function getCallCenterSummaryOrigins(activo?: boolean) {
  try {
    const { data } = await api.get("/call-center/origenes-resumidos", {
      params: typeof activo === "boolean" ? { activo } : undefined,
    });
    const parsed = callCenterSummaryOriginsResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta de origenes resumidos no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "No se pudieron cargar los origenes resumidos"));
  }
}

export async function createCallCenterSummaryOrigin(payload: SummaryOriginPayload) {
  try {
    const { data } = await api.post("/call-center/origenes-resumidos", payload);
    const parsed = callCenterSummaryOriginResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta al crear el origen resumido no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "No se pudo crear el origen resumido"));
  }
}

export async function updateCallCenterSummaryOrigin(id: string, payload: SummaryOriginPayload) {
  try {
    const { data } = await api.put(`/call-center/origenes-resumidos/${id}`, payload);
    const parsed = callCenterSummaryOriginResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta al actualizar el origen resumido no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "No se pudo actualizar el origen resumido"));
  }
}

export async function changeStatusCallCenterSummaryOrigin(id: string) {
  try {
    const { data } = await api.patch(`/call-center/origenes-resumidos/${id}/change-status`);
    const parsed = callCenterSummaryOriginResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta al cambiar el estado del origen resumido no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "No se pudo cambiar el estado del origen resumido"));
  }
}
