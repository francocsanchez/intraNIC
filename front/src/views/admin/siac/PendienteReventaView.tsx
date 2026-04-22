import Mantenimiento from "@/components/Mantenimiento";
import { getConfiguracion } from "@/api/configuracionAPI";
import { getPendienteReventas } from "@/api/dms/dmsAPI";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyRole } from "@/helpers/access";
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
  const { user } = useAuth();

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

  const items: PendienteReventaItem[] = data?.data ?? [];
  const resumen = data?.resumen;

  const isPrivileged = hasAnyRole(user, ["admin", "gerente", "stock"]);

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
      <div className="w-full space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2.6fr_1.1fr]">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
              <div className="mt-6 h-24 w-full animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || configError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar las reventas</h2>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  if (configResponse?.data.sistemaActivoConvencional === false && !isPrivileged) {
    return <Mantenimiento />;
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Convencional</p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Reventas pendientes de facturacion</h1>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2.6fr_1.1fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelos</p>
              <h2 className="mt-1 text-base font-semibold tracking-tight text-gray-900">Resumen por modelo</h2>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">{items.length} registros</div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {resumenDinamico.map((item) => (
              <div key={item.modelo} className="rounded-lg bg-gray-50 px-2 py-2 text-center">
                <p className="truncate text-[10px] text-gray-500">{item.modelo}</p>
                <p className="text-sm font-semibold text-gray-900">{item.total}</p>
              </div>
            ))}

            {resumenDinamico.length === 0 && (
              <div className="col-span-full rounded-lg bg-gray-50 px-2 py-2 text-center">
                <p className="text-xs text-gray-500">Sin modelos</p>
                <p className="text-sm font-semibold text-gray-900">0</p>
              </div>
            )}
          </div>

          {resumen?.total ? <p className="mt-4 text-sm text-gray-500">Total informado por el servicio: {resumen.total}</p> : null}
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Antiguedad</p>
          <div className="mt-5 grid grid-cols-1 gap-2">
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-red-600">Mayor a 90 dias</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-red-700">{resumenDias.mayorA90}</p>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-amber-600">Entre 60 y 90</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-amber-700">{resumenDias.entre60y89}</p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-600">Menor a 60 dias</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-700">{resumenDias.menorA30}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {filtrosDisponibles.map((filtro) => {
          const activo = modeloActivo === filtro;

          return (
            <button
              key={filtro}
              type="button"
              onClick={() => setModeloActivo(filtro)}
              className={[
                "h-12 rounded-xl border text-sm font-medium transition-colors",
                activo ? "border-gray-950 bg-gray-950 text-white shadow-sm" : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {filtro}
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Detalle de reventas</h2>
            <p className="mt-1 text-sm text-gray-500">
              {modeloActivo === "TODOS" ? "Listado completo de reventas pendientes" : `Listado filtrado por modelo: ${modeloActivo}`}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">{itemsFiltrados.length} registros</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Opera</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Version</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Chasis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Fecha entrega</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Dias de entrega</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Vendedor</th>
              </tr>
            </thead>

            <tbody>
              {itemsFiltrados.map((item) => (
                <tr key={`${item.opera}-${item.chasis}`} className={`border-b border-gray-100 transition-colors ${getRowClassByDias(item.diasDesdeEntrega)}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.clienteNombre.trim()}</td>
                  <td className="px-4 py-3 text-gray-700">{item.opera}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
                      {item.modelo}
                    </span>
                  </td>
                  <td className="min-w-[260px] px-4 py-3 text-gray-700">{item.version}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">{item.chasis}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(item.fechaEntrega)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.diasDesdeEntrega}</td>
                  <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                </tr>
              ))}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay reventas para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-500">
          Mostrando {itemsFiltrados.length} reventas
          {modeloActivo !== "TODOS" ? ` de ${modeloActivo}` : ""}.
        </div>
      </section>
    </div>
  );
}
