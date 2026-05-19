import api from "@/libs/axios";
import {
  facturaAnticipoListResponseSchema,
  facturaAnticipoResponseSchema,
  type FacturaAnticipo,
} from "@/types/index";
import { isAxiosError } from "axios";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getFacturasAnticipo(): Promise<FacturaAnticipo[]> {
  try {
    const { data } = await api.get("/facturas-anticipo");
    const parsed = facturaAnticipoListResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener las facturas de anticipo"));
  }
}

export async function createFacturaAnticipo(numeroOp: number) {
  try {
    const { data } = await api.post("/facturas-anticipo", { numeroOp });
    const parsed = facturaAnticipoResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al cargar la operacion"));
  }
}

export async function deleteFacturaAnticipo(id: string) {
  try {
    const { data } = await api.delete(`/facturas-anticipo/${id}`);
    const parsed = facturaAnticipoResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al eliminar el registro"));
  }
}
