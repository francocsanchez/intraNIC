import api from "@/libs/axios";
import { isAxiosError } from "axios";
import { z } from "zod";

const dashboardMonthSchema = z.object({
  key: z.string(),
  monthNumber: z.number(),
  year: z.number(),
  label: z.string(),
});

const dashboardTableRowSchema = z.object({
  label: z.string(),
  months: z.record(z.string(), z.number()),
  total: z.number(),
  percentage: z.number(),
});

const dashboardTableSchema = z.object({
  title: z.string(),
  entityLabel: z.enum(["Marca", "Modelo"]),
  months: z.array(dashboardMonthSchema),
  rows: z.array(dashboardTableRowSchema),
  totalRow: dashboardTableRowSchema,
});

const dashboardEvolutionPointSchema = z.object({
  label: z.string(),
  pais: z.number(),
  zonaNic: z.number(),
});

const dashboardEvolutionSchema = z.object({
  title: z.string(),
  series: z.array(dashboardEvolutionPointSchema),
});

const dashboardYearsSchema = z.object({
  years: z.array(z.number()),
  selectedYear: z.number().nullable(),
});

export type PatentamientosDashboardTable = z.infer<typeof dashboardTableSchema>;
export type PatentamientosDashboardEvolution = z.infer<typeof dashboardEvolutionSchema>;
export type PatentamientosDashboardYears = z.infer<typeof dashboardYearsSchema>;

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

export const getPatentamientosAvailableYears = () =>
  fetchAndParse(
    "/patentamientos/dashboard/years",
    dashboardYearsSchema,
    "No se pudieron obtener los anos disponibles",
  );

export const getPatentamientosTopMarcasPais = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/top-marcas/pais",
    dashboardTableSchema,
    "No se pudo obtener el top de marcas PAIS",
    { year },
  );

export const getPatentamientosTopMarcasZonaNic = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/top-marcas/zona-nic",
    dashboardTableSchema,
    "No se pudo obtener el top de marcas Zona NIC",
    { year },
  );

export const getPatentamientosSegmentoPickupPais = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/segmento-pickup/pais",
    dashboardTableSchema,
    "No se pudo obtener el segmento Pickup PAIS",
    { year },
  );

export const getPatentamientosSegmentoPickupZonaNic = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/segmento-pickup/zona-nic",
    dashboardTableSchema,
    "No se pudo obtener el segmento Pickup Zona NIC",
    { year },
  );

export const getPatentamientosSegmentoSuvPais = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/segmento-suv/pais",
    dashboardTableSchema,
    "No se pudo obtener el segmento SUV PAIS",
    { year },
  );

export const getPatentamientosSegmentoSuvZonaNic = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/segmento-suv/zona-nic",
    dashboardTableSchema,
    "No se pudo obtener el segmento SUV Zona NIC",
    { year },
  );

export const getPatentamientosSegmentoBSuvPais = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/segmento-b-suv/pais",
    dashboardTableSchema,
    "No se pudo obtener el segmento B-SUV PAIS",
    { year },
  );

export const getPatentamientosSegmentoBSuvZonaNic = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/segmento-b-suv/zona-nic",
    dashboardTableSchema,
    "No se pudo obtener el segmento B-SUV Zona NIC",
    { year },
  );

export const getPatentamientosToyotaEvolution = (year: number) =>
  fetchAndParse(
    "/patentamientos/dashboard/toyota-evolucion",
    dashboardEvolutionSchema,
    "No se pudo obtener la evolucion de Toyota",
    { year },
  );
