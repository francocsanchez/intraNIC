import type { SucursalEntrega } from "@/types/index";

type PendientesTurnarFiltersProps = {
  sucursalId: string;
  sucursales: SucursalEntrega[];
  onChange: (next: { sucursalId: string }) => void;
};

export default function PendientesTurnarFilters({
  sucursalId,
  sucursales,
  onChange,
}: PendientesTurnarFiltersProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-2 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,320px)_160px]">
        <div className="space-y-1">
          <label htmlFor="pendientes-sucursal" className="text-primary font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Sucursal
          </label>
          <select
            id="pendientes-sucursal"
            value={sucursalId}
            onChange={(event) => onChange({ sucursalId: event.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">-- Selecciona una sucursal --</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal._id} value={sucursal._id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onChange({ sucursalId: "" })}
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary"
          >
            Limpiar filtro
          </button>
        </div>
      </div>
    </section>
  );
}
