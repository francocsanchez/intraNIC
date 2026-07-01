import type { MinutaPayload } from "@/api/dms/minutasAPI";
import { useAuth } from "@/hooks/useAuthe";
import type { MinutaUser } from "@/types/index";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import ParticipantesMultiSelect from "./ParticipantesMultiSelect";
import TemarioFieldArray, { type MinutaFormValues } from "./TemarioFieldArray";
import { sanitizeRichTextHtml } from "@/utils/richTextSanitize";

type MinutaFormProps = {
  initialValues?: MinutaFormValues;
  onCancel?: () => void;
  onSubmit: (payload: MinutaPayload) => void;
  participants: MinutaUser[];
  pending?: boolean;
  submitLabel?: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

export default function MinutaForm({
  initialValues,
  onCancel,
  onSubmit,
  participants,
  pending = false,
  submitLabel = "Guardar minuta",
}: MinutaFormProps) {
  const { user } = useAuth();

  const defaultValues = useMemo<MinutaFormValues>(
    () => ({
      fecha: "",
      tema: "",
      participantes: [],
      temario: [
        {
          nombre: "",
          desarrollo: "",
        },
      ],
    }),
    [],
  );

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<MinutaFormValues>({
    defaultValues: initialValues ?? defaultValues,
  });

  useEffect(() => {
    reset(initialValues ?? defaultValues);
  }, [defaultValues, initialValues, reset]);

  const moderadorLabel = useMemo(() => {
    if (!user) return "-";
    return `${user.lastName}, ${user.name}`;
  }, [user]);

  const submitHandler = (values: MinutaFormValues) => {
    onSubmit({
      fecha: values.fecha,
      tema: values.tema.trim(),
      participantes: values.participantes,
      temario: values.temario.map((topic) => ({
        nombre: topic.nombre.trim(),
        desarrollo: sanitizeRichTextHtml(topic.desarrollo),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} noValidate className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="fecha" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              disabled={pending}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              {...register("fecha", { required: "La fecha es obligatoria" })}
            />
            <FieldError message={errors.fecha?.message} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Moderador
            </label>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700">
              {moderadorLabel}
            </div>
            <p className="text-xs text-gray-500">Se toma automáticamente del usuario autenticado.</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="tema" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Tema
            </label>
            <input
              id="tema"
              type="text"
              disabled={pending}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              {...register("tema", { required: "El tema es obligatorio" })}
            />
            <FieldError message={errors.tema?.message} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Participantes
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
                  options={participants}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Temario</p>
            <h2 className="mt-1 text-base font-semibold text-gray-900">Definí los temas y su desarrollo</h2>
          </div>

          <TemarioFieldArray
            control={control}
            disabled={pending}
            errors={errors}
            register={register}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">La minuta se guarda en el sistema y luego puede exportarse a PDF.</div>
        <div className="flex gap-3">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Guardando..." : submitLabel}
          </button>
        </div>
      </section>
    </form>
  );
}
