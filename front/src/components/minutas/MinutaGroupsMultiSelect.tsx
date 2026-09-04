import type { MinutaGrupo } from "@/types/index";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown, Search, Users, X } from "lucide-react";
import { useMemo, useState } from "react";

type MinutaGroupsMultiSelectProps = {
  disabled?: boolean;
  onChange: (value: string[]) => void;
  options: MinutaGrupo[];
  value: string[];
};

export default function MinutaGroupsMultiSelect({
  disabled = false,
  onChange,
  options,
  value,
}: MinutaGroupsMultiSelectProps) {
  const [query, setQuery] = useState("");
  const selectedGroups = useMemo(
    () => options.filter((option) => value.includes(option._id)),
    [options, value],
  );
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? options.filter((option) =>
          option.nombre.toLowerCase().includes(normalized),
        )
      : options;
  }, [options, query]);

  return (
    <div className="space-y-2">
      <Combobox
        value={selectedGroups}
        onChange={(groups: MinutaGrupo[]) =>
          onChange(groups.map((group) => group._id))
        }
        disabled={disabled}
        multiple
        immediate
      >
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
          />
          <ComboboxInput
            aria-label="Buscar grupos"
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar grupo por nombre"
            className="h-9 w-full rounded-md border border-input bg-background px-10 pr-10 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />
          <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronDown size={16} />
          </ComboboxButton>
          <ComboboxOptions
            transition
            className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg transition duration-150 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <ComboboxOption key={option._id} value={option}>
                  {({ focus, selected }) => (
                    <div
                      className={`flex cursor-pointer items-start gap-3 rounded-sm px-2 py-2 text-sm ${focus ? "bg-muted text-foreground" : "text-foreground"}`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"}`}
                      >
                        {selected ? <Check size={12} /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium">{option.nombre}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {option.participantesCount} participante(s)
                        </div>
                      </div>
                    </div>
                  )}
                </ComboboxOption>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No hay grupos que coincidan con la búsqueda.
              </div>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      <div className="min-h-9 rounded-md border border-dashed border-border bg-muted px-2 py-2">
        {selectedGroups.length ? (
          <div className="flex flex-wrap gap-1">
            {selectedGroups.map((group) => (
              <span
                key={group._id}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
              >
                <Users size={13} />
                {group.nombre}
                <span className="text-muted-foreground">
                  ({group.participantesCount})
                </span>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(value.filter((current) => current !== group._id))
                    }
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No seleccionaste grupos de difusión.
          </p>
        )}
      </div>
    </div>
  );
}
