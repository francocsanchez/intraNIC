import type { MinutaUser } from "@/types/index";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import { Check, ChevronDown, Search, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

type ParticipantesMultiSelectProps = {
  disabled?: boolean;
  error?: string;
  onChange: (value: string[]) => void;
  options: MinutaUser[];
  value: string[];
};

const getUserLabel = (user: MinutaUser) => `${user.lastName}, ${user.name}`;

export default function ParticipantesMultiSelect({
  disabled = false,
  error,
  onChange,
  options,
  value,
}: ParticipantesMultiSelectProps) {
  const [query, setQuery] = useState("");

  const selectedUsers = useMemo(
    () => options.filter((option) => value.includes(option._id)),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return options;
    }

    return options.filter((option) => {
      const fullName = `${option.lastName} ${option.name}`.toLowerCase();
      return fullName.includes(normalized) || option.email.toLowerCase().includes(normalized);
    });
  }, [options, query]);

  const handleChange = (users: MinutaUser[]) => {
    onChange(users.map((user) => user._id));
  };

  const removeParticipant = (id: string) => {
    if (disabled) return;
    onChange(value.filter((current) => current !== id));
  };

  return (
    <div className="space-y-3">
      <Combobox
        value={selectedUsers}
        onChange={handleChange}
        disabled={disabled}
        multiple
        immediate
      >
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" />
          <ComboboxInput
            aria-label="Buscar participantes"
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o email"
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
                <ComboboxOption
                  key={option._id}
                  value={option}
                >
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
                        <div className="font-medium text-gray-900">{getUserLabel(option)}</div>
                        <div className="truncate text-xs text-gray-500">{option.email}</div>
                      </div>
                    </div>
                  )}
                </ComboboxOption>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500">No hay usuarios que coincidan con la búsqueda.</div>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>

      <div className="min-h-[52px] rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-3 py-3">
        {selectedUsers.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <span
                key={user._id}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
              >
                <UserRound size={13} />
                {getUserLabel(user)}
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() => removeParticipant(user._id)}
                    className="text-gray-400 transition hover:text-gray-700"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Todavía no seleccionaste participantes.</p>
        )}
      </div>

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
