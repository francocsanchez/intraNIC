import Mantenimiento from "@/components/Mantenimiento";
import { getConfiguracion } from "@/api/configuracionAPI";
import { getPendienteReventas } from "@/api/dms/dmsAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type PendienteReventaItem = {
  opera: number;
  clienteNombre: string;
  fechaEntrega: string;
  diasDesdeEntrega: number;
  version: string;
  modelo: string;
  vendedor: string;
  chasis: string;
};

type ModeloFiltro = "TODOS" | "HILUX" | "SW4" | "HIACE" | "COROLLA" | "C. CROSS" | "YARIS" | "RAV4" | "YARIS CROSS";

const FILTROS_PRIORITARIOS: ModeloFiltro[] = ["TODOS", "HILUX", "SW4", "HIACE", "COROLLA", "C. CROSS", "YARIS", "RAV4", "YARIS CROSS"];
const EMPTY_PENDIENTE_REVENTAS: PendienteReventaItem[] = [];

function formatDate(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getRowClassByDias(dias: number) {
  if (dias >= 90) return "bg-red-50 hover:bg-red-100";
  if (dias >= 60) return "bg-amber-50 hover:bg-amber-100";
  return "bg-emerald-50 hover:bg-emerald-100";
}

export default function PendienteReventaView() {
  const [modeloActivo, setModeloActivo] = useState<ModeloFiltro>("TODOS");

  const {
    data: configResponse,
    isError: configError,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ["configuracion"],
    queryFn: getConfiguracion,
    refetchOnWindowFocus: true,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pendiente-reventas", "siac"],
    queryFn: getPendienteReventas,
    refetchOnWindowFocus: true,
  });

  const items: PendienteReventaItem[] = data?.data ?? EMPTY_PENDIENTE_REVENTAS;

  const resumenDinamico = useMemo(() => {
    const porModelo = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.modelo] = (acc[item.modelo] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(porModelo)
      .map(([modelo, total]) => ({ modelo, total }))
      .sort((a, b) => b.total - a.total || a.modelo.localeCompare(b.modelo));
  }, [items]);

  const resumenDias = useMemo(
    () => ({
      mayorA90: items.filter((item) => item.diasDesdeEntrega >= 90).length,
      entre60y89: items.filter((item) => item.diasDesdeEntrega >= 60 && item.diasDesdeEntrega <= 89).length,
      menorA30: items.filter((item) => item.diasDesdeEntrega < 60).length,
    }),
    [items],
  );

  const filtrosDisponibles = useMemo(() => {
    const existentes = new Set(items.map((item) => item.modelo));
    return FILTROS_PRIORITARIOS.filter((filtro) => filtro === "TODOS" || existentes.has(filtro));
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    if (modeloActivo === "TODOS") return items;
    return items.filter((item) => item.modelo === modeloActivo);
  }, [items, modeloActivo]);

  if (isLoading || configLoading) {
    return (
      <div className="font-preset w-full space-y-3 px-2 py-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2.6fr_1.1fr]">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              <div className="mt-6 h-24 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-3">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-4 p-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || configError) {
    return (
      <div className="font-preset w-full px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar las reventas</h2>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  if (configResponse?.data.sistemaActivoConvencional === false) {
    return <Mantenimiento />;
  }

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <div><p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Convencional</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Reventas pendientes de facturacion</h1></div>
          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">{items.length} registros</span>
        </div>
        <div className="grid border-t border-border xl:grid-cols-[2.6fr_1.1fr]">
          <article className="px-3 py-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Modelos</p>
              <h2 className="mt-1 text-sm font-semibold tracking-tight text-foreground">Resumen por modelo</h2>
            </div>

            <div className="text-xs text-muted-foreground">{items.length} registros</div>
          </div>

          <div className="mt-3 flex overflow-x-auto border-y border-border">
            {resumenDinamico.map((item) => (
              <div key={item.modelo} className="min-w-28 flex-1 border-r border-border px-2 py-2 text-center last:border-r-0">
                <p className="truncate text-[10px] text-muted-foreground">{item.modelo}</p>
                <p className="text-sm font-semibold text-foreground">{item.total}</p>
              </div>
            ))}

            {resumenDinamico.length === 0 && (
              <div className="w-full px-2 py-2 text-center">
                <p className="text-xs text-muted-foreground">Sin modelos</p>
                <p className="text-sm font-semibold text-foreground">0</p>
              </div>
            )}
          </div>
        </article>

        <article className="grid grid-cols-3 border-t border-border xl:border-t-0 xl:border-l">
            <div className="flex min-h-28 flex-col items-center justify-center px-3 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-destructive">Mayor a 90 dias</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-destructive">{resumenDias.mayorA90}</p>
            </div>
            <div className="flex min-h-28 flex-col items-center justify-center border-l border-border px-3 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-600">Entre 60 y 90</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-amber-700">{resumenDias.entre60y89}</p>
            </div>
            <div className="flex min-h-28 flex-col items-center justify-center border-l border-border px-3 py-3 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-600">Menor a 60 dias</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-emerald-700">{resumenDias.menorA30}</p>
            </div>
        </article>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">
        {filtrosDisponibles.map((filtro) => {
          const activo = modeloActivo === filtro;

          return (
            <button
              key={filtro}
              type="button"
              onClick={() => setModeloActivo(filtro)}
              className={[
                "h-9 rounded-md border text-xs font-medium transition-colors",
                activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {filtro}
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Detalle de reventas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {modeloActivo === "TODOS" ? "Listado completo de reventas pendientes" : `Listado filtrado por modelo: ${modeloActivo}`}
            </p>
          </div>

          <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{itemsFiltrados.length} registros</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Version</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Chasis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fecha entrega</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dias de entrega</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Vendedor</th>
              </tr>
            </thead>

            <tbody>
              {itemsFiltrados.map((item) => (
                <tr key={`${item.opera}-${item.chasis}`} className={`border-b border-border transition-colors ${getRowClassByDias(item.diasDesdeEntrega)}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{item.clienteNombre.trim()}</td>
                  <td className="px-4 py-3 text-foreground">{item.opera}</td>
                  <td className="px-4 py-3 text-foreground">
                    <span className="inline-flex rounded-full bg-card/80 px-2.5 py-1 text-xs font-semibold text-foreground ring-1 ring-inset ring-border">
                      {item.modelo}
                    </span>
                  </td>
                  <td className="min-w-[260px] px-4 py-3 text-foreground">{item.version}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{item.chasis}</td>
                  <td className="px-4 py-3 text-foreground">{formatDate(item.fechaEntrega)}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{item.diasDesdeEntrega}</td>
                  <td className="px-4 py-3 text-foreground">{item.vendedor}</td>
                </tr>
              ))}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No hay reventas para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-muted px-3 py-3 text-sm text-muted-foreground">
          Mostrando {itemsFiltrados.length} reventas
          {modeloActivo !== "TODOS" ? ` de ${modeloActivo}` : ""}.
        </div>
      </section>
    </div>
  );
}
