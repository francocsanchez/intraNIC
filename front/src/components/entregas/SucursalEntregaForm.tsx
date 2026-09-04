import type { SucursalEntrega } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";

type SucursalEntregaFormValues = {
  nombre: string;
  direccion: string;
  activa: boolean;
  horariosHabilitados: string[];
  observaciones: string;
};

type SucursalEntregaFormProps = {
  open: boolean;
  item: SucursalEntrega | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: SucursalEntregaFormValues) => void;
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

export default function SucursalEntregaForm({
  open,
  item,
  pending = false,
  onClose,
  onSubmit,
}: SucursalEntregaFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SucursalEntregaFormValues>({
    defaultValues: {
      nombre: "",
      direccion: "",
      activa: true,
      horariosHabilitados: TIME_SLOT_OPTIONS,
      observaciones: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      nombre: item?.nombre ?? "",
      direccion: item?.direccion ?? "",
      activa: item?.activa ?? true,
      horariosHabilitados: item ? item.horariosHabilitados : TIME_SLOT_OPTIONS,
      observaciones: item?.observaciones ?? "",
    });
  }, [item, open, reset]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (pending ? undefined : onClose())}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-foreground/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="font-preset w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Entregas</p>
                    <Dialog.Title className="mt-0.5 text-lg font-semibold tracking-tight text-popover-foreground">
                      {item ? "Editar sucursal" : "Nueva sucursal"}
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
                    <div className="space-y-2">
                      <label htmlFor="sucursal-nombre" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Nombre
                      </label>
                      <input
                        id="sucursal-nombre"
                        type="text"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                        {...register("nombre", { required: "El nombre es obligatorio" })}
                      />
                      <FieldError message={errors.nombre?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sucursal-direccion" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Direccion
                      </label>
                      <input
                        id="sucursal-direccion"
                        type="text"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                        {...register("direccion")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Horarios habilitados
                      </label>
                      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted p-4 md:grid-cols-4">
                        {TIME_SLOT_OPTIONS.map((timeSlot) => (
                          <label
                            key={timeSlot}
                            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
                          >
                            <input
                              type="checkbox"
                              value={timeSlot}
                              {...register("horariosHabilitados")}
                              className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                            />
                            <span>{timeSlot}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sucursal-observaciones" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Observaciones
                      </label>
                      <textarea
                        id="sucursal-observaciones"
                        rows={3}
                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                        {...register("observaciones")}
                      />
                    </div>

                    <label className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
                      <span className="text-sm font-medium text-foreground">Sucursal activa</span>
                      <input
                        type="checkbox"
                        {...register("activa")}
                        className="h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                      />
                    </label>
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
                      className="h-9 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                      {pending ? "Guardando..." : item ? "Guardar cambios" : "Crear sucursal"}
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
