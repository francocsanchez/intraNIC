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
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Unidades pendientes de turnar</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-xs">
          <thead className="bg-secondary text-primary font-bold uppercase text-foreground">
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
                  <tr key={item._id} className="border-b border-border align-middle bg-card">
                    <td className="bg-secondary px-3 py-3 text-center align-middle text-primary font-bold leading-none text-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div>{item.interno}</div>
                        {item.equipado ? (
                          <div className="inline-flex items-center gap-1 text-primary font-semibold uppercase tracking-wide text-muted-foreground">
                            <Package size={12} />
                            Equipado
                          </div>
                        ) : null}
                        {item.entregaUsado ? (
                          <div className="inline-flex items-center gap-1 text-primary font-semibold uppercase tracking-wide text-muted-foreground">
                            <CarFront size={12} />
                            Entrega usado
                          </div>
                        ) : null}
                        {item.siniestro ? (
                          <div className="inline-flex items-center gap-1 text-primary font-semibold uppercase tracking-wide text-destructive">
                            <ShieldAlert size={12} />
                            Siniestro
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <div className="space-y-0.5">
                        <div className="border-b border-dotted border-border pb-0.5 text-primary font-medium uppercase leading-tight">
                          {item.siac?.cliente || "-"}
                        </div>
                        <div className="text-primary font-semibold uppercase leading-tight text-muted-foreground">
                          {versionModelo || "-"}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-primary font-bold uppercase leading-tight">
                          <span>{identificador || item.siac?.nroFabricacion || "-"}</span>
                          <span>/</span>
                          <span className="text-muted-foreground">COLOR:</span>
                          <span
                            className={`inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-primary font-bold leading-none ${
                              textToColor(item.siac?.color) ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.siac?.color || "-"}
                          </span>
                        </div>
                        {item.siacSyncError ? (
                          <div className="inline-flex items-center gap-1 pt-0.5 text-primary font-semibold uppercase text-secondary-foreground">
                            <AlertTriangle size={10} />
                            {item.siacSyncMessage || "Sin SIAC"}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary uppercase leading-tight text-foreground">
                      <div className="flex items-center justify-center">{item.siac?.vendedor || "-"}</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary font-semibold leading-none text-foreground">
                      <div className="flex items-center justify-center">{formatOperacion(item)}</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary leading-tight text-muted-foreground">
                      <div className="min-w-[120px]">{item.siac?.telefono?.trim() || "-"}</div>
                    </td>
                    <td className="px-3 py-3 align-middle text-primary leading-tight text-muted-foreground">
                      <div className="line-clamp-3 min-w-[160px]">{item.observaciones?.trim() || "-"}</div>
                    </td>
                    {canManage ? (
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap text-primary">
                          <button
                            type="button"
                            onClick={() => onSchedule(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3.5 py-2 text-primary font-semibold text-secondary-foreground transition hover:bg-secondary"
                          >
                            <CalendarPlus size={13} />
                            Turnar
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-primary font-semibold text-muted-foreground transition hover:bg-muted"
                          >
                            <Pencil size={13} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3.5 py-2 text-primary font-semibold text-destructive transition hover:bg-destructive/10"
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
              <tr className="border-b border-border bg-card">
                <td colSpan={canManage ? 7 : 6} className="px-6 py-10 text-center text-sm text-muted-foreground">
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
