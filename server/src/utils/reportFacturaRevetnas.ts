export type StockRow = {
  interno: number;
  vendedorReserva: string;
  version: string;
  modelo: string;
  ubicacion: string;
  chasis: string;
  fechaRecepcion: string;
  sucursal?: string
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

// Ajustá estos arrays a TU realidad (según tu UI)
const NACIONALES = new Set(["HILUX", "SW4", "HIACE"]);
const IMPORTADAS = new Set(["COROLLA", "C. CROSS", "YARIS", "RAV4"]);

export const buildResumenFacturasReventas = (rows: StockRow[]) => {
  const porModelo: Record<string, number> = {};
  for (const r of rows) {
    const key = toModelKey(r.modelo);
    porModelo[key] = (porModelo[key] ?? 0) + 1;
  }

  const nacionales: Record<string, number> = {};
  const importadas: Record<string, number> = {};

  for (const [modelo, cantidad] of Object.entries(porModelo)) {
    if (NACIONALES.has(modelo)) nacionales[modelo] = cantidad;
    else if (IMPORTADAS.has(modelo)) importadas[modelo] = cantidad;
  }

  const totalNacionales = Object.values(nacionales).reduce((a, b) => a + b, 0);
  const totalImportadas = Object.values(importadas).reduce((a, b) => a + b, 0);

  return {
    total: rows.length,
    totalNacionales,
    totalImportadas,
    nacionales,
    importadas,
    porModelo, 
  };
};
