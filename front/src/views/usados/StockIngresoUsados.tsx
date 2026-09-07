import { useMemo, useState, Fragment } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getConfiguracion } from "@/api/configuracionAPI";
import Mantenimiento from "@/components/Mantenimiento";
import { textToColor } from "@/helpers/colores";
import { Dialog, Transition } from "@headlessui/react";
import { getStockIngresoUsado } from "@/api/usados/stockAPI";
import type { StockIngresoUsadosItem, StockIngresoUsadosResponse } from "@/types/index";

type MarcaFiltro = "TODOS" | string;
type StockIngresoItem = StockIngresoUsadosItem & {
  observaciones?: string | null;
  precioVenta?: number | null;
};
const EMPTY_STOCK_INGRESO_USADOS: StockIngresoItem[] = [];

export default function StockIngresoUsados() {
  const [marcaActiva, setMarcaActiva] = useState<MarcaFiltro>("TODOS");
  const [itemSeleccionado, setItemSeleccionado] = useState<StockIngresoItem | null>(null);

  const {
    data: configResponse,
    isError: configError,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ["configuracion"],
    queryFn: getConfiguracion,
    refetchOnWindowFocus: true,
  });

  const { data, isLoading, isError, error } = useQuery<StockIngresoUsadosResponse>({
    queryKey: ["strockIngreso", "usados"],
    queryFn: getStockIngresoUsado,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const items: StockIngresoItem[] = data?.data ?? EMPTY_STOCK_INGRESO_USADOS;
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

  if (isLoading || configLoading) {
    return (
      <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="h-8 w-80 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_9rem]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              <div className="mt-6 h-12 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-3">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-3 p-3">
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
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar el stock de usados</h2>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  if (configResponse?.data?.sistemaActivoUsados === false) {
    return <Mantenimiento />;
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Usados</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Stock Ingreso Usados</h1>
        </div>
        <div className="grid border-t border-border xl:grid-cols-[minmax(0,1fr)_9rem]">
        <article className="min-w-0 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cantidad por marcas</p>

          <div className="mt-3 flex overflow-x-auto border-y border-border">
            {resumenMarcas.map((item) => (
              <div key={item.marca} className="min-w-28 flex-1 border-r border-border px-2 py-2 text-center last:border-r-0">
                <p className="truncate text-xs text-muted-foreground">{item.marca}</p>
                <p className="text-sm font-semibold text-foreground">{item.total}</p>
              </div>
            ))}

            {!resumenMarcas.length && (
              <div className="w-full px-2 py-2 text-center">
                <p className="text-xs text-muted-foreground">Sin marcas</p>
              </div>
            )}
          </div>
        </article>

        <article className="flex min-h-24 flex-col items-center justify-center border-t border-border px-3 py-3 text-center xl:border-t-0 xl:border-l">
            <p className="text-4xl font-semibold tracking-tight text-foreground">{resumen?.total ?? items.length}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Totales</p>
        </article>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">
        {marcasDisponibles.map((filtro) => {
          const activo = marcaActiva === filtro;

          return (
            <button
              key={filtro}
              type="button"
              onClick={() => setMarcaActiva(filtro)}
              className={[
                "h-9 rounded-md border text-xs font-medium transition-colors",
                activo ? "border-border bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {filtro}
            </button>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Detalle de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {marcaActiva === "TODOS" ? "Listado completo de unidades disponibles" : `Listado filtrado por marca: ${marcaActiva}`}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">{itemsFiltrados.length} registros</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                {['Interno', 'Marca', 'Versión', 'Color', 'Año', 'Km', 'Precio venta', 'Ultimo dueño', 'Observaciones'].map((heading) => <th key={heading} className="px-3 py-2 text-left">{heading}</th>)}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {itemsFiltrados.map((item) => (
                <tr key={`${item.interno}-${item.marca}-${item.version}`} className="hover:bg-muted">
                  <td className="px-3 py-1.5 font-medium text-foreground">{item.interno}</td>
                  <td className="px-3 py-1.5">
                    <span className="inline-flex rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">{item.marca}</span>
                  </td>
                  <td className="min-w-60 px-3 py-1.5 text-foreground">
                    <div className="font-medium">{item.version}</div>
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(item.color)}`}>
                      {item.color}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">{item.anio}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{new Intl.NumberFormat("es-AR").format(item.km ?? 0)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{formatCurrency(item.precioVenta ?? undefined)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground uppercase">{item.ultimoDueno}</td>
                  <td className="px-3 py-1.5">
                    {item.observaciones ? (
                      <button
                        type="button"
                        onClick={() => setItemSeleccionado(item)}
                        className="inline-flex rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
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
                  <td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No hay unidades para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-3 py-2 text-sm text-muted-foreground">
          Mostrando {itemsFiltrados.length} unidades
          {marcaActiva !== "TODOS" ? ` de ${marcaActiva}` : ""}.
        </div>
      </section>

      <Transition appear show={!!itemSeleccionado} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setItemSeleccionado(null)}>
          <div className="fixed inset-0 bg-foreground/40" />
          <div className="fixed inset-0 overflow-y-auto p-2">
            <div className="flex min-h-full items-center justify-center">
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-3">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Usados</p><Dialog.Title className="mt-1 text-lg font-semibold tracking-tight">Observaciones</Dialog.Title></div>
                  <button type="button" onClick={() => setItemSeleccionado(null)} className="rounded-md border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button>
                </div>
                <div className="px-3 py-3 text-sm text-foreground">{itemSeleccionado?.observaciones || "Sin observaciones"}</div>
                <div className="flex justify-end border-t border-border bg-card px-3 py-2">
                  <button type="button" onClick={() => setItemSeleccionado(null)} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Cerrar</button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
