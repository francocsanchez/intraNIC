import { getEmpresaGasto, saveEmpresaGasto, type RendicionGastoPayload } from "@/api/rendicionesGastosAPI";
import { ActionButton, DeleteActionButton } from "@/components/ui/action-button";
import { Dialog, Transition } from "@headlessui/react";
import { useForm, useWatch } from "react-hook-form";
import { Fragment, useState } from "react";
import { FilePlus2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";

type FormValues = { motivo: string; montoRetirado: string };
type GastoDraft = { fecha: string; empresaNombre: string; empresaCuit: string; descripcion: string; monto: string };
type Props = { onSubmit: (payload: RendicionGastoPayload) => void; onCancel: () => void; pending?: boolean };
const emptyGasto = (): GastoDraft => ({ fecha: new Date().toISOString().slice(0, 10), empresaNombre: "", empresaCuit: "", descripcion: "", monto: "" });
const parseMoney = (value: string) => {
  const normalized = value.trim().replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!normalized) return undefined;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : Number.NaN;
};
const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(value);

export default function RendicionGastoForm({ onSubmit, onCancel, pending = false }: Props) {
  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({ defaultValues: { motivo: "", montoRetirado: "" } });
  const montoRetirado = useWatch({ control, name: "montoRetirado" });
  const [gastos, setGastos] = useState<GastoDraft[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<GastoDraft>(emptyGasto);
  const [knownCompany, setKnownCompany] = useState(false);
  const retirado = parseMoney(montoRetirado || "") || 0;
  const total = gastos.reduce((sum, gasto) => sum + (parseMoney(gasto.monto) || 0), 0);
  const saldo = retirado - total;

  const openDialog = () => { setDraft(emptyGasto()); setKnownCompany(false); setDialogOpen(true); };
  const lookupCompany = async (cuitValue = draft.empresaCuit) => {
    const cuit = cuitValue.replace(/\D/g, "");
    setDraft((current) => ({ ...current, empresaCuit: cuit }));
    setKnownCompany(false);
    if (!/^\d{11}$/.test(cuit)) return;
    try {
      const response = await getEmpresaGasto(cuit);
      if (response.data) { setDraft((current) => current.empresaCuit === cuit ? { ...current, empresaNombre: response.data!.nombre } : current); setKnownCompany(true); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo buscar la empresa"); }
  };
  const addGasto = async () => {
    const amount = parseMoney(draft.monto);
    if (!draft.fecha || !draft.empresaNombre.trim() || !draft.descripcion.trim()) return toast.error("Completá todos los datos del gasto");
    if (!/^\d{11}$/.test(draft.empresaCuit)) return toast.error("El CUIT debe tener 11 dígitos sin guiones");
    if (!Number.isFinite(amount) || (amount ?? 0) <= 0) return toast.error("Ingresá un monto mayor a cero");
    try {
      const empresa = await saveEmpresaGasto(draft.empresaCuit, draft.empresaNombre.trim());
      setGastos((current) => [...current, { ...draft, empresaNombre: empresa.data!.nombre, descripcion: draft.descripcion.trim(), monto: money(amount!) }]);
      setDialogOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar la empresa"); }
  };
  const submit = (form: FormValues) => {
    const monto = parseMoney(form.montoRetirado);
    if (!gastos.length) return toast.error("Agregá al menos un gasto para guardar la rendición");
    if (monto !== undefined && (!Number.isFinite(monto) || monto < 0)) return toast.error("El monto retirado no es válido");
    onSubmit({ motivo: form.motivo.trim(), ...(monto === undefined ? {} : { montoRetirado: monto }), gastos: gastos.map((gasto) => ({ ...gasto, monto: parseMoney(gasto.monto)!, empresaCuit: gasto.empresaCuit.replace(/\D/g, "") })) });
  };

  return <><form onSubmit={handleSubmit(submit)} noValidate className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground">
    <section className="grid gap-3 p-3 md:grid-cols-2"><div className="space-y-1.5 md:col-span-2"><label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Motivo</label><input className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={pending} {...register("motivo", { required: "El motivo es obligatorio" })} placeholder="Ej.: Viaje a Bariloche" />{errors.motivo && <p className="text-xs text-destructive">{errors.motivo.message}</p>}</div><div className="space-y-1.5"><label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Monto retirado (opcional)</label><input className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" disabled={pending} inputMode="decimal" placeholder="$ 0,00" {...register("montoRetirado", { validate: (value) => { const amount = parseMoney(value); return amount === undefined || (Number.isFinite(amount) && amount >= 0) || "Ingresá un monto válido"; } })} onBlur={(event) => { const amount = parseMoney(event.target.value); if (amount !== undefined && Number.isFinite(amount)) setValue("montoRetirado", money(amount)); }} />{errors.montoRetirado && <p className="text-xs text-destructive">{errors.montoRetirado.message}</p>}</div><div className="flex items-end"><div className="grid w-full grid-cols-3 divide-x divide-border overflow-hidden rounded-md border border-border bg-muted text-center"><div className="p-2"><p className="text-[11px] text-muted-foreground">Retirado</p><p className="text-sm font-semibold">{money(retirado)}</p></div><div className="p-2"><p className="text-[11px] text-muted-foreground">Gastado</p><p className="text-sm font-semibold">{money(total)}</p></div><div className="p-2"><p className="text-[11px] text-muted-foreground">{saldo >= 0 ? "A devolver" : "A reintegrar"}</p><p className="text-sm font-semibold">{money(Math.abs(saldo))}</p></div></div></div></section>
    <section className="border-t border-border p-3"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Gastos realizados</p><h2 className="mt-1 text-base font-semibold">Comprobantes de la rendición</h2></div><ActionButton onClick={openDialog} disabled={pending}><Plus />Agregar gasto</ActionButton></div>{gastos.length ? <div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[650px] text-sm"><thead className="bg-muted text-left text-[11px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Empresa</th><th className="px-3 py-2">Descripción</th><th className="px-3 py-2 text-right">Monto</th><th className="w-20 px-3 py-2" /></tr></thead><tbody>{gastos.map((gasto, index) => <tr key={`${gasto.empresaCuit}-${index}`} className="border-t border-border"><td className="px-3 py-1.5">{new Date(`${gasto.fecha}T12:00:00`).toLocaleDateString("es-AR")}</td><td className="px-3 py-1.5"><div className="font-medium">{gasto.empresaNombre}</div><div className="text-xs text-muted-foreground">CUIT {gasto.empresaCuit}</div></td><td className="px-3 py-1.5">{gasto.descripcion}</td><td className="px-3 py-1.5 text-right">{gasto.monto}</td><td className="px-3 py-1.5"><DeleteActionButton onClick={() => setGastos((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={pending}>Quitar</DeleteActionButton></td></tr>)}</tbody></table></div> : <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-muted px-3 py-6 text-sm text-muted-foreground"><FilePlus2 size={18} /><span>Agregá el primer gasto desde el botón principal.</span></div>}</section>
    <section className="flex flex-col gap-2 border-t border-border bg-muted p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Una vez guardada, la rendición no podrá editarse ni eliminarse.</p><div className="flex gap-2"><ActionButton variant="outline" onClick={onCancel} disabled={pending}>Cancelar</ActionButton><ActionButton type="submit" disabled={pending}>{pending ? "Guardando..." : <><Save />Guardar rendición</>}</ActionButton></div></section>
  </form>
  <Transition appear show={dialogOpen} as={Fragment}><Dialog as="div" className="relative z-50 font-preset" onClose={() => { if (!pending) setDialogOpen(false); }}><Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-foreground/20" /></Transition.Child><div className="fixed inset-0 overflow-y-auto p-3"><div className="flex min-h-full items-center justify-center"><Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"><Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"><div className="flex items-start justify-between border-b border-border px-3 py-3"><div><p className="text-xs font-medium uppercase tracking-[.16em] text-muted-foreground">Rendición de gastos</p><Dialog.Title className="mt-1 text-lg font-semibold">Agregar gasto</Dialog.Title><p className="mt-1 text-sm text-muted-foreground">Ingresá los datos del comprobante.</p></div><button type="button" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={18} /></button></div><div className="grid gap-3 p-3 md:grid-cols-2"><div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Fecha</label><input type="date" value={draft.fecha} onChange={(event) => setDraft((current) => ({ ...current, fecha: event.target.value }))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></div><div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">CUIT</label><input inputMode="numeric" maxLength={11} value={draft.empresaCuit} onChange={(event) => { const cuit = event.target.value.replace(/\D/g, ""); setDraft((current) => ({ ...current, empresaCuit: cuit })); setKnownCompany(false); if (cuit.length === 11) void lookupCompany(cuit); }} onBlur={() => void lookupCompany()} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Sin guiones" /></div><div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Empresa</label><input value={draft.empresaNombre} disabled={knownCompany} onChange={(event) => setDraft((current) => ({ ...current, empresaNombre: event.target.value }))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:bg-muted" placeholder="Razón social" /></div><div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Monto</label><input inputMode="decimal" value={draft.monto} onChange={(event) => setDraft((current) => ({ ...current, monto: event.target.value }))} onBlur={(event) => { const amount = parseMoney(event.target.value); if (Number.isFinite(amount)) setDraft((current) => ({ ...current, monto: money(amount!) })); }} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="$ 0,00" /></div><div className="space-y-1.5 md:col-span-2"><label className="text-xs font-medium text-muted-foreground">Descripción</label><input value={draft.descripcion} onChange={(event) => setDraft((current) => ({ ...current, descripcion: event.target.value }))} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" placeholder="Detalle del gasto" /></div></div><div className="flex justify-end gap-2 border-t border-border bg-muted px-3 py-2"><ActionButton variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</ActionButton><ActionButton onClick={() => void addGasto()}>Agregar gasto</ActionButton></div></Dialog.Panel></Transition.Child></div></div></Dialog></Transition></>;
}
