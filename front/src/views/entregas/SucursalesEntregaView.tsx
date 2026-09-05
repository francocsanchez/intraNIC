import {
  createSucursalEntrega,
  deleteSucursalEntrega,
  getSucursalesEntrega,
  updateSucursalEntrega,
  type SucursalEntregaPayload,
} from "@/api/entregasAPI";
import SucursalEntregaForm from "@/components/entregas/SucursalEntregaForm";
import { hasSuperAdminRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { SucursalEntrega } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SucursalesEntregaView() {
  const { user } = useAuth();
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
  const canManageSucursales = hasSuperAdminRole(user);

  if (isLoading) {
    return <div className="rounded-lg border border-border bg-card p-6 shadow-sm">Cargando sucursales de entrega...</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-card p-6 text-destructive shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar sucursales de entrega"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between rounded-lg border border-border bg-card p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Entregas</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Sucursales de entrega</h1>
        </div>
        {canManageSucursales ? (
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus size={16} />
            Nueva sucursal
          </button>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">Sucursal</th>
                <th className="px-6 py-3 text-left">Direccion</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Observaciones</th>
                {canManageSucursales ? <th className="px-6 py-3 text-right">Acciones</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-muted">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Building2 size={16} className="text-muted-foreground" />
                      <span>{item.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{item.direccion || "-"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{item.activa ? "Activa" : "Inactiva"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{item.observaciones || "-"}</td>
                  {canManageSucursales ? (
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(item._id)}
                          className="inline-flex h-6 items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td colSpan={canManageSucursales ? 5 : 4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No hay sucursales de entrega cargadas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {canManageSucursales ? (
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
              horariosHabilitados: values.horariosHabilitados,
              observaciones: values.observaciones.trim(),
            };

            if (editingItem) {
              updateMutation.mutate({ id: editingItem._id, payload });
              return;
            }

            createMutation.mutate(payload);
          }}
        />
      ) : null}
    </div>
  );
}
