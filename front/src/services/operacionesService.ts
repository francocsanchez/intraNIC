import api from "@/libs/axios";
import {
  analisisVendedorFiltersResponseSchema,
  analisisVendedorResponseSchema,
  analisisOperacionesPreventaCreditoMensualResponseSchema,
  analisisOperacionesPreventaDescuentoMensualResponseSchema,
  analisisOperacionesPreventaFormaPagoResponseSchema,
  analisisOperacionesPreventaResumenFinanciacionResponseSchema,
  analisisOperacionesPreventaResponseSchema,
  operacionesDashboardResponseSchema,
  type AnalisisVendedorFiltersResponse,
  type AnalisisVendedorResponse,
  type AnalisisOperacionesPreventaCreditoMensualResponse,
  type AnalisisOperacionesPreventaDescuentoMensualResponse,
  type AnalisisOperacionesPreventaFormaPagoResponse,
  type AnalisisOperacionesPreventaResumenFinanciacionResponse,
  type AnalisisOperacionesPreventaResponse,
  type AnalisisOperacionesPreventaUsadosMensualResponse,
  type OperacionesDashboardResponse,
  analisisOperacionesPreventaUsadosMensualResponseSchema,
} from "@/types/index";
import { isAxiosError } from "axios";

type OperacionesDashboardParams = {
  anios: number[];
  meses?: number[];
  sucursales?: string[];
  modelos?: string[];
  dias?: number[];
};

type AnalisisOperacionesPreventaParams = {
  anio: number;
  mes: number;
};

type AnalisisVendedorParams = {
  anio: number;
  vendedor?: number | null;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getOperacionesDashboard(
  params: OperacionesDashboardParams,
): Promise<OperacionesDashboardResponse> {
  try {
    const { data } = await api.get("/operaciones/dashboard", {
      params: {
        anios: params.anios.join(","),
        meses: params.meses?.length ? params.meses.join(",") : undefined,
        sucursales: params.sucursales?.length ? params.sucursales.join(",") : undefined,
        modelos: params.modelos?.length ? params.modelos.join(",") : undefined,
        dias: params.dias?.length ? params.dias.join(",") : undefined,
      },
    });

    const parsed = operacionesDashboardResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el dashboard de operaciones"));
  }
}

export async function getAnalisisOperacionesPreventa(
  params: AnalisisOperacionesPreventaParams,
): Promise<AnalisisOperacionesPreventaResponse> {
  try {
    const { data } = await api.get("/operaciones/analisis-preventa", {
      params,
    });

    const parsed = analisisOperacionesPreventaResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener Analisis Operaciones"));
  }
}

export async function getAnalisisOperacionesPreventaFormaPago(
  numero: number,
): Promise<AnalisisOperacionesPreventaFormaPagoResponse> {
  try {
    const { data } = await api.get(`/operaciones/analisis-preventa/${numero}/forma-pago`);

    const parsed = analisisOperacionesPreventaFormaPagoResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener la forma de pago"));
  }
}

export async function getAnalisisOperacionesPreventaDescuentoMensual(
  anio: number,
  modelo?: string,
): Promise<AnalisisOperacionesPreventaDescuentoMensualResponse> {
  try {
    const { data } = await api.get("/operaciones/analisis-preventa/descuento-mensual", {
      params: { anio, modelo: modelo || undefined },
    });

    const parsed = analisisOperacionesPreventaDescuentoMensualResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el descuento mensual por modelo"));
  }
}

export async function getAnalisisOperacionesPreventaResumenFinanciacion(
  params: AnalisisOperacionesPreventaParams,
): Promise<AnalisisOperacionesPreventaResumenFinanciacionResponse> {
  try {
    const { data } = await api.get("/operaciones/analisis-preventa/resumen-financiacion", {
      params,
    });

    const parsed = analisisOperacionesPreventaResumenFinanciacionResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el resumen de financiacion"));
  }
}

export async function getAnalisisOperacionesPreventaUsadosMensual(
  anio: number,
): Promise<AnalisisOperacionesPreventaUsadosMensualResponse> {
  try {
    const { data } = await api.get("/operaciones/analisis-preventa/usados-mensual", {
      params: { anio },
    });

    const parsed = analisisOperacionesPreventaUsadosMensualResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el resumen anualizado de usados"));
  }
}

export async function getAnalisisOperacionesPreventaCreditoMensual(
  anio: number,
): Promise<AnalisisOperacionesPreventaCreditoMensualResponse> {
  try {
    const { data } = await api.get("/operaciones/analisis-preventa/credito-mensual", {
      params: { anio },
    });

    const parsed = analisisOperacionesPreventaCreditoMensualResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener el promedio mensual de credito"));
  }
}

export async function getAnalisisVendedorFilters(): Promise<AnalisisVendedorFiltersResponse> {
  try {
    const { data } = await api.get("/operaciones/analisis-vendedor/filtros");

    const parsed = analisisVendedorFiltersResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener los filtros de Analisis Vendedor"));
  }
}

export async function getAnalisisVendedor(
  params: AnalisisVendedorParams,
): Promise<AnalisisVendedorResponse> {
  try {
    const { data } = await api.get("/operaciones/analisis-vendedor", {
      params: {
        anio: params.anio,
        vendedor: params.vendedor ?? undefined,
      },
    });

    const parsed = analisisVendedorResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener Analisis Vendedor"));
  }
}
