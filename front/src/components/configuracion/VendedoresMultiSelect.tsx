import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown, Search, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { Vendedor } from "@/types/index";

type VendedoresMultiSelectProps = {
  title: string;
  subtitle: string;
  vendedores: Vendedor[];
  value: string[];
  onChange: (value: string[]) => void;
};

export default function VendedoresMultiSelect({
  title,
  subtitle,
  vendedores,
  value,
  onChange,
}: VendedoresMultiSelectProps) {
  const [query, setQuery] = useState("");
  const selectedCodes = value.map(String);
  const selectedCodeSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const vendedoresByCode = useMemo(
    () => new Map(vendedores.map((vendedor) => [String(vendedor.codigo), vendedor])),
    [vendedores],
  );
  const selectedVendedores = useMemo(
    () => vendedores.filter((vendedor) => selectedCodeSet.has(String(vendedor.codigo))),
    [selectedCodeSet, vendedores],
  );
  const inactiveCodes = useMemo(
    () => selectedCodes.filter((codigo) => !vendedoresByCode.has(codigo)),
    [selectedCodes, vendedoresByCode],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredVendedores = useMemo(
    () =>
      normalizedQuery.length >= 3
        ? vendedores.filter(
            (vendedor) =>
              vendedor.vendedor.toLocaleLowerCase().includes(normalizedQuery) ||
              String(vendedor.codigo).includes(normalizedQuery),
          )
        : [],
    [normalizedQuery, vendedores],
  );

  const updateSelection = (next: Vendedor[]) => {
    onChange([
      ...inactiveCodes,
      ...next.map((vendedor) => String(vendedor.codigo)),
    ]);
  };

  const remove = (codigo: string) => {
    onChange(selectedCodes.filter((current) => current !== codigo));
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>

      <div className="mt-3 space-y-2">
        <Combobox
          value={selectedVendedores}
          onChange={updateSelection}
          onClose={() => setQuery("")}
          multiple
          immediate
        >
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground" />
            <ComboboxInput
              aria-label={`Buscar ${title}`}
              displayValue={() => query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar vendedor o código..."
              className="h-9 w-full rounded-md border border-input bg-background px-9 pr-9 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
            />
            <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <ChevronDown size={16} />
            </ComboboxButton>
            <ComboboxOptions transition className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg transition duration-150 ease-out empty:invisible data-[closed]:scale-95 data-[closed]:opacity-0">
              {normalizedQuery.length < 3 ? <p className="px-2 py-3 text-sm text-muted-foreground">Ingresá al menos 3 caracteres para buscar.</p> : filteredVendedores.length ? filteredVendedores.map((vendedor) => <ComboboxOption key={vendedor.codigo} value={vendedor}>{({ focus, selected }) => <div className={`flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm ${focus ? "bg-muted text-foreground" : "text-foreground"}`}><span className={`flex h-4 w-4 items-center justify-center rounded-sm border ${selected ? "border-border bg-primary text-primary-foreground" : "border-input bg-background"}`}>{selected ? <Check size={12} /> : null}</span><span className="min-w-0 flex-1 truncate font-medium">{vendedor.vendedor}</span><span className="text-xs text-muted-foreground">{vendedor.codigo}</span></div>}</ComboboxOption>) : <p className="px-2 py-3 text-sm text-muted-foreground">No se encontraron vendedores.</p>}
            </ComboboxOptions>
          </div>
        </Combobox>

        <div className="min-h-9 rounded-md border border-dashed border-border bg-muted px-2 py-2">
          {selectedCodes.length ? <div className="flex flex-wrap gap-1">{selectedVendedores.map((vendedor) => { const codigo = String(vendedor.codigo); return <span key={codigo} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground"><UserRound size={13} />{vendedor.vendedor}<button type="button" onClick={() => remove(codigo)} className="text-muted-foreground hover:text-foreground" aria-label={`Quitar ${vendedor.vendedor}`}><X size={13} /></button></span>; })}{inactiveCodes.map((codigo) => <span key={codigo} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">Código {codigo}<button type="button" onClick={() => remove(codigo)} className="hover:text-foreground" aria-label={`Quitar código ${codigo}`}><X size={13} /></button></span>)}</div> : <p className="text-sm text-muted-foreground">Todavía no seleccionaste vendedores.</p>}
        </div>
      </div>
    </div>
  );
}
