import { useQuery } from "@tanstack/react-query";
import { getStockValorizacionConvencional } from "@/api/convencional/stockAPI";
import type { StockValorizacionConvencionalResponse } from "@/types/index";
import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export default function StockValorizacionConvencional() {
  const { data, isLoading, isError, error } = useQuery<StockValorizacionConvencionalResponse>({
    queryKey: ["stockValorizacion", "convencional"],
    queryFn: getStockValorizacionConvencional,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </section>

        <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <article key={index} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-10 w-20 animate-pulse rounded bg-gray-100" />
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar la valorizacion</h2>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const resumen = data?.resumen ?? {
    modelos: 0,
    stockDisponible: 0,
    stockReservado: 0,
    stockGuardado: 0,
    total: 0,
    valorizacionTotal: 0,
    versionesSinPrecio: 0,
    unidadesSinPrecio: 0,
  };
  const faltantes = data?.faltantes ?? [];

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Convencional</p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Valorizacion de stock por modelo</h1>
            <p className="mt-2 text-sm text-gray-500">Resumen consolidado de stock disponible, reservado y guardado agrupado por modelo.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={paths.convencional.stockValorizacionListaPrecios}
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
            >
              Lista de precios
            </Link>

            {faltantes.length ? (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                {resumen.versionesSinPrecio} sin precio
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelos</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{resumen.modelos}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Disponible</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{resumen.stockDisponible}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Reservado</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{resumen.stockReservado}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Guardado</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{resumen.stockGuardado}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total</p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{resumen.total}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Valorizacion</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">{formatMoney(resumen.valorizacionTotal)}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Tabla por modelo</h2>
          <p className="mt-1 text-sm text-gray-500">Cada fila suma las unidades encontradas en los tres estados del stock convencional y calcula su valorizacion monetaria.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 ">Stock Disponible</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Stock Reservado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Stock Guardado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">$ Valorizacion</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.modelo} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.modelo}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.stockDisponible}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.stockReservado}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.stockGuardado}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{row.total}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{formatMoney(row.valorizacion)}</td>
                </tr>
              ))}

              {rows.length > 0 ? (
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{resumen.stockDisponible}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{resumen.stockReservado}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{resumen.stockGuardado}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{resumen.total}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{formatMoney(resumen.valorizacionTotal)}</td>
                </tr>
              ) : null}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay datos para mostrar en la valorizacion.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
