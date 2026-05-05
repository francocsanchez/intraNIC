import Loading from "@/components/Loading";
import {
  createPedidoUnidadPrevia,
  deletePedidoUnidadPrevia,
  getPedidoUnidadesPrevias,
  updatePedidoUnidadPreviaPrioridad,
} from "@/api/dms/pedidoUnidadAPI";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { PedidoUnidadPrioridad } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const PRIORIDAD_OPTIONS: PedidoUnidadPrioridad[] = ["normal", "media", "urgente"];
const PRIORIDAD_ORDER: Record<PedidoUnidadPrioridad, number> = {
  urgente: 0,
  media: 1,
  normal: 2,
};

const prioridadBadgeClass: Record<PedidoUnidadPrioridad, string> = {
  normal: "bg-gray-100 text-gray-700",
  media: "bg-yellow-100 text-yellow-800",
  urgente: "bg-red-100 text-red-700",
};

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function comparePrioridad(a: { prioridad: PedidoUnidadPrioridad; createdAt: string }, b: { prioridad: PedidoUnidadPrioridad; createdAt: string }) {
  const priorityDiff = PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad];
  if (priorityDiff !== 0) return priorityDiff;

  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export default function PedidoUnidadesPreviasView() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [internoInput, setInternoInput] = useState("");

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["pedido-unidades-previas"],
    queryFn: getPedidoUnidadesPrevias,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: createPedidoUnidadPrevia,
    onSuccess: (response) => {
      toast.success(response.message);
      setInternoInput("");
      queryClient.invalidateQueries({ queryKey: ["pedido-unidades-previas"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo agregar el interno");
    },
  });

  const updatePrioridadMutation = useMutation({
    mutationFn: ({ id, prioridad }: { id: string; prioridad: PedidoUnidadPrioridad }) =>
      updatePedidoUnidadPreviaPrioridad(id, prioridad),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["pedido-unidades-previas"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo actualizar la prioridad");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePedidoUnidadPrevia,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["pedido-unidades-previas"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "No se pudo eliminar el registro");
    },
  });

  if (authLoading || isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar la lista previa</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const canAccess = hasAnyRole(user, ["admin", "stock", "administracion", "gerente"]);
  if (!canAccess) return null;

  const canAddPrevia = hasAnyRole(user, ["admin", "stock", "administracion"]);
  const canManagePriority = hasAnyRole(user, ["admin", "stock", "administracion", "gerente"]);
  const canDeletePrevia = hasAnyRole(user, ["admin", "stock", "administracion", "gerente"]);
  const canOpenPedidoUnidades = hasAnyRole(user, ["admin", "stock"]);
  const orderedData = [...data].sort(comparePrioridad);

  const handleAdd = () => {
    const interno = Number(internoInput.trim());

    if (!Number.isInteger(interno) || interno <= 0) {
      toast.error("Ingresa un numero de interno valido");
      return;
    }

    if (data.some((item) => item.interno === interno)) {
      toast.error("Ese interno ya esta cargado en la lista previa");
      return;
    }

    createMutation.mutate(interno);
  };

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Lista previa de pedido de unidades</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Carga internos para dejarlos disponibles antes de consolidar el pedido final.
            </p>
          </div>

          {canOpenPedidoUnidades && (
            <Link
              to="/pedido-unidades"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <ClipboardList size={16} strokeWidth={1.75} />
              Ir a Pedido de Unidades
            </Link>
          )}
        </div>
      </section>

      {canAddPrevia && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Interno
              <input
                type="number"
                min={1}
                value={internoInput}
                onChange={(event) => setInternoInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="Ej: 66439"
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              />
            </label>

            <button
              type="button"
              onClick={handleAdd}
              disabled={createMutation.isPending}
              className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#15aa9a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#129181] disabled:cursor-not-allowed disabled:bg-[#8fd2ca]"
            >
              <Plus size={16} strokeWidth={2} />
              Agregar
            </button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Unidades cargadas</h2>
            <p className="mt-1 text-sm text-gray-500">Registros disponibles para seleccionar desde Pedido de Unidades.</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {data.length} registros
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Interno</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Chasis</th>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Modelo</th>
                <th className="px-4 py-3 text-left">Prioridad</th>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-center">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderedData.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{item.interno}</td>
                  <td className="px-4 py-3 text-gray-700">{item.clienteNombre}</td>
                  <td className="px-4 py-3 text-gray-700">{item.vendedorNombre}</td>
                  <td className="px-4 py-3 text-gray-700">{item.chasis ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{item.version}</td>
                  <td className="px-4 py-3 text-gray-700">{item.modelo}</td>
                  <td className="px-4 py-3">
                    {canManagePriority ? (
                      <select
                        value={item.prioridad}
                        onChange={(event) =>
                          updatePrioridadMutation.mutate({
                            id: item._id,
                            prioridad: event.target.value as PedidoUnidadPrioridad,
                          })
                        }
                        className={[
                          "rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none",
                          prioridadBadgeClass[item.prioridad],
                        ].join(" ")}
                      >
                        {PRIORIDAD_OPTIONS.map((prioridad) => (
                          <option key={prioridad} value={prioridad}>
                            {prioridad}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                          prioridadBadgeClass[item.prioridad],
                        ].join(" ")}
                      >
                        {item.prioridad}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{item.usuario}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDateTime(item.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    {canDeletePrevia ? (
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item._id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                        Eliminar
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}

              {!data.length ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-500">
                    Todavia no hay unidades en la lista previa.
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

