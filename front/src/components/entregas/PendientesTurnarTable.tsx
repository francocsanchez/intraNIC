import type { PendienteTurnar } from "@/types/index";
import { textToColor } from "@/helpers/colores";
import { CalendarPlus, CarFront, Package, Pencil, ShieldAlert, Trash2, AlertTriangle } from "lucide-react";

type PendientesTurnarTableProps = {
  items: PendienteTurnar[];
  canManage: boolean;
  onEdit: (item: PendienteTurnar) => void;
  onDelete: (item: PendienteTurnar) => void;
  onSchedule: (item: PendienteTurnar) => void;
};

export default function PendientesTurnarTable({
  items,
  canManage,
  onEdit,
  onDelete,
  onSchedule,
}: PendientesTurnarTableProps) {
  const formatOperacion = (item: PendienteTurnar) => {
    if (!item.siac) {
      return "-";
    }

    if (item.siac.operacion) {
      return String(item.siac.operacion);
    }

    if (item.siac.grupo && item.siac.orden) {
      return `[${item.siac.grupo} | ${item.siac.orden}]`;
    }

    return "-";
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-2">
        <h2 className="text-sm font-semibold tracking-tight text-gray-900">Unidades pendientes de turnar</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-xs">
          <thead className="bg-[#B7B7B7] text-[11px] font-bold uppercase text-black">
            <tr>
              <th className="px-3 py-3 text-center">Interno</th>
              <th className="px-3 py-3 text-center">Datos</th>
              <th className="px-3 py-3 text-center">Vendedor</th>
              <th className="px-3 py-3 text-center">Operacion</th>
              <th className="px-3 py-3 text-center">Telefono</th>
              <th className="px-3 py-3 text-center">Observaciones</th>
              {canManage ? <th className="px-3 py-3 text-center">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => {
                const versionModelo = [item.siac?.modelo, item.siac?.version]
                  .filter((value) => typeof value === "string" && value.trim().length)
                  .join(" ");
                const identificador = (item.siac?.chasis ?? item.siac?.serie ?? "").trim();

                return (
                  <tr key={item._id} className="border-b border-gray-400 align-middle bg-white">
                    <td className="bg-[#F3F3F3] px-3 py-3 text-center align-middle text-[1.15rem] font-bold leading-none text-black">
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
                        {item.siniestro ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-red-700">
                            <ShieldAlert size={12} />
                            Siniestro
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-black">
                      <div className="space-y-0.5">
                        <div className="border-b border-dotted border-gray-400 pb-0.5 text-[12px] font-medium uppercase leading-tight">
                          {item.siac?.cliente || "-"}
                        </div>
                        <div className="text-[12px] font-semibold uppercase leading-tight text-gray-700">
                          {versionModelo || "-"}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-[12px] font-bold uppercase leading-tight">
                          <span>{identificador || item.siac?.nroFabricacion || "-"}</span>
                          <span>/</span>
                          <span className="text-gray-700">COLOR:</span>
                          <span
                            className={`inline-flex items-center rounded-md border border-slate-200 px-1.5 py-0.5 text-[12px] font-bold leading-none ${
                              textToColor(item.siac?.color) ?? "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.siac?.color || "-"}
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
                      <div className="flex items-center justify-center">{item.siac?.vendedor || "-"}</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[1.05rem] font-semibold leading-none text-black">
                      <div className="flex items-center justify-center">{formatOperacion(item)}</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-[14px] leading-tight text-gray-700">
                      <div className="min-w-[120px]">{item.siac?.telefono?.trim() || "-"}</div>
                    </td>
                    <td className="px-3 py-3 align-middle text-[11px] leading-tight text-gray-700">
                      <div className="line-clamp-3 min-w-[160px]">{item.observaciones?.trim() || "-"}</div>
                    </td>
                    {canManage ? (
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap text-[12px]">
                          <button
                            type="button"
                            onClick={() => onSchedule(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-[12px] font-semibold text-amber-900 transition hover:bg-amber-100"
                          >
                            <CalendarPlus size={13} />
                            Turnar
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3.5 py-2 text-[12px] font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 size={13} />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            ) : (
              <tr className="border-b border-gray-200 bg-white">
                <td colSpan={canManage ? 7 : 6} className="px-6 py-10 text-center text-sm text-gray-500">
                  No hay unidades pendientes de turnar para la sucursal seleccionada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
