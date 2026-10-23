import {
  getCalidadVentasResultados,
  saveCalidadVentasResultado,
  searchCalidadVentasVendedores,
  type CalidadVentasPayload,
} from "@/api/calidadVentasAPI";
import { ActionButton, EditActionButton } from "@/components/ui/action-button";
import type { CalidadVentasResultado, CalidadVentasResultadoValor, CalidadVentasSeller } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pencil, Plus, Search, XCircle } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const currentDate = new Date();
const resultOptions: Array<{ value: CalidadVentasResultadoValor; label: string }> = [
  { value: "cumple", label: "Cumple" },
  { value: "noCumple", label: "No cumple" },
];

type FormState = Omit<CalidadVentasPayload, "vendedorCodigo" | "anio" | "mes">;
const emptyForm = (): FormState => ({
  oportunidadesPresupuesto: "cumple",
  entregaUsado: "cumple",
  tcfa: "cumple",
  ssiInterno: "cumple",
  ssiValor: 95,
});

const labelResult = (value: CalidadVentasResultadoValor) => (value === "cumple" ? "Cumple" : "No cumple");

function ResultBadge({ value }: { value: CalidadVentasResultadoValor }) {
  const isCompliant = value === "cumple";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${isCompliant ? "border-border bg-secondary text-secondary-foreground" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
      {isCompliant ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {labelResult(value)}
    </span>
  );
}

function ResultDialog({
  open,
  record,
  anio,
  mes,
  records,
  onClose,
}: {
  open: boolean;
  record: CalidadVentasResultado | null;
  anio: number;
  mes: number;
  records: CalidadVentasResultado[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [seller, setSeller] = useState<CalidadVentasSeller | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    if (record) {
      setSeller({ codigo: record.vendedorCodigo, vendedor: record.vendedorNombre, sucursal: record.sucursal });
      setForm({
        oportunidadesPresupuesto: record.oportunidadesPresupuesto,
        entregaUsado: record.entregaUsado,
        tcfa: record.tcfa,
        ssiInterno: record.ssiInterno,
        ssiValor: record.ssiValor,
      });
      return;
    }
    setSeller(null);
    setForm(emptyForm());
  }, [open, record]);

  const sellerSearch = useQuery({
    queryKey: ["calidad-ventas", "vendedores", query],
    queryFn: () => searchCalidadVentasVendedores(query),
    enabled: open && !record && query.trim().length >= 2,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: saveCalidadVentasResultado,
    onSuccess: async (response) => {
      toast.success(response.message);
      await queryClient.invalidateQueries({ queryKey: ["calidad-ventas", "resultados", anio, mes] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const chooseSeller = (item: CalidadVentasSeller) => {
    setSeller(item);
    setQuery("");
    const previous = records.find((row) => row.vendedorCodigo === item.codigo) ?? null;
    if (!previous) return;
    setForm({
      oportunidadesPresupuesto: previous.oportunidadesPresupuesto,
      entregaUsado: previous.entregaUsado,
      tcfa: previous.tcfa,
      ssiInterno: previous.ssiInterno,
      ssiValor: previous.ssiValor,
    });
    toast.info("Se abrió el resultado existente para este período");
  };

  const submit = () => {
    if (!seller) {
      toast.error("Seleccioná un vendedor");
      return;
    }
    if (!Number.isFinite(form.ssiValor) || form.ssiValor < 0 || form.ssiValor > 100) {
      toast.error("Ingresá un SSI Interno entre 0 y 100");
      return;
    }
    if ((form.ssiInterno === "cumple" && form.ssiValor < 95) || (form.ssiInterno === "noCumple" && form.ssiValor >= 95)) {
      toast.error("SSI Interno cumple desde 95,00");
      return;
    }
    saveMutation.mutate({ vendedorCodigo: seller.codigo, anio, mes, ...form });
  };

  const options = sellerSearch.data?.data ?? [];
  const selectClass = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:bg-muted";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={() => (saveMutation.isPending ? undefined : onClose())}>
        <Transition.Child as="div" className="fixed inset-0 bg-foreground/40" enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0" />
        <div className="fixed inset-0 overflow-y-auto p-2 sm:p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child as="div" enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="font-preset w-full max-w-2xl rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-start justify-between border-b border-border px-3 py-2">
                  <div>
                    <Dialog.Title className="text-base font-semibold">{record ? "Editar resultado" : seller && records.some((item) => item.vendedorCodigo === seller.codigo) ? "Editar resultado existente" : "Cargar resultado"}</Dialog.Title>
                    <p className="text-sm text-muted-foreground">{months[mes - 1]} {anio}</p>
                  </div>
                  <button type="button" onClick={onClose} disabled={saveMutation.isPending} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-secondary disabled:opacity-50">×</button>
                </div>
                <div className="space-y-4 px-3 py-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Vendedor</label>
                    {record ? (
                      <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm"><span className="font-semibold">{seller?.vendedor}</span> <span className="text-muted-foreground">· {seller?.sucursal}</span></div>
                    ) : seller ? (
                      <div className="flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-sm"><span><span className="font-semibold">{seller.vendedor}</span> <span className="text-muted-foreground">· {seller.sucursal}</span></span><button type="button" onClick={() => setSeller(null)} className="text-muted-foreground hover:text-foreground">Cambiar</button></div>
                    ) : (
                      <div className="relative">
                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder="Ingresá al menos 2 caracteres" className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                        {query.trim().length >= 2 && (
                          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
                            {sellerSearch.isLoading && <p className="px-3 py-2 text-sm text-muted-foreground">Buscando vendedores...</p>}
                            {sellerSearch.isError && <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-destructive"><span>{sellerSearch.error.message}</span><button type="button" onClick={() => sellerSearch.refetch()} className="font-semibold underline">Reintentar</button></div>}
                            {!sellerSearch.isLoading && !sellerSearch.isError && options.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No hay vendedores activos de ventas nuevas que coincidan.</p>}
                            {options.map((item) => <button key={item.codigo} type="button" onClick={() => chooseSeller(item)} className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-secondary"><span className="font-medium">{item.vendedor}</span><span className="ml-2 text-muted-foreground">{item.sucursal}</span></button>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      ["oportunidadesPresupuesto", "Oportunidades con presupuesto"],
                      ["entregaUsado", "Entrega usado"],
                      ["tcfa", "TCFA"],
                    ] as Array<[keyof Pick<FormState, "oportunidadesPresupuesto" | "entregaUsado" | "tcfa">, string]>).map(([key, label]) => (
                      <label key={key} className="block text-sm font-medium">{label}<select value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value as CalidadVentasResultadoValor }))} className={`mt-1 ${selectClass}`}>{resultOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    ))}
                    <label className="block text-sm font-medium">SSI Interno<select value={form.ssiInterno} onChange={(event) => setForm((current) => ({ ...current, ssiInterno: event.target.value as CalidadVentasResultadoValor }))} className={`mt-1 ${selectClass}`}>{resultOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <label className="block text-sm font-medium">Valor SSI Interno<input type="number" min="0" max="100" step="0.01" value={form.ssiValor} onChange={(event) => { const ssiValor = Number(event.target.value); setForm((current) => ({ ...current, ssiValor, ssiInterno: ssiValor >= 95 ? "cumple" : "noCumple" })); }} className={`mt-1 ${selectClass}`} /></label>
                  </div>
                  <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">Puntaje: Oportunidades 3 puntos, Entrega usado 1, TCFA 1 y SSI 3. SSI cumple desde 95,00.</p>
                </div>
                <div className="flex justify-end gap-2 border-t border-border px-3 py-2"><EditActionButton onClick={onClose} disabled={saveMutation.isPending}>Cancelar</EditActionButton><ActionButton onClick={submit} disabled={saveMutation.isPending}>{saveMutation.isPending ? "Guardando..." : "Guardar resultado"}</ActionButton></div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function CalidadVentasView() {
  const [anio, setAnio] = useState(currentDate.getFullYear());
  const [mes, setMes] = useState(currentDate.getMonth() + 1);
  const [selected, setSelected] = useState<CalidadVentasResultado | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const resultsQuery = useQuery({ queryKey: ["calidad-ventas", "resultados", anio, mes], queryFn: () => getCalidadVentasResultados(anio, mes) });
  const records = useMemo(() => resultsQuery.data?.data ?? [], [resultsQuery.data?.data]);
  const years = Array.from({ length: 8 }, (_, index) => currentDate.getFullYear() - 4 + index);
  const openNew = () => { setSelected(null); setIsDialogOpen(true); };

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Calidad</p><h1 className="text-xl font-semibold tracking-tight">Ventas</h1><p className="text-sm text-muted-foreground">Resultados mensuales de tableros de calidad por vendedor.</p></div>
        <div className="flex flex-wrap items-end gap-2"><label className="text-xs font-medium text-muted-foreground">Mes<select value={mes} onChange={(event) => setMes(Number(event.target.value))} className="mt-1 block h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">{months.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}</select></label><label className="text-xs font-medium text-muted-foreground">Año<select value={anio} onChange={(event) => setAnio(Number(event.target.value))} className="mt-1 block h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><ActionButton onClick={openNew}><Plus size={15} /> Cargar resultado</ActionButton></div>
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-3 py-2"><h2 className="text-base font-semibold">Resultados de {months[mes - 1]} {anio}</h2><span className="text-sm text-muted-foreground">{records.length} registros</span></div>
        {resultsQuery.isLoading ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">Cargando resultados...</p> : resultsQuery.isError ? <div className="px-3 py-8 text-center text-sm text-destructive"><p>{resultsQuery.error.message}</p><EditActionButton className="mt-3" onClick={() => resultsQuery.refetch()}>Reintentar</EditActionButton></div> : <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-sm"><thead className="border-b border-border bg-muted text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2 text-left">Vendedor</th><th className="px-3 py-2 text-left">Sucursal</th><th className="px-3 py-2 text-center">Oportunidades</th><th className="px-3 py-2 text-center">Ptos.</th><th className="px-3 py-2 text-center">Entrega usado</th><th className="px-3 py-2 text-center">Ptos.</th><th className="px-3 py-2 text-center">TCFA</th><th className="px-3 py-2 text-center">Ptos.</th><th className="px-3 py-2 text-center">SSI Interno</th><th className="px-3 py-2 text-center">Valor SSI</th><th className="px-3 py-2 text-center">Ptos.</th><th className="px-3 py-2 text-center">Total</th><th className="px-3 py-2" /></tr></thead><tbody>{records.map((row) => <tr key={row._id} className="border-b border-border last:border-b-0 hover:bg-muted"><td className="px-3 py-1.5 font-medium">{row.vendedorNombre}</td><td className="px-3 py-1.5 text-muted-foreground">{row.sucursal}</td><td className="px-3 py-1.5 text-center"><ResultBadge value={row.oportunidadesPresupuesto} /></td><td className="px-3 py-1.5 text-center">{row.puntosOportunidades}</td><td className="px-3 py-1.5 text-center"><ResultBadge value={row.entregaUsado} /></td><td className="px-3 py-1.5 text-center">{row.puntosEntregaUsado}</td><td className="px-3 py-1.5 text-center"><ResultBadge value={row.tcfa} /></td><td className="px-3 py-1.5 text-center">{row.puntosTcfa}</td><td className="px-3 py-1.5 text-center"><ResultBadge value={row.ssiInterno} /></td><td className="px-3 py-1.5 text-center tabular-nums">{row.ssiValor.toFixed(2)}</td><td className="px-3 py-1.5 text-center">{row.puntosSsi}</td><td className="px-3 py-1.5 text-center font-bold">{row.puntosTotal}/8</td><td className="px-3 py-1.5 text-center"><EditActionButton aria-label={`Editar ${row.vendedorNombre}`} className="h-8 w-8 p-0" onClick={() => { setSelected(row); setIsDialogOpen(true); }}><Pencil size={14} /></EditActionButton></td></tr>)}{records.length === 0 && <tr><td colSpan={13} className="px-3 py-10 text-center text-sm text-muted-foreground">No hay resultados cargados para este período.</td></tr>}</tbody></table></div>}
      </section>
      <ResultDialog open={isDialogOpen} record={selected} anio={anio} mes={mes} records={records} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
