import {
  deleteAgendaEntrega,
  deleteReservaEntrega,
  getAgendaEntregaByInterno,
  getAgendasEntrega,
  getSucursalesEntrega,
  toggleAgendaEntregaEquipado,
  toggleAgendaEntregaEntregadaPor,
} from "@/api/entregasAPI";
import AgendaEntregaFilters from "@/components/entregas/AgendaEntregaFilters";
import AgendaEntregaForm from "@/components/entregas/AgendaEntregaForm";
import AgendaEntregaTable from "@/components/entregas/AgendaEntregaTable";
import InternoLookupCard from "@/components/entregas/InternoLookupCard";
import ReservaEntregaForm from "@/components/entregas/ReservaEntregaForm";
import {
  hasEntregaAgendaEquipadoToggleAccess,
  hasEntregaAgendaManageAccess,
  hasEntregaAgendaToggleAccess,
} from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { AgendaEntrega } from "@/types/index";
import { openAgendaEntregaPrintView } from "@/utils/agendaEntregaPrint";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, FileSpreadsheet, Plus, Search, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
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
  const [turnoModalOpen, setTurnoModalOpen] = useState(false);
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<AgendaEntrega | null>(null);
  const [editingReserva, setEditingReserva] = useState<AgendaEntrega | null>(null);
  const [reservationToConvert, setReservationToConvert] = useState<AgendaEntrega | null>(null);
  const [searchInterno, setSearchInterno] = useState("");
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchedInterno, setSearchedInterno] = useState<number | null>(null);
  const [searchedAgenda, setSearchedAgenda] = useState<AgendaEntrega | null>(null);
  const [searchLookupError, setSearchLookupError] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entregas", "agendas", filters],
    queryFn: () => getAgendasEntrega({ fecha: filters.fecha || undefined, sucursalId: filters.sucursalId || undefined }),
  });

  const { data: sucursalesResponse } = useQuery({
    queryKey: ["entregas", "sucursales"],
    queryFn: getSucursalesEntrega,
  });

  const deleteTurnoMutation = useMutation({
    mutationFn: deleteAgendaEntrega,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "agendas"] });
      queryClient.invalidateQueries({ queryKey: ["entregas", "logs"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const deleteReservaMutation = useMutation({
    mutationFn: deleteReservaEntrega,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "agendas"] });
      queryClient.invalidateQueries({ queryKey: ["entregas", "logs"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const toggleEntregadaPorMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      toggleAgendaEntregaEntregadaPor(id, checked),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["entregas", "agendas"] });
      queryClient.invalidateQueries({ queryKey: ["entregas", "logs"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });
  const toggleEquipadoMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      toggleAgendaEntregaEquipado(id, checked),
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
  const canToggleEquipado = hasEntregaAgendaEquipadoToggleAccess(user);
  const canToggleEntregadaPor = hasEntregaAgendaToggleAccess(user);
  const preferredSucursalId = user?.sucursalPredeterminada?._id ?? user?.sucursalEntrega?._id ?? "";
  const activeSucursales = useMemo(
    () => sucursales.filter((sucursal) => sucursal.activa),
    [sucursales],
  );
  const selectedSucursal = useMemo(
    () => sucursales.find((sucursal) => sucursal._id === filters.sucursalId) ?? null,
    [filters.sucursalId, sucursales],
  );
  const canToggleInSelectedSucursal = useMemo(() => {
    if (!filters.sucursalId) {
      return false;
    }

    return canToggleEntregadaPor;
  }, [canToggleEntregadaPor, filters.sucursalId]);
  const canToggleEquipadoInSelectedSucursal = useMemo(() => {
    if (!filters.sucursalId) {
      return false;
    }

    return canToggleEquipado;
  }, [canToggleEquipado, filters.sucursalId]);

  useEffect(() => {
    if (!filters.sucursalId && (preferredSucursalId || activeSucursales[0]?._id)) {
      setFilters((current) => ({
        ...current,
        sucursalId:
          activeSucursales.find((sucursal) => sucursal._id === preferredSucursalId)?._id ??
          activeSucursales[0]?._id ??
          "",
      }));
    }
  }, [activeSucursales, filters.sucursalId, preferredSucursalId]);

  const closeTurnoModal = () => {
    setTurnoModalOpen(false);
    setEditingTurno(null);
    setReservationToConvert(null);
  };

  const closeReservaModal = () => {
    setReservaModalOpen(false);
    setEditingReserva(null);
  };

  const handleCreateTurno = () => {
    setEditingTurno(null);
    setReservationToConvert(null);
    setTurnoModalOpen(true);
  };

  const handleCreateReserva = () => {
    setEditingReserva(null);
    setReservaModalOpen(true);
  };

  const handleEdit = (item: AgendaEntrega) => {
    if (item.tipoRegistro === "reserva") {
      setEditingReserva(item);
      setReservaModalOpen(true);
      return;
    }

    setEditingTurno(item);
    setReservationToConvert(null);
    setTurnoModalOpen(true);
  };

  const handleDelete = (item: AgendaEntrega) => {
    if (item.tipoRegistro === "reserva") {
      deleteReservaMutation.mutate(item._id);
      return;
    }

    deleteTurnoMutation.mutate(item._id);
  };

  const handleConvertReservation = (item: AgendaEntrega) => {
    setEditingTurno(null);
    setReservationToConvert(item);
    setTurnoModalOpen(true);
  };

  const handleToggleEntregadaPor = (item: AgendaEntrega, checked: boolean) => {
    toggleEntregadaPorMutation.mutate({ id: item._id, checked });
  };

  const handleToggleEquipado = (item: AgendaEntrega, checked: boolean) => {
    toggleEquipadoMutation.mutate({ id: item._id, checked });
  };

  const handleCloseSearchDialog = () => {
    setSearchDialogOpen(false);
    setSearchedInterno(null);
    setSearchedAgenda(null);
    setSearchLookupError("");
  };

  const handleOpenSearchedAgenda = () => {
    if (!searchedAgenda?.sucursal?._id) {
      return;
    }

    setFilters({
      fecha: searchedAgenda.fechaAgenda,
      sucursalId: searchedAgenda.sucursal._id,
    });
    handleCloseSearchDialog();
  };

  const handleSearchByInterno = async () => {
    const interno = Number(searchInterno.trim());

    if (!Number.isInteger(interno) || interno <= 0) {
      toast.error("Ingresa un numero de interno valido");
      return;
    }

    setSearchLookupError("");

    try {
      const agenda = await getAgendaEntregaByInterno(interno);
      setSearchedInterno(interno);
      setSearchedAgenda(agenda);
      setSearchDialogOpen(true);
    } catch (searchError) {
      setSearchedInterno(interno);
      setSearchedAgenda(null);
      setSearchLookupError(
        searchError instanceof Error ? searchError.message : "No se pudo buscar el turno por interno",
      );
      setSearchDialogOpen(true);
    }
  };

  const searchMutation = useMutation({
    mutationFn: handleSearchByInterno,
  });

  const searchedAgendaOperacion = useMemo(() => {
    if (!searchedAgenda?.siac) {
      return "-";
    }

    if (searchedAgenda.siac.operacion) {
      return String(searchedAgenda.siac.operacion);
    }

    if (searchedAgenda.siac.grupo && searchedAgenda.siac.orden) {
      return `[${searchedAgenda.siac.grupo} | ${searchedAgenda.siac.orden}]`;
    }

    return "-";
  }, [searchedAgenda]);

  const handlePrint = () => {
    if (!filters.fecha) {
      toast.error("Selecciona una fecha para imprimir la agenda del dia");
      return;
    }

    if (!filters.sucursalId) {
      toast.error("Selecciona una sucursal para imprimir la agenda");
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
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-2">
              <input
                type="text"
                inputMode="numeric"
                value={searchInterno}
                onChange={(event) => setSearchInterno(event.target.value.replace(/\D/g, ""))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (!searchMutation.isPending) {
                      searchMutation.mutate();
                    }
                  }
                }}
                placeholder="Buscar interno"
                className="w-32 border-none bg-transparent px-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => searchMutation.mutate()}
                disabled={searchMutation.isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                aria-label="Buscar turno por interno"
              >
                <Search size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <FileSpreadsheet size={16} />
              Imprimir agenda
            </button>

            {canManageAgenda ? (
              <>
                <button
                  type="button"
                  onClick={handleCreateReserva}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  <CalendarPlus size={16} />
                  Nueva reserva
                </button>
                <button
                  type="button"
                  onClick={handleCreateTurno}
                  className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
                >
                  <Plus size={16} />
                  Nuevo turno
                </button>
              </>
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
        <AgendaEntregaTable
          items={items}
          horariosHabilitados={selectedSucursal?.horariosHabilitados ?? []}
          canToggleEquipado={canToggleEquipadoInSelectedSucursal}
          toggleEquipadoPendingId={toggleEquipadoMutation.isPending ? (toggleEquipadoMutation.variables?.id ?? null) : null}
          canToggleEntregadaPor={canToggleInSelectedSucursal}
          togglePendingId={toggleEntregadaPorMutation.isPending ? (toggleEntregadaPorMutation.variables?.id ?? null) : null}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onConvertReservation={handleConvertReservation}
          onToggleEquipado={handleToggleEquipado}
          onToggleEntregadaPor={handleToggleEntregadaPor}
          canManage={canManageAgenda}
        />
      ) : (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm">
          Selecciona una sucursal para ver la agenda individual.
        </section>
      )}

      {canManageAgenda ? (
        <>
          <AgendaEntregaForm
            open={turnoModalOpen}
            item={editingTurno}
            reservationToConvert={reservationToConvert}
            sucursales={sucursales}
            onClose={closeTurnoModal}
          />
          <ReservaEntregaForm
            open={reservaModalOpen}
            item={editingReserva}
            sucursales={sucursales}
            onClose={closeReservaModal}
          />
        </>
      ) : null}

      <Transition appear show={searchDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => (searchMutation.isPending ? undefined : handleCloseSearchDialog())}>
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
                <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entregas</p>
                      <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                        Busqueda de turno por interno
                      </Dialog.Title>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseSearchDialog}
                      disabled={searchMutation.isPending}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-6 p-6">
                    {searchLookupError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {searchLookupError}
                      </div>
                    ) : searchedAgenda ? (
                      <>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Turno asignado</p>
                              <h3 className="mt-1 text-lg font-semibold text-gray-900">
                                Interno {searchedAgenda.interno}
                              </h3>
                              <p className="mt-1 text-sm text-gray-600">Resultado encontrado en toda la agenda.</p>
                            </div>
                            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
                              Operacion {searchedAgendaOperacion}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Sucursal de entrega</p>
                              <p className="mt-1 text-sm font-semibold text-blue-950">{searchedAgenda.sucursal?.nombre || "-"}</p>
                            </div>
                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Fecha de entrega</p>
                              <p className="mt-1 text-sm font-semibold text-blue-950">{searchedAgenda.fechaAgenda}</p>
                            </div>
                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">Hora de entrega</p>
                              <p className="mt-1 text-sm font-semibold text-blue-950">{searchedAgenda.horaAgenda}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tipo</p>
                              <p className="mt-1 text-sm font-medium text-gray-900">{searchedAgenda.tipoOperacion || searchedAgenda.siac?.tipoOperacion || "-"}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Entregada por</p>
                              <p className="mt-1 text-sm font-medium text-gray-900">
                                {searchedAgenda.entregadaPorMarcada ? searchedAgenda.entregadaPorNombre || "-" : "-"}
                              </p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Equipado</p>
                              <p className="mt-1 text-sm font-medium text-gray-900">{searchedAgenda.equipado ? "Si" : "No"}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Entrega usado</p>
                              <p className="mt-1 text-sm font-medium text-gray-900">{searchedAgenda.entregaUsado ? "Si" : "No"}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Siniestro</p>
                              <p className="mt-1 text-sm font-medium text-gray-900">{searchedAgenda.siniestro ? "Si" : "No"}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Observaciones</p>
                              <p className="mt-1 text-sm font-medium text-gray-900">{searchedAgenda.observaciones?.trim() || "-"}</p>
                            </div>
                          </div>

                          {searchedAgenda.sucursal?._id ? (
                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                onClick={handleOpenSearchedAgenda}
                                className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                              >
                                Ver en agenda
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <InternoLookupCard data={searchedAgenda.siac ?? null} error={searchedAgenda.siacSyncError ? searchedAgenda.siacSyncMessage : ""} />
                      </>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Resultado</p>
                        <h3 className="mt-1 text-lg font-semibold text-amber-900">
                          {searchedInterno ? `Interno ${searchedInterno}` : "Interno"}: turno sin asignar
                        </h3>
                        <p className="mt-1 text-sm text-amber-800">
                          No existe un turno cargado en agenda para ese interno.
                        </p>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
