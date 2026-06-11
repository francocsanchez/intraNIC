import api from "@/libs/axios";
import { misReservasResponseSchema, stockUsadosResponseSchema,ReservasUsadosResumenSchema, type MisReservasResponse, type ReservasUsadosResumen, stockIngresoUsadosSchema } from "@/types/index";
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

export async function getStockNoReparadoUsados() {
  try {
    const { data } = await api.get("/dms/usados/stock-no-reparado");

    const parsed = stockUsadosResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock no reparado usados",
      );
    }

    throw new Error("Error inesperado al obtener el stock no reparado usados");
  }
}

export async function getStockPendienteDocumentacionUsados() {
  try {
    const { data } = await api.get("/dms/usados/stock-pendiente-documentacion");

    const parsed = stockUsadosResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock pendiente documentacion usados",
      );
    }

    throw new Error("Error inesperado al obtener el stock pendiente documentacion usados");
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

export async function getStockIngresoUsado() {
  try {
    const { data } = await api.get("/dms/usados/stock-ingreso");

    const parsed = stockIngresoUsadosSchema.safeParse(data);

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

export async function getMisReservasUsados(): Promise<MisReservasResponse> {
  try {
    const { data } = await api.get("/dms/usados/mis-reservas");

    const parsed = misReservasResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener mis reservas usados",
      );
    }

    throw new Error("Error inesperado al obtener mis reservas usados");
  }
}
