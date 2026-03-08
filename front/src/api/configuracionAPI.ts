import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { configuracionResponseSchema } from "../types";

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
