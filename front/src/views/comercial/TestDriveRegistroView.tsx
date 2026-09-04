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
  return <p className="text-xs font-medium text-destructive">{message}</p>;
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

function hasStarted(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() <= Date.now();
}

function normalizeId(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
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
              <Dialog.Panel className="font-preset w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{sectionLabel}</p>
                    <Dialog.Title className="mt-0.5 text-lg font-semibold tracking-tight text-popover-foreground">
                      {isEditing ? `Editar ${title}` : `Nuevo ${title}`}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(submitHandler)} noValidate>
                  <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
                    <div className="space-y-1 md:col-span-2">
                      <label htmlFor="unidadId" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Dominio
                      </label>
                      <select
                        id="unidadId"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
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

                    <div className="space-y-1">
                      <label htmlFor="fechaRetiro" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Fecha de retiro
                      </label>
                      <input
                        id="fechaRetiro"
                        type="date"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("fechaRetiro", { required: "La fecha de retiro es obligatoria" })}
                      />
                      <FieldError message={errors.fechaRetiro?.message} />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="horaRetiro" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Hora de retiro
                      </label>
                      <input
                        id="horaRetiro"
                        type="time"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("horaRetiro", { required: "La hora de retiro es obligatoria" })}
                      />
                      <FieldError message={errors.horaRetiro?.message} />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="fechaRegreso" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Fecha de regreso
                      </label>
                      <input
                        id="fechaRegreso"
                        type="date"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("fechaRegreso", { required: "La fecha de regreso es obligatoria" })}
                      />
                      <FieldError message={errors.fechaRegreso?.message} />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="horaRegreso" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Hora de regreso
                      </label>
                      <input
                        id="horaRegreso"
                        type="time"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("horaRegreso", { required: "La hora de regreso es obligatoria" })}
                      />
                      <FieldError message={errors.horaRegreso?.message} />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label htmlFor="observacion" className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Observacion
                      </label>
                      <textarea
                        id="observacion"
                        rows={3}
                        placeholder="Ej: Reserva para cliente sin usuario, nombre y detalle del turno"
                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("observacion")}
                      />
                      <p className="text-xs text-muted-foreground">Campo opcional para aclaraciones del cliente o la reserva.</p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label
                        className={[
                          "flex items-center justify-between gap-3 rounded-md border px-3 py-2",
                          canRequestStarlink
                            ? "border-border bg-secondary hover:bg-muted"
                            : "border-border bg-muted opacity-70",
                        ].join(" ")}
                      >
                        <span className="text-sm font-medium text-foreground">StarLink</span>
                        <div className="flex items-center gap-3">
                          {!canRequestStarlink ? (
                            <span className="text-xs font-medium text-muted-foreground">No disponible en esta unidad</span>
                          ) : null}
                          <input
                            type="checkbox"
                            disabled={!canRequestStarlink}
                            {...register("starlink")}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border bg-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">La unidad quedara bloqueada durante todo el rango reservado.</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
          Cargando registros de TestDrive...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 text-destructive shadow-sm">
          {error instanceof Error ? error.message : "Error al cargar los registros de TestDrive"}
        </div>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="p-3">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{sectionLabel}</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-card-foreground">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Agenda solicitudes de test drive y bloquea la unidad durante todo el periodo reservado.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 p-3 pt-0 lg:pt-3">
            <Link
              to={calendarPath}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
            >
              Mostrar calendario
            </Link>

            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus size={16} />
              Nuevo registro
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-border">
          <div className="border-r border-border px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Solicitudes</p>
            <p className="mt-1 text-lg font-semibold text-card-foreground">{items.length}</p>
          </div>
          <div className="px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Con StarLink</p>
            <p className="mt-1 text-lg font-semibold text-card-foreground">{items.filter((item) => item.starlink).length}</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold text-card-foreground">Listado de solicitudes</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Fecha solicitado</th>
                <th className="px-3 py-2 text-left">Dominio</th>
                <th className="px-3 py-2 text-left">Fecha retiro</th>
                <th className="px-3 py-2 text-left">Hora de retiro</th>
                <th className="px-3 py-2 text-left">Fecha de regreso</th>
                <th className="px-3 py-2 text-left">Hora de regreso</th>
                <th className="px-3 py-2 text-center">StarLink</th>
                <th className="px-3 py-2 text-left">Observacion</th>
                <th className="px-3 py-2 text-left">Solicitado</th>
                <th className="px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {items.map((item) => {
                const isOwnRecord = normalizeId(item.solicitadoPorId) !== "" && normalizeId(item.solicitadoPorId) === normalizeId(user?._id);
                const isPastRecord = hasStarted(item.retiroAt);
                const isSuperAdmin = hasSuperAdminRole(user);
                const canEditManagedPlanAhorro = negocio === "planAhorro"
                  ? hasRegistroTestDriveActionAccess(user, "editPlanAhorroManaged")
                  : false;
                const canDeleteManaged = negocio === "planAhorro"
                  ? canEditManagedPlanAhorro
                  : hasRegistroTestDriveActionAccess(user, "deleteManaged");
                const canEdit = isSuperAdmin || canEditManagedPlanAhorro || (
                  !isPastRecord || negocio !== "planAhorro"
                    ? isOwnRecord
                    : false
                );
                const canDelete = isSuperAdmin || canDeleteManaged || (
                  !isPastRecord || negocio !== "planAhorro"
                    ? isOwnRecord
                    : false
                );
                const actionMessage = negocio === "planAhorro" && isPastRecord
                  ? "Historial bloqueado"
                  : "Solo lectura";

                return (
                  <tr key={item._id} className="hover:bg-muted">
                    <td className="px-3 py-1.5 text-muted-foreground">{formatDateTime(item.fechaSolicitado)}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      <div className="font-medium text-card-foreground">{item.dominio}</div>
                      <div className="text-xs text-muted-foreground">{item.versionNombre}</div>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.fechaRetiro}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.horaRetiro}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.fechaRegreso}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span
                        className={[
                          "inline-flex min-w-12 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium",
                          item.starlink
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {item.starlink ? "Si" : "No"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      <div className="max-w-[280px] whitespace-pre-wrap break-words text-sm">
                        {item.observacion?.trim() ? item.observacion : "-"}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.solicitadoPorNombre}</td>
                    <td className="px-3 py-1.5">
                      {canEdit || canDelete ? (
                        <div className="flex justify-center gap-2">
                          {canEdit ? (
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                            className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                          ) : null}

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(item._id)}
                            className="inline-flex h-8 items-center gap-2 rounded-md border border-destructive/30 bg-background px-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                              Eliminar
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-center text-xs font-medium text-muted-foreground">{actionMessage}</div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!items.length ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
