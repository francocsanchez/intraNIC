import { createTestDrive, changeStatusTestDrive, getTestDrives, updateTestDrive, type TestDrivePayload } from "@/api/testDriveAPI";
import { getColores, getVersiones } from "@/api/dms/preventasAPI";
import type { Catalogo, TestDrive } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CarFront, Pencil, Plus, Power, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type TestDriveFormValues = {
  dominio: string;
  modelo: string;
  versionId: string;
  chasis: string;
  colorId: string;
  negocio: "convencional" | "planAhorro";
  anio: number;
  permiteStarlink: boolean;
};

const negocioOptions = [
  { value: "convencional", label: "Convencional" },
  { value: "planAhorro", label: "Plan de Ahorro" },
] as const;

function formatNegocio(value: TestDrive["negocio"]) {
  return value === "planAhorro" ? "Plan de Ahorro" : "Convencional";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

function TestDriveModal({
  open,
  onClose,
  item,
  colores,
  versiones,
}: {
  open: boolean;
  onClose: () => void;
  item: TestDrive | null;
  colores: Catalogo[];
  versiones: Catalogo[];
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TestDriveFormValues>({
    defaultValues: {
      dominio: "",
      modelo: "",
      versionId: "",
      chasis: "",
      colorId: "",
      negocio: "convencional",
      anio: new Date().getFullYear(),
      permiteStarlink: false,
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        dominio: item.dominio,
        modelo: item.modelo,
        versionId: item.version,
        chasis: item.chasis,
        colorId: item.color,
        negocio: item.negocio,
        anio: item.anio,
        permiteStarlink: item.permiteStarlink,
      });
      return;
    }

    reset({
      dominio: "",
      modelo: "",
      versionId: versiones[0]?._id ?? "",
      chasis: "",
      colorId: colores[0]?._id ?? "",
      negocio: "convencional",
      anio: new Date().getFullYear(),
      permiteStarlink: false,
    });
  }, [item, reset, colores, versiones]);

  const createMutation = useMutation({
    mutationFn: createTestDrive,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["test-drive", "listar"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TestDrivePayload }) => updateTestDrive(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["test-drive", "listar"] });
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitHandler = (values: TestDriveFormValues) => {
    const payload: TestDrivePayload = {
      dominio: values.dominio.trim().toUpperCase(),
      modelo: values.modelo.trim(),
      versionId: values.versionId,
      chasis: values.chasis.trim().toUpperCase(),
      colorId: values.colorId,
      negocio: values.negocio,
      anio: Number(values.anio),
      permiteStarlink: Boolean(values.permiteStarlink),
    };

    if (item) {
      updateMutation.mutate({ id: item._id, payload });
      return;
    }

    createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (isPending ? undefined : onClose())}>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sistema</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {isEditing ? "Editar unidad TestDrive" : "Nueva unidad TestDrive"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(submitHandler)} noValidate>
                  <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="dominio" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Dominio
                      </label>
                      <input
                        id="dominio"
                        type="text"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("dominio", { required: "El dominio es obligatorio" })}
                      />
                      <FieldError message={errors.dominio?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="modelo" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Modelo
                      </label>
                      <input
                        id="modelo"
                        type="text"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("modelo", { required: "El modelo es obligatorio" })}
                      />
                      <FieldError message={errors.modelo?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="versionId" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Version
                      </label>
                      <select
                        id="versionId"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("versionId", { required: "La version es obligatoria" })}
                      >
                        <option value="">-- Selecciona una version --</option>
                        {versiones.map((version) => (
                          <option key={version._id} value={version._id}>
                            {version.nombre}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.versionId?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="chasis" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Chasis
                      </label>
                      <input
                        id="chasis"
                        type="text"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("chasis", { required: "El chasis es obligatorio" })}
                      />
                      <FieldError message={errors.chasis?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="colorId" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Color
                      </label>
                      <select
                        id="colorId"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("colorId", { required: "El color es obligatorio" })}
                      >
                        <option value="">-- Selecciona un color --</option>
                        {colores.map((color) => (
                          <option key={color._id} value={color._id}>
                            {color.nombre}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.colorId?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="negocio" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Negocio
                      </label>
                      <select
                        id="negocio"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("negocio", { required: "El negocio es obligatorio" })}
                      >
                        {negocioOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.negocio?.message} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100">
                        <span className="text-sm font-medium text-gray-800">Puede solicitar StarLink</span>
                        <input
                          type="checkbox"
                          {...register("permiteStarlink")}
                          className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                        />
                      </label>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="anio" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Anio
                      </label>
                      <input
                        id="anio"
                        type="number"
                        inputMode="numeric"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("anio", {
                          required: "El anio es obligatorio",
                          valueAsNumber: true,
                          validate: (value) => {
                            const currentYear = new Date().getFullYear() + 1;
                            if (!Number.isInteger(value)) return "Ingresa un anio valido";
                            if (value < 1980 || value > currentYear) return `El anio debe estar entre 1980 y ${currentYear}`;
                            return true;
                          },
                        })}
                      />
                      <FieldError message={errors.anio?.message} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500">Completa los datos de la unidad antes de guardar.</div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear unidad"}
                      </button>
                    </div>
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

export default function TestDriveView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestDrive | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["test-drive", "listar"],
    queryFn: getTestDrives,
  });

  const { data: versionesResponse } = useQuery({
    queryKey: ["versiones", "catalogo", "activas"],
    queryFn: () => getVersiones(true),
  });

  const { data: coloresResponse } = useQuery({
    queryKey: ["colores", "catalogo", "activos"],
    queryFn: () => getColores(true),
  });

  const changeStatusMutation = useMutation({
    mutationFn: changeStatusTestDrive,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["test-drive", "listar"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const items = data?.data ?? [];
  const versiones = useMemo(() => versionesResponse?.data ?? [], [versionesResponse]);
  const colores = useMemo(() => coloresResponse?.data ?? [], [coloresResponse]);

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: TestDrive) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          Cargando unidades de TestDrive...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm text-red-600">
          {error instanceof Error ? error.message : "Error al cargar las unidades de TestDrive"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sistema</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">TestDrive</h1>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
        >
          <Plus size={16} />
          Nuevo TD
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total unidades</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{items.length}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Activas</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {items.filter((item) => item.activo).length}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Lista de unidades TestDrive</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Dominio</th>
                <th className="px-6 py-3 text-left">Modelo</th>
                <th className="px-6 py-3 text-left">Version</th>
                <th className="px-6 py-3 text-left">Chasis</th>
                <th className="px-6 py-3 text-left">Color</th>
                <th className="px-6 py-3 text-left">Negocio</th>
                <th className="px-6 py-3 text-left">StarLink</th>
                <th className="px-6 py-3 text-left">Anio</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 font-medium text-gray-900">
                      <CarFront size={16} className="text-gray-500" />
                      <span>{item.dominio}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{item.modelo}</td>
                  <td className="px-6 py-3 text-gray-700">{item.versionNombre}</td>
                  <td className="px-6 py-3 text-gray-700">{item.chasis}</td>
                  <td className="px-6 py-3 text-gray-700">{item.colorNombre}</td>
                  <td className="px-6 py-3 text-gray-700">{formatNegocio(item.negocio)}</td>
                  <td className="px-6 py-3 text-gray-700">{item.permiteStarlink ? "Si" : "No"}</td>
                  <td className="px-6 py-3 text-gray-700">{item.anio}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => changeStatusMutation.mutate(item._id)}
                        disabled={changeStatusMutation.isPending}
                        className={[
                          "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                          item.activo
                            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                        ].join(" ")}
                      >
                        <Power size={14} />
                        {item.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay unidades de TestDrive cargadas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <TestDriveModal
        open={isModalOpen}
        onClose={handleCloseModal}
        item={editingItem}
        colores={colores}
        versiones={versiones}
      />
    </div>
  );
}
