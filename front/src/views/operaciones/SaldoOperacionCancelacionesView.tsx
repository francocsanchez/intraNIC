import Loading from "@/components/Loading";
import EChart from "@/components/charts/EChart";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";
import { getSaldoOperacionCancelacionAnalysis } from "@/services/operacionesService";
import type { SaldoOperacionCancelacionAnalysisNode } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const formatDays = (value: number) => `${Math.round(value)} día${Math.round(value) === 1 ? "" : "s"}`;
const formatDecimalDays = (value: number) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);

// Tonos suaves locales solicitados para los tiempos de cancelación.
const colorForAverage = (averageDays: number) => {
  if (averageDays < 15) return "#dcfce7";
  if (averageDays < 18) return "#fef9c3";
  return "#fee2e2";
};

const toChartNode = (node: SaldoOperacionCancelacionAnalysisNode): Record<string, unknown> => ({
  ...node,
  itemStyle: { color: colorForAverage(node.averageDays), borderColor: "#a1a1aa", borderWidth: 1 },
  label: { formatter: `${node.name}\n${formatDays(node.averageDays)}`, color: "#18181b", fontSize: 11, lineHeight: 15 },
  children: node.children?.map(toChartNode),
});

export default function SaldoOperacionCancelacionesView() {
  const navigate = useNavigate();
  const analysis = useQuery({ queryKey: ["saldo-operacion-cancelacion-analysis"], queryFn: ({ signal }) => getSaldoOperacionCancelacionAnalysis(signal), staleTime: 30_000 });
  const option = useMemo<EChartsCoreOption | null>(() => {
    if (!analysis.data?.data.operations) return null;
    return {
      tooltip: {
        trigger: "item",
        formatter: (params: { data: SaldoOperacionCancelacionAnalysisNode }) => `<b>${params.data.name}</b><br/>Promedio: ${formatDecimalDays(params.data.averageDays)} días<br/>Cancelaciones: ${params.data.operations}`,
      },
      series: [{
        type: "tree",
        data: [toChartNode(analysis.data.data.tree)],
        orient: "RL",
        top: "6%",
        bottom: "6%",
        left: "14%",
        right: "26%",
        symbol: "circle",
        symbolSize: 12,
        initialTreeDepth: -1,
        edgeShape: "polyline",
        lineStyle: { color: "#a1a1aa", width: 1.25 },
        label: { position: "left", align: "right", verticalAlign: "middle" },
        leaves: { label: { position: "left", align: "right", verticalAlign: "middle" } },
      }],
    } as EChartsCoreOption;
  }, [analysis.data]);

  if (analysis.isLoading) return <Loading />;
  if (analysis.isError) return <div className="p-4 text-destructive">{analysis.error.message}</div>;
  const data = analysis.data?.data;

  return <div className="space-y-3 bg-muted p-2 font-preset">
    <section className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-3">
      <div>
        <h1 className="text-base font-semibold">Análisis de cancelación</h1>
        <p className="text-xs text-muted-foreground">Promedio histórico de días entre asignación y cancelación.</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => navigate(paths.analisis.saldoOperacion)}><ArrowLeft /> Volver a saldo</Button>
    </section>

    {!data?.operations ? <section className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">No hay cancelaciones con fecha válida para analizar.</section> : <>
      <section className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-3"><div className="text-[11px] text-muted-foreground">Tiempo total promedio</div><div className="text-lg font-semibold">{formatDays(data.averageDays)}</div></div>
        <div className="rounded-md border border-border bg-card p-3"><div className="text-[11px] text-muted-foreground">Cancelaciones analizadas</div><div className="text-lg font-semibold">{data.operations}</div></div>
      </section>
      <section className="overflow-x-auto rounded-md border border-border bg-card p-2">
        <div className="h-[720px] min-w-[1050px]"><EChart option={option!} /></div>
      </section>
    </>}
  </div>;
}
