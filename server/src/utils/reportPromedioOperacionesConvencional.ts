export type PromedioOperacionRow = {
  opera: number;
  fechaAsignacion: string | Date | null;
  modelo: string;
  vendedor: string;
  sucursal: string;
};

type MesReporte = {
  key: string;
  label: string;
  mes: number;
  ano: number;
};

type VendedorReporte = {
  vendedor: string;
  sucursal: string;
  meses: Record<string, number>;
  totalSemestre: number;
  ventasMesActual: number;
  promedio: number;
};

type SucursalReporte = {
  sucursal: string;
  vendedores: VendedorReporte[];
  meses: Record<string, number>;
  totalSemestre: number;
  ventasMesActual: number;
  promedio: number;
};

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const buildMonthWindow = (mes: number, ano: number): MesReporte[] => {
  const months: MesReporte[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(ano, mes - 1 - offset, 1));
    const monthNumber = date.getUTCMonth() + 1;
    const yearNumber = date.getUTCFullYear();

    months.push({
      key: `${yearNumber}-${String(monthNumber).padStart(2, "0")}`,
      label: MONTH_LABELS[monthNumber - 1],
      mes: monthNumber,
      ano: yearNumber,
    });
  }

  return months;
};

const parseDateValue = (value: string | Date | null) => {
  if (!value) return "SIN_FECHA";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "SIN_FECHA";
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  if (typeof value !== "string") return "SIN_FECHA";

  const isoMatch = value.match(/^(\d{4})-(\d{2})/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "SIN_FECHA";

  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
};

const resolvePeriodo = (rows: PromedioOperacionRow[], mes?: number, ano?: number) => {
  if (mes && ano) {
    return { mes, ano };
  }

  let latestDate: Date | null = null;

  for (const row of rows) {
    if (!row.fechaAsignacion) continue;

    const parsed = new Date(row.fechaAsignacion);

    if (Number.isNaN(parsed.getTime())) continue;

    if (!latestDate || parsed.getTime() > latestDate.getTime()) {
      latestDate = parsed;
    }
  }

  if (latestDate) {
    return {
      mes: latestDate.getUTCMonth() + 1,
      ano: latestDate.getUTCFullYear(),
    };
  }

  const today = new Date();

  return {
    mes: today.getUTCMonth() + 1,
    ano: today.getUTCFullYear(),
  };
};

export const buildReportePromedioOperaciones = (rows: PromedioOperacionRow[], mes?: number, ano?: number) => {
  const periodo = resolvePeriodo(rows, mes, ano);
  const meses = buildMonthWindow(periodo.mes, periodo.ano);
  const monthKeys = new Set(meses.map((item) => item.key));
  const currentMonthKey = meses[meses.length - 1]?.key ?? "";
  const vendedoresMap = new Map<string, VendedorReporte>();

  for (const row of rows) {
    const periodKey = parseDateValue(row.fechaAsignacion);

    if (!monthKeys.has(periodKey)) continue;

    const vendedorKey = `${row.sucursal}::${row.vendedor}`;
    const vendedorActual =
      vendedoresMap.get(vendedorKey) ??
      (() => {
        const mesesIniciales = meses.reduce<Record<string, number>>((acc, item) => {
          acc[item.key] = 0;
          return acc;
        }, {});

        const nextValue: VendedorReporte = {
          vendedor: row.vendedor,
          sucursal: row.sucursal || "SIN ASIGNAR",
          meses: mesesIniciales,
          totalSemestre: 0,
          ventasMesActual: 0,
          promedio: 0,
        };

        vendedoresMap.set(vendedorKey, nextValue);
        return nextValue;
      })();

    vendedorActual.meses[periodKey] += 1;
    vendedorActual.totalSemestre += 1;
  }

  const vendedores = Array.from(vendedoresMap.values())
    .map((item) => ({
      ...item,
      ventasMesActual: item.meses[currentMonthKey] ?? 0,
      promedio: Math.round(item.totalSemestre / meses.length),
    }))
    .sort((a, b) => {
      const sucursalCompare = a.sucursal.localeCompare(b.sucursal, "es", { sensitivity: "base" });

      if (sucursalCompare !== 0) return sucursalCompare;

      return a.vendedor.localeCompare(b.vendedor, "es", { sensitivity: "base" });
    });

  const sucursales = vendedores.reduce<SucursalReporte[]>((acc, vendedor) => {
    const existing = acc.find((item) => item.sucursal === vendedor.sucursal);

    if (existing) {
      existing.vendedores.push(vendedor);
      existing.totalSemestre += vendedor.totalSemestre;
      existing.ventasMesActual += vendedor.ventasMesActual;
      for (const mesItem of meses) {
        existing.meses[mesItem.key] += vendedor.meses[mesItem.key] ?? 0;
      }
      return acc;
    }

    acc.push({
      sucursal: vendedor.sucursal,
      vendedores: [vendedor],
      meses: meses.reduce<Record<string, number>>((mesesAcc, mesItem) => {
        mesesAcc[mesItem.key] = vendedor.meses[mesItem.key] ?? 0;
        return mesesAcc;
      }, {}),
      totalSemestre: vendedor.totalSemestre,
      ventasMesActual: vendedor.ventasMesActual,
      promedio: 0,
    });

    return acc;
  }, []);

  for (const sucursal of sucursales) {
    sucursal.promedio = sucursal.vendedores.length ? Math.round(sucursal.totalSemestre / sucursal.vendedores.length / meses.length) : 0;
  }

  const tablasPorSucursal = sucursales.reduce<
    Record<
      string,
      Array<
        {
          tipo: "vendedor";
          vendedor: string;
          meses: Record<string, number>;
          ventasMesActual: number;
          promedio: number;
        } | {
          tipo: "sucursal";
          vendedor: string;
          meses: Record<string, number>;
          ventasMesActual: number;
          promedio: number;
        }
      >
    >
  >((acc, sucursal) => {
    acc[sucursal.sucursal] = [
      ...sucursal.vendedores.map((vendedor) => ({
        tipo: "vendedor" as const,
        vendedor: vendedor.vendedor,
        meses: vendedor.meses,
        ventasMesActual: vendedor.ventasMesActual,
        promedio: vendedor.promedio,
      })),
      {
        tipo: "sucursal" as const,
        vendedor: `PROMEDIO ${sucursal.sucursal}`,
        meses: sucursal.meses,
        ventasMesActual: sucursal.ventasMesActual,
        promedio: sucursal.promedio,
      },
    ];

    return acc;
  }, {});

  return {
    total: rows.length,
    periodo: {
      mes: periodo.mes,
      ano: periodo.ano,
    },
    meses,
    vendedores,
    sucursales,
    tablasPorSucursal,
  };
};
