import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import { Dialog, Transition } from "@headlessui/react";
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
      <div className="w-full px-4 py-6">
        <div className="mx-auto max-w-7xl rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-700">Error al cargar tus reservas</h1>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Ocurrio un error al obtener la informacion."}</p>
        </div>
      </div>
    );
  }

  const reservas = data?.data ?? [];
  const resumen = data?.resumen;
  const porModelo = resumen?.porModelo ?? {};

  return (
    <div className="w-full px-4 py-6">
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Mis reservas</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">{heading}</h1>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-gray-900">{resumen?.total ?? 0}</p>
            <p className="mt-2 text-sm text-gray-500">Cantidad total de reservas activas del usuario.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Por modelo</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-900">Distribucion de reservas</h2>
              </div>
            </div>

            {Object.keys(porModelo).length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                No hay datos agrupados por modelo para mostrar.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(porModelo).map(([modelo, cantidad]) => (
                  <div key={modelo} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                    <p className="text-sm font-medium text-gray-900">{modelo}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{cantidad}</p>
                    <p className="mt-1 text-xs text-gray-500">{cantidad === 1 ? "unidad reservada" : "unidades reservadas"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Detalle</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-900">Tabla de reservas</h2>
          </div>

          {reservas.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-500">No tenes reservas para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    <th className="px-4 py-3">Interno</th>
                    <th className="px-4 py-3">Modelo</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Ubicacion</th>
                    <th className="px-4 py-3">Chasis</th>
                    <th className="px-4 py-3">Sucursal</th>
                    <th className="px-4 py-3">Fecha reserva</th>
                    <th className="px-4 py-3">Fecha recepcion</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-center">Dias</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {reservas.map((reserva) => (
                    <tr key={`${reserva.interno}-${reserva.fechaReserva}`} className="align-top text-sm text-gray-700">
                      <td className="px-4 py-4 font-medium text-gray-900">{reserva.interno}</td>
                      <td className="px-4 py-4">{reserva.modelo}</td>
                      <td className="min-w-[260px] px-4 py-4">{reserva.version}</td>
                      <td className="px-4 py-4">
                        <div className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(reserva.color)} `}>
                          {reserva.color}
                        </div>
                      </td>
                      <td className="px-4 py-4">{reserva.ubicacion ?? "EN PRODUCCION"}</td>
                      <td className="px-4 py-4">{reserva.chasis}</td>
                      <td className="px-4 py-4">{reserva.sucursal}</td>
                      <td className="px-4 py-4">{reserva.fechaReserva}</td>
                      <td className="px-4 py-4">{reserva.fechaRecepcion}</td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setReservaSeleccionada(reserva)}
                          className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
                        >
                          Ver
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">{getDiasReservada(reserva.fechaReserva)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Transition appear show={!!reservaSeleccionada} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setReservaSeleccionada(null)}>
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6">
              <Dialog.Title className="font-semibold">Cliente</Dialog.Title>
              <p className="mt-4">{reservaSeleccionada?.clienteReserva || "Sin cliente"}</p>
              <button onClick={() => setReservaSeleccionada(null)} className="mt-4 rounded bg-gray-900 px-4 py-2 text-white">
                Cerrar
              </button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
