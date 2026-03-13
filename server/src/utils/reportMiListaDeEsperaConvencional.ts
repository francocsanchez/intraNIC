export type ReservaRow = {
  opera: number;
  fecha: string;
  clienteNombre: string;
  version: string;
  modelo: string;
  color1: string;
  color2?: string;
};

const normalizeModel = (modelo: string) =>
  (modelo || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

const MODEL_ALIASES: Record<string, string> = {
  "C. CROSS": "C. CROSS",
  "COROLLA CROSS": "C. CROSS",
  "COROLLA C CROSS": "C. CROSS",
  "CROSS": "C. CROSS",
  "RAV 4": "RAV4",
  "RAV-4": "RAV4",
};

const toModelKey = (modelo: string) => {
  const n = normalizeModel(modelo);
  return MODEL_ALIASES[n] ?? n;
};

export const buildResumenListaDeEspera = (rows: ReservaRow[]) => {
  const porModelo: Record<string, number> = {};
  for (const r of rows) {
    const key = toModelKey(r.modelo);
    porModelo[key] = (porModelo[key] ?? 0) + 1;
  }

  return {
    total: rows.length,
    porModelo, 
  };
};
