import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";

const recordOfNumbersSchema = z.record(z.string(), z.number());
const sampleItemSchema = z.record(z.string(), z.unknown());

const summaryBlockSchema = z.object({
  title: z.string(),
  lines: z.array(z.string()),
});

const jobMonitorSummarySchema = z.object({
  jobKey: z.string(),
  title: z.string(),
  scheduleLabel: z.string(),
  canRun: z.boolean().default(true),
  isRunning: z.boolean(),
  lastStatus: z.enum(["success", "partial", "failed", "skipped"]).nullable(),
  lastExecutionAt: z.string().nullable(),
  lastSuccessfulExecutionAt: z.string().nullable(),
  lastTrigger: z.enum(["cron", "manual"]).nullable(),
  message: z.string(),
  headlineMetrics: recordOfNumbersSchema.default({}),
});

const jobExecutionDetailSchema = z.object({
  id: z.string(),
  status: z.enum(["running", "success", "partial", "failed", "skipped"]),
  trigger: z.enum(["cron", "manual"]),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  durationMs: z.number().nullable(),
  fileName: z.string().nullable(),
  message: z.string(),
  metrics: recordOfNumbersSchema.default({}),
});

const jobMonitorDetailSchema = z.object({
  jobKey: z.string(),
  title: z.string(),
  scheduleLabel: z.string(),
  canRun: z.boolean().default(true),
  isRunning: z.boolean(),
  lastStatus: z.enum(["success", "partial", "failed", "skipped"]).nullable(),
  lastExecutionAt: z.string().nullable(),
  lastSuccessfulExecutionAt: z.string().nullable(),
  lastTrigger: z.enum(["cron", "manual"]).nullable(),
  message: z.string(),
  fileName: z.string().nullable(),
  metrics: recordOfNumbersSchema.default({}),
  sourceSummary: summaryBlockSchema.nullable(),
  resultSummary: summaryBlockSchema.nullable(),
  errorSummary: z.array(z.string()).default([]),
  requestSample: z.array(sampleItemSchema).default([]),
  responseSample: z.array(sampleItemSchema).default([]),
  executionHistory: z.array(jobExecutionDetailSchema).default([]),
});

const jobRunResponseSchema = z.object({
  status: z.enum(["success", "partial", "failed", "skipped"]),
  fileName: z.string().nullable(),
  startedAt: z.string(),
  finishedAt: z.string(),
  durationMs: z.number(),
  message: z.string(),
  errorSummary: z.array(z.string()),
  metrics: recordOfNumbersSchema.default({}),
  sourceSummary: summaryBlockSchema.nullable(),
  resultSummary: summaryBlockSchema.nullable(),
  requestSample: z.array(sampleItemSchema).default([]),
  responseSample: z.array(sampleItemSchema).default([]),
});

const listResponseSchema = z.object({
  data: z.array(jobMonitorSummarySchema),
});

const detailResponseSchema = z.object({
  data: jobMonitorDetailSchema,
});

const runResponseSchema = z.object({
  data: jobRunResponseSchema,
  message: z.string(),
});

const parseResponse = <T>(payload: unknown, schema: z.ZodType<T>) => {
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    console.error(parsed.error.issues);
    throw new Error("La respuesta del endpoint no tiene el formato esperado");
  }

  return parsed.data;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

export type JobMonitorSummary = z.infer<typeof jobMonitorSummarySchema>;
export type JobExecutionDetail = z.infer<typeof jobExecutionDetailSchema>;
export type JobMonitorDetail = z.infer<typeof jobMonitorDetailSchema>;

export const getJobsMonitor = async () => {
  try {
    const { data } = await api.get("/jobs-monitor");
    return parseResponse(data, listResponseSchema).data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo obtener el listado de cronos"));
  }
};

export const getJobMonitorDetail = async (jobKey: string) => {
  try {
    const { data } = await api.get(`/jobs-monitor/${jobKey}`);
    return parseResponse(data, detailResponseSchema).data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo obtener el detalle del cron"));
  }
};

export const runJobMonitor = async (jobKey: string) => {
  try {
    const { data } = await api.post(`/jobs-monitor/${jobKey}/run`);
    return parseResponse(data, runResponseSchema).data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "No se pudo ejecutar el cron"));
  }
};
