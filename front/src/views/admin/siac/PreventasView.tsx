import Loading from "@/components/Loading";
import { deletePreventa, getPreventas, patchPreventaAsignado } from "@/api/dms/preventasAPI";
import { hasPathAccess, hasPreventaActionAccess } from "@/helpers/access";
import { formatCurrency } from "@/helpers/preventas";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useMatch, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PreventaModal } from "./PreventaFormView";

export default function PreventasView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const createMatch = useMatch(paths.convencional.preventasNueva);
  const editMatch = useMatch(paths.convencional.preventasEditarRoute);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["preventas", "pendientes"],
    queryFn: () => getPreventas(false),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, asignado }: { id: string; asignado: boolean }) =>
      patchPreventaAsignado(id, asignado),
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
      <div className="font-preset w-full bg-muted px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar preventas pendientes</h1>
          <p className="mt-1 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const preventas = data?.data ?? [];
  const canViewResumen = hasPathAccess(user, paths.convencional.preventasResumen);
  const canCreatePreventa = hasPathAccess(user, paths.convencional.preventasNueva);
  const canViewAsignadas = hasPathAccess(user, paths.convencional.preventasAsignadas);
  const canAssignPreventa = hasPreventaActionAccess(user, "assign");
  const canEditPreventa = hasPreventaActionAccess(user, "edit");
  const canDeletePreventa = hasPreventaActionAccess(user, "delete");
  const canModifyPreventa = canEditPreventa || canDeletePreventa;
  const canManagePreventaColumns = canAssignPreventa || canModifyPreventa;
  const modalPreventaId = editMatch?.params.id;
  const isModalOpen = Boolean(createMatch || modalPreventaId);

  return (
    <>
      <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
        <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-start lg:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">SIAC</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Preventas pendientes</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Registra operaciones sin unidad asignada y mantené previsión mensual de demanda.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {canViewResumen ? (
                <Link
                  to={paths.convencional.preventasResumen}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  <ClipboardList size={16} />
                  Ver resumen
                </Link>
              ) : null}

              {canCreatePreventa ? (
                <Link
                  to={paths.convencional.preventasNueva}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Plus size={16} />
                  Nueva preventa
                </Link>
              ) : null}
            </div>
          </div>
          <div className="grid border-t border-border md:grid-cols-3">
            {[['Pendientes', preventas.length], ['Con reserva', preventas.filter((item) => typeof item.monto_reserva === 'number' && item.monto_reserva > 0).length], ['Colores multiples', preventas.filter((item) => item.colores.length > 1).length]].map(([label, total]) => <div key={String(label)} className="border-t border-border px-3 py-2 first:border-t-0 md:border-l md:first:border-l-0 md:border-t-0"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className="text-2xl font-semibold text-foreground">{total}</p></div>)}
          </div>
        </section>
        <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
            <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Listado operativo</h2><p className="mt-1 text-sm text-muted-foreground">
                Las preventas asignadas se ocultan de esta vista, pero no se eliminan.
              </p>
            </div>

            {canViewAsignadas ? (
              <Link to={paths.convencional.preventasAsignadas} className="text-sm font-semibold text-foreground underline-offset-4 hover:underline">
                Ver asignadas
              </Link>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full text-sm">
              <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Mes</th>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left">Version</th>
                  <th className="px-3 py-2 text-left">Colores</th>
                  <th className="px-3 py-2 text-left">Vendedor</th>
                  <th className="px-3 py-2 text-left">Nro OP</th>
                  <th className="px-3 py-2 text-left">Reserva</th>
                  {canManagePreventaColumns ? <th className="px-4 py-3 text-center">Asignado</th> : null}
                  {canManagePreventaColumns ? <th className="px-4 py-3 text-center">Acciones</th> : null}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {preventas.map((preventa) => (
                  <tr key={preventa._id} className="hover:bg-muted">
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

                    {canManagePreventaColumns ? (
                      <td className="px-4 py-3 text-center">
                        {canAssignPreventa ? (
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground">
                            <input
                              type="checkbox"
                              checked={preventa.asignado}
                              onChange={(event) => assignMutation.mutate({ id: preventa._id, asignado: event.target.checked })}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                            />
                            Asignado
                          </label>
                        ) : (
                          <span
                            className={[
                              "inline-flex rounded-full border px-3 py-2 text-xs font-semibold",
                              preventa.asignado
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 bg-gray-50 text-gray-500",
                            ].join(" ")}
                          >
                            {preventa.asignado ? "Asignado" : "Pendiente"}
                          </span>
                        )}
                      </td>
                    ) : null}

                    {canManagePreventaColumns ? (
                      <td className="px-4 py-3">
                        {canModifyPreventa ? (
                          <div className="flex justify-center gap-2">
                            {canEditPreventa ? (
                              <Link
                                to={paths.convencional.preventasEditar(preventa._id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                              >
                                <Pencil size={14} />
                                Editar
                              </Link>
                            ) : null}

                            {canDeletePreventa ? (
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate(preventa._id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-center text-xs font-semibold text-gray-400">Solo lectura</div>
                        )}
                      </td>
                    ) : null}
                  </tr>
                ))}

                {!preventas.length ? (
                  <tr>
                    <td colSpan={canManagePreventaColumns ? 9 : 7} className="px-6 py-12 text-center text-sm text-gray-500">
                      No hay preventas pendientes. Las que marques como asignadas quedarán disponibles en la vista histórica.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <PreventaModal
        open={isModalOpen}
        onClose={() => navigate(paths.convencional.preventas)}
        preventaId={modalPreventaId}
      />
    </>
  );
}
