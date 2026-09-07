import type { PatentamientosDashboardGeneral } from "@/services/patentamientosDashboardService";
import { ArrowLeft, ArrowRight, Trophy, TrendingUp } from "lucide-react";
import type { EChartsCoreOption } from "echarts/core";
import { useMemo } from "react";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";

type PatentamientosGeneralSectionProps = {
  data: PatentamientosDashboardGeneral;
  onTopModelsPageChange?: (page: number) => void;
  selectedMonthLabel?: string | null;
};

const formatInteger = (value: number) => value.toLocaleString("es-AR");

const formatPercentage = (value: number) =>
  `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default function PatentamientosGeneralSection({
  data,
  onTopModelsPageChange,
  selectedMonthLabel = null,
}: PatentamientosGeneralSectionProps) {
  const hasTrend = data.trend.length > 0;
  const hasTopModels = data.topModels.length > 0;
  const topModelsPagination = data.topModelsPagination;
  const ownUnitsDescription =
    selectedMonthLabel && selectedMonthLabel !== "Todos"
      ? `Patentamientos propios registrados en ${selectedMonthLabel}.`
      : "Patentamientos propios acumulados del anio seleccionado en Zona NIC.";
  const averageTrendValue = hasTrend
    ? data.trend.reduce((sum, point) => sum + point.total, 0) / data.trend.length
    : 0;
  const trendOption = useMemo<EChartsCoreOption>(() => ({
    color: getPresetChartColors(),
    grid: { top: 24, right: 18, bottom: 34, left: 46 },
    tooltip: { trigger: "axis", backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" } },
    xAxis: { type: "category", data: data.trend.map((point) => point.label), axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 } },
    yAxis: { type: "value", axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } },
    series: [
      { type: "bar", name: "Patentamientos propios", data: data.trend.map((point) => point.ownTotal), barMaxWidth: 32 },
      { type: "line", name: "Patentamientos Toyota", smooth: true, data: data.trend.map((point) => point.toyotaTotal), lineStyle: { width: 2 }, symbolSize: 5 },
      { type: "line", name: "Patentamientos", smooth: true, data: data.trend.map((point) => point.total), lineStyle: { width: 2 }, symbolSize: 5, markLine: { symbol: "none", lineStyle: { type: "dashed", color: "var(--muted-foreground)" }, data: [{ yAxis: averageTrendValue, label: { formatter: `Promedio ${formatInteger(Math.round(averageTrendValue))}` } }] } },
    ],
  }), [averageTrendValue, data.trend]);

  return (
    <div className="space-y-6">

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total patentamientos</p>
              <div className="mt-4 flex items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-muted-foreground">
                  {formatInteger(data.summary.totalPatentamientos)}
                </h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Acumulado del anio seleccionado en Zona NIC.</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <TrendingUp size={20} />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Patentamientos propios</p>
              <div className="mt-4 flex items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-muted-foreground">
                  {formatInteger(data.summary.ownPatentamientos)}
                </h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{ownUnitsDescription}</p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <TrendingUp size={20} />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Patentamientos Toyota</p>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-muted-foreground">
                  {formatInteger(data.summary.toyotaPatentamientos)}
                </h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Total Toyota acumulado del anio seleccionado en Zona NIC.
              </p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
              <TrendingUp size={20} />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cobertura Toyota</p>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-muted-foreground">
                  {formatPercentage(data.summary.marketCoverage)}
                </h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {`${formatInteger(data.summary.ownPatentamientos)} propios sobre ${formatInteger(data.summary.toyotaPatentamientos)} patentamientos Toyota.`}
              </p>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <Trophy size={20} />
            </div>
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <DashboardCard className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-muted-foreground">Tendencia de patentamientos</h3>
              <p className="text-sm text-muted-foreground">
                {selectedMonthLabel && selectedMonthLabel !== "Todos"
                  ? `Inscripciones por dia de ${selectedMonthLabel} en Zona NIC.`
                  : "Evolucion mensual de patentamientos de Zona NIC."}
              </p>
            </div>
          </div>

          <div className="px-5 py-6">
            <div className="rounded-lg border border-border bg-muted p-2">
              <div className="h-72 rounded-md bg-card p-2">
                {hasTrend ? (
                  <EChart option={trendOption} />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 text-center text-sm text-muted-foreground">
                    {selectedMonthLabel && selectedMonthLabel !== "Todos"
                      ? `No hay informacion suficiente para graficar las inscripciones diarias de ${selectedMonthLabel}.`
                      : "No hay informacion suficiente para graficar la tendencia mensual de Zona NIC."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <DashboardCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-muted-foreground">Top modelos</h3>
              <p className="text-sm text-muted-foreground">
                Ranking de modelos de Zona NIC ordenado de mayor a menor.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto px-4 py-3">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Rank</th>
                  <th className="pb-2 text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Marca</th>
                  <th className="pb-2 text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Modelo</th>
                  <th className="pb-2 text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Unidades</th>
                  <th className="pb-2 text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hasTopModels ? (
                  data.topModels.map((model) => (
                    <tr key={`${model.rank}-${model.brand}-${model.model}`} className="transition hover:bg-muted">
                      <td className="py-2.5 text-xs text-muted-foreground">{String(model.rank).padStart(2, "0")}</td>
                      <td className="py-2.5 text-xs text-secondary-foreground">{model.brand}</td>
                      <td className="py-2.5 text-xs font-semibold text-muted-foreground">{model.model}</td>
                      <td className="py-2.5 text-xs text-secondary-foreground">{formatInteger(model.total)}</td>
                      <td className="py-2.5 text-xs font-semibold text-primary">{formatPercentage(model.percentage)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      No hay modelos disponibles para el anio seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {topModelsPagination.total > 0
                ? `Mostrando ${data.topModels.length} de ${formatInteger(topModelsPagination.total)} modelos.`
                : "No hay modelos disponibles para paginar."}
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-secondary-foreground">
                Pagina {topModelsPagination.page} de {Math.max(topModelsPagination.totalPages, 1)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTopModelsPageChange?.(topModelsPagination.page - 1)}
                  disabled={topModelsPagination.page <= 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => onTopModelsPageChange?.(topModelsPagination.page + 1)}
                  disabled={topModelsPagination.totalPages === 0 || topModelsPagination.page >= topModelsPagination.totalPages}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </DashboardCard>
      </section>
    </div>
  );
}
