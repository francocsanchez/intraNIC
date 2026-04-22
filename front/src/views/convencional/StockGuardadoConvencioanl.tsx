import { getStockGuardadoConvencional } from "@/api/convencional/stockAPI";
import { getConfiguracion } from "@/api/configuracionAPI";
import Mantenimiento from "@/components/Mantenimiento";
import { textToColor } from "@/helpers/colores";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyRole } from "@/helpers/access";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type ModeloFiltro = "TODOS" | "HILUX" | "SW4" | "HIACE" | "COROLLA" | "C. CROSS" | "YARIS" | "RAV4" | "YARIS CROSS";

const FILTROS_PRIORITARIOS: ModeloFiltro[] = ["TODOS", "HILUX", "SW4", "HIACE", "COROLLA", "C. CROSS", "YARIS", "RAV4", "YARIS CROSS"];

export default function StockGuardadoConvencioanl() {
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
    queryKey: ["stockGuardado", "convencional"],
    queryFn: getStockGuardadoConvencional,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const items = data?.data ?? [];
  const resumen = data?.resumen;

  const resumenDinamico = useMemo(() => {
    const porModelo = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.modelo] = (acc[item.modelo] || 0) + 1;
      return acc;
    }, {});

    const nacionales = ["HILUX", "SW4", "HIACE"];
    const importadas = ["COROLLA", "C. CROSS", "YARIS", "RAV4", "YARIS CROSS"];

    return {
      nacionales: nacionales.map((modelo) => ({
        modelo,
        total: porModelo[modelo] || 0,
      })),
      importadas: importadas.map((modelo) => ({
        modelo,
        total: porModelo[modelo] || 0,
      })),
      total: items.length,
    };
  }, [items]);

  const filtrosDisponibles = useMemo(() => {
    const existentes = new Set(items.map((item) => item.modelo));
    return FILTROS_PRIORITARIOS.filter((filtro) => filtro === "TODOS" || existentes.has(filtro));
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    if (modeloActivo === "TODOS") return items;
    return items.filter((item) => item.modelo === modeloActivo);
  }, [items, modeloActivo]);

  const isPrivileged = hasAnyRole(user, ["admin", "gerente", "stock"]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));

  if (isLoading || configLoading) {
    return (
      <div className="w-full px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_2.5fr_0.9fr]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
              <div className="mt-6 h-12 w-full animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
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
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar el stock</h2>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  if (configResponse?.data.sistemaActivoConvencional === false && !isPrivileged) {
    return <Mantenimiento />;
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Convencional</p>
        <h1 className=" text-2xl font-semibold tracking-tight text-gray-900">Stock Guardado Convencional</h1>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_2.5fr_0.9fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Nacionales</p>

          <div className="mt-5 grid grid-cols-3 divide-x divide-gray-200">
            {resumenDinamico.nacionales.map((item) => (
              <div key={item.modelo} className="px-4 first:pl-0 last:pr-0">
                <p className="text-sm text-gray-500">{item.modelo}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{item.total}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Importadas</p>

          <div className="mt-5 grid grid-cols-5 divide-x divide-gray-200">
            {resumenDinamico.importadas.map((item) => (
              <div key={item.modelo} className="px-4 first:pl-0 last:pr-0">
                <p className="text-sm text-gray-500">{item.modelo}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{item.total}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-6xl font-semibold tracking-tight text-gray-900">{resumen?.total ?? resumenDinamico.total}</p>
            <p className="mt-2 text-sm text-gray-500">Totales</p>
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

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Detalle de unidades</h2>
            <p className="mt-1 text-sm text-gray-500">
              {modeloActivo === "TODOS" ? "Listado completo de unidades disponibles" : `Listado filtrado por modelo: ${modeloActivo}`}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">{itemsFiltrados.length} registros</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Interno</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Versión</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Color</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Ubicación</th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Recepción</th>
              </tr>
            </thead>

            <tbody>
              {itemsFiltrados.map((item) => (
                <tr
                  key={`${item.interno}-${item.chasis}-${item.fechaRecepcion}`}
                  className={[
                    "border-b border-gray-100",
                    item.vendedorReserva === "3MES QUE VIENE" ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  <td className="px-4 py-2 font-medium text-gray-900">{item.interno}</td>
                  <td className="px-4 py-2 text-gray-700">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{item.modelo}</span>
                  </td>

                  <td className="min-w-[240px] px-4 py-2 text-center">
                    <div className="font-medium text-gray-900">{item.version}</div>
                    <div className="text-xs text-gray-400">{item.chasis}</div>
                  </td>
                  <td className="px-4 py-2 text-gray-700 text-center">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md border border-slate-200 ${textToColor(item.color)}`}>
                      {item.color}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{item.ubicacion}</td>

                  <td className="px-4 py-2 text-gray-700">{formatDate(item.fechaRecepcion)}</td>
                </tr>
              ))}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay unidades para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-500">
          Mostrando {itemsFiltrados.length} unidades
          {modeloActivo !== "TODOS" ? ` de ${modeloActivo}` : ""}.
        </div>
      </section>
    </div>
  );
}
