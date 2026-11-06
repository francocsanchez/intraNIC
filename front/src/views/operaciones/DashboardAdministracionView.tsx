import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { createSaldoOperacionTiempoTreeOption } from "@/components/operaciones/SaldoOperacionTiempoTree";
import { getDashboardAdministracion, getDashboardAdministracionCobranzas } from "@/services/operacionesService";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const MODEL_ROSE_COLORS = ["#93c5fd", "#86efac", "#fde68a", "#f9a8d4", "#c4b5fd", "#67e8f9", "#fdba74", "#a7f3d0"];
const formatMillions = (value: number) => `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(value / 1_000_000))}M`;
const formatChartMillions = (value: number) => `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.floor(value / 1_000_000))}M`;
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEK_RANGES = [
  { desde: 1, hasta: 7, etiqueta: "1–7" },
  { desde: 8, hasta: 14, etiqueta: "8–14" },
  { desde: 15, hasta: 21, etiqueta: "15–21" },
  { desde: 22, hasta: 28, etiqueta: "22–28" },
  { desde: 29, hasta: 31, etiqueta: "29–fin" },
] as const;

export default function DashboardAdministracionView() {
  const [searchParams] = useSearchParams();
  const tvMode = searchParams.get("mode") === "tv";
  const query = useQuery({
    queryKey: ["dashboard-administracion"],
    queryFn: ({ signal }) => getDashboardAdministracion(signal),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const cobranzasQuery = useQuery({
    queryKey: ["dashboard-administracion-cobranzas"],
    queryFn: ({ signal }) => getDashboardAdministracionCobranzas(signal),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const option = useMemo(() => query.data
    ? createSaldoOperacionTiempoTreeOption(query.data.data.tree, { showSaldo: true, operationLabel: "Operaciones", edgeShape: "curve", tvMode })
    : null, [query.data, tvMode]);
  const modelOption = useMemo<EChartsCoreOption | null>(() => query.data?.modelos.length ? ({
    color: MODEL_ROSE_COLORS,
    tooltip: {
      trigger: "item",
      formatter: (params: unknown) => {
        const item = params as { name?: string; value?: number; percent?: number };
        return `${item.name ?? ""}: ${item.value ?? 0} operaciones (${Math.round(item.percent ?? 0)}%)`;
      },
    },
    series: [{
      name: "Operaciones pendientes",
      type: "pie",
      radius: [28, "67%"],
      center: ["50%", "50%"],
      roseType: "area",
      itemStyle: { borderRadius: 8, borderColor: "var(--card)", borderWidth: 2 },
      label: { formatter: "{b}\n{c}", color: "var(--foreground)", fontSize: tvMode ? 14 : 10, fontWeight: tvMode ? 600 : 400, lineHeight: tvMode ? 18 : 14 },
      labelLine: { length: tvMode ? 12 : 6, length2: tvMode ? 10 : 6, lineStyle: { width: tvMode ? 2 : 1 } },
      data: query.data.modelos.map((item) => ({ name: item.nombre, value: item.total })),
    }],
  }) : null, [query.data, tvMode]);
  const weeklyChartOption = useMemo<EChartsCoreOption | null>(() => {
    const data = cobranzasQuery.data?.data;
    if (!data) return null;
    const weeks = WEEK_RANGES.map((week) => ({
      ...week,
      total: data.dias.filter((day) => day.dia >= week.desde && day.dia <= week.hasta).reduce((total, day) => total + day.total, 0),
    }));
    const targetColors = { achieved: "#86efac", progress: "#fde68a", below: "#fecaca" };
    return {
      color: getPresetChartColors(),
      grid: { top: tvMode ? 24 : 12, right: tvMode ? 20 : 14, bottom: tvMode ? 38 : 28, left: tvMode ? 82 : 66 },
      tooltip: { trigger: "axis", valueFormatter: (value: number | string) => money.format(Number(value)) },
      xAxis: { type: "category", data: weeks.map((week) => week.etiqueta), axisTick: { alignWithLabel: true }, axisLabel: { fontSize: tvMode ? 14 : 10, fontWeight: tvMode ? 600 : 400 }, axisLine: { lineStyle: { width: tvMode ? 2 : 1 } } },
      yAxis: { type: "value", axisLabel: { fontSize: tvMode ? 12 : 9, fontWeight: tvMode ? 600 : 400, formatter: (value: number) => formatChartMillions(value) }, axisLine: { show: true, lineStyle: { width: tvMode ? 2 : 1 } }, splitLine: { lineStyle: { color: "var(--border)", width: tvMode ? 1.5 : 1 } } },
      series: [
        {
          type: "bar",
          name: "Cobrado",
          data: weeks.map((week, index) => {
            const objetivo = data.objetivos[index];
            const color = objetivo && objetivo > 0
              ? week.total >= objetivo ? targetColors.achieved : week.total >= objetivo * 0.7 ? targetColors.progress : targetColors.below
              : undefined;
            return { value: week.total, ...(color ? { itemStyle: { color } } : {}) };
          }),
          barMaxWidth: tvMode ? 64 : 48,
          itemStyle: { borderRadius: [3, 3, 0, 0] },
          label: { show: true, position: "top", formatter: (params: { value?: number }) => formatChartMillions(Number(params.value ?? 0)), color: "var(--foreground)", fontSize: tvMode ? 17 : 14, fontWeight: 700, backgroundColor: "var(--card)", borderColor: "var(--border)", borderWidth: tvMode ? 2 : 1, borderRadius: 4, padding: tvMode ? [4, 8] : [3, 6] },
        },
        { type: "line", name: "Objetivo", data: data.objetivos, symbol: "none", connectNulls: false, lineStyle: { color: "#dc2626", type: "dashed", width: tvMode ? 3 : 2 } },
      ],
    };
  }, [cobranzasQuery.data, tvMode]);

  if (query.isLoading) return <main className="grid h-dvh place-items-center overflow-hidden bg-muted font-preset text-lg text-muted-foreground">Cargando Dashboard Administración...</main>;
  if (query.isError || !query.data) return <main className="grid h-dvh place-items-center overflow-hidden bg-muted p-6 font-preset"><section className="max-w-lg rounded-md border border-destructive/30 bg-card p-6 text-center"><h1 className="text-xl font-semibold text-foreground">No se pudo cargar Dashboard Administración</h1><p className="mt-2 text-destructive">{query.error instanceof Error ? query.error.message : "Intentá actualizar nuevamente."}</p></section></main>;

  const { data } = query.data;
  const hasTreeBranches = Boolean(data.operations && data.tree.children?.length);
  return <main className={`flex h-dvh min-h-0 flex-col overflow-hidden bg-muted font-preset ${tvMode ? "p-3" : "p-4"}`}>
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card">
      <header className={`flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border ${tvMode ? "px-6 py-4" : "px-5 py-3"}`}>
        <div><p className={`${tvMode ? "text-sm" : "text-xs"} font-semibold uppercase tracking-[0.16em] text-muted-foreground`}>Dashboard Administración</p><h1 className={`${tvMode ? "text-3xl" : "text-xl"} font-bold text-foreground`}>Operaciones no canceladas</h1></div>
        <div className={`flex flex-wrap items-center justify-end gap-x-4 gap-y-1 ${tvMode ? "text-sm" : "text-xs"} text-muted-foreground`}><span className="font-medium text-foreground">Todos los períodos</span><span>Todas las sucursales</span><span className="inline-flex items-center gap-1"><i className={`${tvMode ? "size-3.5" : "size-2.5"} rounded-full bg-green-200`} />Menos de 15 días</span><span className="inline-flex items-center gap-1"><i className={`${tvMode ? "size-3.5" : "size-2.5"} rounded-full bg-yellow-200`} />15 a 17,99 días</span><span className="inline-flex items-center gap-1"><i className={`${tvMode ? "size-3.5" : "size-2.5"} rounded-full bg-red-200`} />18 días o más</span></div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
        <section className="min-h-0 overflow-hidden p-3">
          {hasTreeBranches && option ? <EChart option={option} resetOnOptionChange /> : <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">No hay operaciones no canceladas con asignación válida.</p>}
        </section>
        <section className="grid min-h-0 grid-rows-2 divide-y divide-border">
          <section className="grid min-h-0 grid-cols-2 divide-x divide-border"><div className="flex min-h-0 flex-col overflow-hidden p-3"><h2 className="shrink-0 text-sm font-semibold text-foreground">Operaciones pendientes por modelo</h2>{modelOption ? <div className="min-h-0 flex-1"><EChart option={modelOption} /></div> : <p className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">Sin operaciones pendientes para representar.</p>}</div><div className="flex min-h-0 flex-col p-5"><div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"><p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Saldo pendiente</p><p className="mt-2 text-7xl font-bold leading-none tracking-tight text-foreground">{formatMillions(query.data.resumen.saldoTotal)}</p></div><div className="grid shrink-0 grid-cols-2 gap-4 border-t border-border pt-4 text-center"><div><p className="text-sm font-semibold text-muted-foreground">Créditos</p><p className="mt-1 text-2xl font-bold leading-none text-foreground">{formatMillions(query.data.resumen.creditoTotal)}</p><p className="mt-2 text-xs font-medium text-muted-foreground">{query.data.resumen.creditoCantidad} operaciones</p></div><div><p className="text-sm font-semibold text-muted-foreground">Usados</p><p className="mt-1 text-2xl font-bold leading-none text-foreground">{formatMillions(query.data.resumen.usadoTotal)}</p><p className="mt-2 text-xs font-medium text-muted-foreground">{query.data.resumen.usadoCantidad} operaciones</p></div></div></div></section>
          <section className="flex min-h-0 flex-col overflow-hidden p-3"><div className="shrink-0"><h2 className="text-sm font-semibold text-foreground">Cobranzas por semana</h2><p className="text-[11px] text-muted-foreground">{cobranzasQuery.data ? `Total cobrado por semana de ${MONTHS[cobranzasQuery.data.data.mes - 1]} ${cobranzasQuery.data.data.anio}.` : "Cobranzas del mes actual."}</p></div>{weeklyChartOption ? <div className="min-h-0 flex-1"><EChart option={weeklyChartOption} /></div> : <p className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">{cobranzasQuery.isError ? cobranzasQuery.error.message : "Cargando cobranzas..."}</p>}</section>
        </section>
      </div>
    </section>
  </main>;
}
