import { Switch } from "@headlessui/react";
import { getConfiguracion, updateConfiguracionBelgrano } from "@/api/configuracionAPI";
import { getVendedoresActivosNic } from "@/api/dms/dmsAPI";
import CheckListVendedoresBelgrano from "@/components/configuracion/CheckListVendedoresBelgrano";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ConfigBelgranoForm = {
  sistemaActivoBelgrano: boolean;
  vendedoresDisponibleBelgrano: string[];
};

export default function EditConfiguracionBelgranoView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: configResponse,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["configuracion"],
    queryFn: getConfiguracion,
  });

  const {
    data: vendedoresResponse,
    isError: vendedoresNicIsError,
    isLoading: vendedoresNicIsLoading,
  } = useQuery({
    queryKey: ["vendedores", "activos"],
    queryFn: getVendedoresActivosNic,
  });

  const config = configResponse?.data;
  const vendedoresNic = vendedoresResponse?.data ?? [];
  const { control, register, handleSubmit, setValue, reset } = useForm<ConfigBelgranoForm>({
    defaultValues: {
      sistemaActivoBelgrano: false,
      vendedoresDisponibleBelgrano: [],
    },
  });

  useEffect(() => {
    if (!config) return;

    reset({
      sistemaActivoBelgrano: !!config.sistemaActivoBelgrano,
      vendedoresDisponibleBelgrano: (config.vendedoresDisponibleBelgrano ?? []).map(String),
    });
  }, [config, reset]);

  const enabled = useWatch({
    control,
    name: "sistemaActivoBelgrano",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updateConfiguracionBelgrano,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
      toast.success(response.message);
      navigate(paths.admin.configuracion);
    },
  });

  const handleForm = (formData: ConfigBelgranoForm) => {
    mutate(formData);
  };

  if (isLoading || vendedoresNicIsLoading) {
    return (
      <div className="w-full space-y-6 px-4 py-6">
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-6 p-6">
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="h-9 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isError || vendedoresNicIsError || !config) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar la configuracion</h1>
          <p className="mt-2 text-sm text-destructive">No fue posible cargar la configuracion.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 px-4 py-4">
      <section className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Configuración</h1>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Belgrano
          </span>
        </div>

        <Link
          to={paths.admin.configuracion}
          className="text-xs font-semibold text-primary hover:underline hover:underline-offset-4"
        >
          Volver
        </Link>
      </section>

      <form className="overflow-hidden rounded-lg border border-border bg-card shadow-sm" noValidate onSubmit={handleSubmit(handleForm)}>
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Vendedores habilitados</h2>
        </div>

        <div className="space-y-4 p-4">
          <div className={`flex items-center justify-between rounded-md border px-3 py-2.5 ${enabled ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <div>
              <div className="text-sm font-semibold text-foreground">Estado del sistema</div>
              <div className={`text-xs font-medium ${enabled ? "text-emerald-800" : "text-red-800"}`}>{enabled ? "Activo: acceso habilitado" : "Desactivado: acceso bloqueado"}</div>
            </div>

            <label className="inline-flex items-center gap-3">
              <span className={`text-xs font-bold uppercase tracking-wide ${enabled ? "text-emerald-800" : "text-red-800"}`}>{enabled ? "Activo" : "Desactivado"}</span>
              <Switch
                checked={enabled}
                onChange={(val) => {
                  setValue("sistemaActivoBelgrano", val, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
                className={`${
                  enabled ? "bg-emerald-600" : "bg-red-600"
                } relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40`}
              >
                <span className="sr-only">Cambiar estado del sistema</span>
                <span
                  className={`${
                    enabled ? "translate-x-6" : "translate-x-1"
                  } inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform`}
                />
              </Switch>

              <input type="hidden" {...register("sistemaActivoBelgrano")} />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <CheckListVendedoresBelgrano
              title="Vendedores Disponible"
              subtitle="Habilita visualizacion de stock disponible."
              vendedoresNic={vendedoresNic}
              name="vendedoresDisponibleBelgrano"
              control={control}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">Guarda los cambios para actualizar la configuracion.</div>

          <input
            type="submit"
            disabled={isPending}
            className="inline-flex cursor-pointer justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold uppercase text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            value={isPending ? "Guardando..." : "Guardar configuracion"}
          />
        </div>
      </form>
    </div>
  );
}
