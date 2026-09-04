import { getConfiguracion, updateConfiguracionConvencional } from "@/api/configuracionAPI";
import { getVendedoresActivosNic } from "@/api/dms/dmsAPI";
import CheckListVendedores from "@/components/configuracion/CheckListVendedores";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Switch } from "@headlessui/react";

type ConfigConvForm = {
  sistemaActivoConvencional: boolean;
  vendedoresReservasConvencional: string[];
  vendedoresDisponibleConvencional: string[];
  vendedoresStockGuardadoConvencional: string[];
};

export default function EditConfiguracionConvView() {
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
  const { control, register, handleSubmit, setValue, reset } = useForm<ConfigConvForm>({
    defaultValues: {
      sistemaActivoConvencional: false,
      vendedoresReservasConvencional: [],
      vendedoresDisponibleConvencional: [],
      vendedoresStockGuardadoConvencional: [],
    },
  });

  useEffect(() => {
    if (!config) return;

    const activo = !!config.sistemaActivoConvencional;

    reset({
      sistemaActivoConvencional: activo,
      vendedoresReservasConvencional: (config.vendedoresReservasConvencional ?? []).map(String),
      vendedoresDisponibleConvencional: (config.vendedoresDisponibleConvencional ?? []).map(String),
      vendedoresStockGuardadoConvencional: (config.vendedoresStockGuardadoConvencional ?? []).map(String),
    });
  }, [config, reset]);

  const enabled = useWatch({
    control,
    name: "sistemaActivoConvencional",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updateConfiguracionConvencional,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
      toast.success(response.message);
      navigate(paths.admin.configuracion);
    },
  });

  const handleForm = (formData: ConfigConvForm) => {
    mutate(formData);
  };

  if (isLoading || vendedoresNicIsLoading) {
    return (
      <div className="w-full px-4 py-6 space-y-6">
        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="h-9 animate-pulse rounded-lg bg-muted" />
                    ))}
                  </div>
                </div>
              ))}
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
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar la configuración</h1>
          <p className="mt-2 text-sm text-destructive">No fue posible cargar la configuración.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Administración</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar configuración</h1>
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-primary font-semibold uppercase tracking-wide text-muted-foreground">
              Convencional
            </span>
          </div>
        </div>

        <Link
          to={paths.admin.configuracion}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Volver
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sistema</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Convencional</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado actual</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{enabled ? "Activo" : "Inactivo"}</p>
        </article>
      </section>

      <form className="overflow-hidden rounded-lg border border-border bg-card shadow-sm" noValidate onSubmit={handleSubmit(handleForm)}>
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Configuración</h2>
          <p className="mt-1 text-sm text-muted-foreground">Seleccioná vendedores habilitados por módulo.</p>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-5 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado del sistema</div>
              <div className="mt-1 text-sm text-muted-foreground">Activo habilita el acceso a esta unidad de negocio.</div>
            </div>

            <label className="inline-flex items-center gap-3">
              <Switch
                checked={enabled}
                onChange={(val) => {
                  setValue("sistemaActivoConvencional", val, {
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
                className={`${
                  enabled ? "bg-secondary" : "bg-muted"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40`}
              >
                <span className="sr-only">Cambiar estado del sistema</span>
                <span
                  className={`${
                    enabled ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-card transition-transform`}
                />
              </Switch>

              <input type="hidden" {...register("sistemaActivoConvencional")} />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <CheckListVendedores
              title="Vendedores Reservas"
              subtitle="Habilita crear y gestionar reservas."
              vendedoresNic={vendedoresNic}
              vendedores={config.vendedoresReservasConvencional}
              name="vendedoresReservasConvencional"
              register={register}
            />

            <CheckListVendedores
              title="Vendedores Disponible"
              subtitle="Habilita visualización de stock disponible."
              vendedoresNic={vendedoresNic}
              vendedores={config.vendedoresDisponibleConvencional}
              name="vendedoresDisponibleConvencional"
              register={register}
            />

            <CheckListVendedores
              title="Vendedores Stock Guardado"
              subtitle="Habilita gestión de stock guardado."
              vendedoresNic={vendedoresNic}
              vendedores={config.vendedoresStockGuardadoConvencional}
              name="vendedoresStockGuardadoConvencional"
              register={register}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">Guardá los cambios para actualizar la configuración.</div>

          <input
            type="submit"
            disabled={isPending}
            className="inline-flex cursor-pointer justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold uppercase text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            value={isPending ? "Guardando..." : "Guardar configuración"}
          />
        </div>
      </form>
    </div>
  );
}
