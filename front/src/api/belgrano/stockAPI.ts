import api from "@/libs/axios";
import { stockUsadosResponseSchema } from "@/types/index";
import { isAxiosError } from "axios";

export async function getStockDisponibleBelgrano() {
  try {
    const { data } = await api.get("/dms/belgrano/stock-disponible");

    const parsed = stockUsadosResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock disponible Belgrano",
      );
    }

    throw new Error("Error inesperado al obtener el stock disponible Belgrano");
  }
}
