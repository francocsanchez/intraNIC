import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Mantenimiento from "@/components/Mantenimiento";
import { getConfiguracion } from "@/api/configuracionAPI";
import { shouldShowMaintenanceForBusiness } from "@/helpers/access";
import { textToColor } from "@/helpers/colores";
import { useAuth } from "@/hooks/useAuthe";
import type { StockUsadosResponse, UnidadRow } from "@/types/index";
import { getStockDisponibleBelgrano } from "@/api/belgrano/stockAPI";

type MarcaFiltro = "TODOS" | string;
const EMPTY_STOCK_BELGRANO: UnidadRow[] = [];

export default function StockDisponibleBelgrano() {
  const { user, isLoading: authLoading } = useAuth();
  const [marcaActiva, setMarcaActiva] = useState<MarcaFiltro>("TODOS");
  const [currentTime] = useState(() => Date.now());

  const {
    data: configResponse,
    isError: configError,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ["configuracion"],
    queryFn: getConfiguracion,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const { data, isLoading, isError, error } = useQuery<StockUsadosResponse>({
    queryKey: ["stockDisponible", "belgrano"],
    queryFn: getStockDisponibleBelgrano,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const items: UnidadRow[] = data?.data ?? EMPTY_STOCK_BELGRANO;
  const resumen = data?.resumen;

  const marcasDisponibles = useMemo(() => {
    const marcas = Array.from(new Set(items.map((item) => (item.marca || "").trim().toUpperCase()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );

    return ["TODOS", ...marcas];
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    if (marcaActiva === "TODOS") return items;

    return items.filter((item) => (item.marca || "").trim().toUpperCase() === marcaActiva);
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

  const diasEnStock = (fecha: string | null) => {
    if (!fecha) return "-";

    const start = new Date(fecha).getTime();
    const diff = currentTime - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading || configLoading || authLoading) {
    return (
      <div className="w-full space-y-6 px-4 py-6">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2.6fr_0.9fr]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              <div className="mt-6 h-12 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-4 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || configError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar el stock de Belgrano</h2>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  if (shouldShowMaintenanceForBusiness(user, "belgrano", configResponse?.data?.sistemaActivoBelgrano !== false)) {
    return <Mantenimiento />;
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Belgrano</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Stock Disponible Belgrano</h1>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2.6fr_0.9fr]">
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cantidad por marcas</p>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {resumenMarcas.map((item) => (
              <div key={item.marca} className="rounded-lg bg-muted px-2 py-2 text-center">
                <p className="truncate text-primary text-muted-foreground">{item.marca}</p>
                <p className="text-sm font-semibold text-foreground">{item.total}</p>
              </div>
            ))}

            {!resumenMarcas.length && (
              <div className="col-span-full rounded-lg bg-muted px-2 py-2 text-center">
                <p className="text-xs text-muted-foreground">Sin marcas</p>
                <p className="text-sm font-semibold text-foreground">0</p>
              </div>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-6xl font-semibold tracking-tight text-foreground">{resumen?.total ?? items.length}</p>
            <p className="mt-2 text-sm text-muted-foreground">Totales</p>
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
                "h-12 rounded-lg border text-sm font-medium transition-colors",
                activo ? "border-border bg-primary text-primary-foreground shadow-sm" : "border-border bg-muted text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              {filtro}
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Detalle de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {marcaActiva === "TODOS" ? "Listado completo de unidades disponibles" : `Listado filtrado por marca: ${marcaActiva}`}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{itemsFiltrados.length} registros</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Interno</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Dominio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Marca</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">VersiÃ³n</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Color</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">AÃ±o</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Km</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">RecepciÃ³n</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Precio venta</th>
              </tr>
            </thead>

            <tbody>
              {itemsFiltrados.map((item) => (
                <tr key={`${item.interno}-${item.marca}-${item.fechaRecepcion}`} className="border-b hover:bg-muted">
                  <td className="px-4 py-2 font-medium text-foreground">{item.interno}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.dominio || "-"}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{item.marca}</span>
                  </td>
                  <td className="min-w-[240px] px-4 py-2 text-center">
                    <div className="font-medium text-foreground">{item.version}</div>
                  </td>
                  <td className="px-4 py-2 text-center text-muted-foreground">
                    <span className={`inline-block rounded-md border border-border px-2 py-1 text-xs font-medium ${textToColor(item.color)}`}>
                      {item.color}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.anio}</td>
                  <td className="px-4 py-2 text-muted-foreground">{new Intl.NumberFormat("es-AR").format(item.kilometros ?? 0)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{diasEnStock(item.fechaRecepcion)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatCurrency(item.precioVenta)}</td>
                </tr>
              ))}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No hay unidades para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-muted px-6 py-4 text-sm text-muted-foreground">
          Mostrando {itemsFiltrados.length} unidades
          {marcaActiva !== "TODOS" ? ` de ${marcaActiva}` : ""}.
        </div>
      </section>
    </div>
  );
}
