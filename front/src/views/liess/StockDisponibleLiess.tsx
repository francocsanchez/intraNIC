import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getStockDisponibleLiess } from "@/api/liess/stockAPI";
import { useQuery } from "@tanstack/react-query";
import { textToColor } from "@/helpers/colores";

type MarcaFiltro = string;
type TipoLiess = "usados" | "nuevos";

export default function StockDisponibleLiess() {
  const { tipo } = useParams<{ tipo: TipoLiess }>();
  const tipoSeleccionado: TipoLiess = tipo === "usados" ? "usados" : "nuevos";

  const [marcaActiva, setMarcaActiva] = useState<MarcaFiltro>("TODOS");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["stockDisponible", "liess", tipoSeleccionado],
    queryFn: () => getStockDisponibleLiess(tipoSeleccionado),
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const items = data?.data ?? [];
  const resumen = data?.resumen;

  const resumenMarcas = useMemo(() => {
    const porMarca = resumen?.porMarca ?? {};

    return Object.entries(porMarca)
      .map(([marca, total]) => ({ marca, total }))
      .sort((a, b) => b.total - a.total || a.marca.localeCompare(b.marca));
  }, [resumen]);

  const filtrosDisponibles = useMemo(() => {
    const marcas = resumen?.marcas ?? [];
    return ["TODOS", ...marcas];
  }, [resumen]);

  const tablasPorMarca = useMemo(() => {
    return resumen?.tablasPorMarca ?? {};
  }, [resumen]);

  const marcasVisibles = useMemo(() => {
    if (marcaActiva === "TODOS") return Object.keys(tablasPorMarca);
    return tablasPorMarca[marcaActiva] ? [marcaActiva] : [];
  }, [marcaActiva, tablasPorMarca]);

  const totalVisible = useMemo(() => {
    return marcasVisibles.reduce((acc, marca) => acc + (tablasPorMarca[marca]?.length ?? 0), 0);
  }, [marcasVisibles, tablasPorMarca]);

  const diasEnStock = (fecha: string) => {
    const start = new Date(fecha).getTime();
    const now = Date.now();
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-6 space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2.8fr_0.9fr]">
          {Array.from({ length: 2 }).map((_, i) => (
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
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar el stock</h2>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Liess</p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Stock Disponible Liess</h1>
        <p className="mt-2 text-sm text-gray-500 capitalize">Tipo seleccionado: {tipoSeleccionado}</p>
      </section>

      <section className="grid grid-cols-1 gap-2 xl:grid-cols-[2.8fr_0.9fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Cantidad por marca</p>

          <div
            className="mt-5 grid divide-x divide-gray-200"
            style={{
              gridTemplateColumns: `repeat(${Math.max(resumenMarcas.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {resumenMarcas.map((item) => (
              <div key={item.marca} className="px-4 first:pl-0 last:pr-0">
                <p className="text-sm text-gray-500">{item.marca}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{item.total}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-6xl font-semibold tracking-tight text-gray-900">{resumen?.total ?? items.length}</p>
            <p className="mt-2 text-sm text-gray-500">Totales</p>
          </div>
        </article>
      </section>

      <section
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.min(Math.max(filtrosDisponibles.length, 2), 9)}, minmax(0, 1fr))`,
        }}
      >
        {filtrosDisponibles.map((filtro) => {
          const activo = marcaActiva === filtro;

          return (
            <button
              key={filtro}
              type="button"
              onClick={() => setMarcaActiva(filtro)}
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

      {marcasVisibles.map((marca) => {
        const rows = tablasPorMarca[marca] ?? [];

        return (
          <section key={marca} className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-gray-900">{marca}</h2>
                <p className="mt-1 text-sm text-gray-500">Unidades disponibles de la marca {marca}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">{rows.length} registros</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Interno</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Marca</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Versión</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Chasis</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Ubicacion</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Dias</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((item) => (
                    <tr
                      key={`${item.interno}-${item.chasis ?? "sin-chasis"}`}
                      className={[
                        "border-b border-gray-100",
                        item.reservaVendedor === "SIMPA" ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <td className="px-4 py-2 font-medium text-gray-900">{item.interno}</td>
                      <td className="px-4 py-2 text-gray-700">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{item.marca}</span>
                      </td>
                      <td className="min-w-[280px] px-4 py-2 text-gray-900">{item.version}</td>
                      <td className="px-4 py-2 text-center text-gray-700">
                        {item.color ? (
                          <span
                            className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(item.color)}`}
                          >
                            {item.color}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-700">{item.chasis ?? "-"}</td>
                      <td className="px-4 py-2 text-gray-700">{item.reservaVendedor}</td>
                      <td className="px-4 py-2 text-gray-700">{diasEnStock(item.fechaRecepcion)}</td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">
                        No hay unidades para la marca seleccionada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-500">
        Mostrando {totalVisible} unidades
        {marcaActiva !== "TODOS" ? ` de ${marcaActiva}` : ""}.
      </section>
    </div>
  );
}
