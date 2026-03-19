import api from "@/libs/axios";
import { stockUsadosResponseSchema,ReservasUsadosResumenSchema, type ReservasUsadosResumen } from "@/types/index";
import { isAxiosError } from "axios";

export async function getStockDisponibleUsados() {
  try {
    const { data } = await api.get("/dms/usados/stock-disponible");

    const parsed = stockUsadosResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock disponible usados",
      );
    }

    throw new Error("Error inesperado al obtener el stock disponible usados");
  }
}

export async function getStockGuardadoUsados() {
  try {
    const { data } = await api.get("/dms/usados/stock-guardado");

    const parsed = stockUsadosResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock disponible usados",
      );
    }

    throw new Error("Error inesperado al obtener el stock disponible usados");
  }
}



export async function getStockReservaUsados(): Promise<ReservasUsadosResumen> {
  try {
    const { data } = await api.get("/dms/usados/stock-reservado");
    const parsed = ReservasUsadosResumenSchema.safeParse(data);

    console.log(parsed);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock reservado convencional",
      );
    }

    throw new Error("Error inesperado al obtener el stock reservado convencional");
  }
}