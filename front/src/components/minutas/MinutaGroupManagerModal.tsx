import {
  createMinutaGroup,
  deleteMinutaGroup,
  updateMinutaGroup,
  type MinutaGroupPayload,
} from "@/api/dms/minutasAPI";
import type { MinutaGrupo, MinutaUser } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Users, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import ParticipantesMultiSelect from "./ParticipantesMultiSelect";

type MinutaGroupManagerModalProps = {
  groups: MinutaGrupo[];
  open: boolean;
  onClose: () => void;
  participants: MinutaUser[];
};
type MinutaGroupFormValues = { nombre: string; participantes: string[] };

function GroupForm({
  editingGroup,
  onCancel,
  participants,
}: {
  editingGroup: MinutaGrupo | null;
  onCancel: () => void;
  participants: MinutaUser[];
}) {
  const queryClient = useQueryClient();
  const defaultValues = useMemo<MinutaGroupFormValues>(
    () => ({
      nombre: editingGroup?.nombre ?? "",
      participantes:
        editingGroup?.participantes.map((participant) => participant._id) ?? [],
    }),
    [editingGroup],
  );
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<MinutaGroupFormValues>({ defaultValues });
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);
  const createMutation = useMutation({
    mutationFn: (payload: MinutaGroupPayload) => createMinutaGroup(payload),
    onSuccess: (response) => {
      toast.success(
        response.message || "Grupo de difusión creado correctamente",
      );
      queryClient.invalidateQueries({ queryKey: ["minutas", "groups"] });
      onCancel();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateMutation = useMutation({
    mutationFn: (payload: MinutaGroupPayload) =>
      updateMinutaGroup(editingGroup?._id ?? "", payload),
    onSuccess: (response) => {
      toast.success(
        response.message || "Grupo de difusión actualizado correctamente",
      );
      queryClient.invalidateQueries({ queryKey: ["minutas", "groups"] });
      onCancel();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const pending = createMutation.isPending || updateMutation.isPending;
  const submitHandler = (values: MinutaGroupFormValues) => {
    const payload = {
      nombre: values.nombre.trim(),
      participantes: values.participantes,
    };
    if (editingGroup) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };
  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="space-y-3 border-t border-border pt-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {editingGroup
              ? "Editar grupo de difusión"
              : "Nuevo grupo de difusión"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Armalo una sola vez y después usalo para completar minutas más
            rápido.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-md border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="grupo-nombre"
          className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
        >
          Nombre del grupo
        </label>
        <input
          id="grupo-nombre"
          type="text"
          disabled={pending}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          {...register("nombre", {
            required: "El nombre del grupo es obligatorio",
          })}
        />
        {errors.nombre?.message ? (
          <p className="text-xs font-medium text-destructive">
            {errors.nombre.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Participantes del grupo
        </label>
        <Controller
          control={control}
          name="participantes"
          rules={{
            validate: (value) =>
              value.length > 0 || "Debes seleccionar al menos un participante",
          }}
          render={({ field }) => (
            <ParticipantesMultiSelect
              disabled={pending}
              error={errors.participantes?.message}
              onChange={field.onChange}
              options={participants}
              value={field.value}
            />
          )}
        />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? "Guardando..."
            : editingGroup
              ? "Guardar cambios"
              : "Crear grupo"}
        </button>
      </div>
    </form>
  );
}

export default function MinutaGroupManagerModal({
  groups,
  open,
  onClose,
  participants,
}: MinutaGroupManagerModalProps) {
  const queryClient = useQueryClient();
  const [editingGroup, setEditingGroup] = useState<MinutaGrupo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: deleteMinutaGroup,
    onSuccess: (response) => {
      toast.success(
        response.message || "Grupo de difusión eliminado correctamente",
      );
      queryClient.invalidateQueries({ queryKey: ["minutas", "groups"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const handleCloseForm = () => {
    setEditingGroup(null);
    setIsCreating(false);
  };
  const handleDelete = (group: MinutaGrupo) => {
    if (window.confirm(`Eliminar el grupo de difusión "${group.nombre}"?`))
      deleteMutation.mutate(group._id);
  };
  const isBusy = deleteMutation.isPending;
  const handleDialogClose = () => {
    if (isBusy) return;
    handleCloseForm();
    onClose();
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50 font-preset"
        onClose={handleDialogClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-foreground/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="border-b border-border px-3 py-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Minutas
                      </p>
                      <Dialog.Title className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                        Grupos de difusión
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Estos grupos son privados y solo vos podés reutilizarlos
                        al crear minutas.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroup(null);
                          setIsCreating(true);
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Crear grupo
                      </button>
                      <button
                        type="button"
                        onClick={handleDialogClose}
                        disabled={isBusy}
                        className="rounded-md border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-60"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 px-3 py-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
                  <section>
                    {groups.length ? (
                      <div className="divide-y divide-border border-y border-border">
                        {groups.map((group) => (
                          <article
                            key={group._id}
                            className="flex flex-col gap-3 px-2 py-2 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Users
                                  size={16}
                                  className="text-muted-foreground"
                                />
                                <span className="truncate">{group.nombre}</span>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {group.participantesCount} participante(s)
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {group.participantes
                                  .slice(0, 5)
                                  .map((participant) => (
                                    <span
                                      key={participant._id}
                                      className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                                    >
                                      {participant.lastName}, {participant.name}
                                    </span>
                                  ))}
                                {group.participantesCount > 5 ? (
                                  <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                                    +{group.participantesCount - 5} más
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGroup(group);
                                  setIsCreating(false);
                                }}
                                className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground hover:bg-secondary"
                              >
                                <Pencil size={14} />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(group)}
                                disabled={deleteMutation.isPending}
                                className="inline-flex h-8 items-center gap-2 rounded-md border border-destructive/30 bg-background px-2 text-xs font-semibold text-destructive hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="border-y border-dashed border-border px-2 py-6 text-sm text-muted-foreground">
                        Todavía no tenés grupos de difusión. Creá el primero
                        para reutilizar participantes.
                      </div>
                    )}
                  </section>
                  <section>
                    {isCreating || editingGroup ? (
                      <GroupForm
                        editingGroup={editingGroup}
                        onCancel={handleCloseForm}
                        participants={participants}
                      />
                    ) : (
                      <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                        Seleccioná un grupo para editarlo o usá{" "}
                        <span className="font-semibold text-foreground">
                          Crear grupo
                        </span>{" "}
                        para cargar uno nuevo.
                      </div>
                    )}
                  </section>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
