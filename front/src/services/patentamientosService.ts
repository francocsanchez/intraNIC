import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";

export type PatentamientosImportType =
  | "pais-marcas"
  | "zona-nic-marcas"
  | "pais-modelos"
  | "zona-nic-modelos";

const patentamientosImportResponseSchema = z.object({
  message: z.string(),
});

const endpointByImportType: Record<PatentamientosImportType, string> = {
  "pais-marcas": "/patentamientos/importar/pais-marcas",
  "zona-nic-marcas": "/patentamientos/importar/zona-nic-marcas",
  "pais-modelos": "/patentamientos/importar/pais-modelos",
  "zona-nic-modelos": "/patentamientos/importar/zona-nic-modelos",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export async function importPatentamientosFile(type: PatentamientosImportType, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await api.post(endpointByImportType[type], formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const parsed = patentamientosImportResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo importar el archivo de patentamientos"));
  }
}
