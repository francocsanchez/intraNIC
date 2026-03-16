import api from "@/libs/axios";
import { stockDisponibleLiessSchema } from "@/types/index";
import { isAxiosError } from "axios";

export async function getStockDisponibleLiess(tipoSeleccionado: string) {
  try {
    const { data } = await api.get(`/dms/liess/stock-disponible/${tipoSeleccionado}`);
   
    const parsed = stockDisponibleLiessSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock disponible convencional",
      );
    }

    throw new Error("Error inesperado al obtener el stock disponible convencional");
  }
}
