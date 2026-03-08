import api from "@/libs/axios";
import {
  ReservasResponseSchema,
  stockDisponibleConvencionalSchema,
} from "@/types/index";
import { isAxiosError } from "axios";

export async function getStockDisponibleConvencional() {
  try {
    const { data } = await api.get("/dms/convencional/stock-disponible");

    const parsed = stockDisponibleConvencionalSchema.safeParse(data);

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
          "Error al obtener el stock disponible convencional",
      );
    }

    throw new Error(
      "Error inesperado al obtener el stock disponible convencional",
    );
  }
}

export async function getStockGuardadoConvencional() {
  try {
    const { data } = await api.get("/dms/convencional/stock-guardado");

    const parsed = stockDisponibleConvencionalSchema.safeParse(data);

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
          "Error al obtener el stock guardado convencional",
      );
    }

    throw new Error(
      "Error inesperado al obtener el stock guardado convencional",
    );
  }
}

export async function getStockReservaConvencional() {
  try {
    const { data } = await api.get("/dms/convencional/stock-reservado");

    const parsed = ReservasResponseSchema.safeParse(data);

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
          "Error al obtener el stock reservado convencional",
      );
    }

    throw new Error(
      "Error inesperado al obtener el stock reservado convencional",
    );
  }
}
