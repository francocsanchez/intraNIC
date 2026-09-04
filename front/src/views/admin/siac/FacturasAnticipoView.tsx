import Loading from "@/components/Loading";
import {
  createFacturaAnticipo,
  deleteFacturaAnticipo,
  getFacturasAnticipo,
} from "@/api/facturasAnticipoAPI";
import { hasModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type FormValues = {
  numeroOp: string;
};

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function FacturasAnticipoView() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      numeroOp: "",
    },
  });

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["facturas-anticipo"],
    queryFn: getFacturasAnticipo,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: createFacturaAnticipo,
    onSuccess: (response) => {
      toast.success(response.message);
      reset();
      queryClient.invalidateQueries({ queryKey: ["facturas-anticipo"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo cargar la operacion");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFacturaAnticipo,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["facturas-anticipo"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo eliminar el registro");
    },
  });

  if (authLoading || isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3"><section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar facturas de anticipo</h1><p className="mt-1 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const canAccess = hasModuleAccess(user, "facturasAnticipo");
  if (!canAccess) return null;

  const onSubmit = handleSubmit((values) => {
    const numeroOp = Number(values.numeroOp.trim());

    if (!Number.isInteger(numeroOp) || numeroOp <= 0) {
      toast.error("Ingresa un numero OP valido");
      return;
    }

    createMutation.mutate(numeroOp);
  });

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Facturas de anticipo</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Carga operaciones por numero OP y consulta en forma dinamica si ya tienen factura de anticipo.
            </p>
          </div>

          <Link
            to={paths.administracion.home}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
          >
            <ArrowLeft size={16} strokeWidth={1.75} />
            Volver a Administracion
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm"><form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]"><label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Numero OP
            <input
              type="number"
              min={1}
              placeholder="Ej: 12345"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              {...register("numeroOp", {
                required: "El numero OP es obligatorio",
              })}
            />
            {errors.numeroOp && (
              <span className="text-sm text-destructive">{errors.numeroOp.message}</span>
            )}
          </label>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center gap-2 self-end rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} strokeWidth={2} />
            Agregar
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"><div className="flex flex-col gap-2 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Operaciones cargadas</h2><p className="mt-1 text-sm text-muted-foreground">
              El estado de facturacion se consulta al abrir la pantalla y cuando la ventana vuelve a tener foco.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            {data.length} registros
          </div>
        </div>

        {data.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-base font-semibold text-gray-900">Todavia no hay operaciones cargadas</h3>
            <p className="mt-2 text-sm text-gray-500">Ingresa un numero OP para comenzar a registrar facturas de anticipo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Numero OP</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-left">Vendedor</th>
                  <th className="px-4 py-3 text-left">Chasis</th>
                  <th className="px-4 py-3 text-left">Usuario carga</th>
                  <th className="px-4 py-3 text-left">Fecha carga</th>
                  <th className="px-4 py-3 text-left">Estado / Accion factura de anticipo</th>
                  <th className="px-4 py-3 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((item) => (
                  <tr key={item._id} className="hover:bg-muted">
                    <td className="px-4 py-3 font-semibold text-gray-900">{item.numeroOp}</td>
                    <td className="px-4 py-3 text-gray-700">{item.cliente}</td>
                    <td className="px-4 py-3 text-gray-700">{item.version}</td>
                    <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                    <td className="px-4 py-3 text-gray-700">{item.chasis}</td>
                    <td className="px-4 py-3 text-gray-700">{item.usuarioCarga}</td>
                    <td className="px-4 py-3 text-gray-700">{formatDateTime(item.fechaCarga)}</td>
                    <td className="px-4 py-3">
                      {item.estaFacturada ? (
                        <span className="inline-flex rounded-xl border border-red-200 bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">
                          Anular factura de anticipo
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm("¿Deseas eliminar este registro?");
                          if (!confirmed) return;

                          deleteMutation.mutate(item._id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 p-2 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`Eliminar operacion ${item.numeroOp}`}
                      >
                        <Trash2 size={16} strokeWidth={1.9} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
