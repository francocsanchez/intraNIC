import type { EChartsCoreOption } from "echarts/core";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import Loading from "@/components/Loading";
import { getPatentamientosUnidadesDealersTreemap } from "@/services/patentamientosUnidadesDealersService";
import { toast } from "sonner";

const formatInteger = (value: number) => value.toLocaleString("es-AR");

export default function UnidadesDealersTreemap({ year }: { year: number | null }) {
  const treemapQuery = useQuery({
    queryKey: ["patentamientos-unidades-dealers", "treemap", year],
    queryFn: () => getPatentamientosUnidadesDealersTreemap(year),
  });

  useEffect(() => {
    if (treemapQuery.error instanceof Error) toast.error(treemapQuery.error.message);
  }, [treemapQuery.error]);

  const data = useMemo(() => treemapQuery.data?.data ?? [], [treemapQuery.data]);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const option = useMemo<EChartsCoreOption>(() => ({
    color: getPresetChartColors(),
    tooltip: {
      formatter: (item: unknown) => {
        const point = item as { name?: string; value?: number };
        const value = Number(point.value ?? 0);
        const percentage = total ? (value / total) * 100 : 0;
        return `${point.name ?? "Dealer"}<br />Unidades: ${formatInteger(value)}<br />Participacion: ${percentage.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
      },
      backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" },
    },
    series: [{ type: "treemap", data, roam: false, left: 0, top: 0, right: 0, bottom: 0, breadcrumb: { show: false }, label: { show: true, color: "var(--foreground)", formatter: "{b}\n{c}", fontSize: 11 }, itemStyle: { borderColor: "var(--background)", borderWidth: 2, gapWidth: 2 } }],
  }), [data, total]);

  return (
    <section className="border border-border bg-card">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-base font-semibold text-foreground">Participacion por dealer</h2>
        <p className="text-xs text-muted-foreground">Peso relativo de cada concesionario sobre el total de unidades Toyota.</p>
      </div>
      <div className="flex h-[300px] items-center justify-center">
        {treemapQuery.isLoading ? <Loading /> : data.length ? <EChart option={option} /> : <p className="text-center text-sm text-muted-foreground">No hay datos de unidades disponibles.</p>}
      </div>
    </section>
  );
}
