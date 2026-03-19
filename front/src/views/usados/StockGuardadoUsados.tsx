import { useMemo, useState, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { textToColor } from "@/helpers/colores";
import { Dialog, Transition } from "@headlessui/react";
import {  getStockGuardadoUsados} from "@/api/usados/stockAPI";

type MarcaFiltro = "TODOS" | string;

export default function StockGuardadoUsados() {
  const [marcaActiva, setMarcaActiva] = useState<MarcaFiltro>("TODOS");
  const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["stockGuardado", "usados"],
    queryFn: getStockGuardadoUsados,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const items = data?.data ?? [];
  const resumen = data?.resumen;

  const marcasDisponibles = useMemo(() => {
    const marcas = Array.from(new Set(items.map((item: any) => (item.marca || "").trim().toUpperCase()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );

    return ["TODOS", ...marcas];
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    if (marcaActiva === "TODOS") return items;

    return items.filter((item: any) => (item.marca || "").trim().toUpperCase() === marcaActiva);
  }, [items, marcaActiva]);

  const resumenMarcas = useMemo(() => {
    const porMarca = resumen?.porMarca ?? {};

    return Object.entries(porMarca)
      .map(([marca, total]) => ({
        marca,
        total: Number(total),
      }))
      .sort((a, b) => a.marca.localeCompare(b.marca));
  }, [resumen]);

  const formatCurrency = (value?: number) => {
    if (!value) return "-";

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const diasEnStock = (fecha: string) => {
    const start = new Date(fecha).getTime();
    const now = Date.now();
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-6 px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2.6fr_0.9fr]">
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

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar el stock de usados</h2>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Usados</p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Stock Guardadas Usados</h1>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2.6fr_0.9fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Cantidad por marcas</p>

          <div className="mt-5 overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {resumenMarcas.map((item) => (
                <div key={item.marca} className="min-w-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500 truncate">{item.marca}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">{item.total}</p>
                </div>
              ))}

              {!resumenMarcas.length && (
                <div className="min-w-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
                  <p className="text-xs text-gray-500">Sin marcas</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">0</p>
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-6xl font-semibold tracking-tight text-gray-900">{resumen?.total ?? items.length}</p>
            <p className="mt-2 text-sm text-gray-500">Totales</p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {marcasDisponibles.map((filtro) => {
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

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Detalle de unidades</h2>
            <p className="mt-1 text-sm text-gray-500">
              {marcaActiva === "TODOS" ? "Listado completo de unidades disponibles" : `Listado filtrado por marca: ${marcaActiva}`}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">{itemsFiltrados.length} registros</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Interno</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Marca</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Versión</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Color</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Año</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Km</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Recepción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Precio venta</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Observaciones</th>
              </tr>
            </thead>

            <tbody>
              {itemsFiltrados.map((item: any) => (
                <tr key={`${item.interno}-${item.modelo}-${item.fechaRecepcion}`} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{item.interno}</td>
                  <td className="px-4 py-2 text-gray-700">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{item.marca}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{item.modelo}</td>
                  <td className="min-w-[240px] px-4 py-2 text-center">
                    <div className="font-medium text-gray-900">{item.version}</div>
                  </td>
                  <td className="px-4 py-2 text-center text-gray-700">
                    <span className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(item.color)}`}>
                      {item.color}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{item.anio}</td>
                  <td className="px-4 py-2 text-gray-700">{new Intl.NumberFormat("es-AR").format(item.kilometros ?? 0)}</td>
                  <td className="px-4 py-2 text-gray-700">{diasEnStock(item.fechaRecepcion)}</td>
                  <td className="px-4 py-2 text-gray-700">{formatCurrency(item.precioVenta)}</td>
                  <td className="px-4 py-2 text-center">
                    {item.observaciones ? (
                      <button
                        onClick={() => setItemSeleccionado(item)}
                        className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
                      >
                        Ver
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay unidades para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-500">
          Mostrando {itemsFiltrados.length} unidades
          {marcaActiva !== "TODOS" ? ` de ${marcaActiva}` : ""}.
        </div>
      </section>

      <Transition appear show={!!itemSeleccionado} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setItemSeleccionado(null)}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white p-6 rounded-xl max-w-md w-full">
              <Dialog.Title className="font-semibold">Observaciones</Dialog.Title>
              <p className="mt-4">{itemSeleccionado?.observaciones || "Sin observaciones"}</p>
              <button onClick={() => setItemSeleccionado(null)} className="mt-4 bg-gray-900 text-white px-4 py-2 rounded">
                Cerrar
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
