import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import { formatDateAr } from "@/helpers/proformas";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { Fragment, useState } from "react";
import type { MisReservasResponse } from "@/types/index";

type MisReservasViewContentProps = {
  data?: MisReservasResponse;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  heading?: string;
};

const getDiasReservada = (fecha: string) => {
  const start = new Date(fecha).getTime();
  const now = Date.now();
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatReservaDate = (value?: string | null) => {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return formatDateAr(value);
};

export default function MisReservasViewContent({
  data,
  isLoading,
  isError,
  error,
  heading = "Resumen de reservas",
}: MisReservasViewContentProps) {
  const [reservaSeleccionada, setReservaSeleccionada] = useState<MisReservasResponse["data"][number] | null>(null);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar tus reservas</h1>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Ocurrio un error al obtener la informacion."}</p>
        </div>
      </div>
    );
  }

  const reservas = data?.data ?? [];

  return (
    <div className="font-preset w-full bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mis reservas</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{heading}</h1>
          </div>

          {reservas.length === 0 ? (
            <div className="px-3 py-8 text-sm text-muted-foreground">No tenes reservas para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-3 py-2">Interno</th>
                    <th className="px-3 py-2">Modelo</th>
                    <th className="px-3 py-2">Version</th>
                    <th className="px-3 py-2">Color</th>
                    <th className="px-3 py-2">Ubicacion</th>
                    <th className="px-3 py-2">Chasis</th>
                   
                    <th className="px-3 py-2">Fecha reserva</th>
                    <th className="px-3 py-2">Fecha recepcion</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2 text-center">Dias</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {reservas.map((reserva) => (
                    <tr key={`${reserva.interno}-${reserva.fechaReserva}`} className="align-top text-muted-foreground hover:bg-muted">
                      <td className="px-3 py-1.5 font-medium text-foreground">{reserva.interno}</td>
                      <td className="px-3 py-1.5">{reserva.modelo}</td>
                      <td className="min-w-[260px] px-3 py-1.5">{reserva.version}</td>
                      <td className="px-3 py-1.5">
                        <div className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(reserva.color)}`}>
                          {reserva.color}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">{reserva.ubicacion ?? "EN PRODUCCION"}</td>
                      <td className="px-3 py-1.5">{reserva.chasis}</td>
                     
                      <td className="whitespace-nowrap px-3 py-1.5 font-medium text-foreground">{formatReservaDate(reserva.fechaReserva)}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 font-medium text-foreground">{formatReservaDate(reserva.fechaRecepcion)}</td>
                      <td className="px-3 py-1.5">
                        <button
                          type="button"
                          onClick={() => setReservaSeleccionada(reserva)}
                          className="inline-flex items-center rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          Ver
                        </button>
                      </td>
                      <td className="px-3 py-1.5 text-center">{getDiasReservada(reserva.fechaReserva)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>

      <Transition appear show={!!reservaSeleccionada} as={Fragment}>
        <Dialog as="div" className="font-preset relative z-50" onClose={() => setReservaSeleccionada(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-foreground/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
                  <div className="flex items-center justify-between border-b border-border px-3 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mis reservas</p>
                      <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                        Cliente de la reserva
                      </Dialog.Title>
                    </div>

                    <button
                      type="button"
                      onClick={() => setReservaSeleccionada(null)}
                      className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-3">
                    <div className="rounded-md border border-border bg-muted px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nombre</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{reservaSeleccionada?.clienteReserva || "Sin cliente"}</p>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-border bg-muted px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setReservaSeleccionada(null)}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Cerrar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
