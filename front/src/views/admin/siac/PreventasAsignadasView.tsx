import Loading from "@/components/Loading";
import { getPreventas, patchPreventaAsignado } from "@/api/dms/preventasAPI";
import { formatCurrency } from "@/helpers/preventas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function PreventasAsignadasView() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["preventas", "asignadas"],
    queryFn: () => getPreventas(true),
  });

  const mutation = useMutation({
    mutationFn: ({ id, asignado }: { id: string; asignado: boolean }) => patchPreventaAsignado(id, asignado),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      queryClient.invalidateQueries({ queryKey: ["preventas-resumen"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar preventas asignadas</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const preventas = data?.data ?? [];

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Historico</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Preventas asignadas</h1>
            <p className="mt-2 text-sm text-gray-500">Esta vista conserva el historial de registros ya asignados.</p>
          </div>
          <Link to="/preventas" className="text-sm font-semibold text-[#15aa9a] hover:text-[#128d80]">
            Volver a pendientes
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Listado asignado</h2>
            <p className="mt-1 text-sm text-gray-500">{preventas.length} registros</p>
          </div>
          <History size={18} className="text-gray-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Mes</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Colores</th>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Reserva</th>
                <th className="px-4 py-3 text-center">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {preventas.map((preventa) => (
                <tr key={preventa._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{preventa.mes_asigna_label}</td>
                  <td className="px-4 py-3 text-gray-700">{preventa.cliente}</td>
                  <td className="px-4 py-3 text-gray-700">{preventa.version.nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{preventa.colores.map((color) => color.nombre).join(", ") || "Sin color"}</td>
                  <td className="px-4 py-3 text-gray-700">{preventa.vendedorNombre}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(preventa.monto_reserva)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => mutation.mutate({ id: preventa._id, asignado: false })}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#bde2dc] bg-[#eef9f7] px-3 py-2 text-xs font-semibold text-[#146b61] transition hover:bg-[#e0f5f1]"
                    >
                      <Undo2 size={14} />
                      Volver a pendiente
                    </button>
                  </td>
                </tr>
              ))}
              {!preventas.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    Todavia no hay preventas asignadas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
