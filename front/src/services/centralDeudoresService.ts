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
    chipClassName: "bg-[#6D7A80] text-white",
    accentClassName: "text-[#6D7A80]",
    borderClassName: "border-[#6D7A80]/30",
    softClassName: "bg-[#6D7A80]/10",
  },
  1: {
    label: "Normal",
    chipClassName: "bg-[#2E8B57] text-white",
    accentClassName: "text-[#2E8B57]",
    borderClassName: "border-[#2E8B57]/30",
    softClassName: "bg-[#2E8B57]/12",
  },
  2: {
    label: "Seguimiento especial",
    chipClassName: "bg-[#9FBF3B] text-[#182126]",
    accentClassName: "text-[#7f9930]",
    borderClassName: "border-[#9FBF3B]/35",
    softClassName: "bg-[#9FBF3B]/16",
  },
  3: {
    label: "Riesgo medio",
    chipClassName: "bg-[#D6A11B] text-[#182126]",
    accentClassName: "text-[#b98508]",
    borderClassName: "border-[#D6A11B]/35",
    softClassName: "bg-[#D6A11B]/14",
  },
  4: {
    label: "Riesgo alto",
    chipClassName: "bg-[#D96C2F] text-white",
    accentClassName: "text-[#D96C2F]",
    borderClassName: "border-[#D96C2F]/35",
    softClassName: "bg-[#D96C2F]/12",
  },
  5: {
    label: "Irrecuperable",
    chipClassName: "bg-[#B42318] text-white",
    accentClassName: "text-[#B42318]",
    borderClassName: "border-[#B42318]/35",
    softClassName: "bg-[#B42318]/10",
  },
};

export const getSituacionTone = (situacion: number | null): SituacionTone => {
  if (!situacion) {
    return {
      label: "Sin situacion",
      chipClassName: "bg-[#6D7A80] text-white",
      accentClassName: "text-[#6D7A80]",
      borderClassName: "border-[#6D7A80]/30",
      softClassName: "bg-[#6D7A80]/10",
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
