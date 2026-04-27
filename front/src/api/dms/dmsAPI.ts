import api from "@/libs/axios";
import {
  getAsignacionRecepcionResponseSchema,
  promedioOperacionesConvencionalResponseSchema,
  rankingOperacionesConvencionalResponseSchema,
  resumenGeneralSchema,
  trackingOperacionesResponseSchema,
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


export async function getStockConsolidado() {
  try {
    const { data } = await api.get(`/dms/consolidado/stock`);
    
    const parsed = resumenGeneralSchema.safeParse(data);
    
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

export async function getPendienteReventas() {
  try {
    const { data } = await api.get(`/dms/reventas/facturas`);

    return data;

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

export async function getPromedioOperacionesConvencional(mes: number, anio: number) {
  try {
    const { data } = await api.get(`/dms/convencional/promedio-operaciones/${mes}/${anio}`);

    const parsed = promedioOperacionesConvencionalResponseSchema.safeParse(data);

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
          "Error al obtener el promedio de operaciones convencional",
      );
    }

    throw new Error("Error inesperado al obtener el promedio de operaciones convencional");
  }
}

export async function getRankingOperacionesConvencional(anio: number) {
  try {
    const { data } = await api.get(`/dms/convencional/ranking-operaciones/${anio}`);

    const parsed = rankingOperacionesConvencionalResponseSchema.safeParse(data);

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
          "Error al obtener el ranking de operaciones convencional",
      );
    }

    throw new Error("Error inesperado al obtener el ranking de operaciones convencional");
  }
}

export async function getTrackingOperaciones(mes: number, anio: number) {
  try {
    const { data } = await api.get(`/dms/convencional/tracking-operaciones/${mes}/${anio}`);

    const parsed = trackingOperacionesResponseSchema.safeParse(data);

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
          "Error al obtener la trazabilidad operativa",
      );
    }

    throw new Error("Error inesperado al obtener la trazabilidad operativa");
  }
}
