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

const EMPTY_PEDIDOS_MENSUALES: Awaited<ReturnType<typeof getPedidoMensual>>["data"] = [];
const EMPTY_VERSIONES: Awaited<ReturnType<typeof getVersiones>>["data"] = [];

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

  const pedidos = pedidoMensualQuery.data?.data ?? EMPTY_PEDIDOS_MENSUALES;
  const versiones = versionesQuery.data?.data ?? EMPTY_VERSIONES;

  const versionesDisponibles = useMemo(() => {
    if (editingId) return versiones;

    const usedVersions = new Set(pedidos.map((item) => item.version._id));
    return versiones.filter((item) => !usedVersions.has(item._id));
  }, [editingId, pedidos, versiones]);

  if (loading) return <Loading />;

  if (error instanceof Error) {
    return (
      <div className="font-preset w-full px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar pedido mensual</h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gestion</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Pedido mensual</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Carga editable actual por version. El sistema mantiene un solo registro por version.
        </p>
      </section>

      <section className="border-y border-border py-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Version
            <select
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccionar version</option>
              {versionesDisponibles.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Cantidad
            <input
              type="number"
              min={0}
              value={cantidad}
              onChange={(event) => setCantidad(event.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            />
          </label>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center justify-center gap-2 self-end rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Save size={16} />
            {editingId ? "Guardar cambios" : "Guardar"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Versiones cargadas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Version</th>
                <th className="px-3 py-2 text-center">Cantidad</th>
                <th className="px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidos.map((item) => (
                <tr key={item._id} className="hover:bg-muted">
                  <td className="px-3 py-1.5 font-medium text-foreground">{item.version.nombre}</td>
                  <td className="px-3 py-1.5 text-center text-foreground">{item.cantidad}</td>
                  <td className="px-3 py-1.5">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item._id);
                          setVersion(item.version._id);
                          setCantidad(String(item.cantidad));
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item._id)}
                        className="inline-flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:opacity-90"
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
                  <td colSpan={3} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
