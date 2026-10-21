import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { kintoDashboardResponseSchema, type KintoDashboardResponse } from "@/types/index";

export type KintoDashboardFilters = { anio: number; mes?: number; sucursal?: string; categoria?: "MATAFUEGOS" | "MULTAS"; estadoMulta?: "PEND_COBRAR" | "PEND_FACTURAR" | "PEND_PAGAR" | "PAGADO" };

export async function getKintoDashboard(filters: KintoDashboardFilters): Promise<KintoDashboardResponse> {
  try {
    const { data } = await api.get("/kinto/dashboard", { params: filters });
    const parsed = kintoDashboardResponseSchema.safeParse(data);
    if (!parsed.success) throw new Error("La respuesta del servidor no tiene el formato esperado");
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.message.includes("formato esperado")) throw error;
    const message = isAxiosError(error) ? error.response?.data?.error || error.response?.data?.message : null;
    throw new Error(message || "No se pudo cargar el dashboard de Kinto");
  }
}
