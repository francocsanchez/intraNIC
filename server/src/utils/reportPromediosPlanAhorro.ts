export type PromedioPlanAhorroRow = {
  sucursal: string;
  vendedor: string;
  promedio: number | string | null;
};

type MesReporte = {
  key: string;
  label: string;
  mes: number;
  ano: number;
};

type MesConRows = {
  mes: MesReporte;
  rows: PromedioPlanAhorroRow[];
};

type VendedorReporte = {
  vendedor: string;
  sucursal: string;
  meses: Record<string, number>;
  promedioAnualParcial: number;
};

type SucursalReporte = {
  sucursal: string;
  vendedores: VendedorReporte[];
  meses: Record<string, number>;
  promedioAnualParcial: number;
};

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const roundValue = (value: number) => Math.round(value * 100) / 100;

export const buildPlanAhorroMonthRange = (ano: number, hastaMes: number): MesReporte[] =>
  Array.from({ length: hastaMes }, (_, index) => ({
    key: `${ano}-${String(index + 1).padStart(2, "0")}`,
    label: MONTH_LABELS[index],
    mes: index + 1,
    ano,
  }));

export const buildReportePromediosPlanAhorro = (ano: number, hastaMes: number, mesesConRows: MesConRows[]) => {
  const meses = buildPlanAhorroMonthRange(ano, hastaMes);
  const vendedoresMap = new Map<string, VendedorReporte>();

  for (const { mes, rows } of mesesConRows) {
    for (const row of rows) {
      const sucursal = row.sucursal || "SIN ASIGNAR";
      const vendedor = row.vendedor || "SIN VENDEDOR";
      const vendedorKey = `${sucursal}::${vendedor}`;
      const promedio = roundValue(Number(row.promedio ?? 0));

      const vendedorActual =
        vendedoresMap.get(vendedorKey) ??
        (() => {
          const mesesIniciales = meses.reduce<Record<string, number>>((acc, item) => {
            acc[item.key] = 0;
            return acc;
          }, {});

          const nextValue: VendedorReporte = {
            vendedor,
            sucursal,
            meses: mesesIniciales,
            promedioAnualParcial: 0,
          };

          vendedoresMap.set(vendedorKey, nextValue);
          return nextValue;
        })();

      vendedorActual.meses[mes.key] = promedio;
    }
  }

  const vendedores = Array.from(vendedoresMap.values())
    .map((item) => {
      const totalPeriodo = meses.reduce((acc, mes) => acc + (item.meses[mes.key] ?? 0), 0);

      return {
        ...item,
        promedioAnualParcial: roundValue(totalPeriodo / meses.length),
      };
    })
    .sort((a, b) => {
      const sucursalCompare = a.sucursal.localeCompare(b.sucursal, "es", { sensitivity: "base" });

      if (sucursalCompare !== 0) return sucursalCompare;

      return a.vendedor.localeCompare(b.vendedor, "es", { sensitivity: "base" });
    });

  const sucursales = vendedores.reduce<SucursalReporte[]>((acc, vendedor) => {
    const existing = acc.find((item) => item.sucursal === vendedor.sucursal);

    if (existing) {
      existing.vendedores.push(vendedor);
      return acc;
    }

    acc.push({
      sucursal: vendedor.sucursal,
      vendedores: [vendedor],
      meses: meses.reduce<Record<string, number>>((mesesAcc, mesItem) => {
        mesesAcc[mesItem.key] = 0;
        return mesesAcc;
      }, {}),
      promedioAnualParcial: 0,
    });

    return acc;
  }, []);

  for (const sucursal of sucursales) {
    for (const mes of meses) {
      const totalMes = sucursal.vendedores.reduce((acc, vendedor) => acc + (vendedor.meses[mes.key] ?? 0), 0);
      sucursal.meses[mes.key] = sucursal.vendedores.length
        ? roundValue(totalMes / sucursal.vendedores.length)
        : 0;
    }

    const totalPeriodo = meses.reduce((acc, mes) => acc + (sucursal.meses[mes.key] ?? 0), 0);
    sucursal.promedioAnualParcial = sucursal.vendedores.length
      ? roundValue(totalPeriodo / meses.length)
      : 0;
  }

  const tablasPorSucursal = sucursales.reduce<
    Record<
      string,
      Array<
        | {
            tipo: "vendedor";
            vendedor: string;
            meses: Record<string, number>;
            promedioAnualParcial: number;
          }
        | {
            tipo: "sucursal";
            vendedor: string;
            meses: Record<string, number>;
            promedioAnualParcial: number;
          }
      >
    >
  >((acc, sucursal) => {
    acc[sucursal.sucursal] = [
      ...sucursal.vendedores.map((vendedor) => ({
        tipo: "vendedor" as const,
        vendedor: vendedor.vendedor,
        meses: vendedor.meses,
        promedioAnualParcial: vendedor.promedioAnualParcial,
      })),
      {
        tipo: "sucursal" as const,
        vendedor: `PROMEDIO ${sucursal.sucursal}`,
        meses: sucursal.meses,
        promedioAnualParcial: sucursal.promedioAnualParcial,
      },
    ];

    return acc;
  }, {});

  const promedioGeneral = vendedores.length
    ? roundValue(vendedores.reduce((acc, item) => acc + item.promedioAnualParcial, 0) / vendedores.length)
    : 0;

  return {
    total: vendedores.length,
    periodo: {
      ano,
      hastaMes,
    },
    meses,
    vendedores,
    sucursales,
    tablasPorSucursal,
    metricas: {
      totalVendedores: vendedores.length,
      promedioGeneral,
      mejorPromedio: vendedores.length ? Math.max(...vendedores.map((item) => item.promedioAnualParcial)) : 0,
      mejorSucursal: sucursales.reduce(
        (best, item) => (item.promedioAnualParcial > best.promedioAnualParcial ? item : best),
        { sucursal: "-", vendedores: [], meses: {}, promedioAnualParcial: 0 },
      ),
    },
  };
};
