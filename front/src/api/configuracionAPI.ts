import api from "@/libs/axios";
import { isAxiosError } from "axios";
import {
  configuracionResponseSchema,
  dashboardSalonSettingsResponseSchema,
  dashboardSalonModelImagesResponseSchema,
} from "../types";

export async function getConfiguracion() {
  try {
    const { data } = await api("/config/");

    const response = configuracionResponseSchema.safeParse(data);
    if (!response.success) {
      console.error("Error en la validación de stockGuardado:", response.error);
      throw new Error("La estructura de los datos es inválida");
    }

    if (response.success) {
      return response.data;
    }
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

type ConfigConvForm = {
  sistemaActivoConvencional: boolean;
  vendedoresReservasConvencional: string[];
  vendedoresDisponibleConvencional: string[];
  vendedoresStockGuardadoConvencional: string[];
};

export async function updateConfiguracionConvencional(
  formData: ConfigConvForm,
) {
  try {
    const { data } = await api.patch("/config/", formData);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

type ConfigUsaForm = {
  sistemaActivoUsados: boolean;
  vendedoresReservasUsados: string[];
  vendedoresDisponibleUsados: string[];
  vendedoresStockGuardadoUsados: string[];
  vendedoresStockNoReparadoUsados: string[];
  vendedoresStockPendDocuUsados: string[];
};

export async function updateConfiguracionUsado(formData: ConfigUsaForm) {
  try {
    const { data } = await api.patch("/config/", formData);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

type ConfigBelgranoForm = {
  sistemaActivoBelgrano: boolean;
  vendedoresDisponibleBelgrano: string[];
};

export async function updateConfiguracionBelgrano(formData: ConfigBelgranoForm) {
  try {
    const { data } = await api.patch("/config/", formData);

    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export type DashboardSalonSettingsScope = {
  sucursalCodigo?: number;
  anio: number;
  mes: number;
};

export async function getDashboardSalonSettings(scope: DashboardSalonSettingsScope) {
  const { data } = await api.get("/config/dashboard-salon", { params: scope });
  const response = dashboardSalonSettingsResponseSchema.safeParse(data);
  if (!response.success) {
    throw new Error("La estructura de la configuración es inválida");
  }
  return response.data;
}

export async function updateDashboardSalonSettings(
  payload: DashboardSalonSettingsScope & {
    objetivoVendedores?: number;
    objetivoOperacionesTotales?: number;
  },
) {
  const { data } = await api.put("/config/dashboard-salon", payload);
  const response = dashboardSalonSettingsResponseSchema.safeParse(data);
  if (!response.success) {
    throw new Error("La estructura de la configuración es inválida");
  }
  return response.data;
}

export async function getDashboardSalonModelImages() {
  const { data } = await api.get("/config/dashboard-salon/modelos");
  const response = dashboardSalonModelImagesResponseSchema.safeParse(data);
  if (!response.success) throw new Error("La estructura de las imágenes de modelos es inválida");
  return response.data;
}

export async function uploadDashboardSalonModelImage(payload: { modelo: string; file: File }) {
  const formData = new FormData();
  formData.append("modelo", payload.modelo);
  formData.append("file", payload.file);
  const { data } = await api.post("/config/dashboard-salon/modelos", formData);
  const response = dashboardSalonModelImagesResponseSchema.pick({ message: true }).safeParse(data);
  if (!response.success) throw new Error("La respuesta de la imagen de modelo es inválida");
  return response.data;
}
