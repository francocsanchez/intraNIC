import type { MinutaUser } from "@/types/index";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
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
    return normalized
      ? options.filter(
          (option) =>
            `${option.lastName} ${option.name}`
              .toLowerCase()
              .includes(normalized) ||
            option.email.toLowerCase().includes(normalized),
        )
      : options;
  }, [options, query]);

  return (
    <div className="space-y-2">
      <Combobox
        value={selectedUsers}
        onChange={(users: MinutaUser[]) =>
          onChange(users.map((user) => user._id))
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
            aria-label="Buscar participantes"
            displayValue={() => query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o email"
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
                        <div className="font-medium">
                          {getUserLabel(option)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {option.email}
                        </div>
                      </div>
                    </div>
                  )}
                </ComboboxOption>
              ))
            ) : (
              <div className="px-2 py-3 text-sm text-muted-foreground">
                No hay usuarios que coincidan con la búsqueda.
              </div>
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      <div className="min-h-9 rounded-md border border-dashed border-border bg-muted px-2 py-2">
        {selectedUsers.length ? (
          <div className="flex flex-wrap gap-1">
            {selectedUsers.map((user) => (
              <span
                key={user._id}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"
              >
                <UserRound size={13} />
                {getUserLabel(user)}
                {!disabled ? (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(value.filter((current) => current !== user._id))
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
            Todavía no seleccionaste participantes.
          </p>
        )}
      </div>
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
