import {
  createPendienteTurnar,
  getAgendaEntregaLookup,
  updatePendienteTurnar,
  type PendienteTurnarPayload,
} from "@/api/entregasAPI";
import InternoLookupCard from "@/components/entregas/InternoLookupCard";
import { useAuth } from "@/hooks/useAuthe";
import type { AgendaEntregaLookup, PendienteTurnar, SucursalEntrega } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type PendienteTurnarFormValues = {
  interno?: number;
  sucursal: string;
  equipado: boolean;
  entregaUsado: boolean;
  siniestro: boolean;
  observaciones: string;
};

type PendienteTurnarFormProps = {
  open: boolean;
  item: PendienteTurnar | null;
  sucursales: SucursalEntrega[];
  onClose: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export default function PendienteTurnarForm({
  open,
  item,
  sucursales,
  onClose,
}: PendienteTurnarFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lookup, setLookup] = useState<AgendaEntregaLookup | null>(item?.siac ?? null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const preferredSucursalId = user?.sucursalPredeterminada?._id ?? user?.sucursalEntrega?._id ?? "";
  const isEditing = Boolean(item);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<PendienteTurnarFormValues>({
    defaultValues: {
      interno: undefined,
      sucursal: "",
      equipado: false,
      entregaUsado: false,
      siniestro: false,
      observaciones: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    const defaultSucursal = !item ? preferredSucursalId : "";

    reset({
      interno: item?.interno ?? undefined,
      sucursal: item?.sucursal?._id ?? defaultSucursal,
      equipado: item?.equipado ?? false,
      entregaUsado: item?.entregaUsado ?? false,
      siniestro: item?.siniestro ?? false,
      observaciones: item?.observaciones ?? "",
    });
    setLookup(item?.siac ?? null);
    setLookupError("");
  }, [item, open, preferredSucursalId, reset]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["entregas", "pendientes-turnar"] });
  };

  const createMutation = useMutation({
    mutationFn: createPendienteTurnar,
    onSuccess: (response) => {
      toast.success(response.message);
      invalidate();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PendienteTurnarPayload }) =>
      updatePendienteTurnar(id, payload),
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

  const onSubmit = (values: PendienteTurnarFormValues) => {
    if (!lookup || lookup.interno !== Number(values.interno)) {
      toast.error("Debes buscar y validar el interno antes de guardar");
      return;
    }

    const payload: PendienteTurnarPayload = {
      interno: Number(values.interno),
      sucursal: values.sucursal,
      equipado: Boolean(values.equipado),
      entregaUsado: Boolean(values.entregaUsado),
      siniestro: Boolean(values.siniestro),
      observaciones: values.observaciones?.trim() ?? "",
    };

    if (isEditing && item) {
      updateMutation.mutate({ id: item._id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const pending = createMutation.isPending || updateMutation.isPending;
  const activeSucursales = sucursales.filter(
    (sucursal) => sucursal.activa || sucursal._id === item?.sucursal?._id,
  );
  const availableSucursales = activeSucursales;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (pending ? undefined : onClose())}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-foreground/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="font-preset w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Entregas</p>
                    <Dialog.Title className="mt-0.5 text-lg font-semibold tracking-tight text-popover-foreground">
                      {isEditing ? "Editar pendiente de turnar" : "Nuevo pendiente de turnar"}
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
                  <div className="grid grid-cols-1 gap-3 p-3">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                      <div className="space-y-2">
                        <label htmlFor="pendiente-interno" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Interno
                        </label>
                        <input
                          id="pendiente-interno"
                          type="number"
                          inputMode="numeric"
                          className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
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
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                        >
                          <Search size={16} />
                          {lookupLoading ? "Buscando..." : "Buscar en SIAC"}
                        </button>
                      </div>
                    </div>

                    <InternoLookupCard data={lookup} error={lookupError} loading={lookupLoading} />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="pendiente-sucursal" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Sucursal
                        </label>
                        <select
                          id="pendiente-sucursal"
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

                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
                          <span className="text-sm font-medium text-foreground">Equipado?</span>
                          <input
                            type="checkbox"
                            {...register("equipado")}
                            className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
                          <span className="text-sm font-medium text-foreground">Entrega usado?</span>
                          <input
                            type="checkbox"
                            {...register("entregaUsado")}
                            className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
                          <span className="text-sm font-medium text-foreground">Siniestro?</span>
                          <input
                            type="checkbox"
                            {...register("siniestro")}
                            className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="pendiente-observaciones" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Observaciones
                        </label>
                        <textarea
                          id="pendiente-observaciones"
                          rows={4}
                          className="w-full resize-none rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                          {...register("observaciones")}
                        />
                      </div>
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
                      {pending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear pendiente"}
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
