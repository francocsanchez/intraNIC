import api from "@/libs/axios";
import {
  registroAsignacionInfoOperacionResponseSchema,
  registroAsignacionListResponseSchema,
  registroAsignacionResponseSchema,
  registroAsignacionResumenResponseSchema,
  type RegistroAsignacionInfoOperacion,
  type RegistroAsignacionListResponse,
  type RegistroAsignacionResumenResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

type RegistroAsignacionPayload = {
  fecha: string;
  operacion: number;
  observaciones?: string;
  tipo: "Asignado" | "Desasignado";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      fallback
    );
  }

  return fallback;
};

export async function getRegistroAsignacionInfoOperacion(
  operacion: number,
): Promise<RegistroAsignacionInfoOperacion> {
  try {
    const { data } = await api.get(
      `/dms/registro-asignaciones/operacion/${operacion}`,
    );
    const parsed = registroAsignacionInfoOperacionResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Error al obtener la informacion de la operacion"),
    );
  }
}

export async function getRegistrosAsignaciones(
  page = 1,
  limit = 30,
): Promise<RegistroAsignacionListResponse> {
  try {
    const { data } = await api.get("/dms/registro-asignaciones", {
      params: { page, limit },
    });
    const parsed = registroAsignacionListResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Error al obtener los registros de asignaciones"),
    );
  }
}

export async function createRegistroAsignacion(
  payload: RegistroAsignacionPayload,
) {
  try {
    const { data } = await api.post("/dms/registro-asignaciones", payload);
    const parsed = registroAsignacionResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Error al crear el registro de asignacion"),
    );
  }
}

export async function updateRegistroAsignacion(
  id: string,
  payload: RegistroAsignacionPayload,
) {
  try {
    const { data } = await api.put(`/dms/registro-asignaciones/${id}`, payload);
    const parsed = registroAsignacionResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Error al actualizar el registro de asignacion"),
    );
  }
}

export async function deleteRegistroAsignacion(id: string) {
  try {
    const { data } = await api.delete(`/dms/registro-asignaciones/${id}`);
    const parsed = registroAsignacionResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Error al eliminar el registro de asignacion"),
    );
  }
}

export async function getResumenRegistroAsignaciones(
  mes: number,
  ano: number,
): Promise<RegistroAsignacionResumenResponse> {
  try {
    const { data } = await api.get("/dms/registro-asignaciones/resumen", {
      params: { mes, ano },
    });
    const parsed = registroAsignacionResumenResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Error al obtener el resumen de asignaciones"),
    );
  }
}
