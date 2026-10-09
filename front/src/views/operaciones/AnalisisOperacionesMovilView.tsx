import Loading from "@/components/Loading";
import { ActionButton } from "@/components/ui/action-button";
import { getOperacionesDashboardMovilResumen } from "@/services/operacionesService";
import type { AnalisisOperacionesPreventaMovilResumenResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BarChart3, Building2, CarFront, RefreshCw, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type RankingItem = AnalisisOperacionesPreventaMovilResumenResponse["data"]["sucursales"][number];

function RankingCard({ title, items, icon: Icon }: { title: string; items: RankingItem[]; icon: typeof Building2 }) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Icon size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </header>
      {items.length ? (
        <ol className="divide-y divide-border">
          {items.map((item, index) => (
            <li key={item.nombre} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-5 text-xs font-semibold text-muted-foreground">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground" title={item.nombre}>{item.nombre}</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">{item.total}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-3 py-5 text-center text-sm text-muted-foreground">Sin datos para el período.</p>
      )}
    </section>
  );
}

export default function AnalisisOperacionesMovilView() {
  const today = useMemo(() => new Date(), []);
  const [anio, setAnio] = useState(today.getFullYear());
  const [mes, setMes] = useState(today.getMonth() + 1);
  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["operaciones-dashboard-movil", anio, mes],
    queryFn: () => getOperacionesDashboardMovilResumen({ anio, mes }),
    refetchOnWindowFocus: true,
  });

  const changeMonth = (direction: -1 | 1) => {
    const next = new Date(anio, mes - 1 + direction, 1);
    setAnio(next.getFullYear());
    setMes(next.getMonth() + 1);
  };

  if (isLoading) return <Loading />;

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-md px-3 py-4">
        <section className="rounded-md border border-destructive/30 bg-card p-4 text-center">
          <h1 className="text-base font-semibold text-foreground">No se pudo cargar el resumen</h1>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Intentá actualizar nuevamente."}</p>
          <ActionButton className="mt-4" onClick={() => void refetch()} disabled={isFetching}>Actualizar</ActionButton>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-3 px-3 py-4">
      <section className="rounded-md border border-border bg-card p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tablero de operaciones</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <ActionButton variant="outline" size="icon" aria-label="Mes anterior" onClick={() => changeMonth(-1)}><ArrowLeft size={16} /></ActionButton>
          <div className="min-w-0 text-center">
            <h1 className="text-lg font-semibold text-foreground">{MONTHS[mes - 1]} {anio}</h1>
            <p className="text-xs text-muted-foreground">Resumen mensual de asignaciones</p>
          </div>
          <ActionButton variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => changeMonth(1)}><ArrowRight size={16} /></ActionButton>
        </div>
        <ActionButton className="mt-3 w-full" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw size={15} className={isFetching ? "animate-spin" : undefined} />
          Actualizar información
        </ActionButton>
      </section>

      <section className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
        <span className="rounded-md bg-secondary p-2 text-primary"><BarChart3 size={20} /></span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cantidad de operaciones</p>
          <p className="text-2xl font-bold tabular-nums text-foreground">{data.data.totalOperaciones}</p>
        </div>
      </section>

      <RankingCard title="Operaciones por sucursal" items={data.data.sucursales} icon={Building2} />
      <RankingCard title="Operaciones por modelo" items={data.data.modelos} icon={CarFront} />
      <RankingCard title="Operaciones por vendedor" items={data.data.vendedores} icon={UserRound} />
    </div>
  );
}
