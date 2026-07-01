import {
  deletePendienteTurnar,
  getPendientesTurnar,
  getSucursalesEntrega,
} from "@/api/entregasAPI";
import AgendaEntregaForm from "@/components/entregas/AgendaEntregaForm";
import PendienteTurnarForm from "@/components/entregas/PendienteTurnarForm";
import PendientesTurnarFilters from "@/components/entregas/PendientesTurnarFilters";
import PendientesTurnarTable from "@/components/entregas/PendientesTurnarTable";
import { hasEntregaAgendaManageAccess, hasSuperAdminRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { PendienteTurnar } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListTodo, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function PendientesTurnarView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ sucursalId: "" });
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [turnoModalOpen, setTurnoModalOpen] = useState(false);
  const [editingPending, setEditingPending] = useState<PendienteTurnar | null>(null);
  const [pendingToSchedule, setPendingToSchedule] = useState<PendienteTurnar | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entregas", "pendientes-turnar", filters],
    queryFn: () => getPendientesTurnar({ sucursalId: filters.sucursalId || undefined }),
  });

  const { data: sucursalesResponse } = useQuery({
    queryKey: ["entregas", "sucursales"],
    queryFn: getSucursalesEntrega,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePendienteTurnar,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "pendientes-turnar"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const items = data?.data ?? [];
  const sucursales = useMemo(() => sucursalesResponse?.data ?? [], [sucursalesResponse]);
  const canManageAgenda = hasEntregaAgendaManageAccess(user);
  const isSuperAdmin = hasSuperAdminRole(user);
  const assignedSucursalId = user?.sucursalEntrega?._id ?? "";
  const activeSucursales = useMemo(
    () =>
      sucursales.filter((sucursal) => {
        if (isSuperAdmin) {
          return sucursal.activa;
        }

        return sucursal.activa && (!assignedSucursalId || sucursal._id === assignedSucursalId);
      }),
    [assignedSucursalId, isSuperAdmin, sucursales],
  );

  useEffect(() => {
    if (!filters.sucursalId && activeSucursales[0]?._id) {
      setFilters({ sucursalId: activeSucursales[0]._id });
    }
  }, [activeSucursales, filters.sucursalId]);

  const closePendingModal = () => {
    setPendingModalOpen(false);
    setEditingPending(null);
  };

  const closeTurnoModal = () => {
    setTurnoModalOpen(false);
    setPendingToSchedule(null);
  };

  const handleCreate = () => {
    setEditingPending(null);
    setPendingModalOpen(true);
  };

  const handleEdit = (item: PendienteTurnar) => {
    setEditingPending(item);
    setPendingModalOpen(true);
  };

  const handleDelete = (item: PendienteTurnar) => {
    deleteMutation.mutate(item._id);
  };

  const handleSchedule = (item: PendienteTurnar) => {
    setPendingToSchedule(item);
    setTurnoModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        Cargando pendientes de turnar...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar pendientes de turnar"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entregas</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Unidades pendientes de turnar</h1>
          </div>

          {canManageAgenda ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              <Plus size={16} />
              Nuevo pendiente
            </button>
          ) : null}
        </div>
      </section>

      <PendientesTurnarFilters
        sucursalId={filters.sucursalId}
        sucursales={activeSucursales}
        onChange={setFilters}
      />

      {filters.sucursalId ? (
        <PendientesTurnarTable
          items={items}
          canManage={canManageAgenda}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSchedule={handleSchedule}
        />
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <ListTodo size={18} />
            <span>Selecciona una sucursal para ver las unidades pendientes de turnar.</span>
          </div>
        </section>
      )}

      {canManageAgenda ? (
        <>
          <PendienteTurnarForm
            open={pendingModalOpen}
            item={editingPending}
            sucursales={sucursales}
            onClose={closePendingModal}
          />
          <AgendaEntregaForm
            open={turnoModalOpen}
            item={null}
            reservationToConvert={null}
            pendingToSchedule={pendingToSchedule}
            sucursales={sucursales}
            onClose={closeTurnoModal}
          />
        </>
      ) : null}
    </div>
  );
}
