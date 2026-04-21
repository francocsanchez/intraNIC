export type RankingOperacionRow = {
  opera: number;
  fechaAsignacion: string | Date | null;
  modelo: string;
  vendedor: string;
  sucursal: string;
};

type RankingItem = {
  nombre: string;
  total: number;
};

type RankingVendedorItem = RankingItem & {
  sucursal: string;
  promedioMensual: number;
  hilux: number;
};

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const normalizeText = (value: string) =>
  (value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

const MODEL_ALIASES: Record<string, string> = {
  "C. CROSS": "C. CROSS",
  "COROLLA CROSS": "C. CROSS",
  "COROLLA C CROSS": "C. CROSS",
  CROSS: "C. CROSS",
  "RAV 4": "RAV4",
  "RAV-4": "RAV4",
};

const toModelKey = (modelo: string) => {
  const normalized = normalizeText(modelo);
  return MODEL_ALIASES[normalized] ?? normalized;
};

const toMonthIndex = (value: string | Date | null) => {
  if (!value) return -1;

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) return -1;

  return parsed.getUTCMonth();
};

const toSortedRanking = <T extends RankingItem>(items: T[], limit?: number) => {
  const sorted = [...items].sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
};

export const buildReporteRankingOperaciones = (rows: RankingOperacionRow[], ano: number) => {
  const porVendedor = new Map<string, RankingVendedorItem>();
  const porModelo = new Map<string, number>();
  const porSucursal = new Map<string, number>();
  const porMes = MONTH_LABELS.map((label, index) => ({
    mes: index + 1,
    label,
    total: 0,
  }));

  for (const row of rows) {
    const vendedor = row.vendedor || "SIN VENDEDOR";
    const sucursal = row.sucursal || "SIN ASIGNAR";
    const modelo = toModelKey(row.modelo || "SIN MODELO");
    const monthIndex = toMonthIndex(row.fechaAsignacion);
    const isHilux = modelo.includes("HILUX");

    if (monthIndex >= 0) {
      porMes[monthIndex].total += 1;
    }

    porModelo.set(modelo, (porModelo.get(modelo) ?? 0) + 1);
    porSucursal.set(sucursal, (porSucursal.get(sucursal) ?? 0) + 1);

    const vendedorKey = `${sucursal}::${vendedor}`;
    const vendedorActual = porVendedor.get(vendedorKey) ?? {
      nombre: vendedor,
      sucursal,
      total: 0,
      promedioMensual: 0,
      hilux: 0,
    };

    vendedorActual.total += 1;
    if (isHilux) {
      vendedorActual.hilux += 1;
    }

    porVendedor.set(vendedorKey, vendedorActual);
  }

  const ventasAcumuladasPorVendedor = toSortedRanking(
    Array.from(porVendedor.values()).map((item) => ({
      ...item,
      promedioMensual: Math.round((item.total / 12) * 10) / 10,
    })),
  );

  const rankingVendedores = ventasAcumuladasPorVendedor.slice(0, 10);
  const rankingModelos = toSortedRanking(
    Array.from(porModelo.entries()).map(([nombre, total]) => ({
      nombre,
      total,
    })),
    10,
  );
  const rankingSucursales = toSortedRanking(
    Array.from(porSucursal.entries()).map(([nombre, total]) => ({
      nombre,
      total,
    })),
    10,
  );
  const rankingHilux = toSortedRanking(
    ventasAcumuladasPorVendedor
      .filter((item) => item.hilux > 0)
      .map((item) => ({
        nombre: item.nombre,
        sucursal: item.sucursal,
        total: item.hilux,
        promedioMensual: Math.round((item.hilux / 12) * 10) / 10,
        hilux: item.hilux,
      })),
    10,
  );

  const mejorPromedioAnual =
    [...ventasAcumuladasPorVendedor].sort(
      (a, b) =>
        b.promedioMensual - a.promedioMensual ||
        b.total - a.total ||
        a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    )[0] ?? null;

  const topVendedorDelAno = rankingVendedores[0] ?? null;
  const topModeloDelAno = rankingModelos[0] ?? null;
  const topSucursalDelAno = rankingSucursales[0] ?? null;
  const topHiluxDelAno = rankingHilux[0] ?? null;

  return {
    periodo: {
      ano,
    },
    totales: {
      operaciones: rows.length,
      vendedores: ventasAcumuladasPorVendedor.length,
      modelos: porModelo.size,
      sucursales: porSucursal.size,
      hilux: rankingHilux.reduce((acc, item) => acc + item.total, 0),
    },
    destacados: {
      topVendedorDelAno,
      topModeloDelAno,
      topSucursalDelAno,
      topHiluxDelAno,
      mejorPromedioAnual,
    },
    ventasPorMes: porMes,
    rankingVendedores,
    rankingModelos,
    rankingSucursales,
    rankingHilux,
    ventasAcumuladasPorVendedor,
  };
};
