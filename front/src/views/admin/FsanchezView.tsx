import { getFsanchezOperaciones, updateFsanchezOperacionEstado } from "@/api/dms/fsanchezAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import type { FsanchezOperacionItem } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type VisibleSection = "conSaldo" | "canceladas";

export default function FsanchezView() {
  const queryClient = useQueryClient();
  const [visibleSection, setVisibleSection] = useState<VisibleSection>("conSaldo");
  const [updatingOpera, setUpdatingOpera] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["fsanchez", "operaciones"],
    queryFn: getFsanchezOperaciones,
  });

  const updateMutation = useMutation({
    mutationFn: ({ opera, cancelada }: { opera: string; cancelada: boolean }) =>
      updateFsanchezOperacionEstado(opera, cancelada),
    onMutate: ({ opera }) => {
      setUpdatingOpera(opera);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["fsanchez", "operaciones"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
    onSettled: () => {
      setUpdatingOpera(null);
    },
  });

  const operaciones = data?.data ?? [];
  const meta = data?.meta;

  const operacionesVisibles = useMemo(() => {
    return operaciones.filter((item) => (visibleSection === "conSaldo" ? !item.cancelada : item.cancelada));
  }, [operaciones, visibleSection]);

  const emptyMessage =
    visibleSection === "conSaldo"
      ? "No hay operaciones con saldo para mostrar."
      : "No hay operaciones canceladas para mostrar.";

  const handleToggle = (item: FsanchezOperacionItem) => {
    updateMutation.mutate({ opera: item.opera, cancelada: !item.cancelada });
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar FSANCHEZ</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#d9e4ff] bg-gradient-to-r from-[#eff4ff] via-white to-[#eefbf5] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4c5fc3]">Super Admin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">FSANCHEZ</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Control manual de operaciones pendientes para separar las que siguen con saldo de las ya canceladas.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{meta?.total ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Con saldo</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-900">{meta?.conSaldo ?? 0}</p>
            </article>
            <article className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Canceladas</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-900">{meta?.canceladas ?? 0}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Operaciones</h2>
            <p className="mt-1 text-sm text-gray-500">
              {visibleSection === "conSaldo"
                ? "Vista principal con operaciones activas."
                : "Vista separada con operaciones marcadas manualmente como canceladas."}
            </p>
          </div>

          <div className="inline-flex w-full rounded-lg bg-gray-100 p-1 md:w-auto">
            <button
              type="button"
              onClick={() => setVisibleSection("conSaldo")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "conSaldo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Con saldo ({meta?.conSaldo ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setVisibleSection("canceladas")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "canceladas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Canceladas ({meta?.canceladas ?? 0})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.16em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Opera</th>
                <th className="px-4 py-3 text-left">Interno</th>
                <th className="px-4 py-3 text-left">Nro. fab</th>
                <th className="px-4 py-3 text-left">Modelo</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Ubicacion</th>
                <th className="px-4 py-3 text-left">Dias asignado</th>
                <th className="px-4 py-3 text-left">Chasis</th>
                <th className="px-4 py-3 text-left">Color</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {operacionesVisibles.map((item) => {
                const isUpdating = updatingOpera === item.opera;
                const nextIsCancelada = !item.cancelada;

                return (
                  <tr key={`${item.opera}-${item.interno}-${item.nrofab}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.opera}</td>
                    <td className="px-4 py-3 text-gray-700">{item.interno}</td>
                    <td className="px-4 py-3 text-gray-700">{item.nrofab}</td>
                    <td className="px-4 py-3 text-gray-700">{item.modelo}</td>
                    <td className="px-4 py-3 text-gray-700">{item.version}</td>
                    <td className="px-4 py-3 text-gray-700">{item.cliente}</td>
                    <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>
                    <td className="px-4 py-3 text-gray-700">{item.ubicacion}</td>
                    <td className="px-4 py-3 text-gray-700">{item.diasAsignado}</td>
                    <td className="px-4 py-3 text-gray-700">{item.chasis}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(item.color)}`}>
                        {item.color}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        disabled={isUpdating}
                        className={[
                          "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          nextIsCancelada
                            ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                        ].join(" ")}
                      >
                        {isUpdating ? "Guardando..." : nextIsCancelada ? "Cancelar" : "Volver a con saldo"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {operacionesVisibles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-10 text-center text-sm text-gray-500">
                    {emptyMessage}
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
