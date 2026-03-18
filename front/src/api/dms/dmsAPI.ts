import api from "@/libs/axios";
import {
  getAsignacionRecepcionResponseSchema,
  vendedoresResponseSchema
} from "@/types/index";
import { isAxiosError } from "axios";

export async function getVendedoresNic() {
  try {
    const { data } = await api.get("/dms/vendedores");

    const parsed = vendedoresResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Error al obtener el los vendedores",
      );
    }

    throw new Error(
      "Error inesperado al obtener el los vendedores",
    );
  }
}

export async function getVendedoresActivosNic() {
  try {
    const { data } = await api.get("/dms/vendedores/activos");

    const parsed = vendedoresResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Error al obtener el los vendedores",
      );
    }

    throw new Error(
      "Error inesperado al obtener el los vendedores",
    );
  }
}

export async function getAsignaciones(mes:string, anio:string) {
  try {
    const { data } = await api.get(`/dms/asignaciones/${mes}/${anio}`);
    console.log(data)

   const parsed = getAsignacionRecepcionResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;

  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Error al obtener el los vendedores",
      );
    }

    throw new Error(
      "Error inesperado al obtener el los vendedores",
    );
  }
}