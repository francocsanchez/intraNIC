import type { SucursalEntrega } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";

type SucursalEntregaFormValues = {
  nombre: string;
  direccion: string;
  activa: boolean;
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
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

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
      observaciones: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      nombre: item?.nombre ?? "",
      direccion: item?.direccion ?? "",
      activa: item?.activa ?? true,
      observaciones: item?.observaciones ?? "",
    });
  }, [item, open, reset]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (pending ? undefined : onClose())}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Entregas</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {item ? "Editar sucursal" : "Nueva sucursal"}
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
                  <div className="grid grid-cols-1 gap-5 p-6">
                    <div className="space-y-2">
                      <label htmlFor="sucursal-nombre" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Nombre
                      </label>
                      <input
                        id="sucursal-nombre"
                        type="text"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                        {...register("nombre", { required: "El nombre es obligatorio" })}
                      />
                      <FieldError message={errors.nombre?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sucursal-direccion" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Direccion
                      </label>
                      <input
                        id="sucursal-direccion"
                        type="text"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500"
                        {...register("direccion")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="sucursal-observaciones" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Observaciones
                      </label>
                      <textarea
                        id="sucursal-observaciones"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-500"
                        {...register("observaciones")}
                      />
                    </div>

                    <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">Sucursal activa</span>
                      <input
                        type="checkbox"
                        {...register("activa")}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                      />
                    </label>
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
