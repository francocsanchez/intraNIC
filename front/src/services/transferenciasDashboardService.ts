import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";

const dashboardMonthSchema = z.object({
  key: z.string(),
  monthNumber: z.number(),
  year: z.number(),
  label: z.string(),
});

const dashboardYearsSchema = z.object({
  years: z.array(z.number()),
  selectedYear: z.number().nullable(),
});

const dashboardTrendPointSchema = z.object({
  key: z.string(),
  label: z.string(),
  total: z.number(),
  operaciones: z.number(),
  marketShare: z.number(),
});

const dashboardTopVehicleSchema = z.object({
  rank: z.number(),
  brand: z.string(),
  model: z.string(),
  year: z.number(),
  total: z.number(),
  percentage: z.number(),
});

const dashboardPaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const dashboardGeneralSchema = z.object({
  title: z.string(),
  months: z.array(dashboardMonthSchema),
  summary: z.object({
    totalTransferencias: z.number(),
    totalOperaciones: z.number(),
    marketShare: z.number(),
    marketLeader: z
      .object({
        brand: z.string(),
        total: z.number(),
        percentage: z.number(),
      })
      .nullable(),
  }),
  trend: z.array(dashboardTrendPointSchema),
  topVehicles: z.array(dashboardTopVehicleSchema),
  pagination: dashboardPaginationSchema,
});

export type TransferenciasDashboardYears = z.infer<typeof dashboardYearsSchema>;
export type TransferenciasDashboardTrendPoint = z.infer<typeof dashboardTrendPointSchema>;
export type TransferenciasDashboardTopVehicle = z.infer<typeof dashboardTopVehicleSchema>;
export type TransferenciasDashboardGeneral = z.infer<typeof dashboardGeneralSchema>;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

const fetchAndParse = async <T>(
  path: string,
  schema: z.ZodType<T>,
  fallback: string,
  params?: Record<string, string | number>,
) => {
  try {
    const { data } = await api.get(path, { params });
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, fallback));
  }
};

export const getTransferenciasAvailableYears = () =>
  fetchAndParse(
    "/transferencias/dashboard/years",
    dashboardYearsSchema,
    "No se pudieron obtener los anos disponibles",
  );

export const getTransferenciasGeneralZonaNic = (year: number, page = 1, pageSize = 15) =>
  fetchAndParse(
    "/transferencias/dashboard/general/zona-nic",
    dashboardGeneralSchema,
    "No se pudo obtener la vista general de transferencias",
    { year, page, pageSize },
  );
