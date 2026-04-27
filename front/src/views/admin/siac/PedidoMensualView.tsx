import Loading from "@/components/Loading";
import {
  createPedidoMensual,
  deletePedidoMensual,
  getPedidoMensual,
  getVersiones,
  updatePedidoMensual,
} from "@/api/dms/preventasAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function PedidoMensualView() {
  const queryClient = useQueryClient();
  const [version, setVersion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const pedidoMensualQuery = useQuery({
    queryKey: ["pedido-mensual"],
    queryFn: getPedidoMensual,
  });

  const versionesQuery = useQuery({
    queryKey: ["versiones", "activas"],
    queryFn: () => getVersiones(true),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!version) throw new Error("Debes seleccionar una version");

      const cantidadValue = Number(cantidad);
      if (!Number.isFinite(cantidadValue) || cantidadValue < 0) {
        throw new Error("La cantidad debe ser mayor o igual a 0");
      }

      if (editingId) {
        return updatePedidoMensual(editingId, { version, cantidad: cantidadValue });
      }

      return createPedidoMensual({ version, cantidad: cantidadValue });
    },
    onSuccess: (response) => {
      toast.success(response.message);
      setVersion("");
      setCantidad("");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["pedido-mensual"] });
      queryClient.invalidateQueries({ queryKey: ["preventas-resumen", "pedido-mensual"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePedidoMensual,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["pedido-mensual"] });
      queryClient.invalidateQueries({ queryKey: ["preventas-resumen", "pedido-mensual"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const loading = pedidoMensualQuery.isLoading || versionesQuery.isLoading;
  const error = pedidoMensualQuery.error || versionesQuery.error;

  const pedidos = pedidoMensualQuery.data?.data ?? [];
  const versiones = versionesQuery.data?.data ?? [];

  const versionesDisponibles = useMemo(() => {
    if (editingId) return versiones;

    const usedVersions = new Set(pedidos.map((item) => item.version._id));
    return versiones.filter((item) => !usedVersions.has(item._id));
  }, [editingId, pedidos, versiones]);

  if (loading) return <Loading />;

  if (error instanceof Error) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar pedido mensual</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Gestion</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Pedido mensual</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Carga editable actual por version. El sistema mantiene un solo registro por version.
        </p>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Version
            <select
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            >
              <option value="">Seleccionar version</option>
              {versionesDisponibles.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Cantidad
            <input
              type="number"
              min={0}
              value={cantidad}
              onChange={(event) => setCantidad(event.target.value)}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            />
          </label>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center justify-center gap-2 self-end rounded-2xl bg-[#15aa9a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#128d80]"
          >
            <Save size={16} />
            {editingId ? "Guardar cambios" : "Guardar"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Versiones cargadas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.version.nombre}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{item.cantidad}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item._id);
                          setVersion(item.version._id);
                          setCantidad(String(item.cantidad));
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item._id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pedidos.length ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay versiones cargadas en pedido mensual.
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
