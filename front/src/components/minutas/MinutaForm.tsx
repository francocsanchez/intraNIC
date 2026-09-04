import type { MinutaPayload } from "@/api/dms/minutasAPI";
import { useAuth } from "@/hooks/useAuthe";
import type { MinutaGrupo, MinutaUser } from "@/types/index";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { sanitizeRichTextHtml } from "@/utils/richTextSanitize";
import MinutaGroupsMultiSelect from "./MinutaGroupsMultiSelect";
import ParticipantesMultiSelect from "./ParticipantesMultiSelect";
import TemarioFieldArray, { type MinutaFormValues } from "./TemarioFieldArray";

type MinutaFormProps = {
  initialValues?: MinutaFormValues;
  onCancel?: () => void;
  onSubmit: (payload: MinutaPayload) => void;
  groups: MinutaGrupo[];
  participants: MinutaUser[];
  pending?: boolean;
  submitLabel?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export default function MinutaForm({
  initialValues,
  onCancel,
  onSubmit,
  groups,
  participants,
  pending = false,
  submitLabel = "Guardar minuta",
}: MinutaFormProps) {
  const { user } = useAuth();
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [manualParticipantIds, setManualParticipantIds] = useState<string[]>(
    initialValues?.participantes ?? [],
  );
  const [excludedGroupParticipantIds, setExcludedGroupParticipantIds] =
    useState<string[]>([]);
  const defaultValues = useMemo<MinutaFormValues>(
    () => ({
      fecha: "",
      tema: "",
      participantes: [],
      temario: [{ nombre: "", desarrollo: "" }],
    }),
    [],
  );
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<MinutaFormValues>({
    defaultValues: initialValues ?? defaultValues,
  });

  const moderadorLabel = useMemo(
    () => (user ? `${user.lastName}, ${user.name}` : "-"),
    [user],
  );
  const selectedGroups = useMemo(
    () => groups.filter((group) => selectedGroupIds.includes(group._id)),
    [groups, selectedGroupIds],
  );
  const selectedGroupParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    selectedGroups.forEach((group) =>
      group.participantes.forEach((participant) => ids.add(participant._id)),
    );
    return [...ids];
  }, [selectedGroups]);
  const finalParticipantIds = useMemo(() => {
    const finalIds = new Set<string>(manualParticipantIds);
    selectedGroupParticipantIds.forEach((id) => {
      if (!excludedGroupParticipantIds.includes(id)) finalIds.add(id);
    });
    return [...finalIds];
  }, [
    excludedGroupParticipantIds,
    manualParticipantIds,
    selectedGroupParticipantIds,
  ]);

  useEffect(() => {
    setValue("participantes", finalParticipantIds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [finalParticipantIds, setValue]);

  const handleGroupSelectionChange = (nextGroupIds: string[]) => {
    const nextGroupParticipantSet = new Set<string>();
    groups
      .filter((group) => nextGroupIds.includes(group._id))
      .forEach((group) =>
        group.participantes.forEach((participant) =>
          nextGroupParticipantSet.add(participant._id),
        ),
      );
    setSelectedGroupIds(nextGroupIds);
    setExcludedGroupParticipantIds((current) =>
      current.filter((id) => nextGroupParticipantSet.has(id)),
    );
  };

  const handleParticipantsChange = (nextSelectedIds: string[]) => {
    const currentSelectedIds = getValues("participantes");
    const groupParticipantSet = new Set<string>(selectedGroupParticipantIds);
    const nextManual = new Set<string>(manualParticipantIds);
    const nextExcluded = new Set<string>(excludedGroupParticipantIds);
    currentSelectedIds
      .filter((id) => !nextSelectedIds.includes(id))
      .forEach((id) => {
        nextManual.delete(id);
        if (groupParticipantSet.has(id)) nextExcluded.add(id);
        else nextExcluded.delete(id);
      });
    nextSelectedIds
      .filter((id) => !currentSelectedIds.includes(id))
      .forEach((id) => {
        nextManual.add(id);
        nextExcluded.delete(id);
      });
    setManualParticipantIds([...nextManual]);
    setExcludedGroupParticipantIds([...nextExcluded]);
  };

  const submitHandler = (values: MinutaFormValues) =>
    onSubmit({
      fecha: values.fecha,
      tema: values.tema.trim(),
      participantes: values.participantes,
      temario: values.temario.map((topic) => ({
        nombre: topic.nombre.trim(),
        desarrollo: sanitizeRichTextHtml(topic.desarrollo),
      })),
    });

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      noValidate
      className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
    >
      <section className="px-3 py-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="fecha"
              className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
            >
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              disabled={pending}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              {...register("fecha", { required: "La fecha es obligatoria" })}
            />
            <FieldError message={errors.fecha?.message} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Moderador
            </label>
            <div className="flex h-9 items-center rounded-md border border-border bg-muted px-3 text-sm font-medium text-foreground">
              {moderadorLabel}
            </div>
            <p className="text-xs text-muted-foreground">
              Se toma automáticamente del usuario autenticado.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="tema"
              className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
            >
              Tema
            </label>
            <input
              id="tema"
              type="text"
              disabled={pending}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              {...register("tema", { required: "El tema es obligatorio" })}
            />
            <FieldError message={errors.tema?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Grupos de difusión
            </label>
            <MinutaGroupsMultiSelect
              disabled={pending}
              onChange={handleGroupSelectionChange}
              options={groups}
              value={selectedGroupIds}
            />
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              Los grupos agregan sus integrantes a la minuta. Después podés
              ajustar la lista final de participantes manualmente.
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Participantes
            </label>
            <Controller
              control={control}
              name="participantes"
              rules={{
                validate: (value) =>
                  value.length > 0 ||
                  "Debes seleccionar al menos un participante",
              }}
              render={({ field }) => (
                <ParticipantesMultiSelect
                  disabled={pending}
                  error={errors.participantes?.message}
                  onChange={handleParticipantsChange}
                  options={participants}
                  value={field.value ?? []}
                />
              )}
            />
            <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground">
              <span>{selectedGroups.length} grupo(s) seleccionado(s)</span>
              <span>{finalParticipantIds.length} participante(s) finales</span>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-border px-3 py-3">
        <div className="space-y-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Temario
            </p>
            <h2 className="mt-1 text-base font-semibold text-foreground">
              Definí los temas y su desarrollo
            </h2>
          </div>
          <TemarioFieldArray
            control={control}
            disabled={pending}
            errors={errors}
            register={register}
          />
        </div>
      </section>
      <section className="flex flex-col gap-2 border-t border-border bg-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          La minuta se guarda en el sistema y luego puede exportarse a PDF.
        </div>
        <div className="flex gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Guardando..." : submitLabel}
          </button>
        </div>
      </section>
    </form>
  );
}
