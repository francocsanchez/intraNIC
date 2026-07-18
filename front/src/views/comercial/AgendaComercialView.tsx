import {
  getComercialAgendaPuestos,
  getComercialAgendaUnidadesNegocio,
  getComercialAgendaUsers,
  getComercialAgendaWeek,
  saveComercialAgendaCell,
  saveComercialAgendaPuestos,
  type ComercialAgendaPuestoPayload,
} from "@/api/comercialAgendaAPI";
import ParticipantesMultiSelect from "@/components/minutas/ParticipantesMultiSelect";
import { useAuth } from "@/hooks/useAuthe";
import { hasComercialAgendaManageAccess } from "@/helpers/access";
import type { ComercialAgendaAsignacion, ComercialAgendaPuesto, ComercialAgendaUser } from "@/types/index";
import { openComercialAgendaPrintView } from "@/utils/comercialAgendaPrint";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical, Plus, Printer, Settings2, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfWeek(date: Date) {
  const current = startOfDay(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(current, diff);
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatUserLabel(user: ComercialAgendaUser) {
  return `${user.lastName}, ${user.name}`;
}

type CellEditorModalProps = {
  cell: ComercialAgendaAsignacion | null;
  open: boolean;
  unidadNegocioId: string;
  users: ComercialAgendaUser[];
  onClose: () => void;
};

function CellEditorModal({ cell, open, unidadNegocioId, users, onClose }: CellEditorModalProps) {
  const queryClient = useQueryClient();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !cell) {
      setSelectedUserIds([]);
      return;
    }

    setSelectedUserIds(cell.asistentes.map((item) => item._id));
  }, [cell, open]);

  const saveMutation = useMutation({
    mutationFn: saveComercialAgendaCell,
    onSuccess: (response) => {
      toast.success(response.message || "Asignacion guardada correctamente");
      queryClient.invalidateQueries({ queryKey: ["comercial-agenda", "week"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSave = () => {
    if (!cell) return;

    const fecha = cell.fecha.slice(0, 10);
    saveMutation.mutate({
      unidadNegocioId,
      fecha,
      puestoId: cell.puestoId,
      asistentes: selectedUserIds,
    });
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (saveMutation.isPending ? undefined : onClose())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      Editar asignacion
                    </Dialog.Title>
                    {cell ? (
                      <p className="mt-1 text-sm text-gray-500">
                        {cell.fechaLabel} · {cell.puestoNombre}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saveMutation.isPending}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6">
                  <ParticipantesMultiSelect
                    disabled={saveMutation.isPending}
                    onChange={setSelectedUserIds}
                    options={users}
                    value={selectedUserIds}
                  />
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">
                    Puedes dejar la celda vacia para borrar la asignacion de ese puesto en la fecha.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saveMutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saveMutation.isPending ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

type PuestosManagerModalProps = {
  open: boolean;
  unidadNegocioId: string;
  unidadNegocioNombre: string;
  puestos: ComercialAgendaPuesto[];
  onClose: () => void;
};

function PuestosManagerModal({ open, unidadNegocioId, unidadNegocioNombre, puestos, onClose }: PuestosManagerModalProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Array<{ key: string; _id?: string; nombre: string; activo: boolean }>>([]);

  useEffect(() => {
    if (!open) return;

    setDraft(
      puestos.map((puesto, index) => ({
        key: puesto._id || `existing-${index}`,
        _id: puesto._id,
        nombre: puesto.nombre,
        activo: puesto.activo,
      })),
    );
  }, [open, puestos]);

  const saveMutation = useMutation({
    mutationFn: (items: ComercialAgendaPuestoPayload[]) => saveComercialAgendaPuestos(unidadNegocioId, items),
    onSuccess: (response) => {
      toast.success(response.message || "Puestos guardados correctamente");
      queryClient.invalidateQueries({ queryKey: ["comercial-agenda", "puestos"] });
      queryClient.invalidateQueries({ queryKey: ["comercial-agenda", "week"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateDraftItem = (key: string, updater: (item: { key: string; _id?: string; nombre: string; activo: boolean }) => { key: string; _id?: string; nombre: string; activo: boolean }) => {
    setDraft((current) => current.map((item) => (item.key === key ? updater(item) : item)));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const addItem = () => {
    setDraft((current) => [
      ...current,
      {
        key: `new-${Date.now()}-${current.length}`,
        nombre: "",
        activo: true,
      },
    ]);
  };

  const handleSave = () => {
    const cleaned = draft.map((item) => ({
      _id: item._id,
      nombre: item.nombre.trim(),
      activo: item.activo,
    }));

    saveMutation.mutate(cleaned);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (saveMutation.isPending ? undefined : onClose())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      Administrar puestos
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      Ordena las columnas de {unidadNegocioNombre || "la unidad seleccionada"}, cambia nombres y desactiva puestos sin perder historial.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saveMutation.isPending}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 p-6">
                  {draft.map((item, index) => (
                    <div key={item.key} className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[auto_1fr_auto_auto] md:items-center">
                      <div className="flex items-center gap-2 text-gray-400">
                        <GripVertical size={16} />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">#{index + 1}</span>
                      </div>

                      <input
                        type="text"
                        value={item.nombre}
                        onChange={(event) =>
                          updateDraftItem(item.key, (current) => ({
                            ...current,
                            nombre: event.target.value,
                          }))
                        }
                        placeholder="Nombre del puesto"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                      />

                      <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={item.activo}
                          onChange={(event) =>
                            updateDraftItem(item.key, (current) => ({
                              ...current,
                              activo: event.target.checked,
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                        />
                        Activo
                      </label>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 1)}
                          disabled={index === draft.length - 1}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Bajar
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <Plus size={16} />
                    Agregar puesto
                  </button>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-gray-500">Los puestos inactivos se ocultan en la agenda semanal.</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saveMutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saveMutation.isPending ? "Guardando..." : "Guardar puestos"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function AgendaComercialView() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [visibleDate, setVisibleDate] = useState(() => startOfWeek(new Date()));
  const [editingCell, setEditingCell] = useState<ComercialAgendaAsignacion | null>(null);
  const [puestosModalOpen, setPuestosModalOpen] = useState(false);
  const [selectedUnidadNegocioId, setSelectedUnidadNegocioId] = useState("");

  const from = useMemo(() => formatIsoDate(visibleDate), [visibleDate]);
  const canManageAgenda = hasComercialAgendaManageAccess(user);
  const hasUnidadSeleccionada = Boolean(selectedUnidadNegocioId);

  const { data: unidadesResponse } = useQuery({
    queryKey: ["comercial-agenda", "unidades-negocio"],
    queryFn: getComercialAgendaUnidadesNegocio,
    enabled: true,
  });

  const unidadesNegocio = unidadesResponse?.data ?? [];
  const selectedUnidadNegocio = unidadesNegocio.find((item) => item._id === selectedUnidadNegocioId) ?? null;

  useEffect(() => {
    if (!unidadesNegocio.length) {
      return;
    }

    setSelectedUnidadNegocioId((current) =>
      current && unidadesNegocio.some((item) => item._id === current)
        ? current
        : unidadesNegocio[0]?._id ?? "",
    );
  }, [unidadesNegocio]);

  const { data: usersResponse } = useQuery({
    queryKey: ["comercial-agenda", "users", selectedUnidadNegocioId],
    queryFn: () => getComercialAgendaUsers({ unidadNegocioId: selectedUnidadNegocioId }),
    enabled: canManageAgenda && hasUnidadSeleccionada,
  });

  const { data: puestosResponse } = useQuery({
    queryKey: ["comercial-agenda", "puestos", selectedUnidadNegocioId],
    queryFn: () => getComercialAgendaPuestos(selectedUnidadNegocioId, canManageAgenda),
    enabled: hasUnidadSeleccionada,
  });

  const { data: weekResponse, isLoading, isError, error } = useQuery({
    queryKey: ["comercial-agenda", "week", from, selectedUnidadNegocioId],
    queryFn: () => getComercialAgendaWeek(from, selectedUnidadNegocioId),
    enabled: hasUnidadSeleccionada,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["comercial-agenda", "week"] });
  }, [queryClient]);

  const users = usersResponse?.data ?? [];
  const allPuestos = puestosResponse?.data ?? [];
  const week = weekResponse?.data;

  const goToToday = () => setVisibleDate(startOfWeek(new Date()));
  const goToPrevWeek = () => setVisibleDate((current) => addDays(current, -7));
  const goToNextWeek = () => setVisibleDate((current) => addDays(current, 7));
  const handlePrint = () => {
    if (!week) {
      toast.error("No hay agenda semanal cargada para imprimir");
      return;
    }

    try {
      openComercialAgendaPrintView({ week });
    } catch (printError) {
      toast.error(printError instanceof Error ? printError.message : "No se pudo abrir la vista de impresion");
    }
  };

  if (isLoading && hasUnidadSeleccionada) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando agenda comercial...</div>
      </div>
    );
  }

  if (isError && hasUnidadSeleccionada) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
          {error instanceof Error ? error.message : "Error al cargar la agenda comercial"}
        </div>
      </div>
    );
  }

  const activePuestos = week?.puestos ?? [];

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Agenda semanal de puestos</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              {canManageAgenda
                ? "Asigna usuarios por fecha y puesto de trabajo. Cada unidad de negocio tiene sus propios puestos y su propia semana comercial."
                : "Consulta la agenda comercial semanal por unidad de negocio, con sus puestos y asistentes asignados."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <Printer size={16} />
              Imprimir / PDF
            </button>

            {canManageAgenda ? (
              <button
                type="button"
                onClick={() => setPuestosModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
              >
                <Settings2 size={16} />
                Administrar puestos
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex min-w-[280px] flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Unidad de negocio
              </span>
              <select
                value={selectedUnidadNegocioId}
                onChange={(event) => setSelectedUnidadNegocioId(event.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
              >
                {unidadesNegocio.length ? null : <option value="">-- Sin unidades activas --</option>}
                {unidadesNegocio.map((unidad) => (
                  <option key={unidad._id} value={unidad._id}>
                    {unidad.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700">
              <CalendarDays size={14} />
              {week?.weekLabel ?? "Selecciona una unidad"}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-1.5 py-1.5">
              <button type="button" onClick={goToPrevWeek} className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={goToToday} className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-white hover:text-gray-900">
                Hoy
              </button>
              <button type="button" onClick={goToNextWeek} className="rounded-lg p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {!unidadesNegocio.length ? (
        <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          No hay unidades de negocio activas. Primero crea una desde administracion para poder segmentar la agenda comercial.
        </section>
      ) : !hasUnidadSeleccionada ? (
        <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          Selecciona una unidad de negocio para cargar sus puestos, usuarios y asignaciones semanales.
        </section>
      ) : !activePuestos.length ? (
        <section className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500 shadow-sm">
          No hay puestos activos configurados para <span className="font-semibold text-gray-700">{selectedUnidadNegocio?.nombre ?? "esta unidad"}</span>.
          {canManageAgenda ? " Usa Administrar puestos para crear las columnas de la agenda." : ""}
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                <tr>
                  <th className="w-[180px] px-4 py-3 text-left">Fecha</th>
                  {activePuestos.map((puesto) => (
                    <th key={puesto._id} className="min-w-[220px] px-4 py-3 text-left">
                      {puesto.nombre}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {(week?.days ?? []).map((day) => (
                  <tr key={day.fecha} className="align-top hover:bg-gray-50/60">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{day.fechaLabel}</div>
                      <div className="mt-1 text-xs capitalize text-gray-500">{day.weekdayLabel}</div>
                    </td>
                    {day.cells.map((cell) => (
                      <td key={`${day.fecha}-${cell.puestoId}`} className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => (canManageAgenda ? setEditingCell(cell) : undefined)}
                          className={`w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition ${
                            canManageAgenda ? "hover:border-gray-300 hover:bg-gray-50" : "cursor-default"
                          }`}
                        >
                          {cell.asistentes.length ? (
                            <div className="flex flex-wrap gap-2">
                              {cell.asistentes.map((asistente) => (
                                <span
                                  key={asistente._id}
                                  className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                                >
                                  {formatUserLabel(asistente)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Sin asignar</span>
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canManageAgenda ? (
        <>
          <CellEditorModal
            cell={editingCell}
            open={Boolean(editingCell)}
            unidadNegocioId={selectedUnidadNegocioId}
            users={users}
            onClose={() => setEditingCell(null)}
          />

          <PuestosManagerModal
            open={puestosModalOpen}
            unidadNegocioId={selectedUnidadNegocioId}
            unidadNegocioNombre={selectedUnidadNegocio?.nombre ?? ""}
            puestos={allPuestos}
            onClose={() => setPuestosModalOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}
