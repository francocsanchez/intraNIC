import type { SucursalEntrega } from "@/types/index";

type AgendaEntregaFiltersProps = {
  fecha: string;
  sucursalId: string;
  sucursales: SucursalEntrega[];
  onChange: (next: { fecha: string; sucursalId: string }) => void;
};

export default function AgendaEntregaFilters({
  fecha,
  sucursalId,
  sucursales,
  onChange,
}: AgendaEntregaFiltersProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,320px)_180px_160px]">
        <div className="space-y-1">
          <label htmlFor="agenda-sucursal" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Sucursal
          </label>
          <select
            id="agenda-sucursal"
            value={sucursalId}
            onChange={(event) => onChange({ fecha, sucursalId: event.target.value })}
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

        <div className="space-y-2">
          <label htmlFor="agenda-fecha" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Fecha
          </label>
          <input
            id="agenda-fecha"
            type="date"
            value={fecha}
            onChange={(event) => onChange({ fecha: event.target.value, sucursalId })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onChange({ fecha: "", sucursalId })}
            className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Limpiar fecha
          </button>
        </div>
      </div>
    </section>
  );
}
