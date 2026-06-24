import api from "@/libs/axios";
import {
  segUnidadesFabricaImportResponseSchema,
  segUnidadesFabricaListResponseSchema,
  type SegUnidadFabrica,
} from "@/types/index";
import { isAxiosError } from "axios";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function getSegUnidadesFabrica(): Promise<SegUnidadFabrica[]> {
  try {
    const { data } = await api.get("/seg-unidades-fabrica");
    const parsed = segUnidadesFabricaListResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al obtener las unidades de fabrica"));
  }
}

export async function importSegUnidadesFabrica(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await api.post("/seg-unidades-fabrica/importar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const parsed = segUnidadesFabricaImportResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del importador no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo importar el archivo de unidades de fabrica"));
  }
}
