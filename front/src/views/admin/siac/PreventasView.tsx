import Loading from "@/components/Loading";
import { deletePreventa, getPreventas, patchPreventaAsignado } from "@/api/dms/preventasAPI";
import { formatCurrency } from "@/helpers/preventas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function PreventasView() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["preventas", "pendientes"],
    queryFn: () => getPreventas(false),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, asignado }: { id: string; asignado: boolean }) => patchPreventaAsignado(id, asignado),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      queryClient.invalidateQueries({ queryKey: ["preventas-resumen"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePreventa,
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
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar preventas pendientes</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const preventas = data?.data ?? [];

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">SIAC</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Preventas pendientes</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Registra operaciones sin unidad asignada y mantené previsión mensual de demanda.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/preventas/resumen"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#9fd6cf] bg-white px-4 py-3 text-sm font-semibold text-[#146b61] transition hover:bg-[#f4fbfa]"
            >
              <ClipboardList size={16} />
              Ver resumen
            </Link>
            <Link
              to="/preventas/nueva"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#15aa9a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#128d80]"
            >
              <Plus size={16} />
              Nueva preventa
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Pendientes</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{preventas.length}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Con reserva</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {preventas.filter((item) => typeof item.monto_reserva === "number" && item.monto_reserva > 0).length}
          </p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Colores múltiples</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{preventas.filter((item) => item.colores.length > 1).length}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Listado operativo</h2>
            <p className="mt-1 text-sm text-gray-500">Las preventas asignadas se ocultan de esta vista, pero no se eliminan.</p>
          </div>
          <Link to="/preventas/asignadas" className="text-sm font-semibold text-[#15aa9a] hover:text-[#128d80]">
            Ver asignadas
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Mes</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Colores</th>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Nro OP</th>
                <th className="px-4 py-3 text-left">Reserva</th>
                <th className="px-4 py-3 text-center">Asignado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {preventas.map((preventa) => (
                <tr key={preventa._id} className="hover:bg-[#f8fcfc]">
                  <td className="px-4 py-3 font-semibold text-gray-900">{preventa.mes_asigna_label}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium text-gray-900">{preventa.cliente}</div>
                    <div className="text-xs text-gray-500">{preventa.observaciones || "Sin observaciones"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{preventa.version.nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{preventa.colores.map((color) => color.nombre).join(", ") || "Sin color"}</td>
                  <td className="px-4 py-3 text-gray-700">{preventa.vendedorNombre}</td>
                  <td className="px-4 py-3 text-gray-700">{preventa.numero_op ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(preventa.monto_reserva)}</td>
                  <td className="px-4 py-3 text-center">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#bde2dc] bg-[#eef9f7] px-3 py-2 text-xs font-semibold text-[#146b61]">
                      <input
                        type="checkbox"
                        checked={preventa.asignado}
                        onChange={(event) => assignMutation.mutate({ id: preventa._id, asignado: event.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                      />
                      Asignado
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Link
                        to={`/preventas/${preventa._id}/editar`}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(preventa._id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!preventas.length ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay preventas pendientes. Las que marques como asignadas quedarán disponibles en la vista histórica.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-3xl border border-[#dbeff0] bg-white p-4 text-sm text-gray-600 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckSquare size={18} className="mt-0.5 text-[#15aa9a]" />
          <p>
            Al marcar una preventa como asignada, el registro se conserva y simplemente deja de mostrarse en pendientes.
          </p>
        </div>
      </div>
    </div>
  );
}
