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

type MinutaGroupFormValues = {
  nombre: string;
  participantes: string[];
};

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
      participantes: editingGroup?.participantes.map((participant) => participant._id) ?? [],
    }),
    [editingGroup],
  );

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<MinutaGroupFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const createMutation = useMutation({
    mutationFn: (payload: MinutaGroupPayload) => createMinutaGroup(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Grupo de difusion creado correctamente");
      queryClient.invalidateQueries({ queryKey: ["minutas", "groups"] });
      onCancel();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: MinutaGroupPayload) => updateMinutaGroup(editingGroup?._id ?? "", payload),
    onSuccess: (response) => {
      toast.success(response.message || "Grupo de difusion actualizado correctamente");
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

    if (editingGroup) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {editingGroup ? "Editar grupo de difusion" : "Nuevo grupo de difusion"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Armalo una sola vez y despues usalo para completar minutas mas rapido.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor="grupo-nombre" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Nombre del grupo
        </label>
        <input
          id="grupo-nombre"
          type="text"
          disabled={pending}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
          {...register("nombre", { required: "El nombre del grupo es obligatorio" })}
        />
        {errors.nombre?.message ? <p className="text-xs font-medium text-red-600">{errors.nombre.message}</p> : null}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Participantes del grupo
        </label>
        <Controller
          control={control}
          name="participantes"
          rules={{
            validate: (value) => value.length > 0 || "Debes seleccionar al menos un participante",
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

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando..." : editingGroup ? "Guardar cambios" : "Crear grupo"}
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
      toast.success(response.message || "Grupo de difusion eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["minutas", "groups"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    if (!open) {
      setEditingGroup(null);
      setIsCreating(false);
    }
  }, [open]);

  const handleCloseForm = () => {
    setEditingGroup(null);
    setIsCreating(false);
  };

  const handleDelete = (group: MinutaGrupo) => {
    const confirmed = window.confirm(`Eliminar el grupo de difusion "${group.nombre}"?`);
    if (!confirmed) return;
    deleteMutation.mutate(group._id);
  };

  const isBusy = deleteMutation.isPending;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (isBusy ? undefined : onClose())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-200 px-6 py-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Minutas</p>
                      <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                        Grupos de difusion
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500">
                        Estos grupos son privados y solo vos podes reutilizarlos al crear minutas.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroup(null);
                          setIsCreating(true);
                        }}
                        className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
                      >
                        Crear grupo
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
                  <section className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white">
                      <div className="border-b border-gray-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-900">Mis grupos</h3>
                      </div>
                      {groups.length ? (
                        <div className="divide-y divide-gray-200">
                          {groups.map((group) => (
                            <article key={group._id} className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                  <Users size={16} className="text-gray-400" />
                                  <span className="truncate">{group.nombre}</span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                  {group.participantesCount} participante(s)
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {group.participantes.slice(0, 5).map((participant) => (
                                    <span
                                      key={participant._id}
                                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600"
                                    >
                                      {participant.lastName}, {participant.name}
                                    </span>
                                  ))}
                                  {group.participantesCount > 5 ? (
                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                                      +{group.participantesCount - 5} mas
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGroup(group);
                                    setIsCreating(false);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                                >
                                  <Pencil size={15} />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(group)}
                                  disabled={deleteMutation.isPending}
                                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Trash2 size={15} />
                                  Eliminar
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-10 text-sm text-gray-500">
                          Todavia no tenes grupos de difusion. Crea el primero para reutilizar participantes.
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    {isCreating || editingGroup ? (
                      <GroupForm
                        editingGroup={editingGroup}
                        onCancel={handleCloseForm}
                        participants={participants}
                      />
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                        Selecciona un grupo para editarlo o usa <span className="font-semibold text-gray-700">Crear grupo</span> para
                        cargar uno nuevo.
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
