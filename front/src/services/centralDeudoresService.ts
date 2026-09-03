import api from "@/libs/axios";
import {
  centralDeudoresResponseSchema,
  type CentralDeudoresData,
  type CentralDeudoresResponse,
} from "@/types/index";
import { isAxiosError } from "axios";

type SituacionTone = {
  label: string;
  chipClassName: string;
  accentClassName: string;
  borderClassName: string;
  softClassName: string;
};

export type CentralDeudoresViewModel = CentralDeudoresData & {
  riesgoVisual: SituacionTone;
  timeline: Array<{
    periodo: string;
    cantidadEntidades: number;
    montoTotal: number;
    peorSituacion: number | null;
    peorSituacionLabel: string;
    riesgoVisual: SituacionTone;
  }>;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    return error.response?.data?.error || error.response?.data?.message || error.message || fallback;
  }

  return fallback;
};

const SITUACION_STYLES: Record<number, SituacionTone> = {
  0: {
    label: "Sin deuda informada",
    chipClassName: "bg-muted-foreground text-background",
    accentClassName: "text-muted-foreground",
    borderClassName: "border-border",
    softClassName: "bg-muted",
  },
  1: {
    label: "Normal",
    chipClassName: "bg-emerald-600 text-white",
    accentClassName: "text-emerald-600",
    borderClassName: "border-border",
    softClassName: "bg-muted",
  },
  2: {
    label: "Seguimiento especial",
    chipClassName: "bg-lime-600 text-white",
    accentClassName: "text-lime-600",
    borderClassName: "border-border",
    softClassName: "bg-muted",
  },
  3: {
    label: "Riesgo medio",
    chipClassName: "bg-amber-500 text-amber-950",
    accentClassName: "text-amber-600",
    borderClassName: "border-border",
    softClassName: "bg-muted",
  },
  4: {
    label: "Riesgo alto",
    chipClassName: "bg-orange-600 text-white",
    accentClassName: "text-orange-600",
    borderClassName: "border-border",
    softClassName: "bg-muted",
  },
  5: {
    label: "Irrecuperable",
    chipClassName: "bg-destructive text-destructive-foreground",
    accentClassName: "text-destructive",
    borderClassName: "border-border",
    softClassName: "bg-muted",
  },
};

export const getSituacionTone = (situacion: number | null): SituacionTone => {
  if (!situacion) {
    return {
      label: "Sin situacion",
      chipClassName: "bg-muted-foreground text-background",
      accentClassName: "text-muted-foreground",
      borderClassName: "border-border",
      softClassName: "bg-muted",
    };
  }

  return SITUACION_STYLES[situacion] ?? SITUACION_STYLES[5];
};

export const formatCentralDeudoresMoney = (value: number | null, suffix = "mil") => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  const number = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);

  return suffix ? `$ ${number} ${suffix}` : `$ ${number}`;
};

export const formatCentralDeudoresDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatPeriodo = (periodo: string | null) => {
  if (!periodo || periodo.length !== 6) {
    return periodo || "-";
  }

  return `${periodo.slice(4, 6)}/${periodo.slice(0, 4)}`;
};

export async function getCentralDeudores(identificacion: string): Promise<CentralDeudoresResponse> {
  try {
    const { data } = await api.get(`/central-deudores/${identificacion}`);
    const parsed = centralDeudoresResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error.issues);
      throw new Error("La respuesta del endpoint no tiene el formato esperado");
    }

    return parsed.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Error al consultar Central de Deudores"));
  }
}

export function buildCentralDeudoresViewModel(response: CentralDeudoresResponse): CentralDeudoresViewModel {
  const payload = response.data;

  return {
    ...payload,
    riesgoVisual: getSituacionTone(payload.resumen.peorSituacion),
    timeline: payload.historicas.periodos.map((periodo) => ({
      periodo: periodo.periodo,
      cantidadEntidades: periodo.cantidadEntidades,
      montoTotal: periodo.montoTotal,
      peorSituacion: periodo.peorSituacion,
      peorSituacionLabel: getSituacionTone(periodo.peorSituacion).label,
      riesgoVisual: getSituacionTone(periodo.peorSituacion),
    })),
  };
}
