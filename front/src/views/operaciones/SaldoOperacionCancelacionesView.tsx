import Loading from "@/components/Loading";
import EChart from "@/components/charts/EChart";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";
import { getSaldoOperacionCancelacionAnalysis } from "@/services/operacionesService";
import type { SaldoOperacionCancelacionAnalysisNode } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ALL_MONTHS = "__TODOS__";
const ALL_YEARS = "__TODOS__";
const formatDays = (value: number) => `${Math.round(value)} día${Math.round(value) === 1 ? "" : "s"}`;
const formatDecimalDays = (value: number) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, monthNumber - 1, 1)))
    .replace(".", "");
};

// Tonos suaves locales solicitados para los tiempos de cancelación.
const toneForAverage = (averageDays: number) => averageDays < 15
  ? { fill: "#dcfce7", stroke: "#4ade80", text: "#166534" }
  : averageDays < 18
    ? { fill: "#fef9c3", stroke: "#facc15", text: "#854d0e" }
    : { fill: "#fee2e2", stroke: "#f87171", text: "#991b1b" };

const wrapNodeName = (name: string) => name.split(" ").reduce<string[]>((lines, word) => {
  const currentLine = lines.at(-1) ?? "";
  if (!currentLine) lines.push(word);
  else if (`${currentLine} ${word}`.length <= 18) lines[lines.length - 1] = `${currentLine} ${word}`;
  else lines.push(word);
  return lines;
}, []).join("\n");

const toChartNode = (node: SaldoOperacionCancelacionAnalysisNode): Record<string, unknown> => {
  const tone = toneForAverage(node.averageDays);
  return {
    ...node,
    itemStyle: { color: tone.fill, borderColor: tone.stroke, borderWidth: 1.5, shadowBlur: 5, shadowColor: "rgba(24, 24, 27, 0.08)" },
    label: {
      formatter: `${wrapNodeName(node.name)}\n{days|${formatDays(node.averageDays)}}`,
      color: "#18181b",
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 16,
      rich: { days: { color: tone.text, fontSize: 10, fontWeight: 400, lineHeight: 14 } },
    },
    children: node.children?.map(toChartNode),
  };
};

const countLeafNodes = (node: SaldoOperacionCancelacionAnalysisNode): number => {
  if (!node.children?.length) return 1;
  return node.children.reduce((total, child) => total + countLeafNodes(child), 0);
};

export default function SaldoOperacionCancelacionesView() {
  const navigate = useNavigate();
  const [year, setYear] = useState(ALL_YEARS);
  const [month, setMonth] = useState(ALL_MONTHS);
  const mesAsignacion = month === ALL_MONTHS ? undefined : month;
  const anioAsignacion = year === ALL_YEARS ? undefined : year;
  const analysis = useQuery({
    queryKey: ["saldo-operacion-cancelacion-analysis", anioAsignacion, mesAsignacion],
    queryFn: ({ signal }) => getSaldoOperacionCancelacionAnalysis({ anioAsignacion, mesAsignacion }, signal),
    staleTime: 30_000,
  });
  const option = useMemo<EChartsCoreOption | null>(() => {
    if (!analysis.data?.data.operations) return null;
    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "#18181b",
        borderWidth: 0,
        textStyle: { color: "#fafafa" },
        formatter: (params: { data: SaldoOperacionCancelacionAnalysisNode }) => `<b>${params.data.name}</b><br/>Promedio: ${formatDecimalDays(params.data.averageDays)} días<br/>Cancelaciones: ${params.data.operations}`,
      },
      series: [{
        type: "tree",
        data: [toChartNode(analysis.data.data.tree)],
        orient: "RL",
        top: "4%",
        bottom: "4%",
        left: "16%",
        right: "16%",
        symbol: "circle",
        symbolSize: 14,
        initialTreeDepth: -1,
        edgeShape: "polyline",
        roam: false,
        lineStyle: { color: "#cbd5e1", width: 1.4 },
        label: { position: "left", align: "right", verticalAlign: "middle" },
        leaves: { label: { position: "left", align: "right", verticalAlign: "middle" } },
      }],
    } as EChartsCoreOption;
  }, [analysis.data]);

  if (analysis.isLoading) return <Loading />;
  if (analysis.isError) return <div className="p-4 text-destructive">{analysis.error.message}</div>;
  const data = analysis.data?.data;
  const months = data?.months ?? [];
  const years = [...new Set(months.map((item) => item.month.slice(0, 4)))].sort((left, right) => right.localeCompare(left));
  const monthsForYear = anioAsignacion ? months.filter((item) => item.month.startsWith(`${anioAsignacion}-`)) : months;
  const treeHeight = data ? Math.max(480, countLeafNodes(data.tree) * 64 + 120) : 480;

  return <div className="space-y-3 bg-muted p-2 font-preset">
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
      <div><h1 className="text-base font-semibold">Análisis de cancelación</h1><p className="text-xs text-muted-foreground">Promedio de días entre asignación y cancelación.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-4" /><span>Año asignado</span><select value={year} onChange={(event) => { setYear(event.target.value); setMonth(ALL_MONTHS); }} className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"><option value={ALL_YEARS}>Todos los años</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><span>Mes asignado</span><select value={month} onChange={(event) => setMonth(event.target.value)} className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"><option value={ALL_MONTHS}>Todos los meses</option>{monthsForYear.map((item) => <option key={item.month} value={item.month}>{formatMonth(item.month)}</option>)}</select></label>
        <Button size="sm" variant="outline" onClick={() => navigate(paths.analisis.saldoOperacion)}><ArrowLeft /> Volver a saldo</Button>
      </div>
    </section>

    {!data?.operations ? <section className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">No hay cancelaciones con fecha válida para el período seleccionado.</section> : <>
      <section className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-3"><div className="text-[11px] text-muted-foreground">Tiempo promedio {mesAsignacion ? `· ${formatMonth(mesAsignacion)}` : "total"}</div><div className="text-lg font-semibold">{formatDays(data.averageDays)}</div></div>
        <div className="rounded-md border border-border bg-card p-3"><div className="text-[11px] text-muted-foreground">Cancelaciones analizadas</div><div className="text-lg font-semibold">{data.operations}</div></div>
      </section>

      <section className="overflow-x-auto rounded-md border border-border bg-card"><div className="border-b border-border px-3 py-2"><h2 className="text-sm font-medium">Tiempos promedio por mes de asignación</h2></div><table className="min-w-full text-xs"><thead className="bg-muted text-left"><tr><th className="whitespace-nowrap px-3 py-2 font-medium">Sucursal</th>{monthsForYear.map((item) => <th key={item.month} className={`min-w-24 whitespace-nowrap px-3 py-2 text-center font-medium ${month === item.month ? "bg-background" : ""}`}>{formatMonth(item.month)}</th>)}</tr></thead><tbody><tr><th className="whitespace-nowrap px-3 py-2 text-left font-medium">Tiempo promedio</th>{monthsForYear.map((item) => <td key={item.month} className={`px-3 py-2 text-center font-medium ${month === item.month ? "bg-muted" : ""}`}>{formatDays(item.averageDays)}</td>)}</tr>{data?.sucursalesPorMes.map((sucursal) => { const averages = new Map(sucursal.months.map((item) => [item.month, item.averageDays])); return <tr key={sucursal.sucursal} className="border-t border-border"><th className="whitespace-nowrap px-3 py-2 text-left font-medium">{sucursal.sucursal}</th>{monthsForYear.map((item) => <td key={item.month} className={`px-3 py-2 text-center ${month === item.month ? "bg-muted" : ""}`}>{averages.has(item.month) ? formatDays(averages.get(item.month)!) : "—"}</td>)}</tr>; })}</tbody></table></section>

      <section className="overflow-hidden rounded-md border border-border bg-card"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2"><div><h2 className="text-sm font-medium">Árbol de tiempos de cancelación</h2><p className="text-[11px] text-muted-foreground">Vendedor → Usuario → Sucursal → Tiempo total.</p></div><div className="flex flex-wrap gap-2 text-[11px]"><span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-green-200" />Menos de 15 días</span><span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-yellow-200" />15 a 17,99 días</span><span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-red-200" />18 días o más</span></div></div><div className="w-full" style={{ height: treeHeight }}><EChart option={option!} /></div></section>
    </>}
  </div>;
}
