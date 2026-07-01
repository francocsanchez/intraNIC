import type { Minuta } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { Fragment } from "react";

type MinutaDetailModalProps = {
  item: Minuta | null;
  onClose: () => void;
  open: boolean;
};

export default function MinutaDetailModal({
  item,
  onClose,
  open,
}: MinutaDetailModalProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
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
              <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      Detalle de minuta
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    <X size={18} />
                  </button>
                </div>

                {item ? (
                  <div className="space-y-6 p-6">
                    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <article className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Fecha</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">{item.fechaLabel}</p>
                      </article>
                      <article className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Moderador</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">
                          {item.moderador.lastName}, {item.moderador.name}
                        </p>
                      </article>
                      <article className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Participantes</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900">{item.participantesCount}</p>
                      </article>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Tema</p>
                      <p className="mt-2 text-base font-semibold text-gray-900">{item.tema}</p>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5">
                      <h3 className="text-sm font-semibold text-gray-900">Participantes</h3>
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {item.participantes.map((participant, index) => (
                          <div key={participant._id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            {index + 1}. {participant.lastName}, {participant.name}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-5">
                      <h3 className="text-sm font-semibold text-gray-900">Temario y desarrollo</h3>
                      <div className="mt-4 space-y-4">
                        {item.temario.map((topic) => (
                          <article key={`${item._id}-${topic.orden}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {topic.orden}. {topic.nombre}
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{topic.desarrollo}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
