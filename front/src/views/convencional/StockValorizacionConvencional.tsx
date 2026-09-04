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
      <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
        <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="h-7 w-72 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-muted" />
        </section>

        <section className="grid grid-cols-2 gap-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <article key={index} className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="h-3 w-20 animate-pulse rounded-md bg-muted" />
              <div className="mt-2 h-8 w-16 animate-pulse rounded-md bg-muted" />
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-2">
            <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-8 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h2 className="text-base font-semibold text-card-foreground">Error al cargar la valorizacion</h2>
          <p className="mt-1 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
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
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Convencional</p>
            <h1 className="text-xl font-semibold tracking-tight text-card-foreground">Valorizacion de stock por modelo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Resumen consolidado de stock disponible, reservado y guardado agrupado por modelo.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-3 pt-0 md:pt-3">
            <Link
              to={paths.convencional.stockValorizacionListaPrecios}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Lista de precios
            </Link>

            {faltantes.length ? (
              <span className="inline-flex h-7 items-center rounded-md border border-border bg-secondary px-2 text-xs font-medium text-secondary-foreground">
                {resumen.versionesSinPrecio} sin precio
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-border sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Modelos", resumen.modelos],
            ["Disponible", resumen.stockDisponible],
            ["Reservado", resumen.stockReservado],
            ["Guardado", resumen.stockGuardado],
            ["Total", resumen.total],
            ["Valorizacion", formatMoney(resumen.valorizacionTotal)],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-border px-3 py-2 last:border-r-0 xl:border-b-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-card-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold text-card-foreground">Tabla por modelo</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Cada fila suma las unidades encontradas en los tres estados del stock convencional y calcula su valorizacion monetaria.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Modelo</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Stock Disponible</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Stock Reservado</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Stock Guardado</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Total</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">$ Valorizacion</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.modelo} className="border-b border-border last:border-b-0 hover:bg-muted">
                  <td className="px-3 py-1.5 font-medium text-card-foreground">{row.modelo}</td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">{row.stockDisponible}</td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">{row.stockReservado}</td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">{row.stockGuardado}</td>
                  <td className="px-3 py-1.5 text-center font-semibold text-card-foreground">{row.total}</td>
                  <td className="px-3 py-1.5 text-center font-semibold text-card-foreground">{formatMoney(row.valorizacion)}</td>
                </tr>
              ))}

              {rows.length > 0 ? (
                <tr className="border-t border-border bg-muted">
                  <td className="px-3 py-2 font-semibold text-card-foreground">Total</td>
                  <td className="px-3 py-2 text-center font-semibold text-card-foreground">{resumen.stockDisponible}</td>
                  <td className="px-3 py-2 text-center font-semibold text-card-foreground">{resumen.stockReservado}</td>
                  <td className="px-3 py-2 text-center font-semibold text-card-foreground">{resumen.stockGuardado}</td>
                  <td className="px-3 py-2 text-center font-semibold text-card-foreground">{resumen.total}</td>
                  <td className="px-3 py-2 text-center font-semibold text-card-foreground">{formatMoney(resumen.valorizacionTotal)}</td>
                </tr>
              ) : null}

              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
