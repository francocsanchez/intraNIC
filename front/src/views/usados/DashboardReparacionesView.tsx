import { getPresupuestosUsados, type PresupuestoUsados } from "@/api/usados/talleresAPI";
import EChart from "@/components/charts/EChart";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { CheckCircle2, ClipboardList, Search, Timer, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat("es-AR", { month: "short" }).format(new Date(2026, index, 1)));

type Stage = "analisis" | "esperandoIngreso" | "enReparacion" | "reparado";
type MonthRow = Record<Stage, number> & { month: number };

function stageOf(item: PresupuestoUsados): Stage | null {
  if (item.estado === "Pendiente") return "analisis";
  if (item.estado !== "Aprobado") return null;
  if (!item.fechaIngresoTaller) return "esperandoIngreso";
  return item.fechaEgresoTaller ? "reparado" : "enReparacion";
}

function budgetDate(item: PresupuestoUsados) {
  return new Date(item.fechaPedido);
}

function unitKey(item: PresupuestoUsados) {
  const identifier = item.esExterno ? item.dominio : item.interno;
  return `${item.esExterno ? "externo" : "interno"}:${identifier.trim().toLocaleUpperCase()}`;
}

function Metric({ label, value, icon: Icon, tone = "text-foreground" }: { label: string; value: number; icon: typeof ClipboardList; tone?: string }) {
  return <div className="rounded-lg border border-border bg-card p-3"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon size={18} className={tone} /></div><p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p></div>;
}

export default function DashboardReparacionesView() {
  const budgets = useQuery({ queryKey: ["talleres-usados", "presupuestos", "dashboard-reparaciones"], queryFn: () => getPresupuestosUsados() });
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const items = useMemo(() => budgets.data?.data ?? [], [budgets.data?.data]);
  const years = useMemo(() => Array.from(new Set(items.map((item) => budgetDate(item).getUTCFullYear()))).sort((a, b) => b - a), [items]);
  const year = selectedYear && years.includes(selectedYear) ? selectedYear : (years[0] ?? new Date().getFullYear());

  const data = useMemo(() => {
    const identified = items.filter((item) => (item.esExterno ? item.dominio : item.interno).trim());
    const latestByUnit = new Map<string, PresupuestoUsados>();
    for (const item of identified) {
      const key = unitKey(item);
      const previous = latestByUnit.get(key);
      if (!previous || budgetDate(item).getTime() >= budgetDate(previous).getTime()) latestByUnit.set(key, item);
    }
    const rows: MonthRow[] = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, analisis: 0, esperandoIngreso: 0, enReparacion: 0, reparado: 0 }));
    for (const item of latestByUnit.values()) {
      const stage = stageOf(item); const date = budgetDate(item);
      if (stage && date.getUTCFullYear() === year) rows[date.getUTCMonth()][stage] += 1;
    }
    const annual = identified.filter((item) => item.estado === "Aprobado" && budgetDate(item).getUTCFullYear() === year);
    const workshops = Array.from(new Set(annual.map((item) => item.tallerNombre || "Sin taller"))).sort((a, b) => a.localeCompare(b, "es"));
    const workshopRows = workshops.map((name) => ({ name, values: rows.map((_, index) => annual.filter((item) => (item.tallerNombre || "Sin taller") === name && budgetDate(item).getUTCMonth() === index).length) }));
    const workshopSpendingRows = workshops.map((name) => ({ name, values: rows.map((_, index) => annual.filter((item) => (item.tallerNombre || "Sin taller") === name && budgetDate(item).getUTCMonth() === index).reduce((total, item) => total + item.costoConIva, 0)) }));
    const workshopSpendingTotal = rows.map((_, index) => workshopSpendingRows.reduce((total, row) => total + row.values[index], 0));
    const active = rows.reduce((total, row) => ({ analisis: total.analisis + row.analisis, esperandoIngreso: total.esperandoIngreso + row.esperandoIngreso, enReparacion: total.enReparacion + row.enReparacion, reparado: total.reparado + row.reparado }), { analisis: 0, esperandoIngreso: 0, enReparacion: 0, reparado: 0 });
    const workshopSlice = annual.filter((item) => selectedMonth === "all" || String(budgetDate(item).getUTCMonth() + 1) === selectedMonth);
    const workshopDistribution = workshops.map((name) => ({ name, value: workshopSlice.filter((item) => (item.tallerNombre || "Sin taller") === name).length })).filter((item) => item.value > 0);
    return { rows, workshopRows, workshopSpendingRows, workshopSpendingTotal, active, workshopDistribution, annual };
  }, [items, selectedMonth, year]);

  const operationOption = useMemo<EChartsCoreOption>(() => ({ color: ["#fbbf24", "#ef4444", "#86efac"], tooltip: { trigger: "item" }, legend: { bottom: 0 }, series: [{ type: "pie", radius: ["38%", "70%"], center: ["50%", "43%"], label: { formatter: "{b}: {c}" }, data: [{ name: "En análisis", value: data.active.analisis }, { name: "Esperando ingreso", value: data.active.esperandoIngreso }, { name: "En reparación", value: data.active.enReparacion }].filter((item) => item.value > 0).concat(data.active.analisis + data.active.esperandoIngreso + data.active.enReparacion ? [] : [{ name: "Sin unidades activas", value: 1 }]) }] }), [data.active]);
  const workshopsOption = useMemo<EChartsCoreOption>(() => ({ color: ["#171717", "#525252", "#737373", "#a3a3a3", "#d4d4d4"], tooltip: { trigger: "axis", axisPointer: { type: "shadow" } }, legend: { bottom: 0 }, grid: { top: 16, left: 36, right: 16, bottom: 64, containLabel: true }, xAxis: { type: "category", data: months, axisTick: { show: false } }, yAxis: { type: "value", minInterval: 1 }, series: data.workshopRows.map((item) => ({ name: item.name, type: "bar", stack: "talleres", barMaxWidth: 28, data: item.values })) }), [data.workshopRows]);
  const distributionOption = useMemo<EChartsCoreOption>(() => ({ color: ["#171717", "#525252", "#737373", "#a3a3a3", "#d4d4d4"], tooltip: { trigger: "item" }, legend: { bottom: 0 }, series: [{ type: "pie", radius: "68%", center: ["50%", "43%"], label: { formatter: "{b}: {c}" }, data: data.workshopDistribution.length ? data.workshopDistribution : [{ name: "Sin datos", value: 1, itemStyle: { color: "#d4d4d4" } }] }] }), [data.workshopDistribution]);
  const total = items.length;
  const pending = items.filter((item) => item.estado === "Pendiente").length;
  const approved = items.filter((item) => item.estado === "Aprobado").length;
  const review = items.filter((item) => item.estado === "Revisar").length;
  const rejected = items.filter((item) => item.estado === "Rechazado").length;

  return <div className="space-y-4 bg-muted p-3 font-preset">
    <section className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-border bg-card p-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Gestión de stock usados</p><h1 className="text-xl font-semibold">Dashboard Reparaciones</h1><p className="mt-1 text-sm text-muted-foreground">Seguimiento de presupuestos, talleres y unidades en operatoria.</p></div><label className="text-sm font-medium">Año<select value={year} onChange={(event) => setSelectedYear(Number(event.target.value))} className="ml-2 h-9 rounded-md border border-input bg-background px-2 text-sm">{years.length ? years.map((value) => <option key={value} value={value}>{value}</option>) : <option value={year}>{year}</option>}</select></label></section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Total" value={total} icon={ClipboardList} /><Metric label="Pendiente" value={pending} icon={Search} tone="text-amber-700" /><Metric label="Aprobado" value={approved} icon={CheckCircle2} tone="text-emerald-700" /><Metric label="Revisar" value={review} icon={Timer} tone="text-slate-700" /><Metric label="Rechazado" value={rejected} icon={Wrench} tone="text-red-700" /></section>
    {budgets.isLoading ? <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">Cargando dashboard...</div> : null}
    {budgets.isError ? <div className="rounded-lg border border-destructive/40 bg-card p-8 text-center text-sm text-destructive">No se pudieron cargar los presupuestos para el dashboard.</div> : null}
    <section className="grid gap-4 xl:grid-cols-3"><article className="rounded-lg border border-border bg-card xl:col-span-2"><header className="border-b p-3"><h2 className="font-semibold">Unidades con presupuesto</h2><p className="text-sm text-muted-foreground">Unidades únicas por fecha de carga y etapa operativa.</p></header><div className="p-2"><table className="w-full table-fixed text-center text-xs"><thead className="bg-muted text-[10px] uppercase text-muted-foreground"><tr>{["Mes", "Anál.", "Espera", "Repar.", "Listo", "Total"].map((label) => <th key={label} className="px-1 py-1.5">{label}</th>)}</tr></thead><tbody>{data.rows.map((row) => { const totalRow = row.analisis + row.esperandoIngreso + row.enReparacion + row.reparado; return <tr key={row.month} className="border-t"><td className="px-1 py-1.5 font-medium capitalize">{months[row.month - 1]}</td><td className="px-1 py-1.5 text-amber-700">{row.analisis || "-"}</td><td className="px-1 py-1.5 text-red-700">{row.esperandoIngreso || "-"}</td><td className="px-1 py-1.5 text-emerald-700">{row.enReparacion || "-"}</td><td className="px-1 py-1.5 font-semibold text-emerald-800">{row.reparado || "-"}</td><td className="px-1 py-1.5 font-semibold">{totalRow || "-"}</td></tr>; })}</tbody></table></div></article><article className="rounded-lg border border-border bg-card"><header className="border-b p-3"><h2 className="font-semibold">Unidades en operatoria</h2><p className="text-sm text-muted-foreground">Distribución de unidades activas. Excluye las reparadas.</p></header><EChart className="h-80" option={operationOption} /></article></section>
    <section className="grid gap-4 xl:grid-cols-3"><article className="rounded-lg border border-border bg-card xl:col-span-2"><header className="border-b p-3"><h2 className="font-semibold">Aprobados anualizados por taller</h2><p className="text-sm text-muted-foreground">Cantidad mensual de presupuestos aprobados por taller.</p></header><EChart className="h-96" option={workshopsOption} /></article><article className="rounded-lg border border-border bg-card"><header className="flex items-start justify-between gap-2 border-b p-3"><div><h2 className="font-semibold">Presupuestos por taller</h2><p className="text-sm text-muted-foreground">Participación del período seleccionado.</p></div><select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs"><option value="all">Todos</option>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></header><EChart className="h-96" option={distributionOption} /></article></section>
    <section><article className="rounded-lg border border-border bg-card"><header className="border-b p-3"><h2 className="font-semibold">Gasto mensual por taller</h2><p className="text-sm text-muted-foreground">Importe con IVA de los presupuestos aprobados, agrupado por mes de pedido.</p></header><div className="p-1"><table className="w-full table-fixed text-center text-[10px]"><thead className="bg-muted text-[9px] uppercase text-muted-foreground"><tr><th className="w-[12%] px-1 py-1.5">Taller</th>{months.map((month) => <th key={month} className="px-0.5 py-1.5 font-medium capitalize">{month}</th>)}</tr></thead><tbody>{data.workshopSpendingRows.length ? <><tr className="border-t bg-muted/50 font-semibold"><th className="px-1 py-1.5">Total</th>{data.workshopSpendingTotal.map((value, index) => <td key={index} className="break-words px-0.5 py-1.5 tabular-nums">{value ? money.format(value) : "-"}</td>)}</tr>{data.workshopSpendingRows.map((row) => <tr key={row.name} className="border-t"><th className="break-words px-1 py-1.5 font-medium">{row.name}</th>{row.values.map((value, index) => <td key={`${row.name}-${index}`} className="break-words px-0.5 py-1.5 tabular-nums">{value ? money.format(value) : "-"}</td>)}</tr>)}</> : <tr><td colSpan={13} className="px-3 py-8 text-center text-muted-foreground">No hay gastos aprobados para el año seleccionado.</td></tr>}</tbody></table></div></article></section>
    <p className="text-right text-xs text-muted-foreground">Aprobados del año: {data.annual.length} · Importe aprobado: {money.format(data.annual.reduce((totalAmount, item) => totalAmount + item.costoConIva, 0))}</p>
  </div>;
}
