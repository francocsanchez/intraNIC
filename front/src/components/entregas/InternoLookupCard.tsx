import type { AgendaEntregaLookup } from "@/types/index";

type InternoLookupCardProps = {
  data: AgendaEntregaLookup | null;
  error?: string;
  loading?: boolean;
};

const detailRows = (data: AgendaEntregaLookup) => [
  { label: "Tipo", value: data.tipoOperacion },
  {
    label: "Operacion",
    value: data.operacion ?? (data.grupo && data.orden ? `[${data.grupo} | ${data.orden}]` : "-"),
  },
  { label: "Cliente", value: data.cliente },
  { label: "Telefono", value: data.telefono ?? "-" },
  { label: "Vendedor", value: data.vendedor },
  { label: "Modelo", value: data.modelo ?? "-" },
  { label: "Version", value: data.version ?? "-" },
  { label: "Color", value: data.color },
  { label: "Nro. fabricacion", value: data.nroFabricacion ?? "-" },
  { label: "Chasis", value: data.chasis ?? "-" },
  { label: "Serie", value: data.serie ?? "-" },
];

export default function InternoLookupCard({
  data,
  error,
  loading = false,
}: InternoLookupCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
        <p className="text-sm text-gray-500">Buscando informacion del interno...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-500">
        Busca un interno para ver la informacion actualizada desde SIAC.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Datos SIAC</p>
          <h3 className="mt-0.5 text-base font-semibold text-gray-900">Interno {data.interno}</h3>
        </div>
        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
          {data.operacion ? `Op. ${data.operacion}` : data.grupo && data.orden ? `[${data.grupo} | ${data.orden}]` : data.tipoOperacion}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
        {detailRows(data).map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[120px_1fr] items-start gap-2 border-b border-gray-100 py-1 last:border-b-0"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {row.label}
            </span>
            <span className="text-sm leading-tight text-gray-900">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
