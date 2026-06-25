import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";

const patentamientosImportStatusSchema = z.object({
  isRunning: z.boolean(),
  lastExecutionAt: z.string().nullable(),
  lastSuccessfulExecutionAt: z.string().nullable(),
  lastStatus: z.enum(["success", "partial", "failed", "skipped"]).nullable(),
  lastFileName: z.string().nullable(),
  durationMs: z.number().nullable(),
  totalRead: z.number(),
  inserted: z.number(),
  updated: z.number(),
  discarded: z.number(),
  errored: z.number(),
  message: z.string(),
  executionHistory: z
    .array(
      z.object({
        processedAt: z.string().nullable(),
        fileName: z.string().nullable(),
        totalRead: z.number(),
        inserted: z.number(),
        updated: z.number(),
        discarded: z.number(),
        errored: z.number(),
      }),
    )
    .default([]),
});

const patentamientosImportExecutionSchema = z.object({
  status: z.enum(["success", "partial", "failed", "skipped"]),
  fileName: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string(),
  durationMs: z.number(),
  totalRead: z.number(),
  inserted: z.number(),
  updated: z.number(),
  discarded: z.number(),
  errored: z.number(),
  message: z.string(),
  errorSummary: z.array(z.string()),
});

const statusResponseSchema = z.object({
  data: patentamientosImportStatusSchema,
});

const executionResponseSchema = z.object({
  data: patentamientosImportExecutionSchema,
  message: z.string(),
});

export type PatentamientosImportStatus = z.infer<typeof patentamientosImportStatusSchema>;
export type PatentamientosImportExecution = z.infer<typeof patentamientosImportExecutionSchema>;

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

export const getPatentamientosImportStatus = async () => {
  try {
    const { data } = await api.get("/patentamientos/importaciones/patent-prendas/estado");
    return parseResponse(data, statusResponseSchema).data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo obtener el estado de actualizacion"));
  }
};

export const runPatentamientosImport = async () => {
  try {
    const { data } = await api.post("/patentamientos/importaciones/patent-prendas/ejecutar");
    return parseResponse(data, executionResponseSchema).data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo ejecutar la actualizacion de registros"));
  }
};
