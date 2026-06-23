import type { AgendaEntrega } from "@/types/index";
import { textToColor } from "@/helpers/colores";
import { Pencil, Trash2, AlertTriangle, Package, CarFront } from "lucide-react";

type AgendaEntregaTableProps = {
  items: AgendaEntrega[];
  horariosHabilitados: string[];
  canToggleEntregadaPor: boolean;
  togglePendingId: string | null;
  onEdit: (item: AgendaEntrega) => void;
  onDelete: (item: AgendaEntrega) => void;
  onToggleEntregadaPor: (item: AgendaEntrega, checked: boolean) => void;
  canManage: boolean;
};

type EmptyAgendaRow = {
  _empty: true;
  horaAgenda: string;
};

type BlockedAgendaRow = {
  _blocked: true;
  horaAgenda: string;
};

type AgendaDisplayRow = AgendaEntrega | EmptyAgendaRow | BlockedAgendaRow;

const TIME_SLOT_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

export default function AgendaEntregaTable({
  items,
  horariosHabilitados,
  canToggleEntregadaPor,
  togglePendingId,
  onEdit,
  onDelete,
  onToggleEntregadaPor,
  canManage,
}: AgendaEntregaTableProps) {
  const enabledTimeSlots = new Set(horariosHabilitados);
  const displayRows: AgendaDisplayRow[] = TIME_SLOT_OPTIONS.flatMap((timeSlot): AgendaDisplayRow[] => {
    const matchingItems = items.filter((item) => item.horaAgenda === timeSlot);
    if (matchingItems.length) {
      return matchingItems;
    }

    if (!enabledTimeSlots.has(timeSlot)) {
      return [{ _blocked: true, horaAgenda: timeSlot }];
    }

    return [{ _empty: true, horaAgenda: timeSlot }];
  });

  const isEntregada = (item: AgendaEntrega) =>
    item.siac.estado === 35 || item.siac.estado === 40;

  const isEmptyRow = (row: AgendaDisplayRow): row is EmptyAgendaRow =>
    "_empty" in row && row._empty === true;

  const isBlockedRow = (row: AgendaDisplayRow): row is BlockedAgendaRow =>
    "_blocked" in row && row._blocked === true;

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
              <th className="px-3 py-3 text-center">Entregada por</th>
              {canManage ? <th className="px-3 py-3 text-center">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => {
              if (isBlockedRow(row)) {
                return (
                  <tr key={`blocked-${row.horaAgenda}-${index}`} className="border-b border-gray-400 align-middle bg-gray-200 text-gray-600">
                    <td className="px-3 py-3 text-center align-middle text-[1.1rem] font-bold leading-none">
                      <div className="flex items-center justify-center">{row.horaAgenda}</div>
                    </td>
                    <td className="bg-gray-300 px-3 py-3 text-center align-middle text-[1rem] font-bold leading-none">
                      <div className="flex items-center justify-center uppercase tracking-wide">
                        Bloqueado
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[12px] font-semibold uppercase leading-tight">
                        Horario bloqueado
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[0.95rem] uppercase leading-tight">
                      <div className="flex items-center justify-center">-</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[1.05rem] font-semibold leading-none">
                      <div className="flex items-center justify-center">-</div>
                    </td>
                    <td className="px-3 py-3 align-middle text-[11px] font-medium leading-tight">
                      <div className="min-w-[160px] uppercase text-gray-600">No disponible para agendar</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[11px] font-medium uppercase leading-tight">
                      -
                    </td>
                    {canManage ? <td className="px-3 py-3 align-middle" /> : null}
                  </tr>
                );
              }

              if (isEmptyRow(row)) {
                return (
                  <tr key={`empty-${row.horaAgenda}-${index}`} className="border-b border-gray-400 align-middle bg-white">
                    <td className="px-3 py-3 text-center align-middle text-[1.1rem] font-bold leading-none text-black">
                      <div className="flex items-center justify-center">{row.horaAgenda}</div>
                    </td>
                    <td className="bg-[#F3F3F3] px-3 py-3 text-center align-middle text-[1.15rem] font-bold leading-none text-black">
                      <div className="min-h-[20px]" />
                    </td>
                    <td className="px-4 py-3 text-black">
                      <div className="space-y-0.5">
                        <div className="min-h-[14px] border-b border-dotted border-gray-400 pb-0.5" />
                        <div className="min-h-[14px]" />
                        <div className="min-h-[14px]" />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[0.95rem] uppercase leading-tight text-black">
                      <div className="min-h-[20px]" />
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[1.05rem] font-semibold leading-none text-black">
                      <div className="min-h-[20px]" />
                    </td>
                    <td className="px-3 py-3 align-middle text-[11px] leading-tight text-gray-700">
                      <div className="min-w-[160px] min-h-[20px]" />
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[11px] leading-tight text-gray-700">
                      <div className="min-h-[20px]" />
                    </td>
                    {canManage ? <td className="px-3 py-3 align-middle" /> : null}
                  </tr>
                );
              }

              const item = row;
              const datos = formatDatos(item);
              const entregada = isEntregada(item);
              const togglePending = togglePendingId === item._id;

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
                      {item.entregaUsado ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                          <CarFront size={12} />
                          Entrega usado
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
                  <td className="px-3 py-3 text-center align-middle text-[11px] leading-tight text-gray-700">
                    {entregada ? (
                      <div className="flex min-w-[170px] flex-col items-center justify-center gap-1">
                        {canToggleEntregadaPor ? (
                          <label className="inline-flex items-center gap-2 font-semibold text-gray-800">
                            <input
                              type="checkbox"
                              checked={item.entregadaPorMarcada}
                              disabled={togglePending}
                              onChange={(event) => onToggleEntregadaPor(item, event.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20 disabled:opacity-50"
                            />
                            <span>Entregada por</span>
                          </label>
                        ) : (
                          <span className="font-semibold uppercase tracking-wide text-gray-700">Entregada por</span>
                        )}
                        <div className="text-center font-medium text-gray-700">
                          {item.entregadaPorMarcada ? item.entregadaPorNombre || "-" : "-"}
                        </div>
                      </div>
                    ) : (
                      <div>-</div>
                    )}
                  </td>
                  {canManage ? (
                    <td className="px-3 py-3 align-middle">
                      {entregada ? (
                        <div className="text-center text-[11px] font-semibold uppercase tracking-wide text-green-800">
                          Entregado
                        </div>
                      ) : (
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
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
