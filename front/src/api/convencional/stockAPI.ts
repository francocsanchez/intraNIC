import api from "@/libs/axios";
import {
  cotizadorImportResponseSchema,
  misListaDeEsperaResponseSchema,
  misOperacionesSchema,
  misReservasResponseSchema,
  ReservasResponseSchema,
  stockDisponibleConvencionalSchema,
  stockValorizacionPrecioListResponseSchema,
  stockValorizacionPrecioResponseSchema,
  stockValorizacionConvencionalSchema,
} from "@/types/index";
import { isAxiosError } from "axios";

export async function getStockDisponibleConvencional() {
  try {
    const { data } = await api.get("/dms/convencional/stock-disponible");

    const parsed = stockDisponibleConvencionalSchema.safeParse(data);

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

export async function getStockGuardadoConvencional() {
  try {
    const { data } = await api.get("/dms/convencional/stock-guardado");

    const parsed = stockDisponibleConvencionalSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener el stock guardado convencional",
      );
    }

    throw new Error("Error inesperado al obtener el stock guardado convencional");
  }
}

export async function getStockReservaConvencional() {
  try {
    const { data } = await api.get("/dms/convencional/stock-reservado");

    const parsed = ReservasResponseSchema.safeParse(data);

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

export async function getStockValorizacionConvencional() {
  try {
    const { data } = await api.get("/dms/convencional/stock-valorizacion");

    const parsed = stockValorizacionConvencionalSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener la valorizacion del stock convencional",
      );
    }

    throw new Error("Error inesperado al obtener la valorizacion del stock convencional");
  }
}

export async function getStockValorizacionListaPrecios() {
  try {
    const { data } = await api.get("/dms/convencional/stock-valorizacion/lista-precios");

    const parsed = stockValorizacionPrecioListResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al obtener la lista de precios de valorizacion",
      );
    }

    throw new Error("Error inesperado al obtener la lista de precios de valorizacion");
  }
}

export async function saveStockValorizacionPrecio(payload: { version: string; modelo: string; valor: number }) {
  try {
    const { data } = await api.put("/dms/convencional/stock-valorizacion/lista-precios", payload);

    const parsed = stockValorizacionPrecioResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al guardar el precio de valorizacion",
      );
    }

    throw new Error("Error inesperado al guardar el precio de valorizacion");
  }
}

export async function exportStockValorizacionListaPreciosExcel(): Promise<Blob> {
  try {
    const { data } = await api.get("/dms/convencional/stock-valorizacion/lista-precios/exportar", {
      responseType: "blob",
    });

    return data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al exportar la lista de precios de valorizacion",
      );
    }

    throw new Error("Error inesperado al exportar la lista de precios de valorizacion");
  }
}

export async function importStockValorizacionListaPreciosExcel(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post("/dms/convencional/stock-valorizacion/lista-precios/importar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const parsed = cotizadorImportResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || error.response?.data?.message || error.message || "Error al importar la lista de precios de valorizacion",
      );
    }

    throw new Error("Error inesperado al importar la lista de precios de valorizacion");
  }
}

export async function misReservas() {
  try {
    const { data } = await api(`/dms/convencional/mis-reservas`);

    const parsed = misReservasResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function miListaDeEspera() {
  try {
    const { data } = await api(`/dms/convencional/mi-lista-de-espera`);

    const parsed = misListaDeEsperaResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}

export async function misOperaciones(mes: number, anio: number) {
  try {
    const { data } = await api(`/dms/convencional/mis-operaciones/${mes}/${anio}`);

    const parsed = misOperacionesSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
  }
}
