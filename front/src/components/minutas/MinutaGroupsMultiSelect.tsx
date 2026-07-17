import type { MinutaGrupo } from "@/types/index";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
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

    if (!normalized) {
      return options;
    }

    return options.filter((option) => option.nombre.toLowerCase().includes(normalized));
  }, [options, query]);

  const handleChange = (groups: MinutaGrupo[]) => {
    onChange(groups.map((group) => group._id));
  };

  const removeGroup = (id: string) => {
    if (disabled) return;
    onChange(value.filter((current) => current !== id));
  };

  return (
    <div className="space-y-3">
      <Combobox
        value={selectedGroups}
        onChange={handleChange}
        disabled={disabled}
        multiple
        immediate
      >
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" />
          <ComboboxInput
            aria-label="Buscar grupos"
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar grupo por nombre"
            className="w-full rounded-xl border border-gray-300 px-10 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500 disabled:cursor-not-allowed disabled:bg-gray-50"
          />
          <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
            <ChevronDown size={16} />
          </ComboboxButton>

          <ComboboxOptions
            transition
            className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1 shadow-xl transition duration-150 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <ComboboxOption key={option._id} value={option}>
                  {({ focus, selected }) => (
                    <div
                      className={[
                        "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-sm text-gray-700",
                        focus ? "bg-gray-50" : "bg-white",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-white transition",
                          selected ? "border-black bg-black" : "border-gray-300 bg-white",
                        ].join(" ")}
                      >
                        {selected ? <Check size={12} /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">{option.nombre}</div>
                        <div className="truncate text-xs text-gray-500">
                          {option.participantesCount} participante(s)
                        </div>
                      </div>
                    </div>
                  )}
                </ComboboxOption>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500">No hay grupos que coincidan con la busqueda.</div>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>

      <div className="min-h-[52px] rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3">
        {selectedGroups.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((group) => (
              <span
                key={group._id}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
              >
                <Users size={13} />
                {group.nombre}
                <span className="text-gray-400">({group.participantesCount})</span>
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => removeGroup(group._id)}
                    className="text-gray-400 transition hover:text-gray-700"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No seleccionaste grupos de difusion.</p>
        )}
      </div>
    </div>
  );
}
