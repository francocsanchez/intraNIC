import Loading from "@/components/Loading";
import { exportProformaPdf, getProformaById } from "@/api/dms/proformasAPI";
import { formatCurrencyAr, formatPercentAr } from "@/helpers/proformas";
import { paths } from "@/routes/paths";
import type { Proforma } from "@/types/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function ProformaDetailView() {
  const { id } = useParams();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["proforma", id], queryFn: () => getProformaById(id!), enabled: Boolean(id) });
  const exportMutation = useMutation({
    mutationFn: () => exportProformaPdf(id!),
    onSuccess: (blob) => { downloadBlob(blob, `proforma-${data?.data.numeroProforma ?? "proforma"}.pdf`); toast.success("PDF generado correctamente"); },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) return <Loading />;
  if (isError || !data?.data) return <div className="font-preset w-full bg-muted px-2 py-3"><section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm"><h1 className="text-lg font-semibold text-foreground">No se pudo cargar la proforma</h1><p className="mt-1 text-sm text-destructive">{error instanceof Error ? error.message : "Proforma no encontrada"}</p></section></div>;

  const proforma = data.data;
  const detailRows = proforma.unidades.flatMap((unidad: Proforma["unidades"][number]) => unidad.rows);
  const summary = [["Señores", proforma.senores], ["Cliente", proforma.cliente || "-"], ["CUIT", proforma.cuit || "-"], ["Total neto", formatCurrencyAr(proforma.totalNeto)]];

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-start md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Proformas</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Proforma N° {proforma.numeroProforma}</h1><p className="mt-1 text-sm text-muted-foreground">Emitida el {proforma.fechaLabel}. Lista de valores de {proforma.listaPrecioLabel}.</p></div>
          <div className="flex flex-wrap gap-2"><Link to={paths.convencional.proformas} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"><ArrowLeft size={16} />Volver</Link><button type="button" onClick={() => exportMutation.mutate()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><FileDown size={16} />Exportar PDF</button></div>
        </div>
        <div className="grid border-t border-border sm:grid-cols-2 xl:grid-cols-4">{summary.map(([label, value]) => <div key={label} className="border-t border-border px-3 py-2 first:border-t-0 sm:border-l sm:first:border-l-0 sm:border-t-0"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground">{value}</p></div>)}</div>
        {(proforma.observaciones || proforma.asesorComercial) && <div className="grid border-t border-border md:grid-cols-2"><div className="px-3 py-2"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Observaciones</p><p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{proforma.observaciones || "Sin observaciones"}</p></div><div className="border-t border-border px-3 py-2 md:border-l md:border-t-0"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Asesor comercial</p><p className="mt-1 text-sm font-semibold text-foreground">{proforma.asesorComercial}</p><p className="text-sm text-muted-foreground">{proforma.emailAsesor}</p></div></div>}
      </section>
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"><div className="border-b border-border px-3 py-3"><h2 className="text-base font-semibold tracking-tight text-foreground">Detalle calculado</h2><p className="mt-1 text-sm text-muted-foreground">Cada unidad muestra sus renglones de vehículo, patentamiento y flete.</p></div><div className="overflow-x-auto"><table className="min-w-[980px] w-full text-sm"><thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground"><tr>{["Detalle", "Cantidad", "IVA", "Neto", "Total", "Totales"].map((heading) => <th key={heading} className="px-3 py-2 text-right first:text-left">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{detailRows.map((row, index) => <tr key={`${row.detalle}-${index}`} className="hover:bg-muted"><td className="px-3 py-1.5 text-foreground">{row.detalle}</td><td className="px-3 py-1.5 text-right text-muted-foreground">{row.cantidad}</td><td className="px-3 py-1.5 text-right text-muted-foreground">{formatPercentAr(row.iva)}</td><td className="px-3 py-1.5 text-right text-muted-foreground">{formatCurrencyAr(row.neto)}</td><td className="px-3 py-1.5 text-right text-muted-foreground">{formatCurrencyAr(row.total)}</td><td className="px-3 py-1.5 text-right font-semibold text-foreground">{formatCurrencyAr(row.totales)}</td></tr>)}<tr className="bg-muted"><td colSpan={5} className="px-3 py-2 text-right text-sm font-semibold text-foreground">TOTAL NETO</td><td className="px-3 py-2 text-right text-sm font-semibold text-foreground">{formatCurrencyAr(proforma.totalNeto)}</td></tr></tbody></table></div></section>
    </div>
  );
}
