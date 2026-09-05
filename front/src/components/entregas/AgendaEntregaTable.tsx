import type { AgendaEntrega } from "@/types/index";
import { textToColor } from "@/helpers/colores";
import { ActionButton, DeleteActionButton, EditActionButton } from "@/components/ui/action-button";
import { Pencil, Trash2, AlertTriangle, Package, CarFront, CalendarPlus } from "lucide-react";

type AgendaEntregaTableProps = {
  items: AgendaEntrega[];
  horariosHabilitados: string[];
  canToggleEquipado: boolean;
  toggleEquipadoPendingId: string | null;
  canToggleEntregadaPor: boolean;
  togglePendingId: string | null;
  onEdit: (item: AgendaEntrega) => void;
  onDelete: (item: AgendaEntrega) => void;
  onConvertReservation: (item: AgendaEntrega) => void;
  onToggleEquipado: (item: AgendaEntrega, checked: boolean) => void;
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
  canToggleEquipado,
  toggleEquipadoPendingId,
  canToggleEntregadaPor,
  togglePendingId,
  onEdit,
  onDelete,
  onConvertReservation,
  onToggleEquipado,
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

  const isReserva = (item: AgendaEntrega) => item.tipoRegistro === "reserva";
  const isTurno = (item: AgendaEntrega) => item.tipoRegistro === "turno";
  const isEntregada = (item: AgendaEntrega) =>
    isTurno(item) && (item.siac?.estado === 35 || item.siac?.estado === 40);

  const isEmptyRow = (row: AgendaDisplayRow): row is EmptyAgendaRow =>
    "_empty" in row && row._empty === true;

  const isBlockedRow = (row: AgendaDisplayRow): row is BlockedAgendaRow =>
    "_blocked" in row && row._blocked === true;

  const formatOperacion = (item: AgendaEntrega) => {
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

  const formatDatos = (item: AgendaEntrega) => {
    if (isReserva(item)) {
      return {
        cliente: item.observaciones?.trim() || "Reserva",
        versionModelo: "",
        identificador: "",
        color: "",
        colorClass: "",
      };
    }

    const cliente = item.siac?.cliente || "-";
    const versionModelo = [item.siac?.modelo, item.siac?.version]
      .filter((value) => typeof value === "string" && value.trim().length)
      .join(" ");
    const identificador = (item.siac?.chasis ?? item.siac?.serie ?? "").trim();

    return {
      cliente,
      versionModelo: versionModelo || "-",
      identificador: identificador || item.siac?.nroFabricacion || "-",
      color: item.siac?.color || "-",
      colorClass: textToColor(item.siac?.color),
    };
  };

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold text-card-foreground">Agendas programadas</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-xs">
          <thead className="bg-muted text-primary font-medium uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-center">Hora</th>
              <th className="px-3 py-2 text-center">Interno</th>
              <th className="px-3 py-2 text-center">Datos</th>
              <th className="px-3 py-2 text-center">Vendedor</th>
              <th className="px-3 py-2 text-center">Operacion</th>
              <th className="px-3 py-2 text-center">Observaciones</th>
              <th className="px-3 py-2 text-center">Entregada por</th>
              {canManage ? <th className="px-3 py-2 text-center">Acciones</th> : null}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, index) => {
              if (isBlockedRow(row)) {
                return (
                  <tr key={`blocked-${row.horaAgenda}-${index}`} className="border-b border-border align-middle bg-muted text-muted-foreground">
                    <td className="px-3 py-3 text-center align-middle text-primary font-bold leading-none">
                      <div className="flex items-center justify-center">{row.horaAgenda}</div>
                    </td>
                    <td className="bg-muted px-3 py-3 text-center align-middle text-primary font-bold leading-none">
                      <div className="flex items-center justify-center uppercase tracking-wide">
                        Bloqueado
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-primary font-semibold uppercase leading-tight">
                        Horario bloqueado
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary uppercase leading-tight">
                      <div className="flex items-center justify-center">-</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary font-semibold leading-none">
                      <div className="flex items-center justify-center">-</div>
                    </td>
                    <td className="px-3 py-3 align-middle text-primary font-medium leading-tight">
                      <div className="min-w-[160px] uppercase text-muted-foreground">No disponible para agendar</div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary font-medium uppercase leading-tight">
                      -
                    </td>
                    {canManage ? <td className="px-3 py-3 align-middle" /> : null}
                  </tr>
                );
              }

              if (isEmptyRow(row)) {
                return (
                  <tr key={`empty-${row.horaAgenda}-${index}`} className="border-b border-border align-middle bg-card">
                    <td className="px-3 py-3 text-center align-middle text-primary font-bold leading-none text-foreground">
                      <div className="flex items-center justify-center">{row.horaAgenda}</div>
                    </td>
                    <td className="bg-secondary px-3 py-3 text-center align-middle text-primary font-bold leading-none text-foreground">
                      <div className="min-h-[20px]" />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <div className="space-y-0.5">
                        <div className="min-h-[14px] border-b border-dotted border-border pb-0.5" />
                        <div className="min-h-[14px]" />
                        <div className="min-h-[14px]" />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary uppercase leading-tight text-foreground">
                      <div className="min-h-[20px]" />
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary font-semibold leading-none text-foreground">
                      <div className="min-h-[20px]" />
                    </td>
                    <td className="px-3 py-3 align-middle text-primary leading-tight text-muted-foreground">
                      <div className="min-w-[160px] min-h-[20px]" />
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-primary leading-tight text-muted-foreground">
                      <div className="min-h-[20px]" />
                    </td>
                    {canManage ? <td className="px-3 py-3 align-middle" /> : null}
                  </tr>
                );
              }

              const item = row;
              const datos = formatDatos(item);
              const entregada = isEntregada(item);
              const reserva = isReserva(item);
              const equipadoPending = toggleEquipadoPendingId === item._id;
              const togglePending = togglePendingId === item._id;

              return (
                <tr
                  key={item._id}
                  className={`border-b border-border align-middle ${
                    reserva || entregada ? "bg-secondary" : "bg-card"
                  }`}
                >
                  <td
                    className={`px-3 py-3 text-center align-middle text-primary font-bold leading-none text-foreground ${
                    reserva || entregada ? "bg-secondary" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-center">{item.horaAgenda}</div>
                  </td>
                  <td
                    className={`px-3 py-3 text-center align-middle text-primary font-bold leading-none text-foreground ${
                    reserva || entregada ? "bg-secondary" : "bg-muted"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div>{reserva ? "RESERVA" : item.interno}</div>
                      {reserva ? (
                        <div className="text-primary font-semibold uppercase tracking-wide text-secondary-foreground">
                          Lugar reservado
                        </div>
                      ) : (
                        <>
                          {canToggleEquipado ? (
                            <label className="inline-flex items-center gap-1 text-primary font-semibold uppercase tracking-wide text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={item.equipado}
                                disabled={equipadoPending || entregada}
                                onChange={(event) => onToggleEquipado(item, event.target.checked)}
                                className="h-4 w-4 rounded border-input text-foreground focus:ring-ring disabled:opacity-50"
                              />
                              <span>Equipado</span>
                            </label>
                          ) : item.equipado ? (
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
                        </>
                      )}
                      </div>
                    </td>
                  <td className="px-4 py-3 text-foreground">
                    {reserva ? (
                      <div className="space-y-1">
                        <div className="border-b border-dotted border-border pb-0.5 text-primary font-bold uppercase leading-tight text-secondary-foreground">
                          Reserva
                        </div>
                        <div className="text-primary font-medium leading-tight text-secondary-foreground">
                          {item.observaciones?.trim() || "-"}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="border-b border-dotted border-border pb-0.5 text-primary font-medium uppercase leading-tight">
                          {datos.cliente}
                        </div>
                        <div className="text-primary font-semibold uppercase leading-tight text-muted-foreground">
                          {datos.versionModelo}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-primary font-bold uppercase leading-tight">
                          <span>{datos.identificador}</span>
                          <span>/</span>
                          <span className="text-muted-foreground">COLOR:</span>
                          <span
                            className={`inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-primary font-bold leading-none ${
                              datos.colorClass ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {datos.color}
                          </span>
                        </div>
                        {item.siacSyncError ? (
                          <div className="inline-flex items-center gap-1 pt-0.5 text-primary font-semibold uppercase text-secondary-foreground">
                            <AlertTriangle size={10} />
                            {item.siacSyncMessage || "Sin SIAC"}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center align-middle text-primary uppercase leading-tight text-foreground">
                    <div className="flex items-center justify-center">
                      {reserva ? "-" : (item.siac?.vendedor || "-")}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center align-middle text-primary font-semibold leading-none text-foreground">
                    <div className="flex items-center justify-center">
                      {reserva ? "-" : formatOperacion(item)}
                    </div>
                  </td>
                  <td className="px-3 py-3 align-middle text-primary leading-tight text-muted-foreground">
                    <div className="line-clamp-3 min-w-[160px]">
                      {reserva ? "-" : item.observaciones?.trim() || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center align-middle text-primary leading-tight text-muted-foreground">
                    {entregada ? (
                      <div className="flex min-w-[170px] flex-col items-center justify-center gap-1">
                        {canToggleEntregadaPor ? (
                          <label className="inline-flex items-center gap-2 font-semibold text-foreground">
                            <input
                              type="checkbox"
                              checked={item.entregadaPorMarcada}
                              disabled={togglePending}
                              onChange={(event) => onToggleEntregadaPor(item, event.target.checked)}
                              className="h-4 w-4 rounded border-input text-foreground focus:ring-ring disabled:opacity-50"
                            />
                            <span>Entregada por</span>
                          </label>
                        ) : (
                          <span className="font-semibold uppercase tracking-wide text-muted-foreground">Entregada por</span>
                        )}
                        <div className="text-center font-medium text-muted-foreground">
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
                        <div className="text-center text-primary font-semibold uppercase tracking-wide text-secondary-foreground">
                          Entregado
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap text-primary">
                          {reserva ? (
                            <>
                              <ActionButton
                                onClick={() => onConvertReservation(item)}
                              >
                                <CalendarPlus size={13} />
                                Agendar turno
                              </ActionButton>
                              <EditActionButton
                                onClick={() => onEdit(item)}
                              >
                                <Pencil size={13} />
                                Editar
                              </EditActionButton>
                              <DeleteActionButton
                                onClick={() => onDelete(item)}
                              >
                                <Trash2 size={13} />
                                Eliminar
                              </DeleteActionButton>
                            </>
                          ) : (
                            <>
                              <EditActionButton
                                onClick={() => onEdit(item)}
                              >
                                <Pencil size={13} />
                                Editar
                              </EditActionButton>
                              <DeleteActionButton
                                onClick={() => onDelete(item)}
                              >
                                <Trash2 size={13} />
                                Eliminar
                              </DeleteActionButton>
                            </>
                          )}
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
