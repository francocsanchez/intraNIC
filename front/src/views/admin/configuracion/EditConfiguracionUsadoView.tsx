import {
  getConfiguracion,
  updateConfiguracionUsado,
} from "@/api/configuracionAPI";
import { getVendedoresActivosNic } from "@/api/dms/dmsAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Switch } from "@headlessui/react";
import CheckListVendedoresUsados from "@/components/configuracion/CheckListVendedoresUsados";

type ConfigUsaForm = {
  sistemaActivoUsados: boolean;
  vendedoresReservasUsados: string[];
  vendedoresDisponibleUsados: string[];
  vendedoresStockGuardadoUsados: string[];
};

export default function EditConfiguracionUsadoView() {
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

  const [enabled, setEnabled] = useState(false);

  const { register, handleSubmit, setValue, reset } = useForm<ConfigUsaForm>({
    defaultValues: {
      sistemaActivoUsados: false,
      vendedoresReservasUsados: [],
      vendedoresDisponibleUsados: [],
      vendedoresStockGuardadoUsados: [],
    },
  });

  useEffect(() => {
    if (!config) return;

    const activo = !!config.sistemaActivoUsados;

    setEnabled(activo);

    reset({
      sistemaActivoUsados: activo,
      vendedoresReservasUsados: (config.vendedoresReservasUsados ?? []).map(
        String,
      ),
      vendedoresDisponibleUsados: (config.vendedoresDisponibleUsados ?? []).map(
        String,
      ),
      vendedoresStockGuardadoUsados: (
        config.vendedoresStockGuardadoUsados ?? []
      ).map(String),
    });
  }, [config, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateConfiguracionUsado,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
      toast.success(response.message);
      navigate("/admin/configuracion");
    },
  });

  const handleForm = (formData: ConfigUsaForm) => {
    mutate(formData);
  };

  if (isLoading || vendedoresNicIsLoading) {
    return (
      <div className="w-full px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-6 p-6">
            <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div
                        key={j}
                        className="h-9 animate-pulse rounded-lg bg-gray-100"
                      />
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
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar la configuración
          </h1>
          <p className="mt-2 text-sm text-red-600">
            No fue posible cargar la configuración.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Administración
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Editar configuración
            </h1>
            <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
              Usados
            </span>
          </div>
        </div>

        <Link
          to="/admin/configuracion"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
        >
          Volver
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Sistema
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Usados
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Estado actual
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {enabled ? "Activo" : "Inactivo"}
          </p>
        </article>
      </section>

      <form
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        noValidate
        onSubmit={handleSubmit(handleForm)}
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Configuración
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Seleccioná vendedores habilitados por módulo.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Estado del sistema
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Activo habilita el acceso a esta unidad de negocio.
              </div>
            </div>

            <label className="inline-flex items-center gap-3">
              <Switch
                checked={enabled}
                onChange={(val) => {
                  setEnabled(val);
                  setValue("sistemaActivoUsados", val, {
                    shouldDirty: true,
                  });
                }}
                className={`${
                  enabled ? "bg-black" : "bg-gray-300"
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/40`}
              >
                <span className="sr-only">Cambiar estado del sistema</span>
                <span
                  className={`${
                    enabled ? "translate-x-6" : "translate-x-1"
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>

              <input
                type="hidden"
                value={enabled ? "true" : "false"}
                {...register("sistemaActivoUsados")}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <CheckListVendedoresUsados
              title="Vendedores Reservas"
              subtitle="Habilita crear y gestionar reservas."
              vendedoresNic={vendedoresNic}
              vendedores={config.vendedoresReservasUsados}
              name="vendedoresReservasUsados"
              register={register}
            />

            <CheckListVendedoresUsados
              title="Vendedores Disponible"
              subtitle="Habilita visualización de stock disponible."
              vendedoresNic={vendedoresNic}
              vendedores={config.vendedoresDisponibleUsados}
              name="vendedoresDisponibleUsados"
              register={register}
            />

            <CheckListVendedoresUsados
              title="Vendedores Stock Guardado"
              subtitle="Habilita gestión de stock guardado."
              vendedoresNic={vendedoresNic}
              vendedores={config.vendedoresStockGuardadoUsados}
              name="vendedoresStockGuardadoUsados"
              register={register}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            Guardá los cambios para actualizar la configuración.
          </div>

          <input
            type="submit"
            disabled={isPending}
            className="inline-flex cursor-pointer justify-center rounded-lg bg-black px-6 py-2.5 text-sm font-semibold uppercase text-white shadow-sm transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            value={isPending ? "Guardando..." : "Guardar configuración"}
          />
        </div>
      </form>
    </div>
  );
}
