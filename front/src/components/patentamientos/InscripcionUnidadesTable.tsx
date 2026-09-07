import type { PatentamientosUnidadesDealersResumen } from "@/services/patentamientosUnidadesDealersService";

type InscripcionUnidadesTableProps = {
  data: PatentamientosUnidadesDealersResumen;
};

const formatInteger = (value: number) => value.toLocaleString("es-AR");
const TABLE_STATE_ORDER = ["PENDIENTE", "EN VIAJE", "ENTREGADA"] as const;

export default function InscripcionUnidadesTable({ data }: InscripcionUnidadesTableProps) {
  const orderedStates = [
    ...TABLE_STATE_ORDER,
    ...data.states.filter((state) => !TABLE_STATE_ORDER.includes(state as (typeof TABLE_STATE_ORDER)[number])),
  ];

  return (
    <section className="overflow-hidden rounded-lg border border-input bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Resumen por dealer y estado</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Cantidad de unidades Toyota agrupadas por concesionario y estado actual.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-xs text-primary">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="border border-input px-2 py-1.5 text-left font-semibold">Dealer</th>
              {orderedStates.map((state) => (
                <th key={state} className="border border-input px-2 py-1.5 text-center font-semibold">
                  {state}
                </th>
              ))}
              <th className="border border-input px-2 py-1.5 text-center font-semibold">Total</th>
            </tr>
          </thead>

          <tbody>
            {data.rows.length ? (
              data.rows.map((row, index) => (
                <tr key={row.dealer} className={index % 2 === 0 ? "bg-card" : "bg-secondary"}>
                  <td className="border border-border px-2 py-1.5 text-left font-medium text-foreground">{row.dealer}</td>
                  {orderedStates.map((state) => (
                    <td key={`${row.dealer}-${state}`} className="border border-border px-2 py-1.5 text-center text-muted-foreground">
                      {formatInteger(row.states[state] ?? 0)}
                    </td>
                  ))}
                  <td className="border border-border px-2 py-1.5 text-center font-bold text-foreground">{formatInteger(row.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={orderedStates.length + 2} className="border border-border px-2 py-6 text-center text-xs text-muted-foreground">
                  Todavia no hay unidades sincronizadas para mostrar en esta tabla.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
