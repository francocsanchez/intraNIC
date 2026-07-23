export type MisOperacionRow = {
  opera: number;
  interno: number;
  fechaFactura: string | null;
  fecha: string | null;
  clienteNombre: string;
  fechaEntrega: string | null;
  fechaAsignacion: string | null;
  version: string;
  modelo: string;
  vendedor: string;
  color: string;
  descuentoPorcentaje: number | null;
};

export type MisOperacionAnualRow = {
  opera: number;
  fechaAsignacion: string | null;
  modelo: string;
};

type MisOperacionAnualMesResumen = {
  mes: number;
  total: number;
  porModelo: Record<string, number>;
};

const formatDateKey = (value: string | null) => {
  if (!value) return "SIN_FECHA";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "SIN_FECHA";

  return date.toISOString().slice(0, 10);
};

const normalizeModel = (modelo: string) => (modelo || "").trim().toUpperCase().replace(/\s+/g, " ");

const MODEL_ALIASES: Record<string, string> = {
  "C. CROSS": "C. CROSS",
  "COROLLA CROSS": "C. CROSS",
  "COROLLA C CROSS": "C. CROSS",
  CROSS: "C. CROSS",
  "RAV 4": "RAV4",
  "RAV-4": "RAV4",
};

const toModelKey = (modelo: string) => {
  const normalized = normalizeModel(modelo);
  return MODEL_ALIASES[normalized] ?? normalized;
};

export const buildResumenMisOperaciones = (rows: MisOperacionRow[]) => {
  const porDia: Record<string, number> = {};
  const porModelo: Record<string, number> = {};

  for (const row of rows) {
    const fechaKey = formatDateKey(row.fechaAsignacion);
    const modeloKey = toModelKey(row.modelo);

    porDia[fechaKey] = (porDia[fechaKey] ?? 0) + 1;
    porModelo[modeloKey] = (porModelo[modeloKey] ?? 0) + 1;
  }

  return {
    total: rows.length,
    porDia,
    porModelo,
  };
};

export const buildResumenMisOperacionesAnual = (rows: MisOperacionAnualRow[]): MisOperacionAnualMesResumen[] => {
  const meses = new Map<number, MisOperacionAnualMesResumen>();

  for (let mes = 1; mes <= 12; mes += 1) {
    meses.set(mes, { mes, total: 0, porModelo: {} });
  }

  for (const row of rows) {
    if (!row.fechaAsignacion) continue;

    const fecha = new Date(row.fechaAsignacion);
    if (Number.isNaN(fecha.getTime())) continue;

    const mes = fecha.getMonth() + 1;
    const item = meses.get(mes);
    if (!item) continue;

    const modeloKey = toModelKey(row.modelo);
    item.total += 1;
    item.porModelo[modeloKey] = (item.porModelo[modeloKey] ?? 0) + 1;
  }

  return Array.from(meses.values());
};
