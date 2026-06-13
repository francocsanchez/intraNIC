import Loading from "@/components/Loading";
import { exportProformaPdf, getProformaById } from "@/api/dms/proformasAPI";
import { formatCurrencyAr, formatPercentAr } from "@/helpers/proformas";
import { paths } from "@/routes/paths";
import type { Proforma } from "@/types/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function ProformaDetailView() {
  const { id } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["proforma", id],
    queryFn: () => getProformaById(id!),
    enabled: Boolean(id),
  });

  const exportMutation = useMutation({
    mutationFn: async () => exportProformaPdf(id!),
    onSuccess: (blob) => {
      const numero = data?.data.numeroProforma ?? "proforma";
      downloadBlob(blob, `proforma-${numero}.pdf`);
      toast.success("PDF generado correctamente");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) return <Loading />;

  if (isError || !data?.data) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">No se pudo cargar la proforma</h1>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Proforma no encontrada"}</p>
        </section>
      </div>
    );
  }

  const proforma = data.data;
  const detailRows = proforma.unidades.flatMap((unidad: Proforma["unidades"][number]) => unidad.rows);

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Proformas</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Proforma N° {proforma.numeroProforma}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Emitida el {proforma.fechaLabel}. Lista de valores de {proforma.listaPrecioLabel}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
          to={paths.convencional.proformas}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>
            <button
              type="button"
              onClick={() => exportMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              <FileDown size={16} />
              Exportar PDF
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Señores</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{proforma.senores}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Cliente</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{proforma.cliente || "-"}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">CUIT</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{proforma.cuit || "-"}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total neto</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{formatCurrencyAr(proforma.totalNeto)}</p>
        </article>
      </section>

      {proforma.observaciones ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Observaciones</p>
          <p className="mt-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{proforma.observaciones}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Asesor comercial</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{proforma.asesorComercial}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Email</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{proforma.emailAsesor}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Detalle calculado</h2>
          <p className="mt-1 text-sm text-gray-500">Cada unidad muestra sus renglones de vehículo, patentamiento y flete.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Detalle</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-center">IVA</th>
                <th className="px-4 py-3 text-right">Neto</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detailRows.map((row, index) => (
                <tr key={`${row.detalle}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{row.detalle}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.cantidad}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{formatPercentAr(row.iva)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrencyAr(row.neto)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrencyAr(row.total)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrencyAr(row.totales)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  TOTAL NETO
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrencyAr(proforma.totalNeto)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
