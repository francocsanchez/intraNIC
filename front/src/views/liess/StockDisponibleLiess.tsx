import { getStockDisponibleLiess } from "@/api/liess/stockAPI";
import { textToColor } from "@/helpers/colores";
import type { StockDisponibleLiessItem, StockDisponibleLiessResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";

type TipoLiess = "usados" | "nuevos";

function formatCurrency(value: number | string | null | undefined) {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isNaN(amount) ? "-" : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

export default function StockDisponibleLiess() {
  const { tipo } = useParams<{ tipo: TipoLiess }>();
  const tipoSeleccionado: TipoLiess = tipo === "usados" ? "usados" : "nuevos";
  const [marcaActiva, setMarcaActiva] = useState("TODOS");
  const [currentTime] = useState(() => Date.now());
  const { data, isLoading, isError, error } = useQuery<StockDisponibleLiessResponse>({ queryKey: ["stockDisponible", "liess", tipoSeleccionado], queryFn: () => getStockDisponibleLiess(tipoSeleccionado), refetchOnWindowFocus: true, refetchInterval: 1000 });
  const items = data?.data ?? [];
  const resumen = data?.resumen;
  const resumenMarcas = useMemo(() => Object.entries(resumen?.porMarca ?? {}).map(([marca, total]) => ({ marca, total })).sort((a, b) => b.total - a.total || a.marca.localeCompare(b.marca)), [resumen]);
  const filtrosDisponibles = useMemo(() => ["TODOS", ...(resumen?.marcas ?? [])], [resumen]);
  const tablasPorMarca = useMemo(() => resumen?.tablasPorMarca ?? {}, [resumen]);
  const marcasVisibles = useMemo(() => marcaActiva === "TODOS" ? Object.keys(tablasPorMarca) : tablasPorMarca[marcaActiva] ? [marcaActiva] : [], [marcaActiva, tablasPorMarca]);
  const totalVisible = useMemo(() => marcasVisibles.reduce((total, marca) => total + (tablasPorMarca[marca]?.length ?? 0), 0), [marcasVisibles, tablasPorMarca]);
  const showPrecioUsado = tipoSeleccionado === "usados" || Object.values(tablasPorMarca).some((rows) => rows.some((item) => item.precioVentaUsado != null));
  const diasEnStock = (fecha: string) => Math.floor((currentTime - new Date(fecha).getTime()) / 86_400_000);
  const getAnioUnidad = (item: StockDisponibleLiessItem) => tipoSeleccionado === "nuevos" || String(item.tipo).toLowerCase() === "nuevo" ? item.anioNuevo ?? "-" : item.anioUsado ?? "-";

  if (isLoading) return <div className="font-preset w-full space-y-3 bg-muted px-2 py-3"><div className="h-28 animate-pulse rounded-lg border border-border bg-card" /><div className="h-9 animate-pulse rounded-md bg-muted-foreground/20" /><div className="h-72 animate-pulse rounded-lg border border-border bg-card" /></div>;
  if (isError) return <div className="font-preset w-full bg-muted px-2 py-3"><section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm"><h1 className="text-lg font-semibold text-foreground">Error al cargar el stock</h1><p className="mt-1 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p></section></div>;

  return <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"><div className="px-3 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">LIESS</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Stock disponible {tipoSeleccionado}</h1></div><div className="grid border-t border-border xl:grid-cols-[minmax(0,1fr)_9rem]"><div className="min-w-0 px-3 py-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cantidad por marca</p><div className="mt-2 flex overflow-x-auto border-y border-border">{resumenMarcas.map((item) => <div key={item.marca} className="min-w-28 flex-1 border-r border-border px-2 py-2 text-center last:border-r-0"><p className="truncate text-[10px] text-muted-foreground">{item.marca}</p><p className="text-sm font-semibold text-foreground">{item.total}</p></div>)}{!resumenMarcas.length && <p className="w-full px-2 py-2 text-center text-sm text-muted-foreground">Sin marcas</p>}</div></div><div className="flex min-h-24 flex-col items-center justify-center border-t border-border px-3 py-3 text-center xl:border-t-0 xl:border-l"><p className="text-4xl font-semibold text-foreground">{resumen?.total ?? items.length}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Totales</p></div></div></section>
    <section className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">{filtrosDisponibles.map((filtro) => <button key={filtro} type="button" onClick={() => setMarcaActiva(filtro)} className={`h-9 rounded-md border text-xs font-medium transition-colors ${marcaActiva === filtro ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>{filtro}</button>)}</section>
    {marcasVisibles.map((marca) => { const rows = tablasPorMarca[marca] ?? []; return <section key={marca} className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"><div className="flex items-center justify-between border-b border-border px-3 py-2"><div><h2 className="text-base font-semibold text-foreground">{marca}</h2><p className="text-sm text-muted-foreground">Unidades disponibles de la marca {marca}</p></div><p className="text-sm text-muted-foreground">{rows.length} registros</p></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-muted text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"><tr>{["Interno", "Marca", "Version", "Ano", ...(showPrecioUsado ? ["Precio"] : []), "Color", "Chasis", "Ubicacion", "Dias"].map((heading) => <th key={heading} className="px-3 py-2 text-left">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map((item) => <tr key={`${item.interno}-${item.chasis ?? "sin-chasis"}`} className="hover:bg-muted"><td className="px-3 py-1.5 font-medium text-foreground">{item.interno}</td><td className="px-3 py-1.5"><span className="inline-flex rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">{item.marca}</span></td><td className="min-w-70 px-3 py-1.5 text-foreground">{item.version}</td><td className="px-3 py-1.5 text-muted-foreground">{getAnioUnidad(item)}</td>{showPrecioUsado && <td className="px-3 py-1.5 text-muted-foreground">{formatCurrency(item.precioVentaUsado)}</td>}<td className="px-3 py-1.5">{item.color ? <span className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(item.color)}`}>{item.color}</span> : "-"}</td><td className="px-3 py-1.5 text-muted-foreground">{item.chasis ?? "-"}</td><td className="px-3 py-1.5 text-muted-foreground">{item.reservaVendedor}</td><td className="px-3 py-1.5 text-muted-foreground">{diasEnStock(item.fechaRecepcion)}</td></tr>)}{!rows.length && <tr><td colSpan={showPrecioUsado ? 9 : 8} className="px-3 py-8 text-center text-sm text-muted-foreground">No hay unidades para la marca seleccionada.</td></tr>}</tbody></table></div></section>; })}
    <p className="text-sm text-muted-foreground">Mostrando {totalVisible} unidades{marcaActiva !== "TODOS" ? ` de ${marcaActiva}` : ""}.</p>
  </div>;
}
