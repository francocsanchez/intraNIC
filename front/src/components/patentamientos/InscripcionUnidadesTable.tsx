import type { PatentamientosUnidadesDealersResumen } from "@/services/patentamientosUnidadesDealersService";

type InscripcionUnidadesTableProps = {
  data: PatentamientosUnidadesDealersResumen;
};

const formatInteger = (value: number) => value.toLocaleString("es-AR");

export default function InscripcionUnidadesTable({ data }: InscripcionUnidadesTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">Resumen por dealer y estado</h2>
        <p className="mt-1 text-sm text-gray-500">Cantidad de unidades Toyota agrupadas por concesionario y estado actual.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-black text-white">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Dealer</th>
              {data.states.map((state) => (
                <th key={state} className="border border-gray-300 px-3 py-2 text-center font-semibold">
                  {state}
                </th>
              ))}
              <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Total</th>
            </tr>
          </thead>

          <tbody>
            {data.rows.length ? (
              data.rows.map((row, index) => (
                <tr key={row.dealer} className={index % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                  <td className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-900">{row.dealer}</td>
                  {data.states.map((state) => (
                    <td key={`${row.dealer}-${state}`} className="border border-gray-200 px-3 py-2 text-center text-gray-700">
                      {formatInteger(row.states[state] ?? 0)}
                    </td>
                  ))}
                  <td className="border border-gray-200 px-3 py-2 text-center font-bold text-gray-900">{formatInteger(row.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={data.states.length + 2} className="border border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
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
