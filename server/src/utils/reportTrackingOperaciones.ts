export type TrackingOperacionRow = {
  opera: number;
  fechaFactura: string | Date | null;
  fechaEntrega: string | Date | null;
  diasEntrega: number | null;
  modelo: string;
  vendedor: string;
  sucursal: string;
};

type TrackingStatusKey = "bueno" | "medio" | "malo" | "sin-datos";
type MonthlyBucket = { sumaDias: number; totalOperaciones: number };

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const roundToOne = (value: number) => Math.round(value * 10) / 10;

const getStatus = (value: number, totalOperaciones: number): { key: TrackingStatusKey; label: string } => {
  if (!totalOperaciones) {
    return { key: "sin-datos", label: "Sin datos" };
  }

  if (value <= 10) {
    return { key: "bueno", label: "Bueno" };
  }

  if (value < 15) {
    return { key: "medio", label: "Medio" };
  }

  return { key: "malo", label: "Malo" };
};

const getMonthKey = (value: string | Date | null) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return {
    ano: date.getUTCFullYear(),
    mes: date.getUTCMonth() + 1,
    key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
  };
};

export const buildReporteTrackingOperaciones = (
  rows: TrackingOperacionRow[],
  mesSeleccionado: number,
  anoSeleccionado: number,
) => {
  const yearlyMap = new Map<number, MonthlyBucket>();

  for (let month = 1; month <= 12; month += 1) {
    yearlyMap.set(month, { sumaDias: 0, totalOperaciones: 0 });
  }

  const sucursalMap = new Map<
    string,
    {
      sucursal: string;
      sumaDias: number;
      totalOperaciones: number;
      monthlyMap: Map<number, MonthlyBucket>;
    }
  >();
  let sumaMes = 0;
  let totalMes = 0;

  for (const row of rows) {
    if (typeof row.diasEntrega !== "number" || row.diasEntrega < 0) continue;

    const period = getMonthKey(row.fechaEntrega);

    if (!period || period.ano !== anoSeleccionado) continue;

    const monthBucket = yearlyMap.get(period.mes);

    if (monthBucket) {
      monthBucket.sumaDias += row.diasEntrega;
      monthBucket.totalOperaciones += 1;
    }

    const sucursalKey = row.sucursal?.trim() || "SIN ASIGNAR";
    const currentSucursal = sucursalMap.get(sucursalKey) ?? {
      sucursal: sucursalKey,
      sumaDias: 0,
      totalOperaciones: 0,
      monthlyMap: new Map<number, MonthlyBucket>(
        Array.from({ length: 12 }, (_, index) => [index + 1, { sumaDias: 0, totalOperaciones: 0 }]),
      ),
    };
    const sucursalMonthBucket = currentSucursal.monthlyMap.get(period.mes);

    if (sucursalMonthBucket) {
      sucursalMonthBucket.sumaDias += row.diasEntrega;
      sucursalMonthBucket.totalOperaciones += 1;
    }

    sucursalMap.set(sucursalKey, currentSucursal);

    if (period.mes !== mesSeleccionado) continue;

    sumaMes += row.diasEntrega;
    totalMes += 1;

    currentSucursal.sumaDias += row.diasEntrega;
    currentSucursal.totalOperaciones += 1;
  }

  const promedioMensual = totalMes ? roundToOne(sumaMes / totalMes) : 0;

  const porSucursal = Array.from(sucursalMap.values())
    .map((item) => {
      const promedioDias = item.totalOperaciones ? roundToOne(item.sumaDias / item.totalOperaciones) : 0;

      return {
        sucursal: item.sucursal,
        promedioDias,
        totalOperaciones: item.totalOperaciones,
        estado: getStatus(promedioDias, item.totalOperaciones),
        graficoAnual: Array.from({ length: 12 }, (_, index) => {
          const mes = index + 1;
          const bucket = item.monthlyMap.get(mes) ?? { sumaDias: 0, totalOperaciones: 0 };
          const promedioMensualSucursal = bucket.totalOperaciones
            ? roundToOne(bucket.sumaDias / bucket.totalOperaciones)
            : 0;

          return {
            mes,
            label: MONTH_LABELS[index].slice(0, 3),
            promedioDias: promedioMensualSucursal,
            totalOperaciones: bucket.totalOperaciones,
          };
        }),
      };
    })
    .sort((a, b) => a.sucursal.localeCompare(b.sucursal, "es", { sensitivity: "base" }));

  const graficoAnual = Array.from({ length: 12 }, (_, index) => {
    const mes = index + 1;
    const bucket = yearlyMap.get(mes) ?? { sumaDias: 0, totalOperaciones: 0 };
    const promedioDias = bucket.totalOperaciones ? roundToOne(bucket.sumaDias / bucket.totalOperaciones) : 0;

    return {
      mes,
      label: MONTH_LABELS[index].slice(0, 3),
      promedioDias,
      totalOperaciones: bucket.totalOperaciones,
    };
  });

  return {
    periodo: {
      mes: mesSeleccionado,
      ano: anoSeleccionado,
      label: MONTH_LABELS[mesSeleccionado - 1] ?? "",
    },
    mensual: {
      promedioDias: promedioMensual,
      totalOperaciones: totalMes,
      estado: getStatus(promedioMensual, totalMes),
    },
    porSucursal,
    graficoAnual,
  };
};
