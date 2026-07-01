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
    <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,320px)_160px]">
        <div className="space-y-1">
          <label htmlFor="pendientes-sucursal" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Sucursal
          </label>
          <select
            id="pendientes-sucursal"
            value={sucursalId}
            onChange={(event) => onChange({ sucursalId: event.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-500"
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
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Limpiar filtro
          </button>
        </div>
      </div>
    </section>
  );
}
