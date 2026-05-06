import Loading from "@/components/Loading";
import { exportProformaPdf, getProformas } from "@/api/dms/proformasAPI";
import { formatDateAr } from "@/helpers/proformas";
import type { Proforma } from "@/types/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Eye, FileDown, FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const PAGE_SIZE = 30;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function ProformasView() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["proformas"],
    queryFn: getProformas,
  });

  const exportMutation = useMutation({
    mutationFn: async ({ id, numero }: { id: string; numero: number }) => {
      const blob = await exportProformaPdf(id);
      return { blob, numero };
    },
    onSuccess: ({ blob, numero }) => {
      downloadBlob(blob, `proforma-${numero}.pdf`);
      toast.success("PDF generado correctamente");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const proformas = data?.data ?? [];

  const totalPages = Math.max(1, Math.ceil(proformas.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const visibleProformas = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return proformas.slice(start, start + PAGE_SIZE);
  }, [currentPage, proformas]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">No se pudo cargar el módulo de proformas</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administración</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Proformas</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Generá proformas comerciales, guardalas en el sistema y exportalas con el formato definido.
            </p>
          </div>

          <Link
            to="/proformas/nueva"
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            <Plus size={16} />
            Nueva proforma
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Listado de proformas</h2>
            <p className="mt-1 text-sm text-gray-500">Mostrando hasta 30 registros por página.</p>
          </div>

          {proformas.length ? (
            <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">N°</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Señores</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Asesor</th>
                <th className="px-4 py-3 text-left">Unidades</th>
                <th className="px-4 py-3 text-right">Total neto</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleProformas.map((proforma: Proforma) => (
                <tr key={proforma._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{proforma.numeroProforma}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDateAr(proforma.fecha)}</td>
                  <td className="px-4 py-3 text-gray-700">{proforma.senores}</td>
                  <td className="px-4 py-3 text-gray-700">{proforma.cliente || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{proforma.asesorComercial}</td>
                  <td className="px-4 py-3 text-gray-700">{proforma.unidades.length}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {proforma.totalNeto.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/proformas/${proforma._id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <Eye size={14} />
                        Ver
                      </Link>
                      <button
                        type="button"
                        onClick={() => exportMutation.mutate({ id: proforma._id, numero: proforma.numeroProforma })}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <FileDown size={14} />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!proformas.length ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <FileText size={28} className="text-gray-300" />
                      Todavía no hay proformas registradas.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {proformas.length > PAGE_SIZE ? (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, proformas.length)} de {proformas.length} proformas
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
