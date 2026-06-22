import type { AgendaEntrega } from "@/types/index";
import { textToColor } from "@/helpers/colores";
import { Pencil, Trash2, AlertTriangle, Package } from "lucide-react";

type AgendaEntregaTableProps = {
  items: AgendaEntrega[];
  onEdit: (item: AgendaEntrega) => void;
  onDelete: (item: AgendaEntrega) => void;
};

export default function AgendaEntregaTable({
  items,
  onEdit,
  onDelete,
}: AgendaEntregaTableProps) {
  const isEntregada = (item: AgendaEntrega) =>
    item.siac.estado === 35 || item.siac.estado === 40;

  const formatOperacion = (item: AgendaEntrega) => {
    if (item.siac.operacion) {
      return String(item.siac.operacion);
    }

    if (item.siac.grupo && item.siac.orden) {
      return `[${item.siac.grupo} | ${item.siac.orden}]`;
    }

    return "-";
  };

  const formatDatos = (item: AgendaEntrega) => {
    const cliente = item.siac.cliente || "-";
    const versionModelo = [item.siac.modelo, item.siac.version]
      .filter((value) => typeof value === "string" && value.trim().length)
      .join(" ");
    const identificador = (item.siac.chasis ?? item.siac.serie ?? "").trim();

    return {
      cliente,
      versionModelo: versionModelo || "-",
      identificador: identificador || item.siac.nroFabricacion || "-",
      color: item.siac.color || "-",
      colorClass: textToColor(item.siac.color),
    };
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-2">
        <h2 className="text-sm font-semibold tracking-tight text-gray-900">Agendas programadas</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-xs">
          <thead className="bg-[#B7B7B7] text-[11px] font-bold uppercase text-black">
            <tr>
              <th className="px-3 py-3 text-center">Hora</th>
              <th className="px-3 py-3 text-center">Interno</th>
              <th className="px-3 py-3 text-center">Datos</th>
              <th className="px-3 py-3 text-center">Vendedor</th>
              <th className="px-3 py-3 text-center">Operacion</th>
              <th className="px-3 py-3 text-center">Observaciones</th>
              <th className="px-3 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const datos = formatDatos(item);
              const entregada = isEntregada(item);

              return (
                <tr
                  key={item._id}
                  className={`border-b border-gray-400 align-middle ${entregada ? "bg-green-100" : "bg-white"}`}
                >
                  <td
                    className={`px-3 py-3 text-center align-middle text-[1.1rem] font-bold leading-none text-black ${
                      entregada ? "bg-green-100" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-center">{item.horaAgenda}</div>
                  </td>
                  <td
                    className={`px-3 py-3 text-center align-middle text-[1.15rem] font-bold leading-none text-black ${
                      entregada ? "bg-green-200" : "bg-[#F3F3F3]"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div>{item.interno}</div>
                      {item.equipado ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                          <Package size={12} />
                          Equipado
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-black">
                    <div className="space-y-0.5">
                      <div className="border-b border-dotted border-gray-400 pb-0.5 text-[12px] font-medium uppercase leading-tight">
                        {datos.cliente}
                      </div>
                      <div className="text-[12px] font-semibold uppercase leading-tight text-gray-700">
                        {datos.versionModelo}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[12px] font-bold uppercase leading-tight">
                        <span>{datos.identificador}</span>
                        <span>/</span>
                        <span className="text-gray-700">COLOR:</span>
                        <span
                          className={`inline-flex items-center rounded-md border border-slate-200 px-1.5 py-0.5 text-[12px] font-bold leading-none ${
                            datos.colorClass ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {datos.color}
                        </span>
                      </div>
                      {item.siacSyncError ? (
                        <div className="inline-flex items-center gap-1 pt-0.5 text-[10px] font-semibold uppercase text-amber-700">
                          <AlertTriangle size={10} />
                          {item.siacSyncMessage || "Sin SIAC"}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center align-middle text-[0.95rem] uppercase leading-tight text-black">
                    <div className="flex items-center justify-center">{item.siac.vendedor}</div>
                  </td>
                  <td className="px-3 py-3 text-center align-middle text-[1.05rem] font-semibold leading-none text-black">
                    <div className="flex items-center justify-center">{formatOperacion(item)}</div>
                  </td>
                  <td className="px-3 py-3 align-middle text-[11px] leading-tight text-gray-700">
                    <div className="line-clamp-3 min-w-[160px]">
                      {item.observaciones?.trim() || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap text-[12px]">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 size={13} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!items.length ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                  No hay agendas de entrega para los filtros seleccionados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
