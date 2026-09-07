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
    if (filters.sucursalId || (!preferredSucursalId && !activeSucursales[0]?._id)) return;

    const frame = window.requestAnimationFrame(() => {
      setFilters((current) => ({
        ...current,
        sucursalId:
          activeSucursales.find((sucursal) => sucursal._id === preferredSucursalId)?._id ??
          activeSucursales[0]?._id ??
          "",
      }));
    });

    return () => window.cancelAnimationFrame(frame);
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
      <div className="font-preset rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
        Cargando agenda de entrega...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset rounded-lg border border-destructive/30 bg-card p-3 text-destructive shadow-sm">
        {error instanceof Error ? error.message : "Error al cargar la agenda de entrega"}
      </div>
    );
  }

  return (
    <div className="font-preset space-y-3">
      <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Entregas</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-card-foreground">Agenda de entrega</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2">
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
                className="w-32 border-none bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => searchMutation.mutate()}
                disabled={searchMutation.isPending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-secondary text-secondary-foreground transition hover:bg-muted disabled:opacity-60"
                aria-label="Buscar turno por interno"
              >
                <Search size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
            >
              <FileSpreadsheet size={16} />
              Imprimir agenda
            </button>

            {canManageAgenda ? (
              <>
                <button
                  type="button"
                  onClick={handleCreateReserva}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm font-semibold text-secondary-foreground transition hover:bg-muted"
                >
                  <CalendarPlus size={16} />
                  Nueva reserva
                </button>
                <button
                  type="button"
                  onClick={handleCreateTurno}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
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
        <section className="rounded-lg border border-dashed border-border bg-card px-3 py-8 text-center text-sm text-muted-foreground shadow-sm">
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
            <div className="fixed inset-0 bg-foreground/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Entregas</p>
                      <Dialog.Title className="mt-0.5 text-lg font-semibold tracking-tight text-popover-foreground">
                        Busqueda de turno por interno
                      </Dialog.Title>
                    </div>

                    <button
                      type="button"
                      onClick={handleCloseSearchDialog}
                      disabled={searchMutation.isPending}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-3 p-3">
                    {searchLookupError ? (
                      <div className="rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm text-destructive">
                        {searchLookupError}
                      </div>
                    ) : searchedAgenda ? (
                      <>
                        <div className="border border-border bg-secondary px-3 py-3">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Turno asignado</p>
                              <h3 className="mt-0.5 text-lg font-semibold text-popover-foreground">
                                Interno {searchedAgenda.interno}
                              </h3>
                              <p className="mt-0.5 text-sm text-muted-foreground">Resultado encontrado en todas las sucursales y fechas.</p>
                            </div>
                            <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-foreground">
                              Operacion {searchedAgendaOperacion}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
                            <div className="bg-popover px-3 py-2">
                              <p className="text-primary font-medium uppercase tracking-wide text-muted-foreground">Sucursal de entrega</p>
                              <p className="mt-0.5 text-sm font-semibold text-popover-foreground">{searchedAgenda.sucursal?.nombre || "-"}</p>
                            </div>
                            <div className="bg-popover px-3 py-2">
                              <p className="text-primary font-medium uppercase tracking-wide text-muted-foreground">Fecha de entrega</p>
                              <p className="mt-0.5 text-sm font-semibold text-popover-foreground">{searchedAgenda.fechaAgenda}</p>
                            </div>
                            <div className="bg-popover px-3 py-2">
                              <p className="text-primary font-medium uppercase tracking-wide text-muted-foreground">Hora de entrega</p>
                              <p className="mt-0.5 text-sm font-semibold text-popover-foreground">{searchedAgenda.horaAgenda}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-border bg-card px-4 py-3">
                              <p className="text-primary font-semibold uppercase tracking-wide text-muted-foreground">Tipo</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{searchedAgenda.tipoOperacion || searchedAgenda.siac?.tipoOperacion || "-"}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card px-4 py-3">
                              <p className="text-primary font-semibold uppercase tracking-wide text-muted-foreground">Entregada por</p>
                              <p className="mt-1 text-sm font-medium text-foreground">
                                {searchedAgenda.entregadaPorMarcada ? searchedAgenda.entregadaPorNombre || "-" : "-"}
                              </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card px-4 py-3">
                              <p className="text-primary font-semibold uppercase tracking-wide text-muted-foreground">Equipado</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{searchedAgenda.equipado ? "Si" : "No"}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card px-4 py-3">
                              <p className="text-primary font-semibold uppercase tracking-wide text-muted-foreground">Entrega usado</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{searchedAgenda.entregaUsado ? "Si" : "No"}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card px-4 py-3">
                              <p className="text-primary font-semibold uppercase tracking-wide text-muted-foreground">Siniestro</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{searchedAgenda.siniestro ? "Si" : "No"}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card px-4 py-3">
                              <p className="text-primary font-semibold uppercase tracking-wide text-muted-foreground">Observaciones</p>
                              <p className="mt-1 text-sm font-medium text-foreground">{searchedAgenda.observaciones?.trim() || "-"}</p>
                            </div>
                          </div>

                          {searchedAgenda.sucursal?._id ? (
                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                onClick={handleOpenSearchedAgenda}
                                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                              >
                                Ver en agenda
                              </button>
                            </div>
                          ) : null}
                        </div>

                        <InternoLookupCard data={searchedAgenda.siac ?? null} error={searchedAgenda.siacSyncError ? searchedAgenda.siacSyncMessage : ""} />
                      </>
                    ) : (
                      <div className="rounded-lg border border-border bg-secondary px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">Resultado</p>
                        <h3 className="mt-1 text-lg font-semibold text-secondary-foreground">
                          {searchedInterno ? `Interno ${searchedInterno}` : "Interno"}: turno sin asignar
                        </h3>
                        <p className="mt-1 text-sm text-secondary-foreground">
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
