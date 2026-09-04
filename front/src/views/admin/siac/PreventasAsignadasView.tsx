import Loading from "@/components/Loading";
import { getPreventas, patchPreventaAsignado } from "@/api/dms/preventasAPI";
import { formatCurrency } from "@/helpers/preventas";
import { paths } from "@/routes/paths";
import { hasModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function PreventasAsignadasView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar preventas asignadas</h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const preventas = data?.data ?? [];
  const canManagePreventas = hasModuleAccess(user, "preventas");

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Historico</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Preventas asignadas</h1>
            <p className="mt-2 text-sm text-muted-foreground">Esta vista conserva el historial de registros ya asignados.</p>
          </div>
        <Link to={paths.convencional.preventas} className="text-sm font-semibold text-primary hover:text-primary">
            Volver a pendientes
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Listado asignado</h2>
            <p className="mt-1 text-sm text-muted-foreground">{preventas.length} registros</p>
          </div>
          <History size={18} className="text-muted-foreground" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
            <tbody className="divide-y divide-border">
              {preventas.map((preventa) => (
                <tr key={preventa._id} className="hover:bg-muted">
                  <td className="px-4 py-3 font-semibold text-foreground">{preventa.mes_asigna_label}</td>
                  <td className="px-4 py-3 text-muted-foreground">{preventa.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{preventa.version.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{preventa.colores.map((color) => color.nombre).join(", ") || "Sin color"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{preventa.vendedorNombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrency(preventa.monto_reserva)}</td>
                  <td className="px-4 py-3 text-center">
                    {canManagePreventas ? (
                      <button
                        type="button"
                        onClick={() => mutation.mutate({ id: preventa._id, asignado: false })}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-primary transition hover:bg-secondary"
                      >
                        <Undo2 size={14} />
                        Volver a pendiente
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">Solo lectura</span>
                    )}
                  </td>
                </tr>
              ))}
              {!preventas.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
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
