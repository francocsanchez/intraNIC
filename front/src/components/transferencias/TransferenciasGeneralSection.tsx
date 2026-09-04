import type { EChartsCoreOption } from "echarts/core";
import { ArrowLeft, ArrowRight, Percent, Trophy, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import type { TransferenciasDashboardGeneral } from "@/services/transferenciasDashboardService";

type TransferenciasGeneralSectionProps = { data: TransferenciasDashboardGeneral; onPageChange?: (page: number) => void };
const formatInteger = (value: number) => value.toLocaleString("es-AR");
const formatPercentage = (value: number) => `${value.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

export default function TransferenciasGeneralSection({ data, onPageChange }: TransferenciasGeneralSectionProps) {
  const averageTrendValue = data.trend.length ? data.trend.reduce((sum, point) => sum + point.total, 0) / data.trend.length : 0;
  const option = useMemo<EChartsCoreOption>(() => ({
    color: getPresetChartColors(),
    grid: { top: 24, right: 18, bottom: 34, left: 46 },
    tooltip: { trigger: "axis", backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" } },
    xAxis: { type: "category", data: data.trend.map((point) => point.label), axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 } },
    yAxis: { type: "value", axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } },
    series: [
      { type: "bar", name: "Operaciones", data: data.trend.map((point) => point.operaciones), barMaxWidth: 30 },
      { type: "line", name: "Transferencias", smooth: true, data: data.trend.map((point) => point.total), lineStyle: { width: 2 }, symbolSize: 5, markLine: { symbol: "none", lineStyle: { type: "dashed", color: "var(--muted-foreground)" }, data: [{ yAxis: averageTrendValue, label: { formatter: `Promedio ${formatInteger(Math.round(averageTrendValue))}` } }] } },
    ],
  }), [averageTrendValue, data.trend]);
  const metrics = [
    { label: "Total transferencias", value: formatInteger(data.summary.totalTransferencias), description: "Acumulado del anio seleccionado en Zona NIC.", icon: TrendingUp },
    { label: "Market share NIC", value: formatPercentage(data.summary.marketShare), description: `${formatInteger(data.summary.totalOperaciones)} / ${formatInteger(data.summary.totalTransferencias)} operaciones propias.`, icon: Percent },
    { label: "Marca lider", value: data.summary.marketLeader?.brand ?? "-", description: data.summary.marketLeader ? `${formatInteger(data.summary.marketLeader.total)} transferencias acumuladas.` : "Todavia no hay datos importados.", icon: Trophy },
  ];
  return <div className="space-y-3">
    <section className="grid gap-px border border-border bg-border md:grid-cols-3">
      {metrics.map(({ label, value, description, icon: Icon }) => <article key={label} className="flex min-w-0 items-start justify-between gap-3 bg-card p-3"><div><p className="text-primary font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold text-foreground">{value}</p><p className="text-xs text-muted-foreground">{description}</p></div><Icon size={18} className="text-primary" /></article>)}
    </section>
    <section className="border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2"><div><h3 className="text-base font-semibold text-foreground">Tendencia de transferencias</h3><p className="text-xs text-muted-foreground">Transferencias de Zona NIC y operaciones asignadas por mes.</p></div><span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">Market share anual {formatPercentage(data.summary.marketShare)}</span></div>
      <div className="h-72 p-3">{data.trend.length ? <EChart option={option} /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No hay informacion suficiente para graficar la tendencia mensual de Zona NIC.</div>}</div>
    </section>
    <section className="border border-border bg-card"><div className="border-b border-border px-3 py-2"><h3 className="text-base font-semibold text-foreground">Top marca / modelo / ano</h3><p className="text-xs text-muted-foreground">Ranking de transferencias de Zona NIC ordenado de mayor a menor.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-muted text-muted-foreground"><tr>{["Rank", "Marca", "Modelo", "Ano", "Unidades", "Share"].map((label) => <th key={label} className="px-3 py-2 font-medium uppercase tracking-[0.1em]">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{data.topVehicles.length ? data.topVehicles.map((vehicle) => <tr key={`${vehicle.rank}-${vehicle.brand}-${vehicle.model}-${vehicle.year}`}><td className="px-3 py-1.5 text-muted-foreground">{String(vehicle.rank).padStart(2, "0")}</td><td className="px-3 py-1.5">{vehicle.brand}</td><td className="px-3 py-1.5 font-medium">{vehicle.model}</td><td className="px-3 py-1.5">{vehicle.year}</td><td className="px-3 py-1.5">{formatInteger(vehicle.total)}</td><td className="px-3 py-1.5 font-medium text-primary">{formatPercentage(vehicle.percentage)}</td></tr>) : <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No hay transferencias disponibles para el anio seleccionado.</td></tr>}</tbody></table></div><div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs"><span className="text-muted-foreground">Pagina {data.pagination.page} de {Math.max(data.pagination.totalPages, 1)}</span><div className="flex gap-2"><button type="button" onClick={() => onPageChange?.(data.pagination.page - 1)} disabled={data.pagination.page <= 1} className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 disabled:opacity-50"><ArrowLeft size={14} />Anterior</button><button type="button" onClick={() => onPageChange?.(data.pagination.page + 1)} disabled={data.pagination.totalPages === 0 || data.pagination.page >= data.pagination.totalPages} className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 disabled:opacity-50">Siguiente<ArrowRight size={14} /></button></div></div></section>
  </div>;
}
