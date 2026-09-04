import Loading from "@/components/Loading";
import { getAnalisisVendedor, getAnalisisVendedorFilters } from "@/services/operacionesService";
import type { AnalisisOperacionesPreventaItem, AnalisisVendedorFilterOption } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Inbox, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { EChartsCoreOption } from "echarts/core";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { toast } from "sonner";

const MONTH_SHORT_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const MONEY_COLUMNS: Array<keyof AnalisisOperacionesPreventaItem> = [
  "precio",
  "patentamiento",
  "flete",
  "formulario",
  "prenda",
  "equipamiento",
  "otro",
  "bonificacion",
];

type VendorTableColumn =
  | { kind: "field"; key: keyof AnalisisOperacionesPreventaItem; label: string }
  | { kind: "derived"; key: "descuentoPorcentaje" | "total"; label: string };

const TABLE_COLUMNS: VendorTableColumn[] = [
  { kind: "field", key: "numero", label: "OP" },
  { kind: "field", key: "interno", label: "Stoauto" },
  { kind: "field", key: "cliente", label: "Cliente" },
  { kind: "field", key: "modelo", label: "Modelo" },
  { kind: "field", key: "version", label: "Version" },
  { kind: "field", key: "precio", label: "Precio" },
  { kind: "derived", key: "descuentoPorcentaje", label: "Desc" },
  { kind: "field", key: "formulario", label: "Form" },
  { kind: "field", key: "flete", label: "Flete" },
  { kind: "field", key: "prenda", label: "Prenda" },
  { kind: "field", key: "patentamiento", label: "Paten" },
  { kind: "field", key: "equipamiento", label: "Eq" },
  { kind: "field", key: "otro", label: "Otro" },
  { kind: "derived", key: "total", label: "Total" },
];

type ChartPoint = Record<string, string | number | null | undefined>;
type ChartSeries = { key: string; label: string; type?: "bar" | "line"; stack?: string; yAxisIndex?: number; markLine?: number };

function AnalyticsChart({ data, xKey, series }: { data: ChartPoint[]; xKey: string; series: ChartSeries[] }) {
  const option = useMemo<EChartsCoreOption>(() => ({
    color: getPresetChartColors(),
    grid: { top: 30, right: series.some((item) => item.yAxisIndex) ? 54 : 18, bottom: 40, left: 42 },
    legend: { bottom: 0 },
    tooltip: { trigger: "axis", backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" } },
    xAxis: { type: "category", data: data.map((item) => String(item[xKey] ?? "")), axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 } },
    yAxis: series.some((item) => item.yAxisIndex) ? [{ type: "value", axisLabel: { color: "var(--muted-foreground)", fontSize: 11 }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } }, { type: "value", axisLabel: { color: "var(--muted-foreground)", fontSize: 11 }, splitLine: { show: false } }] : { type: "value", axisLabel: { color: "var(--muted-foreground)", fontSize: 11 }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } },
    series: series.map((item) => ({ type: item.type ?? "bar", name: item.label, stack: item.stack, yAxisIndex: item.yAxisIndex, data: data.map((point) => Number(point[item.key] ?? 0)), smooth: item.type === "line", barMaxWidth: 30, symbolSize: 5, label: item.type === "bar" ? { show: true, position: "top", color: "var(--foreground)", fontSize: 10 } : undefined, markLine: item.markLine === undefined ? undefined : { symbol: "none", lineStyle: { type: "dashed", color: "var(--destructive)" }, data: [{ yAxis: item.markLine }] } })),
  }), [data, series, xKey]);
  return <EChart option={option} />;
}

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value) || value === 0) {
    return "-";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentageCompact = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
};

const getDescuentoPorcentaje = (row: AnalisisOperacionesPreventaItem) => {
  if (!row.precio || !row.bonificacion) {
    return null;
  }

  return (row.bonificacion / row.precio) * 100;
};

const getTotalOperacion = (row: AnalisisOperacionesPreventaItem) =>
  [
    row.precio,
    row.formulario,
    row.flete,
    row.prenda,
    row.patentamiento,
    row.equipamiento,
    row.otro,
  ].reduce<number>((acc, value) => acc + Number(value ?? 0), 0);

const formatPercentage = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value)}%`;
};

const getDescuentoCellClassName = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  if (value > 9) {
    return "bg-destructive/10/70 text-destructive";
  }

  if (value >= 6) {
    return "bg-secondary/70 text-secondary-foreground";
  }

  return "bg-secondary/70 text-secondary-foreground";
};

const formatCellValue = (row: AnalisisOperacionesPreventaItem, column: VendorTableColumn) => {
  if (column.kind === "derived") {
    if (column.key === "descuentoPorcentaje") {
      return formatPercentage(getDescuentoPorcentaje(row));
    }

    return formatMoney(getTotalOperacion(row));
  }

  const value = row[column.key];

  if (MONEY_COLUMNS.includes(column.key)) {
    return formatMoney(value as number | null);
  }

  if (value === null || value === "") {
    return "-";
  }

  return String(value);
};

export default function AnalisisVendedorView() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const [selectedVendedor, setSelectedVendedor] = useState<number | null>(null);

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - 5 + index),
    [currentYear],
  );

  const {
    data: filtersData,
    isLoading: isFiltersLoading,
    error: filtersError,
  } = useQuery({
    queryKey: ["analisis-vendedor-filtros"],
    queryFn: getAnalisisVendedorFilters,
    refetchOnWindowFocus: false,
  });

  const vendedores = filtersData?.filters.vendedores ?? [];

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["analisis-vendedor", anio, selectedVendedor],
    queryFn: () =>
      getAnalisisVendedor({
        anio,
        vendedor: selectedVendedor,
      }),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (filtersError instanceof Error) {
      toast.error(filtersError.message);
    }
  }, [filtersError]);

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  const effectiveVendedores: AnalisisVendedorFilterOption[] = data?.filters.vendedores ?? vendedores;

  if (isFiltersLoading) {
    return <Loading />;
  }

  if (!effectiveVendedores.length) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-dashed border-border bg-card px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
            <Users size={20} />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-foreground">No hay vendedores disponibles</h1>
          <p className="mt-1 text-sm text-muted-foreground">Todavia no existen vendedores activos para construir este analisis.</p>
        </section>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-destructive/30 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle size={18} />
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar Analisis Vendedor</h1>
          </div>
          <p className="mt-2 text-sm text-destructive">
            {error instanceof Error ? error.message : "No fue posible obtener la informacion solicitada."}
          </p>
        </section>
      </div>
    );
  }

  const hasData = data ? data.chartData.some((item) => item.total > 0) : false;
  const usadosChartData = data
    ? MONTH_SHORT_LABELS.map((label, index) => {
        const match = data.usadosMensual.find((item) => item.mes === index + 1);
        const porcentajeToma =
          match && match.totalOperaciones > 0 ? (match.cantidadUsados / match.totalOperaciones) * 100 : null;

        return {
          mes: label,
          porcentajeToma,
          cantidadUsados: match?.cantidadUsados ?? 0,
          promedioValorUsado: match?.promedioValorUsado ?? null,
        };
      })
    : [];
  const creditoChartData = data
    ? MONTH_SHORT_LABELS.map((label, index) => {
        const match = data.creditoMensual.find((item) => item.mes === index + 1);
        const porcentajeCredito =
          match && match.totalOperaciones > 0
            ? (match.cantidadOperacionesCredito / match.totalOperaciones) * 100
            : null;

        return {
          mes: label,
          porcentajeCredito,
          promedioCredito: match?.promedioCredito ?? null,
        };
      })
    : [];
  const descuentoChartData = data
    ? MONTH_SHORT_LABELS.map((label, index) => {
        const match = data.descuentoMensual.find((item) => item.mes === index + 1);

        return {
          mes: label,
          descuentoPromedio: match?.descuentoPromedio ?? null,
          descuentoPromedioHilux: match?.descuentoPromedioHilux ?? null,
        };
      })
    : [];

  return (
    <div className="w-full space-y-4 px-4 py-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="analisis-vendedor-vendedor" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Vendedor
            </label>
            <select
              id="analisis-vendedor-vendedor"
              value={selectedVendedor ?? ""}
              onChange={(event) => setSelectedVendedor(event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos los vendedores</option>
              {effectiveVendedores.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="analisis-vendedor-anio" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ano
            </label>
            <select
              id="analisis-vendedor-anio"
              value={anio}
              onChange={(event) => setAnio(Number(event.target.value))}
              className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.73fr)]">
        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-primary font-semibold uppercase tracking-[0.16em] text-primary">Modulo analitico</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Analisis vendedor anual</h1>
             
            </div>

            <div className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              {data?.context.modelos.length ?? 0} modelos
            </div>
          </div>

          <div className="mt-4 h-[210px] min-w-0 w-full">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : !hasData ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground">
                Sin operaciones para {data.context.vendedorLabel} en {anio}.
              </div>
            ) : (
              <AnalyticsChart data={data.chartData as ChartPoint[]} xKey="label" series={data.context.modelos.map((modelo) => ({ key: modelo, label: modelo, stack: "modelos", markLine: 12 }))} />
            )}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex h-full flex-col">
            <p className="text-primary font-semibold uppercase tracking-[0.16em] text-primary">Resumen</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Indicadores</h2>
            <div className="mt-4 grid flex-1 grid-cols-2 gap-3 content-start">
              <div className="rounded-lg bg-secondary px-3 py-3">
                <p className="text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cant operaciones</p>
                <p className="mt-1 text-xl font-bold text-foreground">{data?.summary.totalOperaciones ?? 0}</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-3">
                <p className="text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cant con credito</p>
                <p className="mt-1 text-xl font-bold text-foreground">{data?.summary.cantidadOperacionesCredito ?? 0}</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-3">
                <p className="text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cant con usado</p>
                <p className="mt-1 text-xl font-bold text-foreground">{data?.summary.cantidadOperacionesUsado ?? 0}</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-3">
                <p className="text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">% Toma</p>
                <p className="mt-1 text-xl font-bold text-foreground">{formatPercentageCompact(data?.summary.porcentajeToma ?? null)}</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-3">
                <p className="text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">% Vendedor</p>
                <p className="mt-1 text-xl font-bold text-foreground">{formatPercentageCompact(data?.summary.porcentajeVendedor ?? null)}</p>
              </div>
              <div className="rounded-lg bg-secondary px-3 py-3">
                <p className="text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">% Vendedor sucursal</p>
                <p className="mt-1 text-xl font-bold text-foreground">{formatPercentageCompact(data?.summary.porcentajeVendedorSucursal ?? null)}</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Usados Anualizado</h2>
          
          </div>

          <div className="mt-4 h-[260px] min-w-0">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : (
              <AnalyticsChart data={usadosChartData as ChartPoint[]} xKey="mes" series={[{ key: "cantidadUsados", label: "Cantidad usados" }, { key: "promedioValorUsado", label: "Promedio valor usado", type: "line", yAxisIndex: 1 }]} />
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Monto Promedio de Credito</h2>
     
          </div>

          <div className="mt-4 h-[260px] min-w-0">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : (
              <AnalyticsChart data={creditoChartData as ChartPoint[]} xKey="mes" series={[{ key: "promedioCredito", label: "Promedio credito" }]} />
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Descuento Promedio</h2>
         
          </div>

          <div className="mt-4 h-[260px] min-w-0">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : (
              <AnalyticsChart data={descuentoChartData as ChartPoint[]} xKey="mes" series={[{ key: "descuentoPromedio", label: "Descuento promedio", markLine: 8 }, { key: "descuentoPromedioHilux", label: "Descuento promedio Hilux", type: "line" }]} />
            )}
          </div>
        </article>
      </section>

      {!isLoading && data && !hasData ? (
        <section className="rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
            <Inbox size={20} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-foreground">No hay operaciones para mostrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Proba cambiar el ano o el vendedor para ampliar el resultado.
          </p>
        </section>
      ) : null}

      {!isLoading && data && data.operations.length ? (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-muted-foreground">
              {data.operations.length} operaciones encontradas para {data.context.vendedorLabel.toLowerCase()} en {anio}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs">
              <thead className="bg-muted">
                <tr>
                  {TABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-2 py-1.5 text-left text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border bg-card">
                {data.operations.map((row) => (
                  <tr key={`${row.numero ?? "sin-numero"}-${row.interno ?? "sin-interno"}-${row.modelo}`} className="hover:bg-muted/70">
                    {TABLE_COLUMNS.map((column) => {
                      const descuentoValue =
                        column.kind === "derived" && column.key === "descuentoPorcentaje"
                          ? getDescuentoPorcentaje(row)
                          : null;

                      const colorClassName =
                        column.kind === "derived" && column.key === "descuentoPorcentaje"
                          ? getDescuentoCellClassName(descuentoValue)
                          : "";

                      return (
                        <td
                          key={`${row.numero ?? "sin-numero"}-${String(column.key)}`}
                          className={`whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground ${colorClassName}`}
                        >
                          {formatCellValue(row, column)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
