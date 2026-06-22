import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import {
  agendaEntregaBatchConvencionalQuery,
  agendaEntregaBatchPlanAhorroQuery,
  agendaEntregaLookupConvencionalQuery,
  agendaEntregaLookupPlanAhorroQuery,
} from "../controllers/querys/agendaEntrega.query";

type LookupConvencionalRow = {
  interno: number;
  estado: number;
  operacion?: number | null;
  vendedor: string;
  cliente: string;
  version?: string | null;
  modelo?: string | null;
  chasis?: string | null;
  nroFabricacion?: string | null;
  color?: string | null;
  tipoOperacion: string;
};

type LookupPlanAhorroRow = {
  interno: number;
  estado: number;
  cliente: string;
  vendedor: string;
  version?: string | null;
  modelo?: string | null;
  grupo?: number | null;
  orden?: number | null;
  serie?: string | null;
  nroFabricacion?: string | null;
  color?: string | null;
  tipoOperacion: string;
};

export type AgendaEntregaLookup = {
  interno: number;
  estado: number;
  tipoOperacion: string;
  operacion?: number;
  grupo?: number;
  orden?: number;
  cliente: string;
  vendedor: string;
  version?: string;
  modelo?: string;
  chasis?: string;
  serie?: string;
  nroFabricacion?: string;
  color: string;
};

type BatchLookupResult = {
  data: Map<number, AgendaEntregaLookup>;
  missing: number[];
};

const normalizeText = (value: unknown, fallback = "-") => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized.length ? normalized : fallback;
};

const normalizeOptionalText = (value: unknown) => {
  const normalized = normalizeText(value, "");
  return normalized ? normalized : undefined;
};

const mapConvencionalRow = (row: LookupConvencionalRow): AgendaEntregaLookup => ({
  interno: Number(row.interno),
  estado: Number(row.estado),
  tipoOperacion: normalizeText(row.tipoOperacion),
  operacion:
    Number.isInteger(Number(row.operacion)) && Number(row.operacion) > 0
      ? Number(row.operacion)
      : undefined,
  version: normalizeOptionalText(row.version),
  modelo: normalizeOptionalText(row.modelo),
  cliente: normalizeText(row.cliente),
  vendedor: normalizeText(row.vendedor),
  chasis: normalizeOptionalText(row.chasis),
  nroFabricacion: normalizeOptionalText(row.nroFabricacion),
  color: normalizeText(row.color),
});

const mapPlanAhorroRow = (row: LookupPlanAhorroRow): AgendaEntregaLookup => ({
  interno: Number(row.interno),
  estado: Number(row.estado),
  tipoOperacion: normalizeText(row.tipoOperacion),
  grupo:
    Number.isInteger(Number(row.grupo)) && Number(row.grupo) > 0
      ? Number(row.grupo)
      : undefined,
  orden:
    Number.isInteger(Number(row.orden)) && Number(row.orden) > 0
      ? Number(row.orden)
      : undefined,
  cliente: normalizeText(row.cliente),
  vendedor: normalizeText(row.vendedor),
  version: normalizeOptionalText(row.version),
  modelo: normalizeOptionalText(row.modelo),
  serie: normalizeOptionalText(row.serie),
  nroFabricacion: normalizeOptionalText(row.nroFabricacion),
  color: normalizeText(row.color),
});

export const lookupAgendaEntregaInterno = async (
  interno: number,
): Promise<AgendaEntregaLookup | null> => {
  const convencionalRows = await sequelizeNIC.query<LookupConvencionalRow>(
    agendaEntregaLookupConvencionalQuery(),
    {
      type: QueryTypes.SELECT,
      replacements: { interno },
    },
  );

  if (convencionalRows[0]) {
    return mapConvencionalRow(convencionalRows[0]);
  }

  const planRows = await sequelizeNIC.query<LookupPlanAhorroRow>(
    agendaEntregaLookupPlanAhorroQuery(),
    {
      type: QueryTypes.SELECT,
      replacements: { interno },
    },
  );

  if (planRows[0]) {
    return mapPlanAhorroRow(planRows[0]);
  }

  return null;
};

export const lookupAgendaEntregaInternos = async (
  internos: number[],
): Promise<BatchLookupResult> => {
  const uniqueInternos = Array.from(
    new Set(
      internos.filter((interno) => Number.isInteger(interno) && interno > 0),
    ),
  );

  if (!uniqueInternos.length) {
    return { data: new Map(), missing: [] };
  }

  const convencionalRows = await sequelizeNIC.query<LookupConvencionalRow>(
    agendaEntregaBatchConvencionalQuery(),
    {
      type: QueryTypes.SELECT,
      replacements: { internos: uniqueInternos },
    },
  );

  const data = new Map<number, AgendaEntregaLookup>();

  for (const row of convencionalRows) {
    data.set(Number(row.interno), mapConvencionalRow(row));
  }

  const remainingInternos = uniqueInternos.filter((interno) => !data.has(interno));

  if (remainingInternos.length) {
    const planRows = await sequelizeNIC.query<LookupPlanAhorroRow>(
      agendaEntregaBatchPlanAhorroQuery(),
      {
        type: QueryTypes.SELECT,
        replacements: { internos: remainingInternos },
      },
    );

    for (const row of planRows) {
      data.set(Number(row.interno), mapPlanAhorroRow(row));
    }
  }

  return {
    data,
    missing: uniqueInternos.filter((interno) => !data.has(interno)),
  };
};
