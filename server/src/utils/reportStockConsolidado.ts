export type StockConsolidadoRow = {
  interno: number;
  modelo: string | null;
  marca: string | null;
  order: string | null;
  sa_estado: number;
  estado: string;
  tipoStock: string;
  tipoOrder: string;
};

type ResumenPorEstado = Record<string, number>;

type ResumenAgrupadoItem = {
  nombre: string;
  total: number;
  porEstado: ResumenPorEstado;
};

type BuildResumenStockConsolidadoResult = {
  total: number;
  totalUsados: number;
  totalNuevos: number;
  usadosPorMarca: Record<string, ResumenAgrupadoItem>;
  nuevosPorTipoOrder: Record<string, Record<string, ResumenAgrupadoItem>>;
};

const normalizeText = (value: string | null | undefined) =>
  (value || "").trim().toUpperCase().replace(/\s+/g, " ");

const MODEL_ALIASES: Record<string, string> = {
  "C. CROSS": "C. CROSS",
  "COROLLA CROSS": "C. CROSS",
  "COROLLA C CROSS": "C. CROSS",
  CROSS: "C. CROSS",
  "RAV 4": "RAV4",
  "RAV-4": "RAV4",
};

const ORDER_TYPE_ALIASES: Record<string, string> = {
  CONVENCIONAL: "convencional",
  "V. ESPECIALES": "v. especiales",
  "C. ESPECIALES": "v. especiales",
  "V ESPECIALES": "v. especiales",
  "C ESPECIALES": "v. especiales",
  "PLAN DE AHORRO": "plan de ahorro",
};

const VALID_ORDER_TYPES = new Set([
  "convencional",
  "v. especiales",
  "plan de ahorro",
]);

const toModelKey = (modelo: string | null) => {
  const normalized = normalizeText(modelo);

  if (!normalized) return "SIN_MODELO";

  return MODEL_ALIASES[normalized] ?? normalized;
};

const toMarcaKey = (marca: string | null) => {
  const normalized = normalizeText(marca);
  return normalized || "SIN_MARCA";
};

const toEstadoKey = (estado: string | null) => {
  const normalized = (estado || "").trim();
  return normalized || "SIN_ESTADO";
};

const toTipoOrderKey = (tipoOrder: string | null) => {
  const normalized = normalizeText(tipoOrder);

  if (!normalized) return "otro";

  return ORDER_TYPE_ALIASES[normalized] ?? normalized.toLowerCase();
};

const addToResumen = (
  target: Record<string, ResumenAgrupadoItem>,
  key: string,
  estado: string
) => {
  if (!target[key]) {
    target[key] = {
      nombre: key,
      total: 0,
      porEstado: {},
    };
  }

  target[key].total += 1;
  target[key].porEstado[estado] = (target[key].porEstado[estado] ?? 0) + 1;
};

export const buildResumenStockConsolidado = (
  rows: StockConsolidadoRow[]
): BuildResumenStockConsolidadoResult => {
  const result: BuildResumenStockConsolidadoResult = {
    total: rows.length,
    totalUsados: 0,
    totalNuevos: 0,
    usadosPorMarca: {},
    nuevosPorTipoOrder: {
      convencional: {},
      "v. especiales": {},
      "plan de ahorro": {},
    },
  };

  for (const row of rows) {
    const tipoStock = normalizeText(row.tipoStock).toLowerCase();
    const tipoOrder = toTipoOrderKey(row.tipoOrder);
    const estado = toEstadoKey(row.estado);

    if (tipoStock === "usado") {
      const marcaKey = toMarcaKey(row.marca);

      result.totalUsados += 1;
      addToResumen(result.usadosPorMarca, marcaKey, estado);
      continue;
    }

    if (VALID_ORDER_TYPES.has(tipoOrder)) {
      const modeloKey = toModelKey(row.modelo);

      result.totalNuevos += 1;
      addToResumen(result.nuevosPorTipoOrder[tipoOrder], modeloKey, estado);
    }
  }

  return result;
};

export type StockRow = {
  marca: string | null;
  tipoStock: string;
};

type ResumenMarca = {
  marca: string;
  total: number;
  nuevo: number;
  usado: number;
};

type ResumenStockPorMarca = {
  total: number;
  marcas: Record<string, ResumenMarca>;
};

const normalize = (value: string | null | undefined) =>
  (value || "").trim().toUpperCase();

export const buildResumenLiessMarca = (
  rows: StockRow[]
): ResumenStockPorMarca => {
  const result: ResumenStockPorMarca = {
    total: rows.length,
    marcas: {},
  };

  for (const row of rows) {
    const marca = normalize(row.marca) || "SIN_MARCA";
    const tipo = normalize(row.tipoStock);

    if (!result.marcas[marca]) {
      result.marcas[marca] = {
        marca,
        total: 0,
        nuevo: 0,
        usado: 0,
      };
    }

    result.marcas[marca].total += 1;

    if (tipo === "NUEVO") {
      result.marcas[marca].nuevo += 1;
    } else if (tipo === "USADO") {
      result.marcas[marca].usado += 1;
    }
  }

  return result;
};