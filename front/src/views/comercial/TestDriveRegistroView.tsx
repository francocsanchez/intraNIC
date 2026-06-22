import {
  createTestDriveRegistro,
  deleteTestDriveRegistro,
  getTestDriveOptions,
  getTestDriveRegistros,
  updateTestDriveRegistro,
  type TestDriveNegocio,
  type TestDriveRegistroPayload,
} from "@/api/testDriveRegistroAPI";
import { hasRegistroTestDriveActionAccess, hasSuperAdminRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { TestDriveOption, TestDriveRegistro } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type RegistroFormValues = {
  unidadId: string;
  fechaRetiro: string;
  horaRetiro: string;
  fechaRegreso: string;
  horaRegreso: string;
  starlink: boolean;
  observacion: string;
};

type TestDriveRegistroViewProps = {
  negocio: TestDriveNegocio;
  sectionLabel: string;
  title: string;
  calendarPath: string;
  queryKeyPrefix: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RegistroModal({
  negocio,
  sectionLabel,
  title,
  queryKeyPrefix,
  open,
  onClose,
  item,
  options,
}: TestDriveRegistroViewProps & {
  open: boolean;
  onClose: () => void;
  item: TestDriveRegistro | null;
  options: TestDriveOption[];
}) {
  const queryClient = useQueryClient();
  const isEditing = !!item;
  const defaultValues = useMemo<RegistroFormValues>(
    () => ({
      unidadId: options[0]?._id ?? "",
      fechaRetiro: "",
      horaRetiro: "",
      fechaRegreso: "",
      horaRegreso: "",
      starlink: false,
      observacion: "",
    }),
    [options],
  );
  const {
    control,
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegistroFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      return;
    }

    if (item) {
      reset({
        unidadId: item.unidadId,
        fechaRetiro: item.fechaRetiro,
        horaRetiro: item.horaRetiro,
        fechaRegreso: item.fechaRegreso,
        horaRegreso: item.horaRegreso,
        starlink: item.starlink,
        observacion: item.observacion ?? "",
      });
      return;
    }

    reset(defaultValues);
  }, [open, item, reset, defaultValues]);

  const selectedUnidadId = useWatch({
    control,
    name: "unidadId",
  });
  const selectedOption = useMemo(
    () => options.find((option) => option._id === selectedUnidadId) ?? null,
    [options, selectedUnidadId],
  );
  const canRequestStarlink = Boolean(selectedOption?.permiteStarlink);

  useEffect(() => {
    if (!canRequestStarlink) {
      setValue("starlink", false);
    }
  }, [canRequestStarlink, setValue]);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "listar"] });
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "calendario"] });
  };

  const createMutation = useMutation({
    mutationFn: createTestDriveRegistro,
    onSuccess: (response) => {
      toast.success(response.message);
      invalidateQueries();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TestDriveRegistroPayload }) =>
      updateTestDriveRegistro(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      invalidateQueries();
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submitHandler = (values: RegistroFormValues) => {
    const payload: TestDriveRegistroPayload = {
      negocio,
      unidadId: values.unidadId,
      fechaRetiro: values.fechaRetiro,
      horaRetiro: values.horaRetiro,
      fechaRegreso: values.fechaRegreso,
      horaRegreso: values.horaRegreso,
      starlink: Boolean(values.starlink),
      observacion: values.observacion?.trim() ?? "",
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{sectionLabel}</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {isEditing ? `Editar ${title}` : `Nuevo ${title}`}
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
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="unidadId" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Dominio
                      </label>
                      <select
                        id="unidadId"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("unidadId", { required: "La unidad es obligatoria" })}
                      >
                        <option value="">-- Selecciona una unidad --</option>
                        {options.map((option) => (
                          <option key={option._id} value={option._id}>
                            {option.dominio} - {option.versionNombre}
                          </option>
                        ))}
                      </select>
                      <FieldError message={errors.unidadId?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="fechaRetiro" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Fecha de retiro
                      </label>
                      <input
                        id="fechaRetiro"
                        type="date"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("fechaRetiro", { required: "La fecha de retiro es obligatoria" })}
                      />
                      <FieldError message={errors.fechaRetiro?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="horaRetiro" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Hora de retiro
                      </label>
                      <input
                        id="horaRetiro"
                        type="time"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("horaRetiro", { required: "La hora de retiro es obligatoria" })}
                      />
                      <FieldError message={errors.horaRetiro?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="fechaRegreso" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Fecha de regreso
                      </label>
                      <input
                        id="fechaRegreso"
                        type="date"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("fechaRegreso", { required: "La fecha de regreso es obligatoria" })}
                      />
                      <FieldError message={errors.fechaRegreso?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="horaRegreso" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Hora de regreso
                      </label>
                      <input
                        id="horaRegreso"
                        type="time"
                        className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("horaRegreso", { required: "La hora de regreso es obligatoria" })}
                      />
                      <FieldError message={errors.horaRegreso?.message} />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="observacion" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Observacion
                      </label>
                      <textarea
                        id="observacion"
                        rows={3}
                        placeholder="Ej: Reserva para cliente sin usuario, nombre y detalle del turno"
                        className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                        {...register("observacion")}
                      />
                      <p className="text-xs text-gray-500">Campo opcional para aclaraciones del cliente o la reserva.</p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label
                        className={[
                          "flex items-center justify-between gap-3 rounded-xl border px-4 py-3",
                          canRequestStarlink
                            ? "border-gray-200 bg-gray-50 hover:bg-gray-100"
                            : "border-gray-200 bg-gray-100 opacity-70",
                        ].join(" ")}
                      >
                        <span className="text-sm font-medium text-gray-800">StarLink</span>
                        <div className="flex items-center gap-3">
                          {!canRequestStarlink ? (
                            <span className="text-xs font-medium text-gray-500">No disponible en esta unidad</span>
                          ) : null}
                          <input
                            type="checkbox"
                            disabled={!canRequestStarlink}
                            {...register("starlink")}
                            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500">La unidad quedara bloqueada durante todo el rango reservado.</div>
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
                        {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear registro"}
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

export default function TestDriveRegistroView({
  negocio,
  sectionLabel,
  title,
  calendarPath,
  queryKeyPrefix,
}: TestDriveRegistroViewProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestDriveRegistro | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [queryKeyPrefix, "listar"],
    queryFn: () => getTestDriveRegistros({ negocio }),
  });

  const { data: optionsResponse } = useQuery({
    queryKey: [queryKeyPrefix, "opciones", "activas"],
    queryFn: () => getTestDriveOptions(negocio),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTestDriveRegistro,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "listar"] });
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, "calendario"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const items = data?.data ?? [];
  const options = useMemo(() => optionsResponse?.data ?? [], [optionsResponse]);

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: TestDriveRegistro) => {
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
          Cargando registros de TestDrive...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
          {error instanceof Error ? error.message : "Error al cargar los registros de TestDrive"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{sectionLabel}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Agenda solicitudes de test drive y bloquea la unidad durante todo el periodo reservado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={calendarPath}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Mostrar calendario
            </Link>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              <Plus size={16} />
              Nuevo registro
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Solicitudes</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{items.length}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Con StarLink</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{items.filter((item) => item.starlink).length}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Listado de solicitudes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Fecha solicitado</th>
                <th className="px-4 py-3 text-left">Dominio</th>
                <th className="px-4 py-3 text-left">Fecha retiro</th>
                <th className="px-4 py-3 text-left">Hora de retiro</th>
                <th className="px-4 py-3 text-left">Fecha de regreso</th>
                <th className="px-4 py-3 text-left">Hora de regreso</th>
                <th className="px-4 py-3 text-center">StarLink</th>
                <th className="px-4 py-3 text-left">Observacion</th>
                <th className="px-4 py-3 text-left">Solicitado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const isOwnRecord = item.solicitadoPorId === user?._id;
                const canEdit = isOwnRecord;
                const canDelete = isOwnRecord || hasRegistroTestDriveActionAccess(user, "deleteManaged") || hasSuperAdminRole(user);

                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{formatDateTime(item.fechaSolicitado)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-medium text-gray-900">{item.dominio}</div>
                      <div className="text-xs text-gray-500">{item.versionNombre}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.fechaRetiro}</td>
                    <td className="px-4 py-3 text-gray-700">{item.horaRetiro}</td>
                    <td className="px-4 py-3 text-gray-700">{item.fechaRegreso}</td>
                    <td className="px-4 py-3 text-gray-700">{item.horaRegreso}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          item.starlink
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-gray-50 text-gray-500",
                        ].join(" ")}
                      >
                        {item.starlink ? "Si" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="max-w-[280px] whitespace-pre-wrap break-words text-sm">
                        {item.observacion?.trim() ? item.observacion : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.solicitadoPorNombre}</td>
                    <td className="px-4 py-3">
                      {canEdit || canDelete ? (
                        <div className="flex justify-center gap-2">
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                          ) : null}

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(item._id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                              Eliminar
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-center text-xs font-semibold text-gray-400">Solo lectura</div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!items.length ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay solicitudes de TestDrive registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <RegistroModal
        negocio={negocio}
        sectionLabel={sectionLabel}
        title={title}
        calendarPath={calendarPath}
        queryKeyPrefix={queryKeyPrefix}
        open={isModalOpen}
        onClose={handleCloseModal}
        item={editingItem}
        options={options}
      />
    </div>
  );
}
