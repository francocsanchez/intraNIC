import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { Control, FieldErrors, UseFieldArrayAppend, UseFieldArrayRemove, UseFormRegister } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import RichTextEditor from "@/components/common/RichTextEditor";
import { hasMeaningfulRichText } from "@/utils/richTextSanitize";

export type MinutaFormValues = {
  fecha: string;
  tema: string;
  participantes: string[];
  temario: Array<{
    nombre: string;
    desarrollo: string;
  }>;
};

type TemarioFieldArrayProps = {
  control: Control<MinutaFormValues>;
  disabled?: boolean;
  errors: FieldErrors<MinutaFormValues>;
  register: UseFormRegister<MinutaFormValues>;
};

function TemarioItemError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-red-600">{message}</p>;
}

export default function TemarioFieldArray({
  control,
  disabled = false,
  errors,
  register,
}: TemarioFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "temario",
  });

  const appendTema: UseFieldArrayAppend<MinutaFormValues, "temario"> = append;
  const removeTema: UseFieldArrayRemove = remove;

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <article key={field.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
              <GripVertical size={15} className="text-gray-400" />
              Tema {index + 1}
            </div>

            <button
              type="button"
              onClick={() => removeTema(index)}
              disabled={disabled || fields.length === 1}
              className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={13} />
              Quitar
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label htmlFor={`temario.${index}.nombre`} className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Nombre del tema
              </label>
              <input
                id={`temario.${index}.nombre`}
                type="text"
                disabled={disabled}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                {...register(`temario.${index}.nombre`, {
                  required: "El nombre del tema es obligatorio",
                })}
              />
              <TemarioItemError message={errors.temario?.[index]?.nombre?.message} />
            </div>

            <div className="space-y-2">
              <label htmlFor={`temario.${index}.desarrollo`} className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Desarrollo
              </label>
              <Controller
                control={control}
                name={`temario.${index}.desarrollo`}
                rules={{
                  validate: (value) => hasMeaningfulRichText(value) || "El desarrollo es obligatorio",
                }}
                render={({ field }) => (
                  <RichTextEditor
                    disabled={disabled}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Escribí el desarrollo del tema con formato..."
                  />
                )}
              />
              <TemarioItemError message={errors.temario?.[index]?.desarrollo?.message} />
            </div>
          </div>
        </article>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          appendTema({
            nombre: "",
            desarrollo: "",
          })
        }
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus size={15} />
        Agregar tema
      </button>

      {typeof errors.temario?.message === "string" ? (
        <p className="text-xs font-medium text-red-600">{errors.temario.message}</p>
      ) : null}
    </div>
  );
}
