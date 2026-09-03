import { textToColor } from "@/helpers/colores";
import type { StockUsadosResponse, UnidadRow } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

type MarcaFiltro = "TODOS" | string;
type StockUsadoItem = UnidadRow;
type StockUsadosViewProps = {
  queryKey: string[];
  queryFn: () => Promise<StockUsadosResponse>;
  title: string;
  subtitle?: string;
};

const EMPTY_STOCK_USADOS: StockUsadoItem[] = [];

function formatCurrency(value?: number) {
  if (!value) return "-";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

export default function StockUsadosView({ queryKey, queryFn, title, subtitle = "Usados" }: StockUsadosViewProps) {
  const [marcaActiva, setMarcaActiva] = useState<MarcaFiltro>("TODOS");
  const [itemSeleccionado, setItemSeleccionado] = useState<StockUsadoItem | null>(null);
  const [currentTime] = useState(() => Date.now());
  const { data, isLoading, isError, error } = useQuery({ queryKey, queryFn, refetchOnWindowFocus: true, refetchInterval: 1000 });
  const items = data?.data ?? EMPTY_STOCK_USADOS;
  const resumen = data?.resumen;
  const marcasDisponibles = useMemo(
    () => ["TODOS", ...Array.from(new Set(items.map((item) => (item.marca || "").trim().toUpperCase()).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [items],
  );
  const itemsFiltrados = useMemo(
    () => (marcaActiva === "TODOS" ? items : items.filter((item) => (item.marca || "").trim().toUpperCase() === marcaActiva)),
    [items, marcaActiva],
  );
  const resumenMarcas = useMemo(
    () => Object.entries(resumen?.porMarca ?? {}).map(([marca, total]) => ({ marca, total: Number(total) })).sort((a, b) => a.marca.localeCompare(b.marca)),
    [resumen],
  );
  const diasEnStock = (fecha: string | null) => (fecha ? Math.floor((currentTime - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24)) : "-");

  if (isLoading) {
    return (
      <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
        <div className="h-28 animate-pulse rounded-lg border border-border bg-card" />
        <div className="h-9 animate-pulse rounded-md bg-muted-foreground/20" />
        <div className="h-72 animate-pulse rounded-lg border border-border bg-card" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3 text-card-foreground shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar el stock de usados</h1>
          <p className="mt-1 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{subtitle}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        </div>
        <div className="grid border-t border-border xl:grid-cols-[minmax(0,1fr)_9rem]">
          <div className="min-w-0 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cantidad por marcas</p>
            <div className="mt-2 flex overflow-x-auto border-y border-border">
              {resumenMarcas.map((item) => (
                <div key={item.marca} className="min-w-28 flex-1 border-r border-border px-2 py-2 text-center last:border-r-0">
                  <p className="truncate text-[10px] text-muted-foreground">{item.marca}</p>
                  <p className="text-sm font-semibold text-foreground">{item.total}</p>
                </div>
              ))}
              {!resumenMarcas.length && <p className="w-full px-2 py-2 text-center text-sm text-muted-foreground">Sin marcas</p>}
            </div>
          </div>
          <div className="flex min-h-24 flex-col items-center justify-center border-t border-border px-3 py-3 text-center xl:border-t-0 xl:border-l">
            <p className="text-4xl font-semibold tracking-tight text-foreground">{resumen?.total ?? items.length}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Totales</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">
        {marcasDisponibles.map((filtro) => {
          const activo = marcaActiva === filtro;
          return <button key={filtro} type="button" onClick={() => setMarcaActiva(filtro)} className={`h-9 rounded-md border text-xs font-medium transition-colors ${activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{filtro}</button>;
        })}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Detalle de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">{marcaActiva === "TODOS" ? "Listado completo de unidades" : `Listado filtrado por marca: ${marcaActiva}`}</p>
          </div>
          <p className="text-sm text-muted-foreground">{itemsFiltrados.length} registros</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                {['Interno', 'Marca', 'Version', 'Color', 'Ano', 'Km', 'Recepcion', 'Precio venta', 'Observaciones'].map((heading) => <th key={heading} className="px-3 py-2 text-left">{heading}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {itemsFiltrados.map((item) => (
                <tr key={`${item.interno}-${item.marca}-${item.fechaRecepcion}`} className="hover:bg-muted">
                  <td className="px-3 py-1.5 font-medium text-foreground">{item.interno}</td>
                  <td className="px-3 py-1.5"><span className="inline-flex rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">{item.marca}</span></td>
                  <td className="min-w-60 px-3 py-1.5 text-foreground">{item.version}</td>
                  <td className="px-3 py-1.5"><span className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(item.color)}`}>{item.color}</span></td>
                  <td className="px-3 py-1.5 text-muted-foreground">{item.anio}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{new Intl.NumberFormat("es-AR").format(item.kilometros ?? 0)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{diasEnStock(item.fechaRecepcion)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{formatCurrency(item.precioVenta)}</td>
                  <td className="px-3 py-1.5">
                    {item.observaciones ? <button type="button" onClick={() => setItemSeleccionado(item)} className="inline-flex rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">Ver</button> : <span className="text-muted-foreground">-</span>}
                  </td>
                </tr>
              ))}
              {!itemsFiltrados.length && <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">No hay unidades para el filtro seleccionado.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-3 py-2 text-sm text-muted-foreground">Mostrando {itemsFiltrados.length} unidades{marcaActiva !== "TODOS" ? ` de ${marcaActiva}` : ""}.</p>
      </section>

      <Transition appear show={Boolean(itemSeleccionado)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setItemSeleccionado(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-foreground/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-2">
            <div className="flex min-h-full items-center justify-center">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                  <div className="flex items-center justify-between border-b border-border px-3 py-3">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{subtitle}</p><Dialog.Title className="mt-1 text-lg font-semibold tracking-tight">Observaciones</Dialog.Title></div>
                    <button type="button" onClick={() => setItemSeleccionado(null)} className="rounded-md border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button>
                  </div>
                  <div className="px-3 py-3 text-sm text-foreground">{itemSeleccionado?.observaciones || "Sin observaciones"}</div>
                  <div className="flex justify-end border-t border-border bg-muted px-3 py-2"><button type="button" onClick={() => setItemSeleccionado(null)} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Cerrar</button></div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
