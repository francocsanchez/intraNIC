import {
  getLiessPresupuestos,
  getLiessTalleres,
  getLiessUnidad,
  saveLiessPresupuesto,
  updateLiessPresupuestoEstado,
  saveLiessTaller,
  setLiessTallerActivo,
  type LiessPresupuesto,
  type LiessTaller,
} from "@/api/liess/reparacionesAPI";
import { ActionButton } from "@/components/ui/action-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, Transition } from "@headlessui/react";
import { ClipboardPenLine, Edit3, Plus, Search, Wrench, X } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});
const formatPesosInput = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? `$ ${new Intl.NumberFormat("es-AR").format(Number(digits))}` : "";
};
const today = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
type Form = {
  fechaPedido: string;
  tipoUnidad: "nuevo" | "usado";
  interno: string;
  tallerId: string;
  kmInformados: string;
  costoArs: string;
  numeroPresupuesto: string;
  fechaIngresoTaller: string;
  fechaEgresoTaller: string;
  prioridad: "Alta" | "Media" | "Baja";
  valorInfo: string;
  porcentajeToma: string;
  detalle: string;
  observaciones: string;
};
const empty = (): Form => ({
  fechaPedido: today(),
  tipoUnidad: "nuevo",
  interno: "",
  tallerId: "",
  kmInformados: "",
  costoArs: "",
  numeroPresupuesto: "",
  fechaIngresoTaller: today(),
  fechaEgresoTaller: "",
  prioridad: "Media",
  valorInfo: "",
  porcentajeToma: "0",
  detalle: "",
  observaciones: "",
});
function Modal({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-foreground/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3">
            <Dialog.Panel className="w-full max-w-4xl rounded-lg border border-border bg-card shadow-xl">
              {children}
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
function BudgetDialog({
  close,
}: {
  close: () => void;
}) {
  const client = useQueryClient();
  const talleres = useQuery({
    queryKey: ["liess", "reparaciones", "talleres"],
    queryFn: () => getLiessTalleres(),
  });
  const [form, setForm] = useState<Form>(empty);
  const [unit, setUnit] = useState<LiessPresupuesto["unidad"] | null>(null);
  const change = (key: keyof Form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));
  const valueInfo = Number(form.valorInfo) || 0,
    percent = Number(form.porcentajeToma) || 0,
    ingreso = valueInfo * (1 - percent / 100),
    diferencia = valueInfo - ingreso,
    costoArs = Number(form.costoArs) || 0,
    costoSuperaDiferencia = costoArs > diferencia;
  const lookup = useMutation({
    mutationFn: () => getLiessUnidad(Number(form.interno), form.tipoUnidad),
    onSuccess: (data) => {
      setUnit(data.data);
      if (!form.kmInformados && data.data.kilometrosBase != null)
        change("kmInformados", String(data.data.kilometrosBase));
    },
    onError: (error: Error) => {
      setUnit(null);
      toast.error(error.message);
    },
  });
  const save = useMutation({
    mutationFn: () =>
      saveLiessPresupuesto(
        {
          ...form,
          tipoUnidad: form.tipoUnidad,
          interno: Number(form.interno),
          kmInformados: Number(form.kmInformados),
          costoArs: Number(form.costoArs),
          valorInfo: valueInfo,
          porcentajeToma: percent,
          fechaEgresoTaller: form.fechaEgresoTaller || null,
        },
      ),
    onSuccess: (data) => {
      toast.success(data.message);
      client.invalidateQueries({
        queryKey: ["liess", "reparaciones", "presupuestos"],
      });
      close();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const input =
    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <Modal close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (unit) save.mutate();
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
              LIESS · Reparaciones
            </p>
            <h2 className="text-xl font-semibold">
              Generar nuevo presupuesto
            </h2>
          </div>
          <button type="button" onClick={close}>
            <X />
          </button>
        </div>
        <div className="grid gap-3 p-3 md:grid-cols-3">
          <label className="text-sm font-medium">
            Fecha pedido
            <input
              required
              type="date"
              value={form.fechaPedido}
              onChange={(e) => change("fechaPedido", e.target.value)}
              className={input}
            />
          </label>
          <label className="md:col-span-2 text-sm font-medium">
            Interno
            <div className="flex gap-2">
              <select
                value={form.tipoUnidad}
                onChange={(e) => {
                  change("tipoUnidad", e.target.value as Form["tipoUnidad"]);
                  setUnit(null);
                }}
                className="h-9 w-28 shrink-0 rounded-md border border-input bg-background px-2 text-sm"
                aria-label="Tipo de unidad"
              >
                <option value="nuevo">Nuevo</option>
                <option value="usado">Usado</option>
              </select>
              <input
                required
                value={form.interno}
                onChange={(e) => {
                  change("interno", e.target.value);
                  setUnit(null);
                }}
                className={input}
              />
              <ActionButton
                type="button"
                size="icon-sm"
                variant="outline"
                title="Buscar interno"
                aria-label="Buscar interno"
                onClick={() => lookup.mutate()}
                disabled={!form.interno || lookup.isPending}
              >
                <Search />
              </ActionButton>
            </div>
          </label>
          {unit ? (
            <div className="md:col-span-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <strong>
                {unit.marca} {unit.version}
              </strong>
              <p className="mt-1 text-muted-foreground">
                Interno {unit.interno} · Chasis: {unit.chasis || "-"} · KM base:{" "}
                {unit.kilometrosBase ?? "-"}
              </p>
            </div>
          ) : null}
          <label className="text-sm font-medium">
            Taller
            <select
              required
              value={form.tallerId}
              onChange={(e) => change("tallerId", e.target.value)}
              className={input}
            >
              <option value="">Seleccionar</option>
              {talleres.data?.data.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.nombre} · {t.tipoTrabajo}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            KM informados
            <input
              required
              min="0"
              step="1"
              type="number"
              value={form.kmInformados}
              onChange={(e) => change("kmInformados", e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm font-medium">
            Costo ARS
            <input
              required
              inputMode="numeric"
              type="text"
              value={formatPesosInput(form.costoArs)}
              onChange={(e) => change("costoArs", e.target.value.replace(/\D/g, ""))}
              className={`${input} ${costoSuperaDiferencia ? "border-destructive ring-1 ring-destructive" : ""}`}
            />
          </label>
          <label className="text-sm font-medium">
            N.º presupuesto
            <input
              required
              value={form.numeroPresupuesto}
              onChange={(e) => change("numeroPresupuesto", e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm font-medium">
            Ingreso a taller
            <input
              required
              type="date"
              value={form.fechaIngresoTaller}
              onChange={(e) => change("fechaIngresoTaller", e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm font-medium">
            Prioridad
            <select
              value={form.prioridad}
              onChange={(e) => change("prioridad", e.target.value)}
              className={input}
            >
              {["Alta", "Media", "Baja"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Valor info
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={form.valorInfo}
              onChange={(e) => change("valorInfo", e.target.value)}
              className={input}
            />
          </label>
          <label className="text-sm font-medium">
            % toma
            <input
              required
              min="0"
              max="100"
              step="0.01"
              type="number"
              value={form.porcentajeToma}
              onChange={(e) => change("porcentajeToma", e.target.value)}
              className={input}
            />
          </label>
          <div className="text-sm font-medium">
            Valor ingreso
            <p className="mt-1 h-9 rounded-md border border-border bg-muted px-3 py-2">
              {money.format(ingreso)}
            </p>
          </div>
          <div className="text-sm font-medium">
            Diferencia
            <p className="mt-1 h-9 rounded-md border border-border bg-muted px-3 py-2">
              {money.format(diferencia)}
            </p>
          </div>
          {costoSuperaDiferencia ? (
            <p className="md:col-span-3 flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              <span aria-hidden="true">⚠</span>
              El presupuesto supera la diferencia.
            </p>
          ) : null}
          <label className="md:col-span-3 text-sm font-medium">
            Detalle
            <textarea
              value={form.detalle}
              onChange={(e) => change("detalle", e.target.value)}
              className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm"
            />
          </label>
          <label className="md:col-span-3 text-sm font-medium">
            Observaciones
            <textarea
              value={form.observaciones}
              onChange={(e) => change("observaciones", e.target.value)}
              className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-3">
          <ActionButton type="button" variant="outline" onClick={close}>
            Cancelar
          </ActionButton>
          <ActionButton type="submit" disabled={!unit || save.isPending}>
            {save.isPending ? "Guardando..." : "Guardar"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
function daysBetween(start: string, end: string | null) {
  if (!start || !end) return null;
  const milliseconds = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime();
  return Number.isFinite(milliseconds) && milliseconds >= 0 ? Math.round(milliseconds / 86_400_000) : null;
}
function statusClass(estado: LiessPresupuesto["estado"]) {
  return estado === "Aprobado" ? "bg-emerald-600 text-white" : estado === "Rechazado" ? "bg-destructive text-destructive-foreground" : "bg-amber-500 text-amber-950";
}
function BudgetStatusDialog({ item, close }: { item: LiessPresupuesto; close: () => void }) {
  const client = useQueryClient();
  const [estado, setEstado] = useState<LiessPresupuesto["estado"]>(item.estado);
  const [fechaIngresoTaller, setFechaIngresoTaller] = useState(item.fechaIngresoTaller);
  const [fechaEgresoTaller, setFechaEgresoTaller] = useState(item.fechaEgresoTaller ?? "");
  const blocked = estado === "Rechazado";
  const update = useMutation({
    mutationFn: () => updateLiessPresupuestoEstado(item._id, { estado, fechaIngresoTaller, fechaEgresoTaller: fechaEgresoTaller || null }),
    onSuccess: (data) => {
      toast.success(data.message);
      client.invalidateQueries({ queryKey: ["liess", "reparaciones", "presupuestos"] });
      close();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const days = daysBetween(fechaIngresoTaller, fechaEgresoTaller || null);
  const input = "mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground";
  return <Modal close={close}>
    <form onSubmit={(event) => { event.preventDefault(); update.mutate(); }}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div><h2 className="text-xl font-semibold">Gestionar presupuesto</h2><p className="text-xs text-muted-foreground">{item.unidad.interno} · {item.unidad.marca} {item.unidad.version}</p></div>
        <button type="button" onClick={close} aria-label="Cerrar"><X /></button>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-3">
        <label className="text-sm font-medium">Estado<select value={estado} onChange={(event) => setEstado(event.target.value as LiessPresupuesto["estado"])} className={input}><option>Pendiente</option><option>Aprobado</option><option>Rechazado</option></select></label>
        <label className="text-sm font-medium">F. ingreso<input required={!blocked} disabled={blocked} type="date" value={fechaIngresoTaller} onChange={(event) => setFechaIngresoTaller(event.target.value)} className={input} /></label>
        <label className="text-sm font-medium">F. egreso<input disabled={blocked} type="date" value={fechaEgresoTaller} onChange={(event) => setFechaEgresoTaller(event.target.value)} className={input} /></label>
        <div className="md:col-span-3 rounded-md border border-border bg-muted/30 p-3 text-sm"><p className="font-medium">Detalle</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.detalle || "Sin detalle informado."}</p></div>
        {item.observaciones ? <div className="md:col-span-3 rounded-md border border-border bg-muted/30 p-3 text-sm"><p className="font-medium">Observaciones</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.observaciones}</p></div> : null}
        <section className="md:col-span-3 rounded-md border border-border p-4"><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Resumen</p><div className="mt-3 grid gap-3 text-sm md:grid-cols-3"><div><p className="text-muted-foreground">Estado</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(estado)}`}>{estado}</span></div><div><p className="text-muted-foreground">Días de reparación</p><p className="mt-1 font-medium">{days == null ? "-" : `${days} día${days === 1 ? "" : "s"}`}</p></div><div><p className="text-muted-foreground">Valor de reparación</p><p className="mt-1 font-medium">{money.format(item.costoArs)}</p></div></div></section>
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-3"><ActionButton type="button" variant="outline" onClick={close}>Cancelar</ActionButton><ActionButton type="submit" disabled={update.isPending}>{update.isPending ? "Guardando..." : "Guardar cambios"}</ActionButton></div>
    </form>
  </Modal>;
}
function Workshops({ close }: { close: () => void }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["liess", "reparaciones", "talleres", "todos"],
    queryFn: () => getLiessTalleres(true),
  });
  const [edit, setEdit] = useState<LiessTaller | null>(null);
  const [nombre, setNombre] = useState(""),
    [tipo, setTipo] = useState("");
  const save = useMutation({
    mutationFn: () => saveLiessTaller({ nombre, tipoTrabajo: tipo }, edit?._id),
    onSuccess: () => {
      client.invalidateQueries({
        queryKey: ["liess", "reparaciones", "talleres"],
      });
      setEdit(null);
      setNombre("");
      setTipo("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: (t: LiessTaller) => setLiessTallerActivo(t._id, !t.activo),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["liess", "reparaciones", "talleres"],
      }),
  });
  return (
    <Modal close={close}>
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="text-xl font-semibold">Talleres</h2>
        <button onClick={close}>
          <X />
        </button>
      </div>
      <form
        className="grid gap-2 border-b border-border p-3 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <input
          required
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          required
          placeholder="Tipo de trabajo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <ActionButton type="submit" className="w-full">
          {edit ? "Guardar" : "Agregar"}
        </ActionButton>
      </form>
      <div className="max-h-[55vh] overflow-auto p-3 space-y-2">
        {query.data?.data.map((t) => (
          <div
            key={t._id}
            className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
          >
            <span>
              <strong>{t.nombre}</strong> · {t.tipoTrabajo}
              {!t.activo ? " · Inactivo" : ""}
            </span>
            <span className="flex gap-1">
              <ActionButton
                size="icon-sm"
                variant="outline"
                onClick={() => {
                  setEdit(t);
                  setNombre(t.nombre);
                  setTipo(t.tipoTrabajo);
                }}
              >
                <Edit3 />
              </ActionButton>
              <ActionButton
                size="sm"
                variant="outline"
                onClick={() => toggle.mutate(t)}
              >
                {t.activo ? "Desactivar" : "Reactivar"}
              </ActionButton>
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
export default function LiessReparacionesView() {
  const query = useQuery({
    queryKey: ["liess", "reparaciones", "presupuestos"],
    queryFn: getLiessPresupuestos,
  });
  const [create, setCreate] = useState(false),
    [workshops, setWorkshops] = useState(false),
    [statusItem, setStatusItem] = useState<LiessPresupuesto | null>(null);
  const rows = query.data?.data ?? [];
  return (
    <div className="font-preset space-y-3 bg-muted p-3">
      <section className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
            LIESS
          </p>
          <h1 className="text-xl font-semibold">Reparaciones</h1>
          <p className="text-sm text-muted-foreground">
            Presupuestos y seguimiento de ingreso a talleres.
          </p>
        </div>
        <div className="flex gap-2">
          <ActionButton variant="outline" onClick={() => setWorkshops(true)}>
            <Wrench />
            Talleres
          </ActionButton>
          <ActionButton onClick={() => setCreate(true)}>
            <Plus />
            Generar nuevo presupuesto
          </ActionButton>
        </div>
      </section>
      {query.isLoading ? (
        <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          Cargando presupuestos...
        </section>
      ) : (
        <section className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="min-w-[1320px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                {[
                  "F. pedido",
                  "Interno",
                  "Unidad",
                  "Taller",
                  "N.º",
                  "Ingreso",
                  "Egreso",
                  "Estado",
                  "Prioridad",
                  "Costo",
                  "V. ingreso",
                  "Acciones",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-border">
                  <td className="px-3 py-1.5">{r.fechaPedido}</td>
                  <td className="px-3 py-1.5 font-medium">
                    {r.unidad.interno}
                  </td>
                  <td className="px-3 py-1.5">
                    {r.unidad.marca} {r.unidad.version}
                  </td>
                  <td className="px-3 py-1.5">{r.tallerNombre}</td>
                  <td className="px-3 py-1.5">{r.numeroPresupuesto}</td>
                  <td className="px-3 py-1.5">{r.fechaIngresoTaller}</td>
                  <td className="px-3 py-1.5">{r.fechaEgresoTaller ?? "-"}</td>
                  <td className="px-3 py-1.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(r.estado)}`}>{r.estado}</span></td>
                  <td className="px-3 py-1.5">{r.prioridad}</td>
                  <td className="px-3 py-1.5">{money.format(r.costoArs)}</td>
                  <td className="px-3 py-1.5">
                    {money.format(r.valorIngreso)}
                  </td>
                  <td className="px-3 py-1.5">
                    <ActionButton
                      size="icon-sm"
                      variant="outline"
                      onClick={() => setStatusItem(r)}
                      title="Cambiar estado"
                      aria-label="Cambiar estado"
                    >
                      <ClipboardPenLine />
                    </ActionButton>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td
                    colSpan={12}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No hay presupuestos cargados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      )}
      {create ? <BudgetDialog close={() => setCreate(false)} /> : null}
      {statusItem ? <BudgetStatusDialog item={statusItem} close={() => setStatusItem(null)} /> : null}
      {workshops ? <Workshops close={() => setWorkshops(false)} /> : null}
    </div>
  );
}
