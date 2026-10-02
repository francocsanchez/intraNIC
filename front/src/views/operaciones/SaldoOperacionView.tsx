import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  exportSaldoOperacionSnapshot,
  getSaldoOperacionSnapshot,
  getSaldoOperacionSnapshotFilters,
  getSaldoOperacionSnapshotSummary,
  updateSaldoOperacionSnapshotCancelacion,
} from "@/services/operacionesService";
import type { SaldoOperacionSnapshotItem } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 60;
const ALL = "__TODAS__";
type Section = "conSaldo" | "canceladas";

const money = (value: number | null) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value ?? 0);
const download = (blob: Blob, name: string) => { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };

export default function SaldoOperacionView() {
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>("conSaldo");
  const [sucursal, setSucursal] = useState(ALL);
  const [ubicacion, setUbicacion] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<SaldoOperacionSnapshotItem | null>(null);
  const [fechaCancelacion, setFechaCancelacion] = useState("");
  const params = { section, sucursal: sucursal === ALL ? undefined : sucursal, ubicacion: ubicacion === ALL ? undefined : ubicacion, page, limit: PAGE_SIZE };
  const table = useQuery({ queryKey: ["saldo-operacion-snapshot", params], queryFn: ({ signal }) => getSaldoOperacionSnapshot(params, signal), refetchOnWindowFocus: false });
  const filters = useQuery({ queryKey: ["saldo-operacion-snapshot-filters"], queryFn: getSaldoOperacionSnapshotFilters, staleTime: 60_000 });
  const summary = useQuery({ queryKey: ["saldo-operacion-snapshot-summary", sucursal, ubicacion], queryFn: ({ signal }) => getSaldoOperacionSnapshotSummary({ sucursal: sucursal === ALL ? undefined : sucursal, ubicacion: ubicacion === ALL ? undefined : ubicacion }, signal), staleTime: 30_000 });
  const update = useMutation({
    mutationFn: () => pending ? updateSaldoOperacionSnapshotCancelacion(pending.codigoOperacion, fechaCancelacion) : Promise.reject(new Error("No hay operacion seleccionada")),
    onSuccess: () => { toast.success("Fecha de cancelacion actualizada"); setPending(null); queryClient.invalidateQueries({ queryKey: ["saldo-operacion-snapshot"] }); },
    onError: (error: Error) => toast.error(error.message),
  });
  const exporter = useMutation({ mutationFn: () => exportSaldoOperacionSnapshot(params), onSuccess: (blob) => { download(blob, `saldo-operacion-${new Date().toISOString().slice(0, 10)}.xlsx`); toast.success("Excel exportado"); }, onError: (error: Error) => toast.error(error.message) });

  if (table.isLoading) return <Loading />;
  if (table.isError) return <div className="p-4 text-destructive">{table.error.message}</div>;
  const rows = table.data?.data ?? [];
  const pagination = table.data?.pagination;

  return <div className="space-y-3 bg-muted p-2 font-preset">
    <section className="space-y-2 rounded-md border border-border bg-card p-2">
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Sucursal" value={sucursal} onChange={(event) => { setSucursal(event.target.value); setPage(1); }} className="h-9 min-w-40 rounded-md border border-border bg-background px-2 text-xs"><option value={ALL}>Todas las sucursales</option>{filters.data?.meta.sucursales.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <span className="whitespace-nowrap text-xs text-muted-foreground">Can. Registros: <b className="text-foreground">{pagination?.total ?? 0}</b></span>
        <div className="flex rounded-md border border-border p-0.5"><Button size="sm" variant={section === "conSaldo" ? "default" : "ghost"} onClick={() => { setSection("conSaldo"); setPage(1); }}>Con saldo</Button><Button size="sm" variant={section === "canceladas" ? "default" : "ghost"} onClick={() => { setSection("canceladas"); setPage(1); }}>Canceladas</Button></div>
        <div className="flex flex-1 flex-wrap gap-1">{[ALL, ...(filters.data?.meta.ubicaciones ?? [])].map((item) => <Button key={item} size="sm" variant={ubicacion === item ? "default" : "outline"} onClick={() => { setUbicacion(item); setPage(1); }}>{item === ALL ? "Todas" : item}</Button>)}</div>
        <Button size="sm" variant="outline" disabled={exporter.isPending} onClick={() => exporter.mutate()}><Download /> Exportar</Button>
      </div>
    </section>

    <section className="rounded-md border border-border bg-card p-2">
      <div className="mb-1 flex items-center justify-between text-[11px]"><span>Saldos restantes a cobrar por modelo</span>{summary.isFetching && <LoaderCircle className="size-3 animate-spin" />}</div>
      <div className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-6">
        {summary.data?.data.map((item) => <div key={item.modelo} className="rounded-md border border-border bg-muted p-2"><div className="text-[11px] tracking-wide">{item.modelo}</div><div className="text-base text-destructive">{money(item.saldo)}</div></div>)}
        <div className="rounded-md border border-border bg-muted p-2"><div className="text-[11px]">Crédito no cancelado</div><div className="text-base text-destructive">{money(summary.data?.creditoTotal ?? 0)}</div></div>
        <div className="rounded-md border border-border bg-muted p-2"><div className="text-[11px]">Usado no cancelado</div><div className="text-base text-destructive">{money(summary.data?.usadoTotal ?? 0)}</div></div>
      </div>
    </section>

    <section className="overflow-x-auto rounded-md border border-border bg-card"><table className="w-full min-w-[1450px] text-xs"><thead className="border-b border-border bg-muted text-left"><tr>{["OP", "Cliente", "Sucursal", "Vendedor", "Usuario operación", "Modelo", "Versión", "Ubicación", "Estado", "F. asignación", "Días asignada", "F. cancelación", "Días cancelación", "Saldo"].map((label) => <th key={label} className="px-2 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.codigoOperacion} className="border-b border-border last:border-0"><td className="px-2 py-1.5">{row.codigoOperacion}</td><td className="px-2 py-1.5">{row.clienteNombre}</td><td className="px-2 py-1.5">{row.sucursal}</td><td className="px-2 py-1.5">{row.vendedor}</td><td className="px-2 py-1.5">{row.nombreUsuarioOperacion || row.usuarioOperacion}</td><td className="px-2 py-1.5">{row.modeloGeneral}</td><td className="px-2 py-1.5">{row.version}</td><td className="px-2 py-1.5">{row.ubicacion}</td><td className="px-2 py-1.5">{row.estado}</td><td className="px-2 py-1.5">{row.fechaAsignacion ?? "-"}</td><td className="px-2 py-1.5">{row.diasAsignada ?? "-"}</td><td className="px-2 py-1.5"><Button size="xs" variant="outline" onClick={() => { setPending(row); setFechaCancelacion(row.fechaCancelacion ?? new Date().toISOString().slice(0, 10)); }}>{row.fechaCancelacion ?? "Ingresar fecha"}</Button></td><td className="px-2 py-1.5">{row.diasHastaCancelacion ?? "-"}</td><td className="px-2 py-1.5 font-medium text-destructive">{money(row.saldo)}</td></tr>)}</tbody></table>{!rows.length && <p className="p-6 text-center text-sm text-muted-foreground">No hay operaciones para los filtros seleccionados.</p>}</section>
    <div className="flex items-center justify-end gap-2"><Button size="sm" variant="outline" disabled={!pagination || pagination.page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span className="text-xs">Página {pagination?.page ?? 1} de {pagination?.totalPages ?? 1}</span><Button size="sm" variant="outline" disabled={!pagination?.hasNextPage} onClick={() => setPage((value) => value + 1)}>Siguiente</Button></div>
    {pending && <div className="fixed inset-0 z-50 bg-foreground/30 p-4" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div className="rounded-md border border-border bg-card p-4" style={{ width: "min(28rem, calc(100vw - 2rem))", height: "fit-content", flex: "none" }}><h2 className="text-base font-semibold">Confirmar cancelación</h2><div className="mt-3 space-y-2 text-sm"><p>OP: <b>{pending.codigoOperacion}</b></p><p>F. asignación: <b>{pending.fechaAsignacion ?? "Sin asignación"}</b></p><label className="grid gap-1">F. cancelación<input type="date" value={fechaCancelacion} onChange={(event) => setFechaCancelacion(event.target.value)} className="h-8 rounded-md border border-border bg-background px-2" /></label><p>Días hasta cancelación: <b>{pending.fechaAsignacion && fechaCancelacion ? Math.round((Date.parse(`${fechaCancelacion}T00:00:00Z`) - Date.parse(`${pending.fechaAsignacion}T00:00:00Z`)) / 86_400_000) : "-"}</b></p></div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setPending(null)}>Cancelar</Button><Button disabled={update.isPending || !fechaCancelacion || !pending.fechaAsignacion} onClick={() => update.mutate()}>{update.isPending ? "Guardando..." : "Confirmar"}</Button></div></div></div>}
  </div>;
}
