import {
  convertReservaEntrega,
  createAgendaEntrega,
  getAgendaEntregaLookup,
  updateAgendaEntrega,
  type AgendaEntregaPayload,
  type ReservaEntregaConvertPayload,
} from "@/api/entregasAPI";
import InternoLookupCard from "@/components/entregas/InternoLookupCard";
import { hasSuperAdminRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { AgendaEntrega, AgendaEntregaLookup, SucursalEntrega } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type AgendaEntregaFormValues = {
  interno?: number;
  sucursal: string;
  fechaAgenda: string;
  horaAgenda: string;
  equipado: boolean;
  entregaUsado: boolean;
  observaciones: string;
};

type AgendaEntregaFormProps = {
  open: boolean;
  item: AgendaEntrega | null;
  reservationToConvert?: AgendaEntrega | null;
  sucursales: SucursalEntrega[];
  onClose: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

const TIME_SLOT_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

export default function AgendaEntregaForm({
  open,
  item,
  reservationToConvert = null,
  sucursales,
  onClose,
}: AgendaEntregaFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lookup, setLookup] = useState<AgendaEntregaLookup | null>(
    item?.tipoRegistro === "turno" ? (item.siac ?? null) : null,
  );
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const isSuperAdmin = hasSuperAdminRole(user);
  const assignedSucursalId = user?.sucursalEntrega?._id ?? "";
  const isEditing = Boolean(item && item.tipoRegistro === "turno");
  const isConvertingReservation = Boolean(reservationToConvert);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AgendaEntregaFormValues>({
    defaultValues: {
      interno: undefined,
      sucursal: "",
      fechaAgenda: "",
      horaAgenda: "",
      equipado: false,
      entregaUsado: false,
      observaciones: "",
    },
  });

  const selectedSucursalId = watch("sucursal");
  const selectedHour = watch("horaAgenda");

  useEffect(() => {
    if (!open) return;

    const defaultSucursal = !item && !reservationToConvert && !isSuperAdmin ? assignedSucursalId : "";
    const source = reservationToConvert ?? item;

    reset({
      interno: item?.tipoRegistro === "turno" ? item.interno ?? undefined : undefined,
      sucursal: source?.sucursal?._id ?? defaultSucursal,
      fechaAgenda: source?.fechaAgenda ?? "",
      horaAgenda: source?.horaAgenda ?? "",
      equipado: item?.tipoRegistro === "turno" ? item.equipado : false,
      entregaUsado: item?.tipoRegistro === "turno" ? item.entregaUsado : false,
      observaciones: source?.observaciones ?? "",
    });
    setLookup(item?.tipoRegistro === "turno" ? (item.siac ?? null) : null);
    setLookupError("");
  }, [assignedSucursalId, isSuperAdmin, item, open, reset, reservationToConvert]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["entregas", "agendas"] });
    queryClient.invalidateQueries({ queryKey: ["entregas", "logs"] });
  };

  const createMutation = useMutation({
    mutationFn: createAgendaEntrega,
    onSuccess: (response) => {
      toast.success(response.message);
      invalidate();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AgendaEntregaPayload }) =>
      updateAgendaEntrega(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      invalidate();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReservaEntregaConvertPayload }) =>
      convertReservaEntrega(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      invalidate();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleLookup = async () => {
    const interno = Number(getValues("interno"));

    if (!Number.isInteger(interno) || interno <= 0) {
      setLookup(null);
      setLookupError("Ingresa un interno valido para buscar");
      return;
    }

    setLookupLoading(true);
    setLookupError("");

    try {
      const data = await getAgendaEntregaLookup(interno);
      setLookup(data);
    } catch (error) {
      setLookup(null);
      setLookupError(error instanceof Error ? error.message : "No se pudo buscar el interno");
    } finally {
      setLookupLoading(false);
    }
  };

  const onSubmit = (values: AgendaEntregaFormValues) => {
    if (!lookup || lookup.interno !== Number(values.interno)) {
      toast.error("Debes buscar y validar el interno antes de guardar");
      return;
    }

    const agendaPayload: AgendaEntregaPayload = {
      interno: Number(values.interno),
      sucursal: values.sucursal,
      fechaAgenda: values.fechaAgenda,
      horaAgenda: values.horaAgenda,
      equipado: Boolean(values.equipado),
      entregaUsado: Boolean(values.entregaUsado),
      observaciones: values.observaciones?.trim() ?? "",
    };

    if (isConvertingReservation && reservationToConvert) {
      const convertPayload: ReservaEntregaConvertPayload = {
        interno: agendaPayload.interno,
        equipado: agendaPayload.equipado,
        entregaUsado: agendaPayload.entregaUsado,
        observaciones: agendaPayload.observaciones,
      };

      convertMutation.mutate({ id: reservationToConvert._id, payload: convertPayload });
      return;
    }

    if (isEditing && item) {
      updateMutation.mutate({ id: item._id, payload: agendaPayload });
      return;
    }

    createMutation.mutate(agendaPayload);
  };

  const pending =
    createMutation.isPending || updateMutation.isPending || convertMutation.isPending;
  const activeSucursales = sucursales.filter(
    (sucursal) => sucursal.activa || sucursal._id === item?.sucursal?._id || sucursal._id === reservationToConvert?.sucursal?._id,
  );
  const availableSucursales = isSuperAdmin
    ? activeSucursales
    : activeSucursales.filter((sucursal) => sucursal._id === assignedSucursalId);
  const selectedSucursal = useMemo(
    () => availableSucursales.find((sucursal) => sucursal._id === selectedSucursalId) ?? null,
    [availableSucursales, selectedSucursalId],
  );
  const availableTimeSlots = useMemo(() => {
    if (!selectedSucursal) {
      return [];
    }

    const slots = selectedSucursal.horariosHabilitados.length
      ? selectedSucursal.horariosHabilitados
      : TIME_SLOT_OPTIONS;

    const currentSource = reservationToConvert ?? item;
    if (
      currentSource?.horaAgenda &&
      selectedSucursal._id === currentSource.sucursal?._id &&
      !slots.includes(currentSource.horaAgenda)
    ) {
      return [...slots, currentSource.horaAgenda].sort((left, right) => left.localeCompare(right));
    }

    return slots;
  }, [item, reservationToConvert, selectedSucursal]);

  useEffect(() => {
    if (!selectedHour) {
      return;
    }

    if (!availableTimeSlots.includes(selectedHour)) {
      setValue("horaAgenda", "");
    }
  }, [availableTimeSlots, selectedHour, setValue]);

  const title = isConvertingReservation
    ? "Agendar turno desde reserva"
    : isEditing
      ? "Editar agenda de entrega"
      : "Nuevo turno de entrega";

  const submitLabel = pending
    ? "Guardando..."
    : isConvertingReservation
      ? "Agendar turno"
      : isEditing
        ? "Guardar cambios"
        : "Crear agenda";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (pending ? undefined : onClose())}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entregas</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {title}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={pending}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="grid grid-cols-1 gap-6 p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                      <div className="space-y-2">
                        <label htmlFor="agenda-interno" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Interno
                        </label>
                        <input
                          id="agenda-interno"
                          type="number"
                          inputMode="numeric"
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                          {...register("interno", {
                            required: "El interno es obligatorio",
                            valueAsNumber: true,
                            validate: (value) =>
                              typeof value === "number" && Number.isInteger(value) && value > 0
                                ? true
                                : "Ingresa un interno valido",
                          })}
                        />
                        <FieldError message={errors.interno?.message} />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleLookup}
                          disabled={lookupLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
                        >
                          <Search size={16} />
                          {lookupLoading ? "Buscando..." : "Buscar en SIAC"}
                        </button>
                      </div>
                    </div>

                    <InternoLookupCard data={lookup} error={lookupError} loading={lookupLoading} />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="agenda-sucursal" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Sucursal
                        </label>
                        <select
                          id="agenda-sucursal"
                          disabled={isConvertingReservation}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 disabled:bg-gray-100"
                          {...register("sucursal", { required: "La sucursal es obligatoria" })}
                        >
                          <option value="">-- Selecciona una sucursal --</option>
                          {availableSucursales.map((sucursal) => (
                            <option key={sucursal._id} value={sucursal._id}>
                              {sucursal.nombre}{!sucursal.activa ? " (Inactiva)" : ""}
                            </option>
                          ))}
                        </select>
                        <FieldError message={errors.sucursal?.message} />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="agenda-fecha-agenda" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Fecha
                        </label>
                        <input
                          id="agenda-fecha-agenda"
                          type="date"
                          disabled={isConvertingReservation}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 disabled:bg-gray-100"
                          {...register("fechaAgenda", { required: "La fecha es obligatoria" })}
                        />
                        <FieldError message={errors.fechaAgenda?.message} />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="agenda-hora-agenda" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Hora
                        </label>
                        <select
                          id="agenda-hora-agenda"
                          disabled={isConvertingReservation}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 disabled:bg-gray-100"
                          {...register("horaAgenda", { required: "La hora es obligatoria" })}
                        >
                          <option value="">
                            {selectedSucursal ? "-- Selecciona un horario --" : "-- Selecciona una sucursal primero --"}
                          </option>
                          {availableTimeSlots.map((timeSlot) => (
                            <option key={timeSlot} value={timeSlot}>
                              {timeSlot}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500">
                          Turnos cada 30 minutos desde las 08:00 hasta las 18:00 segun configuracion de la sucursal.
                        </p>
                        <FieldError message={errors.horaAgenda?.message} />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <span className="text-sm font-medium text-gray-800">Equipado?</span>
                          <input
                            type="checkbox"
                            {...register("equipado")}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <span className="text-sm font-medium text-gray-800">Entrega usado?</span>
                          <input
                            type="checkbox"
                            {...register("entregaUsado")}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="agenda-observaciones" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Observaciones
                        </label>
                        <textarea
                          id="agenda-observaciones"
                          rows={4}
                          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500"
                          {...register("observaciones")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={pending}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
                    >
                      {submitLabel}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
