import type { AgendaEntregaLog } from "@/types/index";

type AgendaEntregaLogsTableProps = {
  items: AgendaEntregaLog[];
};

export default function AgendaEntregaLogsTable({ items }: AgendaEntregaLogsTableProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">Registros de auditoria</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Interno</th>
              <th className="px-4 py-3 text-left">Accion</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">
                  {new Date(item.fecha).toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.interno}</td>
                <td className="px-4 py-3 text-gray-700">{item.accion}</td>
                <td className="px-4 py-3 text-gray-700">{item.usuarioNombre}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="max-w-[480px] whitespace-pre-wrap break-words">
                    {item.detalle || "-"}
                  </div>
                </td>
              </tr>
            ))}

            {!items.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  No hay registros para los filtros seleccionados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
