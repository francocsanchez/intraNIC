import type { EChartsCoreOption } from "echarts/core";
import { useMemo } from "react";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";

export type OperacionesChartDimension = "mes" | "dia" | "modelo" | "sucursal" | "vendedor";
export type OperacionesChartCompare = "none" | "anio";

export type OperacionesChartPoint = {
  label: string;
  total?: number;
  [seriesKey: string]: string | number | undefined;
};

type OperacionesBarChartProps = {
  data: OperacionesChartPoint[];
  dimension: OperacionesChartDimension;
  compareBy: OperacionesChartCompare;
  seriesKeys: string[];
  onDimensionChange: (dimension: OperacionesChartDimension) => void;
  onCompareByChange: (value: OperacionesChartCompare) => void;
};

const DIMENSION_LABELS: Record<OperacionesChartDimension, string> = {
  mes: "Mes",
  dia: "Dia",
  modelo: "Modelo",
  sucursal: "Sucursal",
  vendedor: "Vendedor",
};

const COMPARE_LABELS: Record<OperacionesChartCompare, string> = {
  none: "Sin comparar",
  anio: "Ano",
};

export default function OperacionesBarChart({
  data,
  dimension,
  compareBy,
  seriesKeys,
  onDimensionChange,
  onCompareByChange,
}: OperacionesBarChartProps) {
  const chartWidth = Math.max(data.length * 88, 720);
  const option = useMemo<EChartsCoreOption>(() => {
    const colors = getPresetChartColors();
    const effectiveSeriesKeys = compareBy === "anio" ? seriesKeys : ["total"];

    return {
      color: colors,
      grid: { top: 24, right: 20, bottom: data.length > 6 ? 72 : 40, left: 44 },
      legend: compareBy === "anio" ? { bottom: 0, textStyle: { color: "inherit" } } : undefined,
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--popover)",
        borderColor: "var(--border)",
        textStyle: { color: "var(--popover-foreground)" },
        formatter: (items: unknown) => {
          const rows = Array.isArray(items) ? items : [];
          const label = rows[0] && typeof rows[0] === "object" && "axisValueLabel" in rows[0]
            ? String(rows[0].axisValueLabel)
            : "";
          const values = rows.map((item) => {
            const point = item as { marker?: string; seriesName?: string; value?: number };
            const name = compareBy === "anio" ? point.seriesName : "Total";
            return `${point.marker ?? ""}${name}: ${point.value ?? 0} operaciones`;
          });
          return [`${DIMENSION_LABELS[dimension]}: ${label}`, ...values].join("<br />");
        },
      },
      xAxis: {
        type: "category",
        data: data.map((point) => point.label),
        axisLine: { lineStyle: { color: "var(--border)" } },
        axisTick: { show: false },
        axisLabel: {
          color: "var(--muted-foreground)",
          fontSize: 11,
          rotate: data.length > 6 ? 35 : 0,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "var(--muted-foreground)", fontSize: 11 },
        splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } },
      },
      series: effectiveSeriesKeys.map((seriesKey) => ({
        type: "line",
        name: compareBy === "anio" ? seriesKey : "Total",
        data: data.map((point) => point[seriesKey] ?? 0),
        smooth: true,
        connectNulls: true,
        symbolSize: 6,
        lineStyle: { width: 2 },
        label: { show: true, position: "top", color: "var(--foreground)", fontSize: 10 },
      })),
    };
  }, [compareBy, data, dimension, seriesKeys]);

  return (
    <section className="border border-border bg-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Operaciones por {DIMENSION_LABELS[dimension].toLowerCase()}
          </h2>
          <p className="text-xs text-muted-foreground">
            La linea se recompone segun la dimension elegida y puede comparar por ano.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Dimension
            </span>
            <select
              value={dimension}
              onChange={(event) =>
                onDimensionChange(event.target.value as OperacionesChartDimension)
              }
              className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="mes">Mes</option>
              <option value="dia">Dia</option>
              <option value="modelo" disabled={compareBy === "anio"}>Modelo</option>
              <option value="sucursal" disabled={compareBy === "anio"}>Sucursal</option>
              <option value="vendedor" disabled={compareBy === "anio"}>Vendedor</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Comparar
            </span>
            <select
              value={compareBy}
              onChange={(event) =>
                onCompareByChange(event.target.value as OperacionesChartCompare)
              }
              className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="none">{COMPARE_LABELS.none}</option>
              <option value="anio">{COMPARE_LABELS.anio}</option>
            </select>
          </label>

          <span className="w-fit rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {data.length} puntos
          </span>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="h-[320px]" style={{ width: `${chartWidth}px`, minWidth: "100%" }}>
          <EChart option={option} />
        </div>
      </div>
    </section>
  );
}
