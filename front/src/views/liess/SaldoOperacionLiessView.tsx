import AutocompleteSelect from "@/components/ui/autocomplete-select";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";
import {
  exportSaldoLiess,
  getSaldoLiess,
  getSaldoLiessFilters,
  getSaldoLiessSyncStatus,
  getSaldoLiessSummary,
  syncSaldoLiess,
  updateSaldoLiessCancelacion,
  updateSaldoLiessCreditoLiquidado,
  updateSaldoLiessObservacion,
  type SaldoLiessItem,
} from "@/services/saldoOperacionLiessService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  GitBranch,
  CheckCircle2,
  Circle,
  ReceiptText,
  MessageSquareText,
  RefreshCw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const ALL = "__TODAS__",
  PAGE_SIZE = 60;
const columns = [
  ["OP", "codigoOperacion"],
  ["Cliente", "clienteNombre"],
  ["Vendedor", "vendedor"],
  ["Versión", "version"],
  ["F. asignación", "fechaAsignacion"],
  ["D. Asig", "diasAsignada"],
  ["D. Cancelación", "diasHastaCancelacion"],
  ["Saldo", "saldo"],
  ["Créd. liq.", "creditoLiquidado"],
] as const;
const money = (value: number | null | undefined) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
const cancellationDays = (fechaAsignacion: string | null, fechaCancelacion: string) => {
  if (!fechaAsignacion || !/^\d{4}-\d{2}-\d{2}$/.test(fechaCancelacion)) return null;
  const [anioAsignacion, mesAsignacion, diaAsignacion] = fechaAsignacion.split("-").map(Number);
  const [anioCancelacion, mesCancelacion, diaCancelacion] = fechaCancelacion.split("-").map(Number);
  return Math.round((Date.UTC(anioCancelacion, mesCancelacion - 1, diaCancelacion) - Date.UTC(anioAsignacion, mesAsignacion - 1, diaAsignacion)) / 86_400_000);
};
const syncDate = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" }).format(new Date(value)) : "Sin sincronizaciones";
export default function SaldoOperacionLiessView() {
  const navigate = useNavigate(),
    client = useQueryClient();
  const [section, setSection] = useState<"conSaldo" | "canceladas">("conSaldo"),
    [entrega, setEntrega] = useState<"sin-entregar" | "entregadas">(
      "sin-entregar",
    ),
    [tipoOperacion, setTipoOperacion] = useState<"todas" | "5" | "10">("todas"),
    [creditoMarcado, setCreditoMarcado] = useState<"todos" | "si" | "no">("todos"),
    [vendedor, setVendedor] = useState(ALL),
    [draft, setDraft] = useState(""),
    [operacion, setOperacion] = useState(""),
    [page, setPage] = useState(1),
    [sortKey, setSortKey] = useState("saldo"),
    [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc"),
    [pending, setPending] = useState<SaldoLiessItem | null>(null),
    [paymentDetail, setPaymentDetail] = useState<SaldoLiessItem | null>(null),
    [fechaCancelacion, setFechaCancelacion] = useState(""),
    [commenting, setCommenting] = useState<SaldoLiessItem | null>(null),
    [observacion, setObservacion] = useState("");
  const params = {
    section,
    entrega,
    tipoOperacion: tipoOperacion === "todas" ? undefined : Number(tipoOperacion) as 5 | 10,
    creditoMarcado: creditoMarcado === "todos" ? undefined : creditoMarcado,
    vendedor: vendedor === ALL ? undefined : vendedor,
    operacion: operacion || undefined,
    page,
    limit: PAGE_SIZE,
    sortKey,
    sortDirection,
  } as const;
  const table = useQuery({
    queryKey: ["saldo-liess", params],
    queryFn: ({ signal }) => getSaldoLiess(params, signal),
    refetchOnWindowFocus: false,
  });
  const filters = useQuery({
    queryKey: ["saldo-liess-filters"],
    queryFn: getSaldoLiessFilters,
    staleTime: 60_000,
  });
  const syncStatus = useQuery({
    queryKey: ["saldo-liess-sync-status"],
    queryFn: getSaldoLiessSyncStatus,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
  const summary = useQuery({
    queryKey: ["saldo-liess-summary", entrega, tipoOperacion, creditoMarcado, vendedor],
    queryFn: () => getSaldoLiessSummary(params),
    staleTime: 30_000,
  });
  const cancelMutation = useMutation({
    mutationFn: (value: string | null) =>
      pending
        ? updateSaldoLiessCancelacion(pending.codigoOperacion, pending.tipoOperacion, value)
        : Promise.reject(new Error("No hay operación seleccionada")),
    onSuccess: async () => {
      setPending(null);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["saldo-liess"] }),
        client.invalidateQueries({ queryKey: ["saldo-liess-summary"] }),
        client.invalidateQueries({ queryKey: ["saldo-liess-analysis"] }),
      ]);
      toast.success("Cancelación actualizada");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const syncMutation = useMutation({
    mutationFn: syncSaldoLiess,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["saldo-liess"] }),
        client.invalidateQueries({ queryKey: ["saldo-liess-summary"] }),
        client.invalidateQueries({ queryKey: ["saldo-liess-sync-status"] }),
        client.invalidateQueries({ queryKey: ["saldo-liess-filters"] }),
      ]);
      toast.success("Saldo LIESS sincronizado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const creditMutation = useMutation({
    mutationFn: ({ row, value }: { row: SaldoLiessItem; value: boolean }) => updateSaldoLiessCreditoLiquidado(row.codigoOperacion, row.tipoOperacion, value),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["saldo-liess"] }),
        client.invalidateQueries({ queryKey: ["saldo-liess-summary"] }),
      ]);
      toast.success("Estado de crédito actualizado");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const commentMutation = useMutation({
    mutationFn: (value: string) => commenting ? updateSaldoLiessObservacion(commenting.codigoOperacion, commenting.tipoOperacion, value) : Promise.reject(new Error("No hay operación seleccionada")),
    onSuccess: async () => {
      setCommenting(null);
      await client.invalidateQueries({ queryKey: ["saldo-liess"] });
      toast.success("Observación guardada");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const exporter = useMutation({
    mutationFn: () => exportSaldoLiess(params),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = "saldo-operacion-liess.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  if (table.isLoading) return <Loading />;
  if (table.isError)
    return <div className="p-4 text-destructive">{table.error.message}</div>;
  const diasCancelacion = pending
    ? cancellationDays(pending.fechaAsignacion, fechaCancelacion)
    : null;
  const toggle = (key: string) => {
    if (key === sortKey)
      setSortDirection((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
    setPage(1);
  };
  const SortIcon = ({ column }: { column: string }) =>
    column !== sortKey ? (
      <ArrowUpDown className="size-3 text-muted-foreground" />
    ) : sortDirection === "asc" ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    );
  return (
    <div className="space-y-3 bg-muted p-2 font-preset">
      <section className="space-y-2 rounded-md border border-border bg-card p-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Operaciones:{" "}
            <b className="text-foreground">{table.data?.total ?? 0}</b>
          </span>
          <AutocompleteSelect
            aria-label="Tipo de operación"
            value={tipoOperacion}
            onChange={(event) => {
              setTipoOperacion(event.target.value as "todas" | "5" | "10");
              setPage(1);
            }}
            className="h-9 min-w-32 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="todas">Todas</option>
            <option value="5">Nuevas</option>
            <option value="10">Usadas</option>
          </AutocompleteSelect>
          <AutocompleteSelect
            aria-label="Crédito marcado"
            value={creditoMarcado}
            onChange={(event) => {
              setCreditoMarcado(event.target.value as "todos" | "si" | "no");
              setPage(1);
            }}
            className="h-9 min-w-36 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="todos">Todos los créditos</option>
            <option value="si">Crédito marcado</option>
            <option value="no">Crédito sin marcar</option>
          </AutocompleteSelect>
          <AutocompleteSelect
            aria-label="Vendedor"
            value={vendedor}
            onChange={(event) => {
              setVendedor(event.target.value);
              setPage(1);
            }}
            className="h-9 min-w-40 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value={ALL}>Todos los vendedores</option>
            {filters.data?.vendedores.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </AutocompleteSelect>
          <AutocompleteSelect
            aria-label="Entrega"
            value={entrega}
            onChange={(event) => {
              setEntrega(event.target.value as any);
              setPage(1);
            }}
            className="h-9 min-w-36 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="sin-entregar">No entregadas</option>
            <option value="entregadas">Entregadas</option>
          </AutocompleteSelect>
          {entrega === "sin-entregar" && (
            <AutocompleteSelect
              aria-label="Sección"
              value={section}
              onChange={(event) => {
                setSection(event.target.value as any);
                setPage(1);
              }}
              className="h-9 rounded-md border border-border bg-background px-2 text-xs"
            >
              <option value="conSaldo">Con saldo</option>
              <option value="canceladas">Canceladas</option>
            </AutocompleteSelect>
          )}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-8 border-green-300 bg-green-100 px-2 text-[11px] text-green-800 hover:bg-green-200"
            onClick={() => navigate(paths.liess.saldoOperacionCancelaciones)}
          >
            <GitBranch className="size-3" /> A. Canceladas
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-red-300 bg-red-100 px-2 text-[11px] text-red-800 hover:bg-red-200"
            onClick={() => navigate(paths.liess.saldoOperacionNoCanceladas)}
          >
            <GitBranch className="size-3" /> A. No canceladas
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label="Exportar Excel"
            disabled={exporter.isPending}
            onClick={() => exporter.mutate()}
            className="size-9 border-green-300 bg-green-100 p-0 text-green-800 hover:bg-green-200"
          >
            <Download />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-6">
          {(summary.data?.porMarca ?? []).map((item) => (
            <div
              key={item.marca}
              className="rounded-md border border-border bg-muted p-2"
            >
              <div className="text-[11px] tracking-wide">{item.marca}</div>
              <div className="text-base text-destructive">
                {money(item.saldo)}
              </div>
            </div>
          ))}
          {(summary.data?.opUsados?.operaciones ?? 0) > 0 && (
            <div className="rounded-md border border-border bg-muted p-2">
              <div className="text-[11px] tracking-wide">OP Usados</div>
              <div className="text-base text-destructive">
                {money(summary.data?.opUsados?.saldo)}
              </div>
            </div>
          )}
          <div className="rounded-md border border-border bg-muted p-2">
            <div className="text-[11px]">Crédito pendiente</div>
            <div className="text-base text-destructive">
              {money(summary.data?.creditoPendiente)}
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted p-2">
            <div className="text-[11px]">Usados NO comprados</div>
            <div className="text-base text-destructive">
              {money(summary.data?.usadoPendiente)}
            </div>
          </div>
        </div>
      </section>
      <section className="overflow-x-auto rounded-md border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border p-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Últ. sincronización: {syncDate(syncStatus.data?.sincronizadoEn)}</span>
            <Button size="xs" variant="ghost" title="Forzar sincronización" aria-label="Forzar sincronización" disabled={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
              <RefreshCw className={`size-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
          <input
            aria-label="Buscar operación"
            value={draft}
            inputMode="numeric"
            onChange={(event) =>
              setDraft(event.target.value.replace(/\D/g, ""))
            }
            onKeyDown={(event) =>
              event.key === "Enter" && (setOperacion(draft), setPage(1))
            }
            placeholder="Buscar OP"
            className="h-8 w-32 rounded-md border border-border bg-background px-2 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setOperacion(draft);
              setPage(1);
            }}
          >
            <Search /> Buscar
          </Button>
          </div>
        </div>
        <table className="w-full min-w-[980px] text-xs">
          <thead className="border-b border-border bg-muted text-left">
            <tr>
              {columns.map(([label, key]) => (
                <th key={key} className="px-2 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className="inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    {label}
                    <SortIcon column={key} />
                  </button>
                </th>
              ))}
              <th className="px-2 py-2 text-center">Pago</th>
              <th className="px-2 py-2 text-center">Comentario</th>
              <th className="px-2 py-2 text-center">Cancelar</th>
            </tr>
          </thead>
          <tbody>
            {table.data?.data.map((row) => (
              <tr
                key={`${row.tipoOperacion}-${row.codigoOperacion}`}
                className={`border-b border-border last:border-0 ${row.entregada && !row.fechaCancelacion ? "bg-amber-100/70 hover:bg-amber-100" : ""}`}
              >
                <td className="px-2 py-1.5 text-center"><div className="flex flex-col items-center gap-0.5"><span className="font-medium">{row.codigoOperacion}</span><Badge className={`h-4 px-1.5 text-[9px] ${row.tipoOperacion === 10 ? "border-amber-300 bg-amber-100 text-amber-800" : "border-green-300 bg-green-100 text-green-800"}`} variant="outline">{row.tipoOperacion === 10 ? "Usada" : "Nueva"}</Badge></div></td>
                <td className="px-2 py-1.5">{row.clienteNombre}</td>
                <td className="px-2 py-1.5">{row.vendedor}</td>
                <td className="px-2 py-1.5">{row.version}</td>
                <td className="px-2 py-1.5">{row.fechaAsignacion ?? "-"}</td>
                <td className="px-2 py-1.5">{row.diasAsignada ?? "-"}</td>
                <td className="px-2 py-1.5">
                  {row.diasHastaCancelacion ?? "-"}
                </td>
                <td
                  className={`px-2 py-1.5 font-medium ${row.saldo <= 0 ? "text-green-700" : "text-destructive"}`}
                >
                  {money(row.saldo)}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {(row.creditoBanco ?? 0) > 0 ? <Button size="xs" variant="ghost" title={row.creditoLiquidado ? "Crédito marcado como liquidado" : "Marcar crédito como liquidado"} aria-label="Cambiar estado de crédito" disabled={creditMutation.isPending} onClick={() => creditMutation.mutate({ row, value: !row.creditoLiquidado })}>{row.creditoLiquidado ? <CheckCircle2 className="size-4 text-green-700" /> : <Circle className="size-4 text-muted-foreground" />}</Button> : "-"}
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Button size="xs" variant="ghost" title="Ver composición del pago" aria-label="Ver composición del pago" onClick={() => setPaymentDetail(row)}>
                    <ReceiptText className="size-4 text-primary" />
                  </Button>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Button size="xs" variant="ghost" title={row.observacion ? "Editar observación" : "Agregar observación"} aria-label={row.observacion ? "Editar observación" : "Agregar observación"} onClick={() => { setCommenting(row); setObservacion(row.observacion ?? ""); }}>
                    <MessageSquareText className={`size-4 ${row.observacion ? "text-primary" : "text-muted-foreground"}`} />
                  </Button>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setPending(row);
                      setFechaCancelacion(row.fechaCancelacion ?? "");
                    }}
                  >
                    <CheckCircle2 className="size-4 text-green-700" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>
          Página {page} de {table.data?.totalPages ?? 1}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= (table.data?.totalPages ?? 1)}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-md rounded-md border border-border bg-card p-4">
            <h2 className="text-base font-semibold">Confirmar cancelación</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                OP: <b>{pending.codigoOperacion}</b>
              </p>
              <p>
                F. asignación:{" "}
                <b>{pending.fechaAsignacion ?? "Sin asignación"}</b>
              </p>
              <label className="grid gap-1">
                F. cancelación
                <input
                  type="date"
                  value={fechaCancelacion}
                  onChange={(event) => setFechaCancelacion(event.target.value)}
                  className="h-8 rounded-md border border-border bg-background px-2"
                />
              </label>
              <p>
                D. cancelación: <b>{diasCancelacion ?? "-"}</b>
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPending(null)}>
                Cancelar
              </Button>
              {pending.fechaCancelacion && (
                <Button
                  variant="outline"
                  onClick={() => cancelMutation.mutate(null)}
                >
                  Anular fecha
                </Button>
              )}
              <Button
                disabled={
                  cancelMutation.isPending ||
                  !fechaCancelacion ||
                  !pending.fechaAsignacion
                }
                onClick={() => cancelMutation.mutate(fechaCancelacion)}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
      {paymentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-md rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold">Composición del pago</h2><p className="text-xs text-muted-foreground">OP {paymentDetail.codigoOperacion} · {paymentDetail.clienteNombre}</p></div><Button size="xs" variant="ghost" aria-label="Cerrar" onClick={() => setPaymentDetail(null)}>×</Button></div>
            <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt>Precio de venta</dt><dd>{money((paymentDetail.total ?? 0) - (paymentDetail.gestoria ?? 0) + (paymentDetail.bonificacion ?? 0))}</dd></div><div className="flex justify-between"><dt>Gestoría</dt><dd>{money(paymentDetail.gestoria)}</dd></div><div className="flex justify-between"><dt>Bonificación</dt><dd className="text-green-700">- {money(paymentDetail.bonificacion)}</dd></div><div className="flex justify-between"><dt>Anticipos cobrados</dt><dd className="text-green-700">- {money(paymentDetail.senas)}</dd></div><div className="flex justify-between"><dt>Usado</dt><dd className="text-green-700">- {money(paymentDetail.usado)}</dd></div><div className="flex justify-between"><dt>Crédito bancario pactado</dt><dd>{money(paymentDetail.creditoBanco)}</dd></div><div className="flex justify-between"><dt>Crédito aplicado</dt><dd className="text-green-700">- {money(paymentDetail.creditoLiquidadoMonto)}</dd></div><div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Saldo comercial</dt><dd className={paymentDetail.saldo <= 0 ? "text-green-700" : "text-destructive"}>{money(paymentDetail.saldo)}</dd></div></dl>
          </div>
        </div>
      )}
      {commenting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
          <div className="w-full max-w-md rounded-md border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold">Observación</h2><p className="text-xs text-muted-foreground">OP {commenting.codigoOperacion} · {commenting.clienteNombre}</p></div><Button size="xs" variant="ghost" aria-label="Cerrar" onClick={() => setCommenting(null)}>×</Button></div>
            <label className="mt-4 grid gap-1 text-sm font-medium">Comentario<textarea autoFocus value={observacion} maxLength={2000} onChange={(event) => setObservacion(event.target.value)} rows={5} className="resize-y rounded-md border border-border bg-background px-2 py-1.5 text-sm font-normal" placeholder="Dejá una observación para esta operación" /></label>
            <p className="mt-1 text-right text-xs text-muted-foreground">{observacion.length}/2000</p>
            <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setCommenting(null)}>Cancelar</Button><Button disabled={commentMutation.isPending} onClick={() => commentMutation.mutate(observacion)}>{commentMutation.isPending ? "Guardando..." : "Guardar"}</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
