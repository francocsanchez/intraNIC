import { getStockReservaUsados } from "@/api/usados/stockAPI";
import { textToColor } from "@/helpers/colores";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type ReservaUsado = {
  interno: number;
  vendedorReserva: string;
  version: string;
  marca: string;
  color: string;
  anio: number;
  fechaRecepcion: string;
  kilometros: number;
};
type ReservasUsadosResponse = { data: Record<string, ReservaUsado[]>; resumen: { total: number; sucursales: Record<string, number> } };
type MarcaFiltro = "TODOS" | string;

export default function StockReservasUsados() {
  const [marcaActiva, setMarcaActiva] = useState<MarcaFiltro>("TODOS");
  const [currentTime] = useState(() => Date.now());
  const { data, isLoading, isError, error } = useQuery<ReservasUsadosResponse>({
    queryKey: ["stockReservado", "usados"],
    queryFn: getStockReservaUsados,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });
  const reservasPorSucursal = useMemo(() => Object.entries(data?.data ?? {}), [data]);
  const todosLosItems = useMemo(() => Object.values(data?.data ?? {}).flat(), [data]);
  const filtrosDisponibles = useMemo(
    () => ["TODOS", ...Array.from(new Set(todosLosItems.map((item) => (item.marca || "").trim().toUpperCase()).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [todosLosItems],
  );
  const sucursalesFiltradas = useMemo(
    () => reservasPorSucursal.map(([sucursal, reservas]) => [sucursal, marcaActiva === "TODOS" ? reservas : reservas.filter((item) => (item.marca || "").trim().toUpperCase() === marcaActiva)] as const).filter(([, reservas]) => reservas.length),
    [marcaActiva, reservasPorSucursal],
  );
  const totalFiltrado = useMemo(() => sucursalesFiltradas.reduce((total, [, reservas]) => total + reservas.length, 0), [sucursalesFiltradas]);
  const diasReserva = (fecha: string) => Math.floor((currentTime - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));

  if (isLoading) return <div className="font-preset w-full space-y-3 bg-muted px-2 py-3"><div className="h-28 animate-pulse rounded-lg border border-border bg-card" /><div className="h-9 animate-pulse rounded-md bg-muted-foreground/20" /><div className="h-72 animate-pulse rounded-lg border border-border bg-card" /></div>;
  if (isError) return <div className="font-preset w-full bg-muted px-2 py-3"><section className="rounded-lg border border-destructive/30 bg-card p-3 text-card-foreground shadow-sm"><h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar reservas</h1><p className="mt-1 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p></section></div>;

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-3 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Usados</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Stock reservado</h1></div>
        <div className="grid border-t border-border xl:grid-cols-[minmax(0,1fr)_9rem]">
          <div className="min-w-0 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sucursales</p>
            <div className="mt-2 flex overflow-x-auto border-y border-border">
              {Object.entries(data?.resumen.sucursales ?? {}).map(([sucursal, total]) => <div key={sucursal} className="min-w-28 flex-1 border-r border-border px-2 py-2 text-center last:border-r-0"><p className="truncate text-[10px] text-muted-foreground">{sucursal}</p><p className="text-sm font-semibold text-foreground">{total}</p></div>)}
              {!Object.keys(data?.resumen.sucursales ?? {}).length && <p className="w-full px-2 py-2 text-center text-sm text-muted-foreground">Sin sucursales</p>}
            </div>
          </div>
          <div className="flex min-h-24 flex-col items-center justify-center border-t border-border px-3 py-3 text-center xl:border-t-0 xl:border-l"><p className="text-4xl font-semibold tracking-tight text-foreground">{marcaActiva === "TODOS" ? data?.resumen.total ?? 0 : totalFiltrado}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Totales</p></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">
        {filtrosDisponibles.map((filtro) => { const activo = marcaActiva === filtro; return <button key={filtro} type="button" onClick={() => setMarcaActiva(filtro)} className={`h-9 rounded-md border text-xs font-medium transition-colors ${activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{filtro}</button>; })}
      </section>

      {sucursalesFiltradas.map(([sucursal, reservas]) => (
        <section key={sucursal} className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-3 py-2"><h2 className="text-base font-semibold tracking-tight text-foreground">{sucursal}</h2><p className="text-sm text-muted-foreground">{reservas.length} registros</p></div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"><tr>{['Interno', 'Marca', 'Version', 'Color', 'Ano', 'Km', 'Vendedor', 'Dias'].map((heading) => <th key={heading} className="px-3 py-2 text-left">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {reservas.map((item, index) => <tr key={`${item.interno}-${index}-${item.fechaRecepcion}`} className="hover:bg-muted"><td className="px-3 py-1.5 font-medium text-foreground">{item.interno}</td><td className="px-3 py-1.5"><span className="inline-flex rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">{item.marca}</span></td><td className="min-w-60 px-3 py-1.5 text-foreground">{item.version}</td><td className="px-3 py-1.5"><span className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(item.color)}`}>{item.color}</span></td><td className="px-3 py-1.5 text-muted-foreground">{item.anio}</td><td className="px-3 py-1.5 text-muted-foreground">{new Intl.NumberFormat("es-AR").format(item.kilometros ?? 0)}</td><td className="px-3 py-1.5 text-muted-foreground">{item.vendedorReserva}</td><td className="px-3 py-1.5 text-muted-foreground">{diasReserva(item.fechaRecepcion)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {!sucursalesFiltradas.length && <section className="rounded-lg border border-border bg-card px-3 py-8 text-center text-sm text-muted-foreground shadow-sm">No hay unidades reservadas para la marca seleccionada.</section>}
    </div>
  );
}
