import {
  deletePendienteTurnar,
  getPendientesTurnar,
  getSucursalesEntrega,
  importPendientesTurnarFile,
} from "@/api/entregasAPI";
import AgendaEntregaForm from "@/components/entregas/AgendaEntregaForm";
import PendienteTurnarForm from "@/components/entregas/PendienteTurnarForm";
import PendientesTurnarFilters from "@/components/entregas/PendientesTurnarFilters";
import PendientesTurnarTable from "@/components/entregas/PendientesTurnarTable";
import { hasEntregaAgendaManageAccess, hasPendienteTurnarImportAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { PendienteTurnar } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, ListTodo, LoaderCircle, Plus, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

const ACCEPTED_EXCEL_TYPES =
  ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export default function PendientesTurnarView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
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
  const importMutation = useMutation({
    mutationFn: ({ file, sucursalId }: { file: File; sucursalId: string }) =>
      importPendientesTurnarFile(file, sucursalId),
    onSuccess: (response) => {
      const { createdCount, skippedCount, skippedAlreadyPending, skippedAlreadyScheduled, skippedInvalidRows } =
        response.data;

      toast.success(
        `${response.message}. Creados: ${createdCount}. Omitidos: ${skippedCount} (ya pendientes: ${skippedAlreadyPending}, ya agendados: ${skippedAlreadyScheduled}, invalidos: ${skippedInvalidRows}).`,
      );
      queryClient.invalidateQueries({ queryKey: ["entregas", "pendientes-turnar"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const items = data?.data ?? [];
  const sucursales = useMemo(() => sucursalesResponse?.data ?? [], [sucursalesResponse]);
  const canManageAgenda = hasEntregaAgendaManageAccess(user);
  const canImportPendientes = hasPendienteTurnarImportAccess(user);
  const preferredSucursalId = user?.sucursalPredeterminada?._id ?? user?.sucursalEntrega?._id ?? "";
  const activeSucursales = useMemo(
    () => sucursales.filter((sucursal) => sucursal.activa),
    [sucursales],
  );

  useEffect(() => {
    if (!filters.sucursalId && (preferredSucursalId || activeSucursales[0]?._id)) {
      setFilters({
        sucursalId:
          activeSucursales.find((sucursal) => sucursal._id === preferredSucursalId)?._id ??
          activeSucursales[0]?._id ??
          "",
      });
    }
  }, [activeSucursales, filters.sucursalId, preferredSucursalId]);

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

  const handleImportSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!filters.sucursalId) {
      toast.error("Selecciona una sucursal antes de importar");
      event.target.value = "";
      return;
    }

    try {
      await importMutation.mutateAsync({
        file: selectedFile,
        sucursalId: filters.sucursalId,
      });
    } finally {
      event.target.value = "";
    }
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_EXCEL_TYPES}
                className="hidden"
                onChange={(event) => void handleImportSelected(event)}
              />
              {canImportPendientes ? (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={!filters.sucursalId || importMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importMutation.isPending ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      Importar Datos
                    </>
                  )}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                <Plus size={16} />
                Nuevo pendiente
              </button>
            </div>
          ) : null}
        </div>
        {canImportPendientes ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <FileSpreadsheet size={16} />
            <span>Importa archivos `.xls` o `.xlsx` con `F.Patenta`, `Dominio` y `SPE = Finalizada`, usando la sucursal actualmente seleccionada.</span>
          </div>
        ) : null}
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
