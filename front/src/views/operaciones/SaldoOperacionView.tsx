import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";
import {
  exportSaldoOperacionSnapshot,
  getSaldoOperacionSnapshot,
  getSaldoOperacionSnapshotFilters,
  getSaldoOperacionSnapshotSummary,
  getSaldoOperacionUsuarios,
  updateSaldoOperacionSnapshotCancelacion,
  updateSaldoOperacionUsuario,
} from "@/services/operacionesService";
import type { SaldoOperacionSnapshotItem, SaldoOperacionUsuario } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, GitBranch, LoaderCircle, Pencil, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 60;
const ALL = "__TODAS__";
type Section = "conSaldo" | "canceladas";

const money = (value: number | null) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value ?? 0);
const download = (blob: Blob, name: string) => { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };

export default function SaldoOperacionView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>("conSaldo");
  const [sucursal, setSucursal] = useState(ALL);
  const [ubicacion, setUbicacion] = useState(ALL);
  const [usuario, setUsuario] = useState(ALL);
  const [vendedor, setVendedor] = useState(ALL);
  const [operacionDraft, setOperacionDraft] = useState("");
  const [operacion, setOperacion] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<SaldoOperacionSnapshotItem | null>(null);
  const [fechaCancelacion, setFechaCancelacion] = useState("");
  const [usuarioPending, setUsuarioPending] = useState<SaldoOperacionSnapshotItem | null>(null);
  const [usuarioSearch, setUsuarioSearch] = useState("");
  const params = { section, sucursal: sucursal === ALL ? undefined : sucursal, ubicacion: ubicacion === ALL ? undefined : ubicacion, usuario: usuario === ALL ? undefined : usuario, vendedor: vendedor === ALL ? undefined : vendedor, operacion: operacion || undefined, page, limit: PAGE_SIZE };
  const table = useQuery({ queryKey: ["saldo-operacion-snapshot", params], queryFn: ({ signal }) => getSaldoOperacionSnapshot(params, signal), refetchOnWindowFocus: false });
  const filters = useQuery({ queryKey: ["saldo-operacion-snapshot-filters"], queryFn: getSaldoOperacionSnapshotFilters, staleTime: 60_000 });
  const summary = useQuery({ queryKey: ["saldo-operacion-snapshot-summary", sucursal, ubicacion, usuario, vendedor], queryFn: ({ signal }) => getSaldoOperacionSnapshotSummary({ sucursal: sucursal === ALL ? undefined : sucursal, ubicacion: ubicacion === ALL ? undefined : ubicacion, usuario: usuario === ALL ? undefined : usuario, vendedor: vendedor === ALL ? undefined : vendedor }, signal), staleTime: 30_000 });
  const usuarioSearchReady = usuarioSearch.trim().length >= 3;
  const usuarios = useQuery({ queryKey: ["saldo-operacion-usuarios", usuarioSearch], queryFn: ({ signal }) => getSaldoOperacionUsuarios(usuarioSearch.trim(), signal), enabled: Boolean(usuarioPending) && usuarioSearchReady, staleTime: 60_000 });
  const update = useMutation({
    mutationFn: () => pending ? updateSaldoOperacionSnapshotCancelacion(pending.codigoOperacion, fechaCancelacion) : Promise.reject(new Error("No hay operacion seleccionada")),
    onSuccess: () => { toast.success("Fecha de cancelacion actualizada"); setPending(null); queryClient.invalidateQueries({ queryKey: ["saldo-operacion-snapshot"] }); queryClient.invalidateQueries({ queryKey: ["saldo-operacion-cancelacion-analysis"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const exporter = useMutation({ mutationFn: () => exportSaldoOperacionSnapshot(params), onSuccess: (blob) => { download(blob, `saldo-operacion-${new Date().toISOString().slice(0, 10)}.xlsx`); toast.success("Excel exportado"); }, onError: (error: Error) => toast.error(error.message) });
  const updateUsuario = useMutation({
    mutationFn: (usuario: SaldoOperacionUsuario) => usuarioPending ? updateSaldoOperacionUsuario(usuarioPending.codigoOperacion, usuario.codigo) : Promise.reject(new Error("No hay operacion seleccionada")),
    onSuccess: () => { toast.success("Usuario de operacion actualizado"); setUsuarioPending(null); setUsuarioSearch(""); queryClient.invalidateQueries({ queryKey: ["saldo-operacion-snapshot"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  if (table.isLoading) return <Loading />;
  if (table.isError) return <div className="p-4 text-destructive">{table.error.message}</div>;
  const rows = table.data?.data ?? [];
  const pagination = table.data?.pagination;
  const searchOperacion = () => { setOperacion(operacionDraft.trim()); setPage(1); };

  return <div className="space-y-3 bg-muted p-2 font-preset">
    <section className="space-y-2 rounded-md border border-border bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Sucursal" value={sucursal} onChange={(event) => { setSucursal(event.target.value); setPage(1); }} className="h-9 min-w-40 rounded-md border border-border bg-background px-2 text-xs"><option value={ALL}>Todas las sucursales</option>{filters.data?.meta.sucursales.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select aria-label="Usuario" value={usuario} onChange={(event) => { setUsuario(event.target.value); setPage(1); }} className="h-9 min-w-40 rounded-md border border-border bg-background px-2 text-xs"><option value={ALL}>Todos los usuarios</option>{filters.data?.meta.usuarios.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select aria-label="Vendedor" value={vendedor} onChange={(event) => { setVendedor(event.target.value); setPage(1); }} className="h-9 min-w-40 rounded-md border border-border bg-background px-2 text-xs"><option value={ALL}>Todos los vendedores</option>{filters.data?.meta.vendedores.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <span className="whitespace-nowrap text-xs text-muted-foreground">Can. Registros: <b className="text-foreground">{pagination?.total ?? 0}</b></span>
        <select aria-label="Sección" value={section} onChange={(event) => { setSection(event.target.value as Section); setPage(1); }} className="h-9 rounded-md border border-border bg-background px-2 text-xs"><option value="conSaldo">Con saldo</option><option value="canceladas">Canceladas</option></select>
        <select aria-label="Ubicación" value={ubicacion} onChange={(event) => { setUbicacion(event.target.value); setPage(1); }} className="h-9 min-w-44 rounded-md border border-border bg-background px-2 text-xs"><option value={ALL}>Todas las ubicaciones</option>{filters.data?.meta.ubicaciones.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <Button size="sm" variant="outline" disabled={exporter.isPending} onClick={() => exporter.mutate()}><Download /> Exportar</Button>
        <Button size="sm" variant="outline" onClick={() => navigate(paths.analisis.saldoOperacionCancelaciones)}><GitBranch /> Análisis de cancelación</Button>
      </div>
      <div className="mb-1 flex items-center justify-between text-[11px]"><span>Saldos restantes a cobrar por modelo</span>{summary.isFetching && <LoaderCircle className="size-3 animate-spin" />}</div>
      <div className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-6">
        {summary.data?.data.map((item) => <div key={item.modelo} className="rounded-md border border-border bg-muted p-2"><div className="text-[11px] tracking-wide">{item.modelo}</div><div className="text-base text-destructive">{money(item.saldo)}</div></div>)}
        <div className="rounded-md border border-border bg-muted p-2"><div className="text-[11px]">Crédito no facturado</div><div className="text-base text-destructive">{money(summary.data?.creditoTotal ?? 0)}</div></div>
        <div className="rounded-md border border-border bg-muted p-2"><div className="text-[11px]">Usado no cancelado</div><div className="text-base text-destructive">{money(summary.data?.usadoTotal ?? 0)}</div></div>
      </div>
    </section>

    <section className="overflow-x-auto rounded-md border border-border bg-card"><div className="flex items-center justify-end gap-2 border-b border-border p-2"><input aria-label="Buscar operación" inputMode="numeric" value={operacionDraft} onChange={(event) => setOperacionDraft(event.target.value.replace(/\D/g, ""))} onKeyDown={(event) => { if (event.key === "Enter") searchOperacion(); }} placeholder="Buscar OP" className="h-8 w-32 rounded-md border border-border bg-background px-2 text-xs" /><Button size="sm" variant="outline" onClick={searchOperacion}><Search /> Buscar</Button></div><table className="w-full min-w-[1450px] text-xs"><thead className="border-b border-border bg-muted text-left"><tr>{["OP", "Cliente", "Sucursal", "Vendedor", "Usuario operación", "Modelo", "Versión", "Ubicación", "F. asignación", "Días asignada", "F. cancelación", "Días cancelación", "Saldo"].map((label) => <th key={label} className="px-2 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.codigoOperacion} className="border-b border-border last:border-0"><td className="px-2 py-1.5">{row.codigoOperacion}</td><td className="px-2 py-1.5">{row.clienteNombre}</td><td className="px-2 py-1.5">{row.sucursal}</td><td className="px-2 py-1.5">{row.vendedor}</td><td className="px-2 py-1.5"><Button size="xs" variant="outline" onClick={() => { setUsuarioPending(row); setUsuarioSearch(""); }}><Pencil /> {row.nombreUsuarioOperacion || row.usuarioOperacion}</Button></td><td className="px-2 py-1.5">{row.modeloGeneral}</td><td className="px-2 py-1.5">{row.version}</td><td className="px-2 py-1.5">{row.ubicacion}</td><td className="px-2 py-1.5">{row.fechaAsignacion ?? "-"}</td><td className="px-2 py-1.5">{row.diasAsignada ?? "-"}</td><td className="px-2 py-1.5"><Button size="xs" variant="outline" onClick={() => { setPending(row); setFechaCancelacion(row.fechaCancelacion ?? new Date().toISOString().slice(0, 10)); }}>{row.fechaCancelacion ?? "Ingresar fecha"}</Button></td><td className="px-2 py-1.5">{row.diasHastaCancelacion ?? "-"}</td><td className={`px-2 py-1.5 font-medium ${row.saldo > 0 ? "text-destructive" : "text-green-700"}`}>{money(row.saldo)}</td></tr>)}</tbody></table>{!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">No hay operaciones para los filtros seleccionados.</p>}</section>
    <div className="flex items-center justify-end gap-2"><Button size="sm" variant="outline" disabled={!pagination || pagination.page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span className="text-xs">Página {pagination?.page ?? 1} de {pagination?.totalPages ?? 1}</span><Button size="sm" variant="outline" disabled={!pagination?.hasNextPage} onClick={() => setPage((value) => value + 1)}>Siguiente</Button></div>
    {pending && <div className="fixed inset-0 z-50 bg-foreground/30 p-4" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="rounded-md border border-border bg-card p-4" style={{ width: "min(28rem, calc(100vw - 2rem))", height: "fit-content", flex: "none" }}><h2 className="text-base font-semibold">Confirmar cancelación</h2><div className="mt-3 space-y-2 text-sm"><p>OP: <b>{pending.codigoOperacion}</b></p><p>F. asignación: <b>{pending.fechaAsignacion ?? "Sin asignación"}</b></p><label className="grid gap-1">F. cancelación<input type="date" value={fechaCancelacion} onChange={(event) => setFechaCancelacion(event.target.value)} className="h-8 rounded-md border border-border bg-background px-2" /></label><p>Días hasta cancelación: <b>{pending.fechaAsignacion && fechaCancelacion ? Math.round((Date.parse(`${fechaCancelacion}T00:00:00Z`) - Date.parse(`${pending.fechaAsignacion}T00:00:00Z`)) / 86_400_000) : "-"}</b></p></div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setPending(null)}>Cancelar</Button><Button disabled={update.isPending || !fechaCancelacion || !pending.fechaAsignacion} onClick={() => update.mutate()}>{update.isPending ? "Guardando..." : "Confirmar"}</Button></div></div></div>}
    {usuarioPending && <div className="fixed inset-0 z-50 bg-foreground/30 p-4" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="rounded-md border border-border bg-card p-4" style={{ width: "min(28rem, calc(100vw - 2rem))", height: "fit-content", flex: "none" }}><h2 className="text-base font-semibold">Corregir usuario de operación</h2><p className="mt-1 text-xs text-muted-foreground">OP {usuarioPending.codigoOperacion} · SIAC: {usuarioPending.nombreUsuarioOperacionOriginal || usuarioPending.usuarioOperacionOriginal || "Sin usuario"}</p><input autoFocus value={usuarioSearch} onChange={(event) => setUsuarioSearch(event.target.value)} placeholder="Escribí al menos 3 caracteres" className="mt-3 h-8 w-full rounded-md border border-border bg-background px-2 text-sm" /><div className="mt-2 max-h-52 overflow-y-auto rounded-md border border-border">{!usuarioSearchReady ? <p className="p-2 text-xs text-muted-foreground">Ingresá al menos 3 caracteres para buscar.</p> : usuarios.isLoading ? <p className="p-2 text-xs text-muted-foreground">Buscando usuarios...</p> : usuarios.isError ? <div className="space-y-2 p-2 text-xs text-destructive"><p>{usuarios.error.message}</p><Button size="xs" variant="outline" onClick={() => usuarios.refetch()}>Reintentar</Button></div> : !(usuarios.data?.length) ? <p className="p-2 text-xs text-muted-foreground">No se encontraron usuarios habilitados.</p> : usuarios.data.map((usuario) => <button key={usuario.codigo} type="button" disabled={updateUsuario.isPending} onClick={() => updateUsuario.mutate(usuario)} className="flex w-full items-center justify-between border-b border-border px-2 py-2 text-left text-xs last:border-0 hover:bg-muted"><span>{usuario.nombre}</span><span className="text-muted-foreground">{usuario.codigo}</span></button>)}</div><div className="mt-3 flex justify-end"><Button variant="outline" onClick={() => setUsuarioPending(null)}>Cancelar</Button></div></div></div>}
  </div>;
}
