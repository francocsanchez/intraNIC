import { exportRendicionGastoPdf, getRendicionesGastos } from "@/api/rendicionesGastosAPI";
import { ActionButton } from "@/components/ui/action-button";
import { paths } from "@/routes/paths";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(value);
const download = (blob: Blob, name: string) => { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); };

export default function RendicionesGastosView() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ["rendiciones-gastos"], queryFn: getRendicionesGastos });
  const pdf = useMutation({ mutationFn: exportRendicionGastoPdf, onSuccess: (blob, id) => { download(blob, `rendicion-gastos-${id}.pdf`); toast.success("PDF generado correctamente"); }, onError: (error: Error) => toast.error(error.message) });
  if (query.isLoading) return <div className="font-preset bg-muted p-3 text-sm text-muted-foreground">Cargando rendiciones...</div>;
  if (query.isError) return <div className="font-preset bg-muted p-3 text-sm text-destructive">{query.error instanceof Error ? query.error.message : "Error al cargar rendiciones"}</div>;
  const items = query.data?.data ?? [];
  return <div className="font-preset space-y-3 bg-muted p-3"><section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-medium uppercase tracking-[.16em] text-muted-foreground">Comercial</p><h1 className="mt-1 text-xl font-semibold">Rend. Gastos</h1><p className="mt-1 text-sm text-muted-foreground">Registrá y exportá tus rendiciones de gastos de viaje.</p></div><ActionButton onClick={() => navigate(paths.convencional.rendicionesGastosNueva)}><Plus />Nueva rendición</ActionButton></section><section className="overflow-hidden rounded-lg border border-border bg-card"><div className="border-b border-border px-3 py-2 text-base font-semibold">Mis rendiciones</div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted text-left text-[11px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Motivo</th><th className="px-3 py-2 text-right">Retirado</th><th className="px-3 py-2 text-right">Gastado</th><th className="px-3 py-2 text-right">Saldo</th><th className="px-3 py-2" /></tr></thead><tbody>{items.map((item) => <tr key={item._id} className="border-t border-border"><td className="px-3 py-1.5">{item.createdAtLabel}</td><td className="px-3 py-1.5 font-medium">{item.motivo}</td><td className="px-3 py-1.5 text-right">{money(item.montoRetirado)}</td><td className="px-3 py-1.5 text-right">{money(item.totalGastado)}</td><td className="px-3 py-1.5 text-right"><span className="text-xs text-muted-foreground">{item.saldoLabel}: </span>{money(Math.abs(item.saldo))}</td><td className="flex gap-1 px-3 py-1.5"><ActionButton variant="outline" onClick={() => navigate(paths.convencional.rendicionesGastosDetalle(item._id))}>Ver</ActionButton><ActionButton variant="outline" onClick={() => pdf.mutate(item._id)} disabled={pdf.isPending}><FileDown />PDF</ActionButton></td></tr>)}{!items.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Todavía no registraste rendiciones de gastos.</td></tr>}</tbody></table></div></section></div>;
}
