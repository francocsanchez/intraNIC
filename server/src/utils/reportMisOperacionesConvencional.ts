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
