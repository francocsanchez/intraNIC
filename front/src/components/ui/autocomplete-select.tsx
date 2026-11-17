import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  Children,
  forwardRef,
  isValidElement,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

type Option = { disabled?: boolean; label: string; value: string };

function optionsFromChildren(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ children?: ReactNode; disabled?: boolean; value?: string | number }>(child)) return [];
    if (child.type === "optgroup") return optionsFromChildren(child.props.children);
    if (child.type !== "option") return [];
    const value = String(child.props.value ?? "");
    const label = Children.toArray(child.props.children).join("").trim();
    return [{ value, label, disabled: child.props.disabled }];
  });
}

/**
 * Replacement compatible con un select nativo. Conserva las opciones existentes
 * (incluidas las generadas con map) y entrega un evento de cambio equivalente.
 */
const AutocompleteSelect = forwardRef<HTMLInputElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function AutocompleteSelect(
    { children, className, disabled, id, name, onBlur, onChange, required, value, defaultValue, multiple: _multiple, "aria-label": ariaLabel },
    ref,
  ) {
    const [query, setQuery] = useState("");
    const [uncontrolledValue, setUncontrolledValue] = useState(() => String(defaultValue ?? ""));
    const options = useMemo(() => optionsFromChildren(children), [children]);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? String(value ?? "") : uncontrolledValue;
    const selected = options.find((option) => option.value === currentValue) ?? null;
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const largeList = options.length > 16;
    const visible = !largeList || normalizedQuery.length >= 3
      ? options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery))
      : [];

    const select = (option: Option | null) => {
      const nextValue = option?.value ?? "";
      if (!isControlled) setUncontrolledValue(nextValue);
      const event = {
        target: { name, value: nextValue },
        currentTarget: { name, value: nextValue },
      } as ChangeEvent<HTMLSelectElement>;
      onChange?.(event);
      setQuery("");
    };

    return (
      <Combobox value={selected} onChange={(option) => select((Array.isArray(option) ? option[0] ?? null : option) as Option | null)} disabled={disabled} onClose={() => setQuery("")}>
        <div className="relative">
          <input ref={ref} aria-hidden="true" className="sr-only" name={name} required={required} value={currentValue} onChange={() => undefined} tabIndex={-1} />
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
          <ComboboxInput
            id={id}
            aria-label={ariaLabel ?? name ?? "Seleccionar opción"}
            displayValue={() => query || selected?.label || ""}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={onBlur as never}
            placeholder={selected?.label || "Seleccionar..."}
            className={`${className ?? "h-9 w-full rounded-md border border-input bg-background text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"} !pl-9 !pr-10`}
          />
          <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronDown size={16} />
          </ComboboxButton>
          <ComboboxOptions transition className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg transition duration-150 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0">
            {selected && !required ? <ComboboxOption value={null} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground data-focus:bg-muted"><X size={14} /> Limpiar selección</ComboboxOption> : null}
            {largeList && normalizedQuery.length < 3 ? <p className="px-2 py-2 text-xs text-muted-foreground">Ingresá al menos 3 caracteres para buscar.</p> : null}
            {visible.map((option) => (
              <ComboboxOption key={option.value} value={option} disabled={option.disabled}>
                {({ focus, selected: isSelected }) => <div className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${focus ? "bg-muted" : ""} ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}><span className="flex h-4 w-4 items-center justify-center">{isSelected ? <Check size={14} /> : null}</span>{option.label}</div>}
              </ComboboxOption>
            ))}
            {!visible.length && (!largeList || normalizedQuery.length >= 3) ? <p className="px-2 py-2 text-xs text-muted-foreground">No se encontraron opciones.</p> : null}
          </ComboboxOptions>
        </div>
      </Combobox>
    );
  },
);

export default AutocompleteSelect;
