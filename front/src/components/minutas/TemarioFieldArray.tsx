import RichTextEditor from "@/components/common/RichTextEditor";
import { hasMeaningfulRichText } from "@/utils/richTextSanitize";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  UseFormRegister,
} from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";

export type MinutaFormValues = {
  fecha: string;
  tema: string;
  participantes: string[];
  temario: Array<{ nombre: string; desarrollo: string }>;
};

type TemarioFieldArrayProps = {
  control: Control<MinutaFormValues>;
  disabled?: boolean;
  errors: FieldErrors<MinutaFormValues>;
  register: UseFormRegister<MinutaFormValues>;
};

function TemarioItemError({ message }: { message?: string }) {
  return message ? (
    <p className="text-xs font-medium text-destructive">{message}</p>
  ) : null;
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
    <div className="space-y-3">
      {fields.map((field, index) => (
        <article
          key={field.id}
          className="border-t border-border pt-3 first:border-t-0 first:pt-0"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <GripVertical size={15} className="text-muted-foreground" />
              Tema {index + 1}
            </div>
            <button
              type="button"
              onClick={() => removeTema(index)}
              disabled={disabled || fields.length === 1}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-destructive/30 bg-background px-2 text-xs font-semibold text-destructive transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={13} />
              Quitar
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <label
                htmlFor={`temario.${index}.nombre`}
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
              >
                Nombre del tema
              </label>
              <input
                id={`temario.${index}.nombre`}
                type="text"
                disabled={disabled}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                {...register(`temario.${index}.nombre`, {
                  required: "El nombre del tema es obligatorio",
                })}
              />
              <TemarioItemError
                message={errors.temario?.[index]?.nombre?.message}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor={`temario.${index}.desarrollo`}
                className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
              >
                Desarrollo
              </label>
              <Controller
                control={control}
                name={`temario.${index}.desarrollo`}
                rules={{
                  validate: (value) =>
                    hasMeaningfulRichText(value) ||
                    "El desarrollo es obligatorio",
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
              <TemarioItemError
                message={errors.temario?.[index]?.desarrollo?.message}
              />
            </div>
          </div>
        </article>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={() => appendTema({ nombre: "", desarrollo: "" })}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus size={15} />
        Agregar tema
      </button>
      {typeof errors.temario?.message === "string" ? (
        <p className="text-xs font-medium text-destructive">
          {errors.temario.message}
        </p>
      ) : null}
    </div>
  );
}
