import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { ActionButton } from "@/components/ui/action-button";
import { getDashboardSalon } from "@/services/operacionesService";
import type { DashboardSalonResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { CarFront, ChevronLeft, ChevronRight, CreditCard, Star } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

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
  dashboardHeader?: ReactNode;
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

function RankingChart({ title, items, colorIndex, vertical = false, objective, usadosItems = [], creditosItems = [], modelImages = [], dashboardHeader }: SellerRankingProps) {
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
      grid: { top: vertical ? dashboardHeader ? 82 : 46 : 20, right: 12, bottom: vertical ? 26 : 24, left: vertical ? 76 : 12, containLabel: !vertical },
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
      }), barMaxWidth: vertical ? 52 : 42, itemStyle: { color, borderRadius: vertical ? [4, 4, 0, 0] : [0, 4, 4, 0] }, label: { show: true, position: vertical ? "top" : "right", color: "var(--foreground)", fontSize: 13 }, ...(vertical && objective ? { markLine: { silent: true, symbol: "none", lineStyle: { color: "#fca5a5", type: "dashed", width: 2 }, label: { show: true, formatter: `Target ${objective}`, color: "#b91c1c", position: "insideEndTop" }, data: [{ yAxis: objective }] } } : {}) }],
    };
  }, [colorIndex, dashboardHeader, items, modelImages, objective, vertical]);

  if (vertical) {
    return <section className="relative flex min-h-0 flex-col overflow-hidden rounded-md border border-border bg-card">{dashboardHeader ? <div className="absolute inset-x-4 top-2 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2">{dashboardHeader}</div> : null}<h2 className={`pointer-events-none absolute left-4 z-10 text-xl font-semibold text-foreground ${dashboardHeader ? "top-14" : "top-3"}`}>{title}</h2><div className="pointer-events-none absolute right-4 top-3 z-10 flex items-center gap-4 text-sm font-semibold text-muted-foreground"><span className="flex items-center gap-1" title="Usados"><CarFront size={16} strokeWidth={1.8} /><span>{totalUsados}</span></span><span className="flex items-center gap-1" title="Créditos"><CreditCard size={16} strokeWidth={1.8} /><span>{totalCreditos}</span></span></div>{items.length ? <><div className="min-h-0 flex-1"><EChart option={option} /></div><SellerFinancingTable items={items} usadosItems={usadosItems} creditosItems={creditosItems} /></> : <p className="flex h-full items-center justify-center text-lg text-muted-foreground">Sin operaciones asignadas.</p>}</section>;
  }

  return <section className="flex min-h-0 flex-col rounded-md border border-border bg-card p-4"><h2 className="mb-2 text-xl font-semibold text-foreground">{title}</h2>{items.length ? <div className="min-h-0 flex-1"><EChart option={option} /></div> : <p className="flex flex-1 items-center justify-center text-lg text-muted-foreground">Sin operaciones asignadas.</p>}</section>;
}

function OperationsGauge({ title, total, objective }: { title: string; total: number; objective?: number | null }) {
  const target = objective && objective > 0 ? objective : null;
  const restantes = target === null ? null : Math.max(target - total, 0);
  const porcentajeRestante = target === null || restantes === null ? null : (restantes / target) * 100;
  const porcentajeCumplimiento = target === null ? null : Math.round((total / target) * 100);
  const estadoTarget = porcentajeRestante === null ? null : porcentajeRestante < 10 ? "cerca" : porcentajeRestante <= 60 ? "en-riesgo" : "lejos";
  const targetCumplido = target !== null && total >= target;
  const colorTarget = estadoTarget === "cerca" ? { bar: "#22c55e", background: "#dcfce7", text: "text-emerald-600" } : estadoTarget === "en-riesgo" ? { bar: "#eab308", background: "#fef9c3", text: "text-yellow-600" } : { bar: "#ef4444", background: "#fee2e2", text: "text-red-600" };
  const option = useMemo<EChartsCoreOption>(() => {
    return {
      grid: { top: 56, right: 30, bottom: 24, left: 30 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: () => `Target: ${target ?? 0}<br/>Ventas: ${total}<br/>Restantes: ${restantes ?? 0}` },
      xAxis: { type: "category", data: ["Ventas restantes"], axisTick: { show: false }, axisLine: { show: false }, axisLabel: { show: false } },
      yAxis: { type: "value", min: 0, max: target ?? 1, show: false },
      series: [{ type: "bar", data: [restantes ?? 0], barWidth: "52%", showBackground: true, backgroundStyle: { color: colorTarget.background, borderRadius: [10, 10, 0, 0] }, itemStyle: { color: colorTarget.bar, borderRadius: [10, 10, 0, 0] }, label: { show: false } }],
    };
  }, [colorTarget.background, colorTarget.bar, restantes, target, total]);

  return <section className="relative min-h-0 overflow-hidden rounded-md border border-border bg-card"><h2 className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-xl font-semibold text-foreground">{title}</h2>{target === null ? <div className="flex h-full flex-col items-center justify-center"><p className="text-6xl font-bold text-foreground">{total}</p><p className="mt-2 text-sm text-muted-foreground">Sin Target configurado</p></div> : <><div className="h-full w-full"><EChart option={option} enableHoverEmphasis={false} /></div><div className="pointer-events-none absolute inset-x-0 top-[42%] z-10 -translate-y-1/2 text-center"><p className={`text-7xl font-bold leading-none ${colorTarget.text}`}>{restantes}</p><p className="mt-2 text-base font-semibold text-muted-foreground">{targetCumplido ? "Target cumplido" : "Ventas restantes"}</p><p className={`mt-1 text-lg font-bold ${colorTarget.text}`}>{porcentajeCumplimiento}% de cumplimiento</p></div><div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 text-center"><p className="text-sm font-semibold text-foreground">{total} ventas · Target {target}</p></div></>}</section>;
}

function OperationsCounter({ title, total, modelos, totalOperaciones: _totalOperaciones }: { title: string; total: number; totalOperaciones: number; modelos: DashboardSalonResponse["modelos"] }) {
  void _totalOperaciones;
  const option = useMemo<EChartsCoreOption>(() => ({
    color: MODEL_ROSE_COLORS,
    tooltip: { trigger: "item", formatter: (params: unknown) => { const item = params as { name?: string; value?: number; percent?: number }; return `${item.name ?? ""}: ${item.value ?? 0} - ${Math.round(item.percent ?? 0)}%`; } },
    series: [{ type: "pie", roseType: "radius", radius: ["27%", "65%"], center: ["50%", "56%"], avoidLabelOverlap: true, itemStyle: { borderRadius: 7, borderColor: "var(--card)", borderWidth: 3 }, label: { show: true, fontSize: 10, color: "var(--foreground)", formatter: (params: unknown) => { const item = params as { name?: string; value?: number; percent?: number }; return `${item.name ?? ""}: ${item.value ?? 0} - ${Math.round(item.percent ?? 0)}%`; } }, labelLine: { show: true, length: 8, length2: 8 }, data: modelos.map((item) => ({ name: item.nombre, value: item.total })) }],
  }), [modelos]);
  return <section className="relative min-h-0 overflow-hidden rounded-md border border-border bg-card"><h2 className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-xl font-semibold text-foreground">{title}</h2>{modelos.length ? <><div className="h-full w-full"><EChart option={option} enableHoverEmphasis={false} /></div><div className="pointer-events-none absolute left-1/2 top-[56%] z-20 -translate-x-1/2 -translate-y-1/2"><span className="text-5xl font-bold leading-none text-foreground">{total}</span></div></> : <div className="flex h-full items-center justify-center"><p className="text-7xl font-bold leading-none text-foreground">{total}</p></div>}</section>;
}

function DailyOperationsTable({ items, anio, mes }: { items: DashboardSalonResponse["operacionesPorDia"]; anio: number; mes: number }) {
  const diasHabiles = items.filter((item) => {
    const diaSemana = new Date(Date.UTC(anio, mes - 1, item.dia)).getUTCDay();
    return diaSemana !== 0 && diaSemana !== 6;
  });
  return <section className="h-[74px] shrink-0 overflow-hidden rounded-md border border-border bg-card"><div className="flex h-6 items-center justify-between border-b border-border px-3"><h2 className="text-sm font-semibold text-foreground">Operaciones por día</h2><span className="text-xs text-muted-foreground">Asignaciones de la sucursal</span></div><div className="flex h-[47px] text-center text-[10px] leading-5"><div className="grid w-[76px] shrink-0 grid-rows-2 border-r border-border font-medium text-muted-foreground"><span className="border-b border-border">Día</span><span>Operaciones</span></div><div className="grid min-w-0 flex-1 grid-flow-col grid-rows-2" style={{ gridTemplateColumns: `repeat(${diasHabiles.length}, minmax(0, 1fr))` }}>{diasHabiles.flatMap((item) => [<span key={`dia-${item.dia}`} className="border-b border-r border-border text-muted-foreground">{item.dia}</span>, <span key={`total-${item.dia}`} className="border-r border-border font-semibold text-foreground">{item.total || "-"}</span>])}</div></div></section>;
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
  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-muted p-4 font-preset">
    <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_74px_minmax(0,1fr)] gap-4 overflow-hidden">
      <RankingChart title="Operaciones por vendedor" items={data.vendedores} colorIndex={0} vertical objective={data.objetivoVendedores} usadosItems={data.usadosPorVendedor} creditosItems={data.creditosPorVendedor} dashboardHeader={<><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Dashboard Salón</p><h1 className="text-2xl font-bold leading-tight text-foreground">{data.sucursal}</h1></div><div className="flex items-center gap-2"><ActionButton aria-label="Mes anterior" onClick={() => movePeriod(-1)} className="h-8 w-8 bg-primary p-0 text-primary-foreground hover:bg-primary/90"><ChevronLeft size={18} /></ActionButton><p className="whitespace-nowrap text-base text-muted-foreground">Asignaciones · {MONTHS[data.periodo.mes - 1]} {data.periodo.anio}</p><ActionButton aria-label="Mes siguiente" onClick={() => movePeriod(1)} disabled={isCurrentPeriod} className="h-8 w-8 bg-primary p-0 text-primary-foreground hover:bg-primary/90"><ChevronRight size={18} /></ActionButton></div><div /></>} />
      <DailyOperationsTable items={data.operacionesPorDia} anio={data.periodo.anio} mes={data.periodo.mes} />
      <div className="grid min-h-0 grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.7fr)] gap-4 overflow-hidden"><OperationsCounter title={data.sucursal} total={data.totalOperaciones} totalOperaciones={data.totalOperacionesTodasSucursales} modelos={data.modelos} /><RankingChart title="Operaciones por modelo" items={data.modelos} colorIndex={1} modelImages={data.imagenesModelos} /><OperationsGauge title="Ventas NIC Totales" total={data.totalOperacionesTodasSucursales} objective={data.objetivoOperacionesTotales} /></div>
    </div>
  </main>;
}
