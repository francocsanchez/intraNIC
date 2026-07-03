import api from "@/libs/axios";
import { analisisStockResponseSchema, type AnalisisStockResponse } from "@/types/index";
import { isAxiosError } from "axios";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getAnalisisStock(): Promise<AnalisisStockResponse> {
  try {
    const { data } = await api.get("/dms/analisis-stock");
    const parsed = analisisStockResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el analisis de stock"));
  }
}
