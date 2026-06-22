import {
  deleteAgendaEntrega,
  getAgendasEntrega,
  getSucursalesEntrega,
} from "@/api/entregasAPI";
import AgendaEntregaFilters from "@/components/entregas/AgendaEntregaFilters";
import AgendaEntregaForm from "@/components/entregas/AgendaEntregaForm";
import AgendaEntregaTable from "@/components/entregas/AgendaEntregaTable";
import { hasEntregaAgendaManageAccess, hasSuperAdminRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { AgendaEntrega } from "@/types/index";
import { openAgendaEntregaPrintView } from "@/utils/agendaEntregaPrint";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AgendaEntregaView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ fecha: getTodayDate(), sucursalId: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaEntrega | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entregas", "agendas", filters],
    queryFn: () => getAgendasEntrega({ fecha: filters.fecha || undefined, sucursalId: filters.sucursalId || undefined }),
  });

  const { data: sucursalesResponse } = useQuery({
    queryKey: ["entregas", "sucursales"],
    queryFn: getSucursalesEntrega,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgendaEntrega,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "agendas"] });
      queryClient.invalidateQueries({ queryKey: ["entregas", "logs"] });
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
      setFilters((current) => ({
        ...current,
        sucursalId: activeSucursales[0]?._id ?? "",
      }));
    }
  }, [activeSucursales, filters.sucursalId]);

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: AgendaEntrega) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = (item: AgendaEntrega) => {
    deleteMutation.mutate(item._id);
  };

  const handlePrint = () => {
    if (!filters.fecha) {
      toast.error("Selecciona una fecha para imprimir la agenda del dia");
      return;
    }

    if (!filters.sucursalId) {
      toast.error("Selecciona una sucursal para imprimir la agenda");
      return;
    }

    if (!items.length) {
      toast.error("No hay agendas para imprimir con los filtros actuales");
      return;
    }

    try {
      openAgendaEntregaPrintView({
        items,
        fecha: filters.fecha,
        sucursalId: filters.sucursalId,
        sucursales,
      });
    } catch (printError) {
      toast.error(printError instanceof Error ? printError.message : "No se pudo abrir la vista de impresion");
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        Cargando agenda de entrega...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar la agenda de entrega"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entregas</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Agenda de entrega</h1>
         
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <FileSpreadsheet size={16} />
              Imprimir agenda
            </button>

            {canManageAgenda ? (
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                <Plus size={16} />
                Nuevo turno
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <AgendaEntregaFilters
        fecha={filters.fecha}
        sucursalId={filters.sucursalId}
        sucursales={activeSucursales}
        onChange={setFilters}
      />

      {filters.sucursalId ? (
        <AgendaEntregaTable items={items} onEdit={handleEdit} onDelete={handleDelete} canManage={canManageAgenda} />
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm">
          Selecciona una sucursal para ver la agenda individual.
        </section>
      )}

      {canManageAgenda ? (
        <AgendaEntregaForm
          open={modalOpen}
          item={editingItem}
          sucursales={sucursales}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
        />
      ) : null}
    </div>
  );
}
