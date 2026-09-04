import {
  createTestDrive,
  changeStatusTestDrive,
  getTestDrives,
  updateTestDrive,
  type TestDrivePayload,
} from "@/api/testDriveAPI";
import { getColores, getVersiones } from "@/api/dms/preventasAPI";
import type { Catalogo, TestDrive } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CarFront, Pencil, Plus, Power, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const EMPTY_TEST_DRIVES: TestDrive[] = [];

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
  return <p className="text-xs font-medium text-destructive">{message}</p>;
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
  const defaultValues = useMemo<TestDriveFormValues>(
    () => ({
      dominio: "",
      modelo: "",
      versionId: versiones[0]?._id ?? "",
      chasis: "",
      colorId: colores[0]?._id ?? "",
      negocio: "convencional",
      anio: new Date().getFullYear(),
      permiteStarlink: false,
    }),
    [colores, versiones],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TestDriveFormValues>({
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      return;
    }

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

    reset(defaultValues);
  }, [open, item, reset, defaultValues]);

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
    mutationFn: ({ id, payload }: { id: string; payload: TestDrivePayload }) =>
      updateTestDrive(id, payload),
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
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => (isPending ? undefined : onClose())}
      >
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
              <Dialog.Panel className="font-preset w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-3 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Sistema
                    </p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {isEditing
                        ? "Editar unidad TestDrive"
                        : "Nueva unidad TestDrive"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="rounded-md border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(submitHandler)} noValidate>
                  <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="dominio"
                        className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Dominio
                      </label>
                      <input
                        id="dominio"
                        type="text"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                        {...register("dominio", {
                          required: "El dominio es obligatorio",
                        })}
                      />
                      <FieldError message={errors.dominio?.message} />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="modelo"
                        className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Modelo
                      </label>
                      <input
                        id="modelo"
                        type="text"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("modelo", {
                          required: "El modelo es obligatorio",
                        })}
                      />
                      <FieldError message={errors.modelo?.message} />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="versionId"
                        className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Version
                      </label>
                      <select
                        id="versionId"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("versionId", {
                          required: "La version es obligatoria",
                        })}
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
                      <label
                        htmlFor="chasis"
                        className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Chasis
                      </label>
                      <input
                        id="chasis"
                        type="text"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("chasis", {
                          required: "El chasis es obligatorio",
                        })}
                      />
                      <FieldError message={errors.chasis?.message} />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="colorId"
                        className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Color
                      </label>
                      <select
                        id="colorId"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("colorId", {
                          required: "El color es obligatorio",
                        })}
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
                      <label
                        htmlFor="negocio"
                        className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Negocio
                      </label>
                      <select
                        id="negocio"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("negocio", {
                          required: "El negocio es obligatorio",
                        })}
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
                      <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2 hover:bg-secondary">
                        <span className="text-sm font-medium text-foreground">
                          Puede solicitar StarLink
                        </span>
                        <input
                          type="checkbox"
                          {...register("permiteStarlink")}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                        />
                      </label>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label
                        htmlFor="anio"
                        className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
                      >
                        Anio
                      </label>
                      <input
                        id="anio"
                        type="number"
                        inputMode="numeric"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
                        {...register("anio", {
                          required: "El anio es obligatorio",
                          valueAsNumber: true,
                          validate: (value) => {
                            const currentYear = new Date().getFullYear() + 1;
                            if (!Number.isInteger(value))
                              return "Ingresa un anio valido";
                            if (value < 1980 || value > currentYear)
                              return `El anio debe estar entre 1980 y ${currentYear}`;
                            return true;
                          },
                        })}
                      />
                      <FieldError message={errors.anio?.message} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border bg-muted px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      Completa los datos de la unidad antes de guardar.
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending
                          ? "Guardando..."
                          : isEditing
                            ? "Guardar cambios"
                            : "Crear unidad"}
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
  const [visibleSection, setVisibleSection] = useState<
    "activas" | "deshabilitadas"
  >("activas");

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

  const items = data?.data ?? EMPTY_TEST_DRIVES;
  const versiones = useMemo(
    () => versionesResponse?.data ?? [],
    [versionesResponse],
  );
  const colores = useMemo(() => coloresResponse?.data ?? [], [coloresResponse]);
  const unidadesActivas = useMemo(
    () => items.filter((item) => item.activo),
    [items],
  );
  const unidadesDeshabilitadas = useMemo(
    () => items.filter((item) => !item.activo),
    [items],
  );
  const unidadesVisibles =
    visibleSection === "activas" ? unidadesActivas : unidadesDeshabilitadas;

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
      <div className="font-preset w-full px-2 py-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          Cargando unidades de TestDrive...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Error al cargar las unidades de TestDrive"}
        </div>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Sistema
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            TestDrive
          </h1>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:opacity-90"
        >
          <Plus size={16} />
          Nuevo TD
        </button>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Lista de unidades TestDrive
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {visibleSection === "activas"
                ? "Vista principal con las unidades habilitadas."
                : "Listado separado de unidades deshabilitadas."}
            </p>
          </div>

          <div className="inline-flex w-full rounded-md bg-muted p-1 md:w-auto">
            <button
              type="button"
              onClick={() => setVisibleSection("activas")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "activas"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Activas ({unidadesActivas.length})
            </button>

            <button
              type="button"
              onClick={() => setVisibleSection("deshabilitadas")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "deshabilitadas"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Deshabilitadas ({unidadesDeshabilitadas.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Dominio</th>
                <th className="px-3 py-2 text-left">Modelo</th>
                <th className="px-3 py-2 text-left">Version</th>
                <th className="px-3 py-2 text-left">Chasis</th>
                <th className="px-3 py-2 text-left">Color</th>
                <th className="px-3 py-2 text-left">Negocio</th>
                <th className="px-3 py-2 text-left">StarLink</th>
                <th className="px-3 py-2 text-left">Anio</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {unidadesVisibles.map((item) => (
                <tr key={item._id} className="hover:bg-muted">
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <CarFront size={16} className="text-muted-foreground" />
                      <span>{item.dominio}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.modelo}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.versionNombre}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.chasis}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.colorNombre}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {formatNegocio(item.negocio)}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.permiteStarlink ? "Si" : "No"}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    {item.anio}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground transition hover:bg-secondary"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => changeStatusMutation.mutate(item._id)}
                        disabled={changeStatusMutation.isPending}
                        className={[
                          "inline-flex h-8 items-center justify-center gap-2 rounded-md border px-2 text-xs font-semibold transition",
                          item.activo
                            ? "border-destructive/30 bg-background text-destructive hover:bg-muted"
                            : "border-border bg-background text-foreground hover:bg-secondary",
                        ].join(" ")}
                      >
                        <Power size={14} />
                        {item.activo ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {unidadesVisibles.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    {visibleSection === "activas"
                      ? "No hay unidades activas de TestDrive cargadas."
                      : "No hay unidades deshabilitadas de TestDrive."}
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
