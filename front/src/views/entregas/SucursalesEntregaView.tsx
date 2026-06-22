import {
  createSucursalEntrega,
  deleteSucursalEntrega,
  getSucursalesEntrega,
  updateSucursalEntrega,
  type SucursalEntregaPayload,
} from "@/api/entregasAPI";
import SucursalEntregaForm from "@/components/entregas/SucursalEntregaForm";
import type { SucursalEntrega } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SucursalesEntregaView() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SucursalEntrega | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entregas", "sucursales"],
    queryFn: getSucursalesEntrega,
  });

  const createMutation = useMutation({
    mutationFn: createSucursalEntrega,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "sucursales"] });
      setModalOpen(false);
      setEditingItem(null);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SucursalEntregaPayload }) =>
      updateSucursalEntrega(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "sucursales"] });
      setModalOpen(false);
      setEditingItem(null);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSucursalEntrega,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "sucursales"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const items = data?.data ?? [];

  if (isLoading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando sucursales de entrega...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar sucursales de entrega"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entregas</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Sucursales de entrega</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          <Plus size={16} />
          Nueva sucursal
        </button>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Sucursal</th>
                <th className="px-6 py-3 text-left">Direccion</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Observaciones</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <Building2 size={16} className="text-gray-500" />
                      <span>{item.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{item.direccion || "-"}</td>
                  <td className="px-6 py-3 text-gray-700">{item.activa ? "Activa" : "Inactiva"}</td>
                  <td className="px-6 py-3 text-gray-700">{item.observaciones || "-"}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(item);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item._id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay sucursales de entrega cargadas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <SucursalEntregaForm
        open={modalOpen}
        item={editingItem}
        pending={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={(values) => {
          const payload: SucursalEntregaPayload = {
            nombre: values.nombre.trim(),
            direccion: values.direccion.trim(),
            activa: Boolean(values.activa),
            observaciones: values.observaciones.trim(),
          };

          if (editingItem) {
            updateMutation.mutate({ id: editingItem._id, payload });
            return;
          }

          createMutation.mutate(payload);
        }}
      />
    </div>
  );
}
