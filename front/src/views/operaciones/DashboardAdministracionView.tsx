import EChart from "@/components/charts/EChart";
import { createSaldoOperacionTiempoTreeOption } from "@/components/operaciones/SaldoOperacionTiempoTree";
import { getDashboardAdministracion } from "@/services/operacionesService";
import { useQuery } from "@tanstack/react-query";
import type { EChartsCoreOption } from "echarts/core";
import { useMemo } from "react";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MODEL_ROSE_COLORS = ["#93c5fd", "#86efac", "#fde68a", "#f9a8d4", "#c4b5fd", "#67e8f9", "#fdba74", "#a7f3d0"];
const formatMillions = (value: number) => `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(value / 1_000_000))}M`;

export default function DashboardAdministracionView() {
  const query = useQuery({
    queryKey: ["dashboard-administracion"],
    queryFn: ({ signal }) => getDashboardAdministracion(signal),
    refetchOnWindowFocus: true,
  });
  const option = useMemo(() => query.data
    ? createSaldoOperacionTiempoTreeOption(query.data.data.tree, { showSaldo: true, operationLabel: "Operaciones", edgeShape: "curve" })
    : null, [query.data]);
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
      label: { formatter: "{b}\n{c}", color: "var(--foreground)", fontSize: 10 },
      labelLine: { length: 6, length2: 6 },
      data: query.data.modelos.map((item) => ({ name: item.nombre, value: item.total })),
    }],
  }) : null, [query.data]);

  if (query.isLoading) return <main className="grid h-dvh place-items-center overflow-hidden bg-muted font-preset text-lg text-muted-foreground">Cargando Dashboard Administración...</main>;
  if (query.isError || !query.data) return <main className="grid h-dvh place-items-center overflow-hidden bg-muted p-6 font-preset"><section className="max-w-lg rounded-md border border-destructive/30 bg-card p-6 text-center"><h1 className="text-xl font-semibold text-foreground">No se pudo cargar Dashboard Administración</h1><p className="mt-2 text-destructive">{query.error instanceof Error ? query.error.message : "Intentá actualizar nuevamente."}</p></section></main>;

  const { data, periodo } = query.data;
  const hasTreeBranches = Boolean(data.operations && data.tree.children?.length);
  return <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-muted p-4 font-preset">
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Dashboard Administración</p><h1 className="text-xl font-bold text-foreground">Operaciones no canceladas</h1></div>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="font-medium text-foreground">{MONTHS[periodo.mes - 1]} {periodo.anio}</span><span>Todas las sucursales</span><span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-green-200" />Menos de 15 días</span><span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-yellow-200" />15 a 17,99 días</span><span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-red-200" />18 días o más</span></div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-border">
        <section className="min-h-0 overflow-hidden p-3">
          {hasTreeBranches && option ? <EChart key={`${periodo.anio}-${periodo.mes}`} option={option} resetOnOptionChange /> : <p className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">No hay operaciones no canceladas con asignación válida para el período actual.</p>}
        </section>
        <section className="grid min-h-0 grid-rows-2 divide-y divide-border">
          <section className="grid min-h-0 grid-cols-2 divide-x divide-border"><div className="flex min-h-0 flex-col overflow-hidden p-3"><h2 className="shrink-0 text-sm font-semibold text-foreground">Operaciones pendientes por modelo</h2>{modelOption ? <div className="min-h-0 flex-1"><EChart option={modelOption} /></div> : <p className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">Sin operaciones pendientes para representar.</p>}</div><div className="flex min-h-0 flex-col p-5"><div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"><p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Saldo pendiente</p><p className="mt-2 text-7xl font-bold leading-none tracking-tight text-foreground">{formatMillions(query.data.resumen.saldoTotal)}</p></div><div className="grid shrink-0 grid-cols-2 gap-4 border-t border-border pt-4 text-center"><div><p className="text-sm font-semibold text-muted-foreground">Créditos</p><p className="mt-1 text-2xl font-bold leading-none text-foreground">{formatMillions(query.data.resumen.creditoTotal)}</p><p className="mt-2 text-xs font-medium text-muted-foreground">{query.data.resumen.creditoCantidad} operaciones</p></div><div><p className="text-sm font-semibold text-muted-foreground">Usados</p><p className="mt-1 text-2xl font-bold leading-none text-foreground">{formatMillions(query.data.resumen.usadoTotal)}</p><p className="mt-2 text-xs font-medium text-muted-foreground">{query.data.resumen.usadoCantidad} operaciones</p></div></div></div></section>
          <section className="flex min-h-0 items-center justify-center p-3"><p className="text-xl font-semibold text-muted-foreground">Zona 2</p></section>
        </section>
      </div>
    </section>
  </main>;
}
