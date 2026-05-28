type OperacionesResumenTableProps = {
  data: Array<{
    vendedor: string;
    total: number;
    modelos: Record<string, number>;
  }>;
  modelos: string[];
};

export default function OperacionesResumenTable({
  data,
  modelos,
}: OperacionesResumenTableProps) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Resumen por vendedor y modelo</h2>
          <p className="mt-1 text-sm text-gray-500">Las columnas de modelos se generan en forma automática según el resultado filtrado.</p>
        </div>

        <span className="w-fit rounded-full bg-[#e4f3fa] px-3 py-1 text-xs font-semibold text-[#128c80]">
          {modelos.length} modelos visibles
        </span>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-gray-200 bg-white px-4 py-3 text-left font-semibold text-gray-900">
                Vendedor
              </th>
              <th className="border-b border-gray-200 bg-white px-4 py-3 text-center font-semibold text-gray-900">
                Total
              </th>
              {modelos.map((modelo) => (
                <th
                  key={modelo}
                  className="border-b border-gray-200 bg-white px-4 py-3 text-center font-semibold text-gray-900"
                >
                  {modelo}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={row.vendedor} className={index % 2 === 0 ? "bg-[#fbfdff]" : "bg-white"}>
                <td className="sticky left-0 z-10 border-b border-gray-100 bg-inherit px-4 py-3 font-medium text-gray-800">
                  {row.vendedor}
                </td>
                <td className="border-b border-gray-100 px-4 py-3 text-center font-semibold text-[#128c80]">
                  {row.total}
                </td>
                {modelos.map((modelo) => (
                  <td key={`${row.vendedor}-${modelo}`} className="border-b border-gray-100 px-4 py-3 text-center text-gray-700">
                    {row.modelos[modelo] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
