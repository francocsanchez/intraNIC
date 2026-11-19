import {
  createPresupuestoUsados,
  deleteTallerUsados,
  exportPresupuestosUsados,
  getCatalogoUsados,
  getDashboardTalleres,
  getPresupuestosUsados,
  getTalleresUsados,
  getUnidadUsada,
  saveTallerUsados,
  updatePresupuestoUsados,
  type PresupuestoUsados,
  type TallerUsados,
} from "@/api/usados/talleresAPI";
import BaseEChart from "@/components/charts/EChart";
import type { EChartsCoreOption } from "echarts/core";
import {
  ActionButton,
  DeleteActionButton,
  EditActionButton,
} from "@/components/ui/action-button";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Pencil, Plus, RotateCcw, Search, Settings, X } from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
import { toast } from "sonner";

type Form = {
  origen: "interno" | "externo";
  interno: string;
  dominio: string;
  marcaCodigo: string;
  modeloCodigo: string;
  tallerId: string;
  km: string;
  costo: string;
  valorInfo: string;
  porcentajeToma: string;
  observaciones: string;
  nroPresupuesto: string;
  prioridad: "Alta" | "Media" | "Baja";
  detalle: string;
  fechaPedido: string;
  fechaIngresoTaller: string;
  fechaEgresoTaller: string;
  esReingreso: boolean;
};
const today = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
const blank = (): Form => ({
  origen: "interno",
  interno: "",
  dominio: "",
  marcaCodigo: "",
  modeloCodigo: "",
  tallerId: "",
  km: "",
  costo: "",
  valorInfo: "",
  porcentajeToma: "0",
  observaciones: "",
  nroPresupuesto: "",
  prioridad: "Media",
  detalle: "",
  fechaPedido: today(),
  fechaIngresoTaller: "",
  fechaEgresoTaller: "",
  esReingreso: false,
});
const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const thousands = new Intl.NumberFormat("es-AR");
const formattedInteger = (value: string, currency = false) =>
  value ? `${currency ? "$ " : ""}${thousands.format(Number(value))}` : "";
const input =
  "mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(
        new Date(value),
      )
    : "-";
const stateClass: Record<PresupuestoUsados["estado"], string> = {
  Pendiente: "bg-amber-100 text-amber-900",
  Aprobado: "bg-emerald-100 text-emerald-900",
  Rechazado: "bg-red-100 text-red-900",
  Revisar: "bg-muted text-foreground",
};

type RepairChartOption = EChartsCoreOption & { series?: Array<{ name?: string; data?: number[] }>; xAxis?: { data?: number[] } };

function EChart({ option, className }: { option: EChartsCoreOption; className?: string }) {
  const source = option as unknown as RepairChartOption;
  const series = Array.isArray(source.series) ? source.series : [];
  if (series[0]?.name !== "En análisis" || series[1]?.name !== "Reparados") return <BaseEChart option={option} className={className} />;
  const averageDays = series[0].data as number[];
  const repairCount = series[1].data as number[];
  const months = source.xAxis?.data as number[];
  return <BaseEChart className={className} option={{
    color: ["#171717"],
    title: { text: "Promedio anualizado de días de reparación", left: "center", top: 4, textStyle: { fontSize: 13, fontWeight: 600 } },
    grid: { top: 42, left: 45, right: 25, bottom: 28, containLabel: true },
    tooltip: { trigger: "axis", formatter: (params: { dataIndex?: number }[]) => { const index = Number(params[0]?.dataIndex ?? 0); const value = averageDays[index] ?? 0; return `${months[index] ?? index + 1}<br/>Promedio: ${value} ${value === 1 ? "día" : "días"}<br/>Reparaciones: ${repairCount[index] ?? 0}`; } },
    xAxis: { type: "category", data: months.map((month) => new Intl.DateTimeFormat("es-AR", { month: "short" }).format(new Date(2026, month - 1, 1))), axisTick: { show: false } },
    yAxis: { type: "value", name: "Días", min: 0, axisLabel: { formatter: "{value} d" }, splitLine: { lineStyle: { color: "#ececec" } } },
    series: [{ name: "Promedio de reparación", type: "line", smooth: true, symbol: "circle", symbolSize: 8, lineStyle: { width: 2 }, label: { show: true, position: "top", formatter: "{c} días", fontSize: 11 }, data: averageDays }],
  }} />;
}

function Modal({
  children,
  close,
  wide = false,
}: {
  children: ReactNode;
  close: () => void;
  wide?: boolean;
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
            <Dialog.Panel
              className={`w-full rounded-lg border border-border bg-card shadow-xl ${wide ? "max-w-5xl" : "max-w-xl"}`}
            >
              {children}
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function PresupuestoDialog({ close }: { close: () => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState<Form>(blank);
  type UnidadEncontrada = { dominio: string; marca: string; modelo: string; km: number };
  const [unidad, setUnidadRaw] = useState<UnidadEncontrada | null>(null);
  const [modelSearch, setModelSearch] = useState("");
  const talleres = useQuery({ queryKey: ["talleres-usados", "talleres"], queryFn: () => getTalleresUsados() });
  const marcas = useQuery({ queryKey: ["talleres-usados", "marcas"], queryFn: () => getCatalogoUsados(), enabled: form.origen === "externo" });
  const modelos = useQuery({ queryKey: ["talleres-usados", "modelos", form.marcaCodigo, modelSearch], queryFn: () => getCatalogoUsados(form.marcaCodigo, modelSearch), enabled: form.origen === "externo" && Boolean(form.marcaCodigo) && modelSearch.length >= 3 });
  const set = (key: keyof Form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const lookup = useMutation({ mutationFn: () => getUnidadUsada(form.interno), onSuccess: (item) => { setUnidadRaw(item); set("km", String(item.km)); }, onError: (error: Error) => { setUnidadRaw(null); toast.error(error.message); } });
  const save = useMutation({ mutationFn: () => createPresupuestoUsados(form), onSuccess: () => { toast.success("Presupuesto cargado"); client.invalidateQueries({ queryKey: ["talleres-usados"] }); close(); }, onError: (error: Error) => toast.error(error.message) });
  const valid = Boolean(form.tallerId && form.km && form.costo && form.valorInfo && form.fechaPedido && (form.origen === "interno" ? unidad : form.dominio && form.marcaCodigo && form.modeloCodigo));
  const valorIngreso = Number(form.valorInfo || 0) * (1 - Number(form.porcentajeToma || 0) / 100);
  const diferencia = Number(form.valorInfo || 0) - valorIngreso;
  const superaDiferencia = Boolean(form.costo) && Number(form.costo) > diferencia;

  return <Modal close={close} wide>
    <form onSubmit={(event) => { event.preventDefault(); if (valid) save.mutate(); }}>
      <header className="flex items-center justify-between border-b border-border px-3 py-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Gestión de stock usados</p><Dialog.Title className="mt-1 text-xl font-semibold">Nuevo presupuesto</Dialog.Title></div><button type="button" onClick={close} className="rounded-md border border-border p-2"><X size={17} /></button></header>
      <div className="grid gap-3 p-3 md:grid-cols-3">
        <label className="text-sm font-medium">Origen<select value={form.origen} onChange={(event) => { set("origen", event.target.value); setUnidadRaw(null); set("esReingreso", false); }} className={input}><option value="interno">Unidad del sistema</option><option value="externo">Unidad externa</option></select></label>
        <label className="text-sm font-medium">F. Pedido<input required type="date" value={form.fechaPedido} onChange={(event) => set("fechaPedido", event.target.value)} className={input} /></label>
        <label className="text-sm font-medium">Taller<select required value={form.tallerId} onChange={(event) => set("tallerId", event.target.value)} className={input}><option value="">Seleccionar taller</option>{talleres.data?.data.map((item) => <option key={item._id} value={item._id}>{item.nombre}</option>)}</select></label>
        {form.origen === "interno" ? <><label className="text-sm font-medium">Interno<div className="mt-1 flex gap-2"><input value={form.interno} onChange={(event) => { set("interno", event.target.value); setUnidadRaw(null); }} className="h-9 min-w-0 flex-1 rounded-md border border-input px-3 text-sm" /><ActionButton type="button" size="icon-sm" variant="outline" disabled={!form.interno || lookup.isPending} onClick={() => lookup.mutate()}><Search size={15} /></ActionButton></div></label>{unidad ? <div className="flex min-w-0 items-center truncate rounded-md border border-border bg-muted px-3 text-sm md:col-span-2"><b className="mr-1">Unidad:</b><span className="truncate">{unidad.marca} · {unidad.modelo} · {unidad.dominio || "sin dominio"}</span></div> : null}</> : <><label className="text-sm font-medium">Dominio<input value={form.dominio} onChange={(event) => set("dominio", event.target.value)} className={input} /></label><label className="text-sm font-medium">Marca<select value={form.marcaCodigo} onChange={(event) => { set("marcaCodigo", event.target.value); set("modeloCodigo", ""); }} className={input}><option value="">Seleccionar marca</option>{marcas.data?.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}</select></label><label className="text-sm font-medium">Buscar modelo<input value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} placeholder="3 caracteres" className={input} /></label><label className="text-sm font-medium">Modelo<select value={form.modeloCodigo} onChange={(event) => set("modeloCodigo", event.target.value)} className={input}><option value="">Seleccionar modelo</option>{modelos.data?.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}</select></label></>}
        <label className="text-sm font-medium">KM informado<input required inputMode="numeric" value={formattedInteger(form.km)} onChange={(event) => set("km", event.target.value.replace(/\D/g, ""))} className={input} /></label>
        <label className="relative text-sm font-medium">Costo ARS{superaDiferencia ? <span className="absolute right-0 top-0 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">Supera diferencia</span> : null}<input required inputMode="numeric" value={formattedInteger(form.costo, true)} onChange={(event) => set("costo", event.target.value.replace(/\D/g, ""))} className={`${input} ${superaDiferencia ? "border-destructive text-destructive" : ""}`} /></label>
        <label className="text-sm font-medium">Valor info ARS<input required inputMode="numeric" value={formattedInteger(form.valorInfo, true)} onChange={(event) => set("valorInfo", event.target.value.replace(/\D/g, ""))} className={input} /></label>
        <label className="text-sm font-medium">% toma<input inputMode="decimal" value={form.porcentajeToma} onChange={(event) => set("porcentajeToma", event.target.value)} className={input} /></label>
        <label className="text-sm font-medium">Valor ingreso<input readOnly value={money.format(valorIngreso)} className={`${input} bg-muted`} /></label>
        <label className="text-sm font-medium">Diferencia<input readOnly value={money.format(diferencia)} className={`${input} bg-muted`} /></label>
        <label className="text-sm font-medium">Prioridad<select value={form.prioridad} onChange={(event) => set("prioridad", event.target.value)} className={input}>{["Alta", "Media", "Baja"].map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium">Nro. presupuesto<input value={form.nroPresupuesto} onChange={(event) => set("nroPresupuesto", event.target.value)} className={input} /></label>
        {form.origen === "externo" ? <label className="flex h-9 items-center self-end gap-2 rounded-md border border-input px-3 text-sm font-medium"><input type="checkbox" checked={form.esReingreso} onChange={(event) => set("esReingreso", event.target.checked)} />Es re-ingreso</label> : null}
        <label className="text-sm font-medium md:col-span-3">Detalle<textarea value={form.detalle} onChange={(event) => set("detalle", event.target.value)} className="mt-1 w-full rounded-md border border-input p-2 text-sm" rows={2} /></label>
        <label className="text-sm font-medium md:col-span-3">Observaciones<textarea value={form.observaciones} onChange={(event) => set("observaciones", event.target.value)} className="mt-1 w-full rounded-md border border-input p-2 text-sm" rows={2} /></label>
      </div>
      <footer className="flex justify-end gap-2 border-t border-border p-3"><ActionButton variant="outline" onClick={close}>Cancelar</ActionButton><ActionButton type="submit" disabled={!valid || save.isPending}>{save.isPending ? "Guardando..." : "Guardar"}</ActionButton></footer>
    </form>
  </Modal>;
}
function TalleresDialog({ close }: { close: () => void }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["talleres-usados", "talleres", "all"],
    queryFn: () => getTalleresUsados(true),
  });
  const [edit, setEdit] = useState<TallerUsados | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipoTrabajo, setTipo] = useState("");
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["talleres-usados", "talleres"] });
  const save = useMutation({
    mutationFn: () =>
      saveTallerUsados(
        { nombre, tipoTrabajo, activo: edit?.activo ?? true },
        edit?._id,
      ),
    onSuccess: () => {
      toast.success("Taller guardado");
      setEdit(null);
      setNombre("");
      setTipo("");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: deleteTallerUsados,
    onSuccess: () => {
      toast.success("Taller eliminado");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  return (
    <Modal close={close} wide>
      <header className="flex items-center justify-between border-b border-border p-3">
        <Dialog.Title className="text-xl font-semibold">Talleres</Dialog.Title>
        <button type="button" onClick={close}>
          <X size={18} />
        </button>
      </header>
      <div className="grid gap-3 p-3 md:grid-cols-[1fr_20rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {query.data?.data.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="p-2 font-medium">{item.nombre}</td>
                  <td>{item.tipoTrabajo || "-"}</td>
                  <td>{item.activo ? "Activo" : "Inactivo"}</td>
                  <td className="flex justify-end gap-1 p-1">
                    <EditActionButton
                      onClick={() => {
                        setEdit(item);
                        setNombre(item.nombre);
                        setTipo(item.tipoTrabajo);
                      }}
                    >
                      <Pencil size={14} />
                    </EditActionButton>
                    <DeleteActionButton
                      onClick={() => {
                        if (window.confirm(`¿Eliminar ${item.nombre}?`))
                          remove.mutate(item._id);
                      }}
                    >
                      <X size={14} />
                    </DeleteActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form
          className="space-y-2 rounded-md border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (nombre.trim()) save.mutate();
          }}
        >
          <h2 className="font-semibold">
            {edit ? "Editar taller" : "Nuevo taller"}
          </h2>
          <input
            required
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Nombre"
            className={input}
          />
          <input
            value={tipoTrabajo}
            onChange={(event) => setTipo(event.target.value)}
            placeholder="Tipo de trabajo"
            className={input}
          />
          <ActionButton type="submit" disabled={save.isPending}>
            {edit ? "Guardar" : "Crear"}
          </ActionButton>
        </form>
      </div>
    </Modal>
  );
}

export default function TalleresUsadosView() {
  const client = useQueryClient();
  const [dialog, setDialog] = useState<"new" | "talleres" | null>(null);
  const [detail, setDetail] = useState<PresupuestoUsados | null>(null);
  const [manage, setManage] = useState<PresupuestoUsados | null>(null);
  const [filters, setFilters] = useState({
    estado: "",
    interno: "",
    dominio: "",
  });
  const [page, setPage] = useState(0);
  const [dashboardYear, setDashboardYear] = useState(() => new Date().getFullYear());
  const list = useQuery({
    queryKey: ["talleres-usados", "presupuestos", filters],
    queryFn: () => getPresupuestosUsados(filters),
  });
  const statusPresupuestos = useQuery({
    queryKey: ["talleres-usados", "presupuestos", "status-counts"],
    queryFn: () => getPresupuestosUsados(),
  });
  const allPresupuestos = useQuery({
    queryKey: ["talleres-usados", "presupuestos", "historial"],
    queryFn: () => getPresupuestosUsados(),
    enabled: Boolean(detail),
  });
  const dashboard = useQuery({
    queryKey: ["talleres-usados", "dashboard", dashboardYear],
    queryFn: () => getDashboardTalleres(dashboardYear),
  });
  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updatePresupuestoUsados(id, payload),
    onSuccess: () => {
      toast.success("Presupuesto actualizado");
      setManage(null);
      client.invalidateQueries({ queryKey: ["talleres-usados"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const items = list.data?.data ?? [];
  const statusCounts = (statusPresupuestos.data?.data ?? []).reduce<Record<string, number>>(
    (counts, item) => ({ ...counts, [item.estado]: (counts[item.estado] ?? 0) + 1 }),
    {},
  );
  const pageCount = Math.max(1, Math.ceil(items.length / 40));
  const pageItems = items.slice(page * 40, page * 40 + 40);
  const sameUnit = detail
    ? (allPresupuestos.data?.data ?? items).filter((item) =>
        detail.interno
          ? item.interno === detail.interno
          : item.esExterno && item.dominio === detail.dominio,
      )
    : [];
  const pendingTotal = sameUnit.filter((item) => item.estado === "Pendiente" || item.estado === "Revisar").reduce((total, item) => total + item.costo, 0);
  const approvedTotal = sameUnit.filter((item) => item.estado === "Aprobado").reduce((total, item) => total + item.costo, 0);
  const repairBudgets = sameUnit.filter((item) => item.estado !== "Rechazado");
  const repairTotal = repairBudgets.reduce((total, item) => total + item.costo, 0);
  const exportFile = async () => {
    try {
      const blob = await exportPresupuestosUsados();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `presupuestos-usados-${today()}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo exportar",
      );
    }
  };
  const rows = dashboard.data?.rows ?? [];
  const dashboardYears = Array.from(
    new Set([dashboardYear, ...(dashboard.data?.availableYears ?? [])]),
  ).sort((left, right) => right - left);
  return (
    <div className="font-preset space-y-3 bg-muted p-3">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
            Gestión de stock usados
          </p>
          <h1 className="text-xl font-semibold">Talleres y presupuestos</h1>
        </div>
        <div className="flex gap-2">
          <ActionButton variant="outline" onClick={() => setDialog("talleres")}>
            <Settings size={16} />
            Talleres
          </ActionButton>
          <ActionButton variant="outline" onClick={exportFile}>
            <Download size={16} />
            Excel
          </ActionButton>
          <ActionButton onClick={() => setDialog("new")}>
            <Plus size={16} />
            Nuevo presupuesto
          </ActionButton>
        </div>
      </section>
      <section>
        <div className="relative min-h-64 rounded-lg border border-border bg-card p-2">
          <div className="absolute right-3 top-2 z-10">
            <label className="flex items-center gap-2 text-sm font-medium">
              Año
              <select
                value={dashboardYear}
                onChange={(event) => setDashboardYear(Number(event.target.value))}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                {dashboardYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          </div>
          <EChart
            className="h-64 min-h-64"
            option={{
              tooltip: { trigger: "axis" },
              xAxis: { type: "category", data: rows.map((row) => row.month) },
              yAxis: { type: "value" },
              series: [
                {
                  name: "En análisis",
                  type: "bar",
                  data: rows.map((row) => row.analisis),
                },
                {
                  name: "Reparados",
                  type: "line",
                  data: rows.map((row) => row.reparado),
                },
              ],
            }}
          />
        </div>
      </section>
      <section className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap gap-2 border-b p-3">
          <select
            value={filters.estado}
            onChange={(event) => {
              setPage(0);
              setFilters((current) => ({
                ...current,
                estado: event.target.value,
              }));
            }}
            className="h-9 rounded-md border px-2 text-sm"
          >
            <option value="">Todos los estados</option>
            {["Pendiente", "Aprobado", "Rechazado", "Revisar"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input
            value={filters.interno}
            onChange={(event) => {
              setPage(0);
              setFilters((current) => ({
                ...current,
                interno: event.target.value,
              }));
            }}
            placeholder="Interno"
            className="h-9 rounded-md border px-2 text-sm"
          />
          <input
            value={filters.dominio}
            onChange={(event) => {
              setPage(0);
              setFilters((current) => ({
                ...current,
                dominio: event.target.value,
              }));
            }}
            placeholder="Dominio"
            className="h-9 rounded-md border px-2 text-sm"
          />
          <div className="ml-auto flex items-center gap-1">
            {(["Pendiente", "Aprobado", "Rechazado", "Revisar"] as const).map((estado) => {
              const tones = { Pendiente: "border-amber-500 text-amber-700", Aprobado: "border-emerald-500 text-emerald-700", Rechazado: "border-red-500 text-red-700", Revisar: "border-muted-foreground text-foreground" };
              return <button key={estado} type="button" onClick={() => { setPage(0); setFilters((current) => ({ ...current, estado: current.estado === estado ? "" : estado })); }} className={`border-b-2 px-2 py-1 text-xs transition-colors hover:bg-muted ${tones[estado]} ${filters.estado === estado ? "bg-muted font-semibold" : ""}`}>{estado} <span className="font-semibold">{statusCounts[estado] ?? 0}</span></button>;
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] w-full text-sm">
            <thead className="bg-muted text-left text-[11px] uppercase text-muted-foreground">
              <tr>
                {[
                  "F. Pedido",
                  "Tipo / Interno",
                  "Unidad",
                  "KM",
                  "Taller",
                  "Costo",
                  "Estado",
                  "Ingreso",
                  "Egreso",
                  "Acciones",
                ].map((item) => (
                  <th key={item} className="p-2">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.isLoading ? (
                <tr>
                  <td className="p-8 text-center" colSpan={10}>
                    Cargando...
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <tr key={item._id} className="border-t hover:bg-muted">
                    <td className="p-2 whitespace-nowrap">
                      {date(item.fechaPedido)}
                    </td>
                    <td className="p-2 whitespace-nowrap font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{item.esExterno ? "Externo" : item.interno || "-"}</span>
                        {item.esReingreso ? <span title="Re-ingreso"><RotateCcw size={14} strokeWidth={1.8} className="text-muted-foreground" aria-label="Re-ingreso" /></span> : null}
                      </div>
                    </td>
                    <td className="max-w-[300px] p-2">
                      <div
                        className="truncate"
                        title={`${item.marca} · ${item.modelo}${item.dominio ? ` · ${item.dominio}` : ""}`}
                      >
                        {item.marca} · {item.modelo}
                        {item.dominio ? ` · ${item.dominio}` : ""}
                      </div>
                    </td>
                    <td>{new Intl.NumberFormat("es-AR").format(item.km)}</td>
                    <td>{item.tallerNombre}</td>
                    <td
                      className={
                        item.costo > item.diferencia
                          ? "font-semibold text-destructive"
                          : ""
                      }
                    >
                      {money.format(item.costo)}
                    </td>
                    <td>
                      <span
                        className={`rounded px-2 py-1 text-xs ${stateClass[item.estado]}`}
                      >
                        {item.estado}
                      </span>
                    </td>
                    <td>{date(item.fechaIngresoTaller)}</td>
                    <td>{date(item.fechaEgresoTaller)}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <EditActionButton
                          onClick={() => setDetail(item)}
                          title="Ver más"
                        >
                          <Eye size={15} />
                        </EditActionButton>
                        <EditActionButton
                          onClick={() => setManage(item)}
                          title="Gestionar"
                        >
                          <Pencil size={15} />
                        </EditActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <footer className="flex items-center justify-between border-t px-3 py-2 text-sm">
          <span>
            {items.length} registros · página {page + 1} de {pageCount}
          </span>
          <div className="flex gap-2">
            <ActionButton
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </ActionButton>
            <ActionButton
              variant="outline"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </ActionButton>
          </div>
        </footer>
      </section>
      {dialog === "new" ? (
        <PresupuestoDialog close={() => setDialog(null)} />
      ) : null}
      {dialog === "talleres" ? (
        <TalleresDialog close={() => setDialog(null)} />
      ) : null}
      {detail ? (
        <Modal close={() => setDetail(null)} wide>
          <header className="flex items-start justify-between border-b p-4">
            <div>
              <Dialog.Title className="text-xl font-semibold">
                Presupuestos de la unidad
              </Dialog.Title>
              <p className="mt-1 text-sm text-muted-foreground">
                {detail.interno ? `Interno ${detail.interno}` : "Unidad externa"} · {detail.dominio || `${detail.marca} ${detail.modelo}`}
              </p>
            </div>
            <button type="button" onClick={() => setDetail(null)} className="rounded p-1 text-muted-foreground hover:bg-muted">
              <X size={17} />
            </button>
          </header>
          <div className="space-y-3 p-4">
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="bg-muted text-left text-xs uppercase text-muted-foreground"><tr><th className="p-2">F. Pedido</th><th>Nro.</th><th>Taller</th><th>Estado</th><th>Seguimiento</th><th className="text-right">Costo</th><th className="p-2 text-right">Costo + IVA</th></tr></thead>
                <tbody>{allPresupuestos.isLoading ? <tr><td className="p-5 text-center text-muted-foreground" colSpan={7}>Cargando historial…</td></tr> : sameUnit.sort((a, b) => b.fechaPedido.localeCompare(a.fechaPedido)).map((item) => <tr key={item._id} className="border-t"><td className="p-2 whitespace-nowrap">{date(item.fechaPedido)}</td><td>{item.nroPresupuesto || "Sin número"}</td><td>{item.tallerNombre}</td><td><span className={`rounded px-2 py-1 text-xs ${stateClass[item.estado]}`}>{item.estado}</span></td><td>{item.fechaEgresoTaller ? "Reparado" : item.fechaIngresoTaller ? "En taller" : "-"}</td><td className="text-right whitespace-nowrap">{money.format(item.costo)}</td><td className="p-2 text-right whitespace-nowrap">{money.format(item.costoConIva)}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border p-3"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Pendiente de aprobación</p><p className="mt-1 font-semibold">{money.format(pendingTotal)}</p><p className="text-xs text-muted-foreground">{money.format(pendingTotal * 1.21)} con IVA</p></div>
              <div className="rounded-md border p-3"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Total aprobado</p><p className="mt-1 font-semibold">{money.format(approvedTotal)}</p><p className="text-xs text-muted-foreground">{money.format(approvedTotal * 1.21)} con IVA</p></div>
              <div className="rounded-md border p-3"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Total de {repairBudgets.length} presupuestos</p><p className="mt-1 font-semibold">{money.format(repairTotal)}</p><p className="text-xs text-muted-foreground">{money.format(repairTotal * 1.21)} con IVA</p></div>
            </div>
          </div>
        </Modal>
      ) : null}
      {manage ? (
        <Modal close={() => setManage(null)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              update.mutate({
                id: manage._id,
                payload: {
                  estado: manage.estado,
                  fechaIngresoTaller: manage.fechaIngresoTaller
                    ? manage.fechaIngresoTaller.slice(0, 10)
                    : "",
                  fechaEgresoTaller: manage.fechaEgresoTaller
                    ? manage.fechaEgresoTaller.slice(0, 10)
                    : "",
                  detalle: manage.detalle,
                  observaciones: manage.observaciones,
                },
              });
            }}
          >
            <header className="border-b p-3">
              <Dialog.Title className="font-semibold">
                Gestionar presupuesto
              </Dialog.Title>
            </header>
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              <label>
                Estado
                <select
                  value={manage.estado}
                  onChange={(event) =>
                    setManage({
                      ...manage,
                      estado: event.target.value as PresupuestoUsados["estado"],
                    })
                  }
                  className={input}
                >
                  {["Pendiente", "Aprobado", "Rechazado", "Revisar"].map(
                    (item) => (
                      <option key={item}>{item}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Ingreso
                <input
                  type="date"
                  value={manage.fechaIngresoTaller?.slice(0, 10) || ""}
                  onChange={(event) =>
                    setManage({
                      ...manage,
                      fechaIngresoTaller: event.target.value || null,
                    })
                  }
                  className={input}
                />
              </label>
              <label>
                Egreso
                <input
                  type="date"
                  value={manage.fechaEgresoTaller?.slice(0, 10) || ""}
                  onChange={(event) =>
                    setManage({
                      ...manage,
                      fechaEgresoTaller: event.target.value || null,
                    })
                  }
                  className={input}
                />
              </label>
              <label className="sm:col-span-2">
                Detalle
                <textarea
                  value={manage.detalle}
                  onChange={(event) =>
                    setManage({ ...manage, detalle: event.target.value })
                  }
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
              <label className="sm:col-span-2">
                Observaciones
                <textarea
                  value={manage.observaciones}
                  onChange={(event) =>
                    setManage({ ...manage, observaciones: event.target.value })
                  }
                  className="mt-1 w-full rounded border p-2"
                />
              </label>
            </div>
            <footer className="flex justify-end gap-2 border-t p-3">
              <ActionButton variant="outline" onClick={() => setManage(null)}>
                Cancelar
              </ActionButton>
              <ActionButton type="submit" disabled={update.isPending}>
                Guardar
              </ActionButton>
            </footer>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
