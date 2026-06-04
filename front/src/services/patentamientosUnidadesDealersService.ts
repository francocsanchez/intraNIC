import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";

const syncSummarySchema = z.object({
  message: z.string(),
  total: z.number(),
  created: z.number(),
  updated: z.number(),
  errors: z.number(),
});

const resumenRowSchema = z.object({
  dealer: z.string(),
  states: z.record(z.string(), z.number()),
  total: z.number(),
});

const resumenSchema = z.object({
  states: z.array(z.string()),
  rows: z.array(resumenRowSchema),
});

const treemapItemSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const treemapSchema = z.object({
  data: z.array(treemapItemSchema),
});

export type PatentamientosUnidadesDealersSyncSummary = z.infer<typeof syncSummarySchema>;
export type PatentamientosUnidadesDealersResumen = z.infer<typeof resumenSchema>;
export type PatentamientosUnidadesDealersTreemap = z.infer<typeof treemapSchema>;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

const parseResponse = <T>(payload: unknown, schema: z.ZodType<T>) => {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    console.error(parsed.error.issues);
    throw new Error("La respuesta del endpoint no tiene el formato esperado");
  }

  return parsed.data;
};

export const getPatentamientosUnidadesDealersResumen = async () => {
  try {
    const { data } = await api.get("/patentamientos/unidades-dealers/resumen");
    return parseResponse(data, resumenSchema);
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo obtener el resumen de unidades por dealer"));
  }
};

export const getPatentamientosUnidadesDealersTreemap = async () => {
  try {
    const { data } = await api.get("/patentamientos/unidades-dealers/treemap");
    return parseResponse(data, treemapSchema);
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo obtener el treemap de unidades por dealer"));
  }
};

export const syncPatentamientosUnidadesDealers = async () => {
  try {
    const { data } = await api.post("/patentamientos/unidades-dealers/sincronizar");
    return parseResponse(data, syncSummarySchema);
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo actualizar la base de unidades"));
  }
};
