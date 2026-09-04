import {
  createReservaEntrega,
  updateReservaEntrega,
  type ReservaEntregaPayload,
} from "@/api/entregasAPI";
import { useAuth } from "@/hooks/useAuthe";
import type { AgendaEntrega, SucursalEntrega } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Fragment, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type ReservaEntregaFormValues = {
  sucursal: string;
  fechaAgenda: string;
  horaAgenda: string;
  observaciones: string;
};

type ReservaEntregaFormProps = {
  open: boolean;
  item: AgendaEntrega | null;
  sucursales: SucursalEntrega[];
  onClose: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

const TIME_SLOT_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

export default function ReservaEntregaForm({
  open,
  item,
  sucursales,
  onClose,
}: ReservaEntregaFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const preferredSucursalId = user?.sucursalPredeterminada?._id ?? user?.sucursalEntrega?._id ?? "";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReservaEntregaFormValues>({
    defaultValues: {
      sucursal: "",
      fechaAgenda: "",
      horaAgenda: "",
      observaciones: "",
    },
  });

  const selectedSucursalId = watch("sucursal");
  const selectedHour = watch("horaAgenda");

  useEffect(() => {
    if (!open) return;

    const defaultSucursal = !item ? preferredSucursalId : "";

    reset({
      sucursal: item?.sucursal?._id ?? defaultSucursal,
      fechaAgenda: item?.fechaAgenda ?? "",
      horaAgenda: item?.horaAgenda ?? "",
      observaciones: item?.observaciones ?? "",
    });
  }, [item, open, preferredSucursalId, reset]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["entregas", "agendas"] });
    queryClient.invalidateQueries({ queryKey: ["entregas", "logs"] });
  };

  const createMutation = useMutation({
    mutationFn: createReservaEntrega,
    onSuccess: (response) => {
      toast.success(response.message);
      invalidate();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReservaEntregaPayload }) =>
      updateReservaEntrega(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      invalidate();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pending = createMutation.isPending || updateMutation.isPending;
  const activeSucursales = sucursales.filter((sucursal) => sucursal.activa || sucursal._id === item?.sucursal?._id);
  const availableSucursales = activeSucursales;
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

    if (
      item?.horaAgenda &&
      selectedSucursal._id === item.sucursal?._id &&
      !slots.includes(item.horaAgenda)
    ) {
      return [...slots, item.horaAgenda].sort((left, right) => left.localeCompare(right));
    }

    return slots;
  }, [item?.horaAgenda, item?.sucursal?._id, selectedSucursal]);

  useEffect(() => {
    if (!selectedHour) {
      return;
    }

    if (!availableTimeSlots.includes(selectedHour)) {
      setValue("horaAgenda", "");
    }
  }, [availableTimeSlots, selectedHour, setValue]);

  const onSubmit = (values: ReservaEntregaFormValues) => {
    const payload: ReservaEntregaPayload = {
      sucursal: values.sucursal,
      fechaAgenda: values.fechaAgenda,
      horaAgenda: values.horaAgenda,
      observaciones: values.observaciones.trim(),
    };

    if (item) {
      updateMutation.mutate({ id: item._id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (pending ? undefined : onClose())}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-foreground/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="font-preset w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Entregas</p>
                    <Dialog.Title className="mt-0.5 text-lg font-semibold tracking-tight text-popover-foreground">
                      {item ? "Editar reserva" : "Nueva reserva"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={pending}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="reserva-sucursal" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Sucursal
                      </label>
                      <select
                        id="reserva-sucursal"
                        className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
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
                      <label htmlFor="reserva-fecha" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Fecha
                      </label>
                      <input
                        id="reserva-fecha"
                        type="date"
                        className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                        {...register("fechaAgenda", { required: "La fecha es obligatoria" })}
                      />
                      <FieldError message={errors.fechaAgenda?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="reserva-hora" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Hora
                      </label>
                      <select
                        id="reserva-hora"
                        className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
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
                      <FieldError message={errors.horaAgenda?.message} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="reserva-observaciones" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Observaciones
                      </label>
                      <textarea
                        id="reserva-observaciones"
                        rows={5}
                        className="w-full resize-none rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                        {...register("observaciones", {
                          required: "Las observaciones son obligatorias para la reserva",
                          validate: (value) =>
                            value.trim().length > 0 ? true : "Las observaciones son obligatorias para la reserva",
                        })}
                      />
                      <FieldError message={errors.observaciones?.message} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border bg-muted px-3 py-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={pending}
                      className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                      {pending ? "Guardando..." : item ? "Guardar cambios" : "Crear reserva"}
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
