import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { getCobrosVendedor, getCobrosVendedorDetalle, searchCobrosVendedorVendedores } from "@/services/operacionesService";
import type { CobrosVendedorOption } from "@/types/index";
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Dialog, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Info, Search, UserRound, X } from "lucide-react";
import { Fragment, useState } from "react";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const PAGE_SIZE = 60;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, index) => CURRENT_YEAR - 10 + index);

const formatMoney = (value: number | null) => value === null || !Number.isFinite(value)
  ? "—"
  : new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(new Date(value)) : "—";

export default function CobrosVendedorView() {
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [busqueda, setBusqueda] = useState("");
  const [vendedor, setVendedor] = useState<CobrosVendedorOption | null>(null);
  const [operacionDraft, setOperacionDraft] = useState("");
  const [operacion, setOperacion] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selectedOperation, setSelectedOperation] = useState<number | null>(null);
  const normalizedSearch = busqueda.trim();

  const vendedoresQuery = useQuery({
    queryKey: ["cobros-vendedor", "vendedores", normalizedSearch],
    queryFn: ({ signal }) => searchCobrosVendedorVendedores(normalizedSearch, signal),
    enabled: normalizedSearch.length >= 3,
    staleTime: 30_000,
  });
  const cobrosQuery = useQuery({
    queryKey: ["cobros-vendedor", vendedor?.codigo, operacion, anio, mes, page],
    queryFn: ({ signal }) => getCobrosVendedor({ vendedor: vendedor?.codigo, operacion: operacion ?? undefined, anio, mes, page, limit: PAGE_SIZE }, signal),
    enabled: Boolean(vendedor) || operacion !== null,
    refetchOnWindowFocus: false,
  });
  const detalleQuery = useQuery({
    queryKey: ["cobros-vendedor", "detalle", selectedOperation],
    queryFn: ({ signal }) => getCobrosVendedorDetalle(selectedOperation!, signal),
    enabled: selectedOperation !== null,
  });

  const selectVendedor = (option: CobrosVendedorOption | null) => {
    setVendedor(option);
    setBusqueda("");
    setOperacion(null);
    setOperacionDraft("");
    setPage(1);
  };

  const buscarOperacion = () => {
    const codigo = Number(operacionDraft.trim());
    if (!Number.isInteger(codigo) || codigo <= 0) return;
    setVendedor(null);
    setBusqueda("");
    setOperacion(codigo);
    setPage(1);
  };

  if (vendedoresQuery.isError && !vendedor) {
    // The header remains usable so the user can correct the search or retry it.
  }

  const pagination = cobrosQuery.data?.pagination;
  return (
    <div className="w-full space-y-3 px-2 py-1 font-preset">
      <section className="border border-border bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="cobros-vendedor-vendedor" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Vendedor</label>
            <Combobox value={vendedor} onChange={selectVendedor} onClose={() => setBusqueda("")}>
              <div className="relative">
                <ComboboxInput
                  id="cobros-vendedor-vendedor"
                  aria-label="Buscar vendedor"
                  displayValue={(item: CobrosVendedorOption | null) => item?.vendedor ?? ""}
                  onChange={(event) => {
                    setBusqueda(event.target.value);
                    if (vendedor) {
                      setVendedor(null);
                      setPage(1);
                    }
                    if (operacion !== null) setOperacion(null);
                  }}
                  placeholder="Ingresá al menos 3 caracteres"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
                <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <ComboboxOptions anchor="bottom" className="z-[60] mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg empty:invisible">
                  {normalizedSearch.length < 3 ? (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Ingresá al menos 3 caracteres.</p>
                  ) : vendedoresQuery.isLoading ? (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Buscando vendedores…</p>
                  ) : vendedoresQuery.isError ? (
                    <p className="px-2 py-1.5 text-xs text-destructive">No se pudo buscar. Intentá nuevamente.</p>
                  ) : vendedoresQuery.data?.length ? vendedoresQuery.data.map((item) => (
                    <ComboboxOption key={item.vendedor} value={item} className="cursor-pointer rounded px-2 py-1.5 text-sm text-popover-foreground data-focus:bg-muted data-selected:bg-secondary">
                      {item.vendedor}
                    </ComboboxOption>
                  )) : (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">No se encontraron vendedores.</p>
                  )}
                </ComboboxOptions>
              </div>
            </Combobox>
          </div>
          <div className="space-y-1 lg:w-56">
            <label htmlFor="cobros-vendedor-operacion" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">O operación</label>
            <form className="flex gap-1" onSubmit={(event) => { event.preventDefault(); buscarOperacion(); }}>
              <input id="cobros-vendedor-operacion" inputMode="numeric" value={operacionDraft} onChange={(event) => { setOperacionDraft(event.target.value.replace(/\D/g, "")); if (operacion !== null) setOperacion(null); }} placeholder="N° exacto" className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <Button type="submit" variant="outline" size="icon" className="h-9 w-9" aria-label="Buscar operación" title="Buscar operación"><Search className="h-4 w-4" /></Button>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:w-[280px]">
            <label className="space-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Mes
              <select value={mes} onChange={(event) => { setMes(Number(event.target.value)); setPage(1); }} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground">
                {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Año
              <select value={anio} onChange={(event) => { setAnio(Number(event.target.value)); setPage(1); }} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal normal-case tracking-normal text-foreground">
                {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      {!vendedor && operacion === null ? (
        <section className="flex min-h-64 flex-col items-center justify-center border border-dashed border-border bg-card px-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary"><UserRound size={19} /></div>
          <h1 className="mt-3 text-base font-semibold text-foreground">Cobros x Vendedor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Buscá un vendedor para consultar el período o ingresá una operación exacta.</p>
        </section>
      ) : cobrosQuery.isFetching ? <Loading /> : cobrosQuery.isError ? (
        <section className="flex items-start gap-3 border border-destructive/30 bg-card p-3 text-destructive">
          <AlertCircle size={18} />
          <div><h1 className="font-semibold">No se pudieron cargar los cobros</h1><p className="mt-1 text-sm">{cobrosQuery.error instanceof Error ? cobrosQuery.error.message : "Intentá nuevamente."}</p></div>
        </section>
      ) : (
        <section className="overflow-hidden border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{operacion !== null ? `Operación ${operacion}` : `Operaciones de ${vendedor?.vendedor}`}</p><h1 className="text-base font-semibold text-foreground">{operacion !== null ? "Detalle de cobro" : `${MONTHS[mes - 1]} ${anio}`}</h1></div>
            <p className="text-xs text-muted-foreground">{pagination?.total ?? 0} operaciones</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-xs">
              <thead className="bg-muted/50 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"><tr>{["Operación", "Stoauto", "Cliente", "Modelo", "Versión", "Total", "$ Cobrado", "$ Usado", "Saldo", ""].map((label, index) => <th key={label || index} className="px-2 py-1.5">{label}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {cobrosQuery.data?.data.map((row) => <tr key={row.codigoOperacion} className="hover:bg-muted/40"><td className="px-2 py-1 font-medium">{row.codigoOperacion}</td><td className="px-2 py-1">{row.numeroFabrica || "—"}</td><td className="px-2 py-1">{row.cliente || "—"}</td><td className="px-2 py-1">{row.modelo || "—"}</td><td className="px-2 py-1">{row.version || "—"}</td><td className="px-2 py-1 text-right tabular-nums">{formatMoney(row.total)}</td><td className="px-2 py-1 text-right tabular-nums">{formatMoney(row.cobrado)}</td><td className="px-2 py-1 text-right tabular-nums">{formatMoney(row.usado)}</td><td className={"px-2 py-1 text-right tabular-nums " + (row.saldo <= 0 ? "text-emerald-700" : "text-destructive")}>{formatMoney(row.saldo)}</td><td className="px-1 py-1 text-right"><Button variant="ghost" size="icon" className="h-6 w-6" title={`Ver detalle de la operación ${row.codigoOperacion}`} aria-label={`Ver detalle de la operación ${row.codigoOperacion}`} onClick={() => setSelectedOperation(row.codigoOperacion)}><Info className="h-3.5 w-3.5" /></Button></td></tr>)}
                {!cobrosQuery.data?.data.length && <tr><td colSpan={10} className="px-3 py-8 text-center text-sm text-muted-foreground">No hay operaciones para el vendedor en el período seleccionado.</td></tr>}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground"><span>Página {pagination.page} de {pagination.totalPages}</span><Button variant="outline" size="sm" className="h-8" disabled={pagination.page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /> Anterior</Button><Button variant="outline" size="sm" className="h-8" disabled={!pagination.hasNextPage} onClick={() => setPage((current) => current + 1)}>Siguiente <ChevronRight size={15} /></Button></div>}
        </section>
      )}
      <Transition appear show={selectedOperation !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setSelectedOperation(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-foreground/20" /></Transition.Child>
          <div className="fixed inset-0 overflow-y-auto p-4"><div className="flex min-h-full items-center justify-center"><Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"><Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
            <div className="flex items-start justify-between border-b border-border px-4 py-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Cobros de la operación</p><Dialog.Title className="mt-0.5 text-lg font-semibold">{selectedOperation}</Dialog.Title></div><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Cerrar detalle" onClick={() => setSelectedOperation(null)}><X className="h-4 w-4" /></Button></div>
            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
              {detalleQuery.isLoading ? <Loading /> : detalleQuery.isError ? <p className="text-sm text-destructive">{detalleQuery.error instanceof Error ? detalleQuery.error.message : "No se pudo cargar el detalle."}</p> : detalleQuery.data && <>
                <div className="grid grid-cols-2 divide-x divide-y divide-border border border-border text-xs sm:grid-cols-4"><div className="p-2"><p className="text-muted-foreground">Venta</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.venta)}</p></div><div className="p-2"><p className="text-muted-foreground">Gestoría</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.gestoria)}</p></div><div className="p-2"><p className="text-muted-foreground">Bonificación</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.bonificacion)}</p></div><div className="p-2"><p className="text-muted-foreground">Total</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.total)}</p></div><div className="p-2"><p className="text-muted-foreground">Cobrado</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.cobrado)}</p></div><div className="p-2"><p className="text-muted-foreground">Usado</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.usado)}</p></div><div className="p-2"><p className="text-muted-foreground">Crédito bancario</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.credito)}</p></div><div className="p-2"><p className="text-muted-foreground">Saldo</p><p className="mt-1 font-semibold tabular-nums">{formatMoney(detalleQuery.data.data.saldo)}</p></div></div>
                <DetalleRecibos title="Recibos de anticipo" total={detalleQuery.data.data.anticipos} recibos={detalleQuery.data.data.recibosAnticipos} />
                <DetalleRecibos title="Recibos Deudores Varios" total={detalleQuery.data.data.deudoresVarios} recibos={detalleQuery.data.data.recibosDeudores} />
              </>}
            </div>
          </Dialog.Panel></Transition.Child></div></div>
        </Dialog>
      </Transition>
    </div>
  );
}

function DetalleRecibos({ title, total, recibos }: { title: string; total: number; recibos: Array<{ fecha: string | null; caja: number; comprobante: number; importe: number }> }) {
  return <section className="border border-border"><div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2"><h2 className="text-xs font-semibold">{title}</h2><span className="text-xs font-semibold tabular-nums">{formatMoney(total)}</span></div>{recibos.length ? <table className="w-full text-xs"><thead className="text-left text-[10px] uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="px-3 py-1.5">Fecha</th><th className="px-3 py-1.5">Caja</th><th className="px-3 py-1.5">Comprobante</th><th className="px-3 py-1.5 text-right">Importe</th></tr></thead><tbody className="divide-y divide-border">{recibos.map((recibo) => <tr key={`${recibo.fecha}-${recibo.caja}-${recibo.comprobante}`}><td className="px-3 py-1">{formatDate(recibo.fecha)}</td><td className="px-3 py-1">{recibo.caja || "—"}</td><td className="px-3 py-1">{recibo.comprobante || "—"}</td><td className="px-3 py-1 text-right tabular-nums">{formatMoney(recibo.importe)}</td></tr>)}</tbody></table> : <p className="px-3 py-3 text-xs text-muted-foreground">Sin recibos vinculados.</p>}</section>;
}
