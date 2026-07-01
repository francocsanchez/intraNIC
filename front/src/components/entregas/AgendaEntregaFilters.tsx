import type { SucursalEntrega } from "@/types/index";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const shiftDate = (direction: -1 | 1) => {
    const baseDate = fecha ? new Date(`${fecha}T00:00:00`) : new Date();
    baseDate.setDate(baseDate.getDate() + direction);
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, "0");
    const day = String(baseDate.getDate()).padStart(2, "0");
    onChange({ fecha: `${year}-${month}-${day}`, sucursalId });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,320px)_minmax(220px,280px)]">
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
          <div className="grid grid-cols-[40px_1fr_40px] gap-2">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
              aria-label="Dia anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              id="agenda-fecha"
              type="date"
              value={fecha}
              onChange={(event) => onChange({ fecha: event.target.value, sucursalId })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 outline-none focus:border-gray-500"
            />
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
              aria-label="Dia siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
