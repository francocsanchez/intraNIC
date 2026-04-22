import { getConfiguracion, updateConfiguracionReventa } from "@/api/configuracionAPI";
import { getVendedoresActivosNic } from "@/api/dms/dmsAPI";
import CheckListVendedores from "@/components/configuracion/CheckListVendedores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ConfigReventaForm = {
  vendedorReventasConvencional: string[];
};

export default function EditConfiguracionReventaView() {
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

  const { register, handleSubmit, reset } = useForm<ConfigReventaForm>({
    defaultValues: {
      vendedorReventasConvencional: [],
    },
  });

  useEffect(() => {
    if (!config) return;

    reset({
      vendedorReventasConvencional: (config.vendedorReventasConvencional ?? []).map(String),
    });
  }, [config, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateConfiguracionReventa,
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["configuracion"] });
      toast.success(response.message);
      navigate("/configuracion");
    },
  });

  const handleForm = (formData: ConfigReventaForm) => {
    mutate(formData);
  };

  if (isLoading || vendedoresNicIsLoading) {
    return (
      <div className="w-full px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-7 w-64 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-9 animate-pulse rounded-lg bg-gray-100" />
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
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar la configuracion</h1>
          <p className="mt-2 text-sm text-red-600">No fue posible cargar la configuracion.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administracion</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Editar configuracion</h1>
            <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
              Reventas
            </span>
          </div>
        </div>

        <Link
          to="/configuracion"
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
        >
          Volver
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modulo</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Reventas</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Vendedores seleccionados</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{config.vendedorReventasConvencional?.length ?? 0}</p>
        </article>
      </section>

      <form className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" noValidate onSubmit={handleSubmit(handleForm)}>
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Configuracion</h2>
          <p className="mt-1 text-sm text-gray-500">Selecciona los vendedores habilitados para reventas.</p>
        </div>

        <div className="p-6">
          <CheckListVendedores
            title="Vendedores Reventas"
            subtitle="Habilita visualizacion y gestion del modulo de reventas."
            vendedoresNic={vendedoresNic}
            vendedores={config.vendedorReventasConvencional ?? []}
            name="vendedorReventasConvencional"
            register={register}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">Guarda los cambios para actualizar la configuracion de reventas.</div>

          <input
            type="submit"
            disabled={isPending}
            className="inline-flex cursor-pointer justify-center rounded-lg bg-black px-6 py-2.5 text-sm font-semibold uppercase text-white shadow-sm transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
            value={isPending ? "Guardando..." : "Guardar configuracion"}
          />
        </div>
      </form>
    </div>
  );
}
