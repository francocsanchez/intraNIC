import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { ActionButton } from "@/components/ui/action-button";
import { getDashboardSalon } from "@/services/operacionesService";
import type { DashboardSalonResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const getCurrentPeriod = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "numeric" }).formatToParts(new Date());
  return { anio: Number(parts.find((part) => part.type === "year")?.value), mes: Number(parts.find((part) => part.type === "month")?.value) };
};

// Tonos de negocio solicitados para el cumplimiento del objetivo mensual.
const SALES_TARGET_COLORS = { achieved: "#bbf7d0", progress: "#fde68a", below: "#fecaca" };

function RankingChart({ title, items, colorIndex, vertical = false, highlightedName, objective }: { title: string; items: DashboardSalonResponse["vendedores"]; colorIndex: number; vertical?: boolean; highlightedName?: string | null; objective?: number | null }) {
  const option = useMemo<EChartsCoreOption>(() => {
    const color = getPresetChartColors()[colorIndex] ?? "var(--primary)";
    return {
      grid: { top: vertical ? 42 : 20, right: 28, bottom: vertical ? 86 : 24, left: 12, containLabel: true },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "var(--popover)",
        borderColor: "var(--border)",
        textStyle: { color: "var(--popover-foreground)" },
        formatter: (params: unknown) => {
          const item = Array.isArray(params) ? params[0] as { name?: string; value?: number } : null;
          return `${item?.name ?? ""}: ${item?.value ?? 0} operaciones`;
        },
      },
      xAxis: vertical
        ? { type: "category", data: items.map((item) => item.nombre), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: "var(--foreground)", fontSize: 10, rotate: 35, interval: 0, width: 110, overflow: "truncate" } }
        : { type: "value", minInterval: 1, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: vertical
        ? { type: "value", minInterval: 1, axisTick: { show: false }, axisLine: { show: false }, axisLabel: { show: false }, splitLine: { show: false } }
        : { type: "category", inverse: true, data: items.map((item) => item.nombre), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: "var(--foreground)", fontSize: 13, width: 145, overflow: "truncate" } },
      series: [{ type: "bar", data: items.map((item) => {
        const targetColor = vertical && objective
          ? item.total >= objective ? SALES_TARGET_COLORS.achieved : item.total >= objective * 0.7 ? SALES_TARGET_COLORS.progress : SALES_TARGET_COLORS.below
          : undefined;
        return {
          value: item.total,
          ...(targetColor ? { itemStyle: { color: targetColor } } : {}),
          ...(item.nombre === highlightedName ? { label: { formatter: "🚙\n{c}", lineHeight: 16 } } : {}),
        };
      }), barMaxWidth: vertical ? 52 : 42, itemStyle: { color, borderRadius: vertical ? [4, 4, 0, 0] : [0, 4, 4, 0] }, label: { show: true, position: vertical ? "top" : "right", color: "var(--foreground)", fontSize: 13 }, ...(vertical && objective ? { markLine: { silent: true, symbol: "none", lineStyle: { color: "#fca5a5", type: "dashed", width: 2 }, label: { show: true, formatter: `Target ${objective}`, color: "#b91c1c", position: "insideEndTop" }, data: [{ yAxis: objective }] } } : {}) }],
    };
  }, [colorIndex, highlightedName, items, objective, vertical]);

  return <section className="flex min-h-0 flex-col rounded-md border border-border bg-card p-4"><h2 className="mb-2 text-xl font-semibold text-foreground">{title}</h2>{items.length ? <div className="min-h-0 flex-1"><EChart option={option} /></div> : <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">Sin operaciones asignadas.</p>}</section>;
}

const roundGaugeMaximum = (value: number) => {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(value, 10)));
  return Math.ceil(value / magnitude) * magnitude;
};

function OperationsGauge({ title, total, colorIndex, objective }: { title: string; total: number; colorIndex: number; objective?: number | null }) {
  const option = useMemo<EChartsCoreOption>(() => {
    const color = getPresetChartColors()[colorIndex] ?? "var(--primary)";
    const hasObjective = Boolean(objective && objective > 0);
    const max = hasObjective ? roundGaugeMaximum(Math.max(objective as number, total, 10) * 1.1) : Math.max(10, total * 1.2);
    const target = objective ?? max;
    const warningEnd = Math.min((target * 0.7) / max, 1);
    const targetEnd = Math.min(target / max, 1);
    const currentColor = !hasObjective ? color : total >= target ? "#fecaca" : total >= target * 0.7 ? "#fde68a" : "#bbf7d0";
    return {
      series: [{ type: "gauge", center: ["50%", "57%"], radius: "96%", startAngle: 210, endAngle: -30, min: 0, max, splitNumber: hasObjective ? 6 : 5, progress: { show: !hasObjective, width: 18, itemStyle: { color } }, axisLine: { lineStyle: { width: hasObjective ? 26 : 18, color: hasObjective ? [[warningEnd, "#bbf7d0"], [targetEnd, "#fde68a"], [1, "#fecaca"]] : [[1, "var(--secondary)"]] } }, pointer: { show: hasObjective, length: "60%", width: 7, itemStyle: { color: currentColor } }, anchor: { show: hasObjective, size: 14, itemStyle: { color: currentColor } }, axisTick: { show: hasObjective, distance: -31, length: 7, lineStyle: { color: "var(--background)", width: 1 } }, splitLine: { show: hasObjective, distance: -33, length: 14, lineStyle: { color: "var(--background)", width: 2 } }, axisLabel: { show: hasObjective, distance: 34, color: "var(--muted-foreground)", fontSize: 13, formatter: (value: number) => String(Math.round(value)) }, detail: { valueAnimation: false, formatter: "{value}", color: "var(--foreground)", fontSize: hasObjective ? 80 : 72, fontWeight: "bold", offsetCenter: [0, "20%"] }, title: { color: "var(--muted-foreground)", fontSize: 16, offsetCenter: [0, "55%"] }, data: [{ value: total, name: "Operaciones" }] }],
    };
  }, [colorIndex, objective, total]);

  return <section className="relative min-h-0 overflow-hidden rounded-md border border-border bg-card"><h2 className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-xl font-semibold text-foreground">{title}</h2><div className="h-full w-full"><EChart option={option} enableHoverEmphasis={false} /></div></section>;
}

function OperationsCounter({ title, total, totalOperaciones }: { title: string; total: number; totalOperaciones: number }) {
  const percentage = totalOperaciones > 0 ? Math.round((total / totalOperaciones) * 100) : 0;
  return <section className="flex min-h-0 flex-col items-center justify-center rounded-md border border-border bg-card p-3 text-center"><h2 className="text-xl font-semibold text-foreground">{title}</h2><p className="mt-3 text-8xl font-bold leading-none text-foreground">{total}</p><p className="mt-3 text-lg text-muted-foreground">{percentage}%</p></section>;
}

export default function DashboardSalonView() {
  const [period, setPeriod] = useState(getCurrentPeriod);
  const currentPeriod = getCurrentPeriod();
  const query = useQuery({
    queryKey: ["dashboard-salon", period],
    queryFn: () => getDashboardSalon(period),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  if (query.isLoading) return <div className="grid min-h-screen place-items-center bg-muted font-preset text-lg text-muted-foreground">Cargando Dashboard Salón...</div>;
  if (query.isError || !query.data) return <div className="grid min-h-screen place-items-center bg-muted p-6 font-preset"><section className="max-w-lg rounded-md border border-destructive/30 bg-card p-6 text-center"><h1 className="text-xl font-semibold text-foreground">No se pudo cargar Dashboard Salón</h1><p className="mt-2 text-destructive">{query.error instanceof Error ? query.error.message : "Intentá actualizar nuevamente."}</p></section></div>;

  const { data } = query;
  const isCurrentPeriod = period.anio === currentPeriod.anio && period.mes === currentPeriod.mes;
  const movePeriod = (direction: -1 | 1) => setPeriod((value) => {
    const date = new Date(Date.UTC(value.anio, value.mes - 1 + direction, 1));
    return { anio: date.getUTCFullYear(), mes: date.getUTCMonth() + 1 };
  });
  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-muted p-4 font-preset"><header className="mb-4 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Dashboard Salón</p><h1 className="text-3xl font-bold text-foreground">{data.sucursal}</h1></div><div className="flex items-center gap-2"><ActionButton aria-label="Mes anterior" onClick={() => movePeriod(-1)} className="h-9 w-9 bg-primary p-0 text-primary-foreground hover:bg-primary/90"><ChevronLeft size={20} /></ActionButton><p className="whitespace-nowrap text-lg text-muted-foreground">Asignaciones · {MONTHS[data.periodo.mes - 1]} {data.periodo.anio}</p><ActionButton aria-label="Mes siguiente" onClick={() => movePeriod(1)} disabled={isCurrentPeriod} className="h-9 w-9 bg-primary p-0 text-primary-foreground hover:bg-primary/90"><ChevronRight size={20} /></ActionButton></div><div /></header><div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 overflow-hidden"><RankingChart title="Operaciones por vendedor" items={data.vendedores} colorIndex={0} vertical highlightedName={data.vendedorMayorHilux} objective={data.objetivoVendedores} /><div className="grid min-h-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.7fr)] gap-4 overflow-hidden"><OperationsCounter title="Cantidad de operaciones" total={data.totalOperaciones} totalOperaciones={data.totalOperacionesTodasSucursales} /><RankingChart title="Operaciones por modelo" items={data.modelos} colorIndex={1} /><OperationsGauge title="Cantidad de operaciones totales" total={data.totalOperacionesTodasSucursales} colorIndex={2} objective={data.objetivoOperacionesTotales} /></div></div></main>;
}
