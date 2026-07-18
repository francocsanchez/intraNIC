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
  return <p className="text-xs font-medium text-red-600">{message}</p>;
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
                      {isEditing ? "Editar pendiente de turnar" : "Nuevo pendiente de turnar"}
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
                        <label htmlFor="pendiente-interno" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Interno
                        </label>
                        <input
                          id="pendiente-interno"
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
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="pendiente-sucursal" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Sucursal
                        </label>
                        <select
                          id="pendiente-sucursal"
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
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
                        <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                          <span className="text-sm font-medium text-gray-800">Siniestro?</span>
                          <input
                            type="checkbox"
                            {...register("siniestro")}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                          />
                        </label>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="pendiente-observaciones" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Observaciones
                        </label>
                        <textarea
                          id="pendiente-observaciones"
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
