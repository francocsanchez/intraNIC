import type { EChartsCoreOption } from "echarts/core";
import { useMemo } from "react";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import type { PatentamientosDashboardEvolution } from "@/services/patentamientosDashboardService";

type PatentamientosToyotaEvolutionChartProps = {
  data: PatentamientosDashboardEvolution;
};

export default function PatentamientosToyotaEvolutionChart({
  data,
}: PatentamientosToyotaEvolutionChartProps) {
  const option = useMemo<EChartsCoreOption>(() => {
    const colors = getPresetChartColors();
    return {
      color: colors,
      grid: { top: 24, right: 20, bottom: 44, left: 46 },
      legend: { bottom: 0, data: ["Toyota PAIS", "Toyota Zona NIC"] },
      tooltip: {
        trigger: "axis",
        backgroundColor: "var(--popover)",
        borderColor: "var(--border)",
        textStyle: { color: "var(--popover-foreground)" },
        valueFormatter: (value: number | string) => `${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
      },
      xAxis: { type: "category", data: data.series.map((point) => point.label), axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 } },
      yAxis: { type: "value", axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", formatter: "{value}%", fontSize: 11 }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } },
      series: [
        { type: "line", name: "Toyota PAIS", smooth: true, data: data.series.map((point) => point.pais), lineStyle: { width: 2 }, symbolSize: 6 },
        { type: "line", name: "Toyota Zona NIC", smooth: true, data: data.series.map((point) => point.zonaNic), lineStyle: { width: 2 }, symbolSize: 6 },
      ],
    };
  }, [data.series]);

  return (
    <section className="border border-border bg-card p-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">{data.title}</h2>
        <p className="text-xs text-muted-foreground">Comparacion mensual del porcentaje de participacion de Toyota entre PAIS y Zona NIC.</p>
      </div>

      <div className="mt-3 h-[320px] w-full">
        {data.series.length ? (
          <EChart option={option} />
        ) : (
          <div className="flex h-full items-center justify-center border border-dashed border-border bg-muted px-3 text-center text-sm text-muted-foreground">
            No hay informacion suficiente para graficar la evolucion de Toyota todavia.
          </div>
        )}
      </div>
    </section>
  );
}
