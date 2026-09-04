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
  { label: "Dominio", value: data.dominio ?? "-" },
  { label: "Fecha patente", value: data.fechaPatente ?? "-" },
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
      <div className="rounded-md border border-border bg-card px-3 py-2">
        <p className="text-sm text-muted-foreground">Buscando informacion del interno...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card px-3 py-2 text-sm text-muted-foreground">
        Busca un interno para ver la informacion actualizada desde SIAC.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Datos SIAC</p>
          <h3 className="mt-0.5 text-base font-semibold text-card-foreground">Interno {data.interno}</h3>
        </div>
        <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-primary font-medium text-secondary-foreground">
          {data.operacion ? `Op. ${data.operacion}` : data.grupo && data.orden ? `[${data.grupo} | ${data.orden}]` : data.tipoOperacion}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
        {detailRows(data).map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[120px_1fr] items-start gap-2 border-b border-border py-1 last:border-b-0"
          >
            <span className="text-primary font-medium uppercase tracking-wide text-muted-foreground">
              {row.label}
            </span>
            <span className="text-sm leading-tight text-card-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
