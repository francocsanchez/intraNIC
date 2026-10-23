import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { ActionButton } from "@/components/ui/action-button";
import { getDashboardSalon } from "@/services/operacionesService";
import type { DashboardSalonResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { CarFront, ChevronLeft, ChevronRight, CreditCard, Star } from "lucide-react";
import { useMemo, useState } from "react";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const getCurrentPeriod = () => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "numeric" }).formatToParts(new Date());
  return { anio: Number(parts.find((part) => part.type === "year")?.value), mes: Number(parts.find((part) => part.type === "month")?.value) };
};

// Tonos de negocio solicitados para el cumplimiento del objetivo mensual.
const SALES_TARGET_COLORS = { achieved: "#bbf7d0", progress: "#fde68a", below: "#fecaca" };
// Tonos suaves locales para distinguir los modelos en el gráfico de distribución.
const MODEL_ROSE_COLORS = ["#93c5fd", "#86efac", "#fde68a", "#f9a8d4", "#c4b5fd", "#67e8f9", "#fdba74", "#a7f3d0"];
const resolveDashboardSalonImageUrl = (imageUrl: string) => {
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const apiUrl = String(import.meta.env.VITE_API_URL ?? "");
  const apiOrigin = apiUrl.replace(/\/api\/?$/, "");
  return apiOrigin ? `${apiOrigin}${imageUrl}` : imageUrl;
};

type SellerRankingProps = {
  title: string;
  items: DashboardSalonResponse["vendedores"];
  colorIndex: number;
  vertical?: boolean;
  objective?: number | null;
  usadosItems?: DashboardSalonResponse["vendedores"];
  creditosItems?: DashboardSalonResponse["vendedores"];
  modelImages?: DashboardSalonResponse["imagenesModelos"];
};

function SellerFinancingTable({ items, usadosItems, creditosItems }: Pick<SellerRankingProps, "items"> & { usadosItems: DashboardSalonResponse["vendedores"]; creditosItems: DashboardSalonResponse["vendedores"] }) {
  const usadosPorNombre = new Map(usadosItems.map((item) => [item.nombre, item.total]));
  const creditosPorNombre = new Map(creditosItems.map((item) => [item.nombre, item.total]));
  const getLeader = (source: Map<string, number>) => {
    const max = Math.max(0, ...items.map((item) => source.get(item.nombre) ?? 0));
    return max > 0 ? items.filter((item) => (source.get(item.nombre) ?? 0) === max).map((item) => item.nombre).sort((a, b) => a.localeCompare(b))[0] : null;
  };
  const rows = [
    { label: "Usados", icon: CarFront, starClass: "text-emerald-500", leader: getLeader(usadosPorNombre), values: items.map((item) => usadosPorNombre.get(item.nombre) ?? 0) },
    { label: "Créditos", icon: CreditCard, starClass: "text-amber-400", leader: getLeader(creditosPorNombre), values: items.map((item) => creditosPorNombre.get(item.nombre) ?? 0) },
  ];

  return <div className="relative shrink-0 pb-2 text-[11px] leading-5 text-foreground"><div className="absolute left-0 top-0 flex w-[76px] flex-col border-y border-r border-border text-muted-foreground">{rows.map((row, index) => { const Icon = row.icon; return <span key={row.label} title={row.label} aria-label={row.label} className={`flex h-5 items-center justify-end pr-2 ${index ? "border-t border-border" : ""}`}><Icon size={14} strokeWidth={1.8} /></span>; })}</div><div className="ml-[76px] mr-3 grid border-y border-r border-border" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>{rows.flatMap((row, rowIndex) => row.values.map((value, index) => <span key={`${row.label}-${items[index]?.nombre}`} className={`flex h-5 items-center justify-center gap-0.5 border-l border-border text-center ${rowIndex ? "border-t" : ""}`}>{value > 0 ? value : "-"}{items[index]?.nombre === row.leader ? <Star aria-label={`Mayor cantidad de ${row.label.toLocaleLowerCase("es-AR")}`} size={12} className={row.starClass} fill="currentColor" /> : null}</span>))}</div></div>;
}

function RankingChart({ title, items, colorIndex, vertical = false, objective, usadosItems = [], creditosItems = [], modelImages = [] }: SellerRankingProps) {
  const totalUsados = usadosItems.reduce((total, item) => total + item.total, 0);
  const totalCreditos = creditosItems.reduce((total, item) => total + item.total, 0);
  const option = useMemo<EChartsCoreOption>(() => {
    const color = getPresetChartColors()[colorIndex] ?? "var(--primary)";
    const modelImageByName = new Map(modelImages.map((item) => [item.modelo.toLocaleUpperCase("es-AR"), resolveDashboardSalonImageUrl(item.imageUrl)]));
    const modelAxisRich = items.reduce<Record<string, { width: number; height: number; backgroundColor: { image: string } }>>((rich, item, index) => {
      const imageUrl = modelImageByName.get(item.nombre.toLocaleUpperCase("es-AR"));
      if (imageUrl) rich[`model${index}`] = { width: 50, height: 30, backgroundColor: { image: imageUrl } };
      return rich;
    }, {});
    return {
      grid: { top: vertical ? 46 : 20, right: 12, bottom: vertical ? 26 : 24, left: vertical ? 76 : 12, containLabel: !vertical },
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
        ? { type: "category", data: items.map((item) => item.nombre), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: "var(--foreground)", fontSize: 10, rotate: 28, margin: 3, interval: 0, width: 110, overflow: "truncate" } }
        : { type: "value", minInterval: 1, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, splitLine: { show: false } },
      yAxis: vertical
        ? { type: "value", minInterval: 1, axisTick: { show: false }, axisLine: { show: false }, axisLabel: { show: false }, splitLine: { show: false } }
        : { type: "category", inverse: true, data: items.map((item) => item.nombre), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: "var(--foreground)", fontSize: 13, width: 165, overflow: "truncate", formatter: (value: string, index: number) => modelImageByName.has(value.toLocaleUpperCase("es-AR")) ? `{model${index}|} {label|${value}}` : `{fallback|🚗} {label|${value}}`, rich: { fallback: { width: 34, align: "center", fontSize: 19 }, label: { color: "var(--foreground)", fontSize: 13 }, ...modelAxisRich } } },
      series: [{ name: "Operaciones", type: "bar", data: items.map((item) => {
        const targetColor = vertical && objective
          ? item.total >= objective ? SALES_TARGET_COLORS.achieved : item.total >= objective * 0.7 ? SALES_TARGET_COLORS.progress : SALES_TARGET_COLORS.below
          : undefined;
        return {
          value: item.total,
          ...(targetColor ? { itemStyle: { color: targetColor } } : {}),
        };
      }), barMaxWidth: vertical ? 52 : 42, itemStyle: { color, borderRadius: vertical ? [4, 4, 0, 0] : [0, 4, 4, 0] }, label: { show: true, position: vertical ? "top" : "right", color: "var(--foreground)", fontSize: 13 }, ...(vertical && objective ? { markLine: { silent: true, symbol: "none", lineStyle: { color: "#fca5a5", type: "dashed", width: 2 }, label: { show: true, formatter: `Objetivo ${objective}`, color: "#b91c1c", position: "insideEndTop" }, data: [{ yAxis: objective }] } } : {}) }],
    };
  }, [colorIndex, items, modelImages, objective, vertical]);

  if (vertical) {
    return <section className="relative flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card"><h2 className="pointer-events-none absolute left-4 top-3 z-10 text-xl font-semibold text-foreground">{title}</h2><div className="pointer-events-none absolute right-4 top-3 z-10 flex items-center gap-4 text-sm font-semibold text-muted-foreground"><span className="flex items-center gap-1" title="Usados"><CarFront size={16} strokeWidth={1.8} /><span>{totalUsados}</span></span><span className="flex items-center gap-1" title="Créditos"><CreditCard size={16} strokeWidth={1.8} /><span>{totalCreditos}</span></span></div>{items.length ? <><div className="min-h-0 flex-1"><EChart option={option} /></div><SellerFinancingTable items={items} usadosItems={usadosItems} creditosItems={creditosItems} /></> : <p className="flex h-full items-center justify-center text-lg text-muted-foreground">Sin operaciones asignadas.</p>}</section>;
  }

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
    const currentColor = !hasObjective ? color : total >= target ? "#bbf7d0" : total >= target * 0.7 ? "#fde68a" : "#fecaca";
    return {
      series: [{ type: "gauge", center: ["50%", "57%"], radius: "96%", startAngle: 210, endAngle: -30, min: 0, max, splitNumber: hasObjective ? 6 : 5, progress: { show: !hasObjective, width: 18, itemStyle: { color } }, axisLine: { lineStyle: { width: hasObjective ? 26 : 18, color: hasObjective ? [[warningEnd, "#fecaca"], [targetEnd, "#fde68a"], [1, "#bbf7d0"]] : [[1, "var(--secondary)"]] } }, pointer: { show: hasObjective, length: "60%", width: 7, itemStyle: { color: currentColor } }, anchor: { show: hasObjective, size: 14, itemStyle: { color: currentColor } }, axisTick: { show: hasObjective, distance: -31, length: 7, lineStyle: { color: "var(--background)", width: 1 } }, splitLine: { show: hasObjective, distance: -33, length: 14, lineStyle: { color: "var(--background)", width: 2 } }, axisLabel: { show: hasObjective, distance: 34, color: "var(--muted-foreground)", fontSize: 13, formatter: (value: number) => String(Math.round(value)) }, detail: { valueAnimation: false, formatter: "{value}", color: "var(--foreground)", fontSize: hasObjective ? 80 : 72, fontWeight: "bold", offsetCenter: [0, "20%"] }, title: { color: "var(--muted-foreground)", fontSize: 16, offsetCenter: [0, "55%"] }, data: [{ value: total, name: "Operaciones" }] }],
    };
  }, [colorIndex, objective, total]);

  return <section className="relative min-h-0 overflow-hidden rounded-md border border-border bg-card"><h2 className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-xl font-semibold text-foreground">{title}</h2><div className="h-full w-full"><EChart option={option} enableHoverEmphasis={false} /></div></section>;
}

function OperationsCounter({ title, total, totalOperaciones, modelos }: { title: string; total: number; totalOperaciones: number; modelos: DashboardSalonResponse["modelos"] }) {
  const percentage = totalOperaciones > 0 ? Math.round((total / totalOperaciones) * 100) : 0;
  const option = useMemo<EChartsCoreOption>(() => ({
    color: MODEL_ROSE_COLORS,
    tooltip: { trigger: "item", formatter: (params: unknown) => { const item = params as { name?: string; value?: number; percent?: number }; return `${item.name ?? ""}: ${item.value ?? 0} - ${Math.round(item.percent ?? 0)}%`; } },
    series: [{ type: "pie", roseType: "radius", radius: ["27%", "65%"], center: ["50%", "56%"], avoidLabelOverlap: true, itemStyle: { borderRadius: 7, borderColor: "var(--card)", borderWidth: 3 }, label: { show: true, fontSize: 10, color: "var(--foreground)", formatter: (params: unknown) => { const item = params as { name?: string; value?: number; percent?: number }; return `${item.name ?? ""}: ${item.value ?? 0} - ${Math.round(item.percent ?? 0)}%`; } }, labelLine: { show: true, length: 8, length2: 8 }, data: modelos.map((item) => ({ name: item.nombre, value: item.total })) }],
    graphic: [{ type: "text", left: "center", top: "42%", style: { text: `${total}\n${percentage}%`, textAlign: "center", textVerticalAlign: "middle", fill: "var(--foreground)", fontSize: 28, fontWeight: "bold", lineHeight: 32 } }],
  }), [modelos, percentage, total]);
  return <section className="relative min-h-0 overflow-hidden rounded-md border border-border bg-card"><h2 className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-xl font-semibold text-foreground">{title}</h2>{modelos.length ? <div className="h-full w-full"><EChart option={option} enableHoverEmphasis={false} /></div> : <div className="flex h-full flex-col items-center justify-center"><p className="text-7xl font-bold leading-none text-foreground">{total}</p><p className="mt-3 text-lg text-muted-foreground">{percentage}%</p></div>}</section>;
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
  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-muted p-4 font-preset"><header className="mb-4 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Dashboard Salón</p><h1 className="text-3xl font-bold text-foreground">{data.sucursal}</h1></div><div className="flex items-center gap-2"><ActionButton aria-label="Mes anterior" onClick={() => movePeriod(-1)} className="h-9 w-9 bg-primary p-0 text-primary-foreground hover:bg-primary/90"><ChevronLeft size={20} /></ActionButton><p className="whitespace-nowrap text-lg text-muted-foreground">Asignaciones · {MONTHS[data.periodo.mes - 1]} {data.periodo.anio}</p><ActionButton aria-label="Mes siguiente" onClick={() => movePeriod(1)} disabled={isCurrentPeriod} className="h-9 w-9 bg-primary p-0 text-primary-foreground hover:bg-primary/90"><ChevronRight size={20} /></ActionButton></div><div /></header><div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 overflow-hidden"><RankingChart title="Operaciones por vendedor" items={data.vendedores} colorIndex={0} vertical objective={data.objetivoVendedores} usadosItems={data.usadosPorVendedor} creditosItems={data.creditosPorVendedor} /><div className="grid min-h-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.7fr)] gap-4 overflow-hidden"><OperationsCounter title="Cantidad de operaciones" total={data.totalOperaciones} totalOperaciones={data.totalOperacionesTodasSucursales} modelos={data.modelos} /><RankingChart title="Operaciones por modelo" items={data.modelos} colorIndex={1} modelImages={data.imagenesModelos} /><OperationsGauge title="Cantidad de operaciones totales" total={data.totalOperacionesTodasSucursales} colorIndex={2} objective={data.objetivoOperacionesTotales} /></div></div></main>;
}
