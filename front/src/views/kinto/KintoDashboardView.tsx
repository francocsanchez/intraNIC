import { getKintoDashboard, type KintoDashboardFilters } from "@/api/kintoDashboardAPI";
import EChart from "@/components/charts/EChart";
import Loading from "@/components/Loading";
import { ActionButton } from "@/components/ui/action-button";
import type { KintoDashboardResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { BarChart3, CircleAlert, Flame, Gauge, ReceiptText, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { useMemo, useState } from "react";

const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const fineLabels = { PEND_COBRAR: "Pend. cobrar", PEND_FACTURAR: "Pend. facturar", PEND_PAGAR: "Pend. pagar", PAGADO: "Pagadas" } as const;
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("es-AR");

function Metric({ label, value, icon: Icon, detail }: { label: string; value: string; icon: typeof BarChart3; detail?: string }) {
  return <article className="min-w-0 border-r border-border p-2 last:border-r-0"><div className="flex items-center gap-2 text-muted-foreground"><Icon size={15} /><span className="truncate text-[11px] font-medium uppercase tracking-[.08em]">{label}</span></div><p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>{detail ? <p className="truncate text-[11px] text-muted-foreground">{detail}</p> : null}</article>;
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-lg border border-border bg-card"><h2 className="border-b border-border px-3 py-2 text-sm font-semibold">{title}</h2><div className="h-72 p-2">{children}</div></section>;
}

export default function KintoDashboardView() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<KintoDashboardFilters>({ anio: currentYear });
  const query = useQuery<KintoDashboardResponse>({ queryKey: ["kinto", "dashboard", filters], queryFn: () => getKintoDashboard(filters) });
  const data = query.data;
  const set = <K extends keyof KintoDashboardFilters>(key: K, value: KintoDashboardFilters[K] | undefined) => setFilters((current) => ({ ...current, [key]: value || undefined }));
  const reset = () => setFilters({ anio: currentYear });

  const expenseOption = useMemo<EChartsCoreOption>(() => ({
    color: ["var(--chart-1)", "var(--chart-2)"], tooltip: { trigger: "axis", valueFormatter: (value: number | string) => money.format(Number(value)) }, legend: { bottom: 0 }, grid: { left: 42, right: 12, top: 18, bottom: 38 },
    xAxis: { type: "category", data: data?.gastos.mensual.map((item) => months[item.month - 1]) ?? [] }, yAxis: { type: "value", axisLabel: { formatter: (value: number | string) => money.format(Number(value)) } },
    series: [{ name: "Carga Matafuegos", type: "bar", stack: "gastos", data: data?.gastos.mensual.map((item) => item.matafuegos) ?? [] }, { name: "Multas", type: "bar", stack: "gastos", data: data?.gastos.mensual.map((item) => item.multas) ?? [] }],
  }), [data]);
  const geotabOption = useMemo<EChartsCoreOption>(() => ({
    color: ["var(--chart-1)", "var(--chart-3)"], tooltip: { trigger: "item", valueFormatter: (value: number | string) => integer.format(Number(value)) }, legend: { bottom: 0 },
    series: [{ type: "pie", radius: ["48%", "72%"], label: { formatter: "{b}\n{c}" }, data: [{ name: "Reportando", value: data?.estadoActual.reportando ?? 0 }, { name: "Sin conexión", value: data?.estadoActual.sinConexion ?? 0 }] }],
  }), [data]);
  const fineOption = useMemo<EChartsCoreOption>(() => ({
    color: ["var(--chart-3)"], tooltip: { trigger: "axis", valueFormatter: (value: number | string) => money.format(Number(value)) }, grid: { left: 48, right: 12, top: 18, bottom: 54 },
    xAxis: { type: "category", axisLabel: { interval: 0, rotate: 25 }, data: data?.multas.estados.map((item) => fineLabels[item.status]) ?? [] }, yAxis: { type: "value", axisLabel: { formatter: (value: number | string) => money.format(Number(value)) } },
    series: [{ name: "Importe", type: "bar", data: data?.multas.estados.map((item) => item.amount) ?? [] }],
  }), [data]);
  const branchOption = useMemo<EChartsCoreOption>(() => ({
    color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"], tooltip: { trigger: "axis" }, legend: { bottom: 0 }, grid: { left: 42, right: 12, top: 18, bottom: 38 },
    xAxis: { type: "category", data: data?.sucursales.map((item) => item.sucursal) ?? [] }, yAxis: { type: "value" },
    series: [{ name: "Activas", type: "bar", data: data?.sucursales.map((item) => item.activeUnits) ?? [] }, { name: "Reportando", type: "bar", data: data?.sucursales.map((item) => item.reporting) ?? [] }, { name: "Matafuegos críticos", type: "bar", data: data?.sucursales.map((item) => item.matafuegosCriticos) ?? [] }],
  }), [data]);

  if (query.isLoading) return <Loading />;
  if (query.isError || !data) return <div className="font-preset bg-muted p-4"><section className="rounded-lg border border-destructive/30 bg-card p-3 text-sm text-destructive">{query.error instanceof Error ? query.error.message : "No se pudo cargar el dashboard de Kinto."}</section></div>;
  const activeFilters = Boolean(filters.mes || filters.sucursal || filters.categoria || filters.estadoMulta || filters.anio !== currentYear);

  return <div className="font-preset space-y-3 bg-muted p-3">
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Kinto</p><h1 className="mt-1 text-xl font-semibold tracking-tight">Dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Flota actual y evolución operativa de gastos, multas y seguridad.</p></div>
        <div className="grid grid-cols-2 gap-1 md:grid-cols-5"><select value={filters.anio} onChange={(e) => set("anio", Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-xs"><option value={currentYear}>Año {currentYear}</option>{data.filtros.anios.filter((year) => year !== currentYear).map((year) => <option key={year} value={year}>{year}</option>)}</select><select value={filters.mes ?? ""} onChange={(e) => set("mes", e.target.value ? Number(e.target.value) : undefined)} className="h-9 rounded-md border border-input bg-background px-2 text-xs"><option value="">Todos los meses</option>{months.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select><select value={filters.sucursal ?? ""} onChange={(e) => set("sucursal", e.target.value || undefined)} className="h-9 rounded-md border border-input bg-background px-2 text-xs"><option value="">Todas las sucursales</option>{data.filtros.sucursales.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select><select value={filters.categoria ?? ""} onChange={(e) => set("categoria", e.target.value as KintoDashboardFilters["categoria"])} className="h-9 rounded-md border border-input bg-background px-2 text-xs"><option value="">Todos los gastos</option><option value="MATAFUEGOS">Matafuegos</option><option value="MULTAS">Multas</option></select><select value={filters.estadoMulta ?? ""} onChange={(e) => set("estadoMulta", e.target.value as KintoDashboardFilters["estadoMulta"])} className="h-9 rounded-md border border-input bg-background px-2 text-xs"><option value="">Todos los estados</option>{Object.entries(fineLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      </div>{activeFilters ? <div className="mt-3 flex justify-end"><ActionButton variant="outline" onClick={reset}><RotateCcw />Limpiar filtros</ActionButton></div> : null}
      <div className="mt-3 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-md border border-border md:grid-cols-4 xl:grid-cols-8"><Metric label="Unidades activas" value={integer.format(data.estadoActual.unidadesActivas)} icon={Gauge} detail={`${data.estadoActual.unidadesInactivas} inactivas`} /><Metric label="Reportando" value={integer.format(data.estadoActual.reportando)} icon={Wifi} detail={`${data.estadoActual.tasaConexion}% conectadas`} /><Metric label="Sin conexión" value={integer.format(data.estadoActual.sinConexion)} icon={WifiOff} /><Metric label="Gasto período" value={money.format(data.gastos.total)} icon={BarChart3} /><Metric label="Promedio/unidad" value={money.format(data.gastos.promedioPorUnidad)} icon={ReceiptText} /><Metric label="Matafuegos vencidos" value={integer.format(data.estadoActual.matafuegos.vencidos)} icon={Flame} detail={`${data.estadoActual.matafuegos.proximos} próximos`} /><Metric label="Sin recarga" value={integer.format(data.estadoActual.matafuegos.sinRecarga)} icon={CircleAlert} /><Metric label="Multas pendientes" value={money.format(data.multas.pendientesMonto)} icon={ReceiptText} detail={`${data.multas.pendientesCantidad} cargos`} /></div>
    </section>
    <div className="grid gap-3 xl:grid-cols-2"><ChartPanel title="Gastos por mes"><EChart option={expenseOption} onChartClick={({ seriesName }) => set("categoria", seriesName === "Carga Matafuegos" ? "MATAFUEGOS" : seriesName === "Multas" ? "MULTAS" : undefined)} /></ChartPanel><ChartPanel title="Estado actual de Geotab"><EChart option={geotabOption} /></ChartPanel><ChartPanel title="Importe por estado de multa"><EChart option={fineOption} onChartClick={({ name }) => { const found = Object.entries(fineLabels).find(([, label]) => label === name); set("estadoMulta", found?.[0] as KintoDashboardFilters["estadoMulta"]); }} /></ChartPanel><ChartPanel title="Flota y seguridad por sucursal"><EChart option={branchOption} onChartClick={({ name }) => set("sucursal", name)} /></ChartPanel></div>
    <div className="grid gap-3 xl:grid-cols-2"><section className="overflow-hidden rounded-lg border border-border bg-card"><h2 className="border-b border-border px-3 py-2 text-sm font-semibold">Resumen mensual</h2><div className="overflow-auto"><table className="w-full text-xs"><thead className="bg-muted text-left text-muted-foreground"><tr><th className="px-3 py-2">Mes</th><th className="px-3 py-2 text-right">Matafuegos</th><th className="px-3 py-2 text-right">Multas</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody>{data.gastos.mensual.map((item) => <tr key={item.month} className="border-t border-border"><td className="px-3 py-1.5">{months[item.month - 1]}</td><td className="px-3 py-1.5 text-right">{money.format(item.matafuegos)}</td><td className="px-3 py-1.5 text-right">{money.format(item.multas)}</td><td className="px-3 py-1.5 text-right font-medium">{money.format(item.total)}</td></tr>)}</tbody></table></div></section><section className="overflow-hidden rounded-lg border border-border bg-card"><h2 className="border-b border-border px-3 py-2 text-sm font-semibold">Análisis por sucursal</h2><div className="overflow-auto"><table className="w-full text-xs"><thead className="bg-muted text-left text-muted-foreground"><tr><th className="px-3 py-2">Sucursal</th><th className="px-3 py-2 text-right">Act.</th><th className="px-3 py-2 text-right">Rep.</th><th className="px-3 py-2 text-right">Crít.</th><th className="px-3 py-2 text-right">Gasto</th><th className="px-3 py-2 text-right">Pendiente</th></tr></thead><tbody>{data.sucursales.map((item) => <tr key={item.sucursal} className="cursor-pointer border-t border-border hover:bg-muted" onClick={() => set("sucursal", item.sucursal)}><td className="px-3 py-1.5 font-medium">{item.sucursal}</td><td className="px-3 py-1.5 text-right">{item.activeUnits}</td><td className="px-3 py-1.5 text-right">{item.reporting}</td><td className="px-3 py-1.5 text-right">{item.matafuegosCriticos}</td><td className="px-3 py-1.5 text-right">{money.format(item.matafuegosAmount + item.multasAmount)}</td><td className="px-3 py-1.5 text-right">{money.format(item.montoPendiente)}</td></tr>)}</tbody></table></div></section></div>
  </div>;
}
