import type { AgendaEntregaLog } from "@/types/index";

type AgendaEntregaLogsTableProps = {
  items: AgendaEntregaLog[];
};

export default function AgendaEntregaLogsTable({ items }: AgendaEntregaLogsTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold text-card-foreground">Registros de auditoria</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Interno</th>
              <th className="px-4 py-3 text-left">Accion</th>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-muted">
                <td className="px-3 py-1.5 text-muted-foreground">
                  {new Date(item.fecha).toLocaleString("es-AR")}
                </td>
                <td className="px-3 py-1.5 font-medium text-card-foreground">{item.interno ?? "Reserva"}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{item.accion}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{item.usuarioNombre}</td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  <div className="max-w-[480px] whitespace-pre-wrap break-words">
                    {item.detalle || "-"}
                  </div>
                </td>
              </tr>
            ))}

            {!items.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
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
