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
      <Dialog as="div" className="relative z-50 font-preset" onClose={onClose}>
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
          <div className="flex min-h-full items-center justify-center p-2">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="flex items-center justify-between border-b border-border px-3 py-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Comercial
                    </p>
                    <Dialog.Title className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      Detalle de minuta
                    </Dialog.Title>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-border bg-background p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>
                {item ? (
                  <div className="space-y-3 px-3 py-3">
                    <section className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <article className="border-l-2 border-border px-3 py-1">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Fecha
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {item.fechaLabel}
                        </p>
                      </article>
                      <article className="border-l-2 border-border px-3 py-1">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Moderador
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {item.moderador.lastName}, {item.moderador.name}
                        </p>
                      </article>
                      <article className="border-l-2 border-border px-3 py-1">
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                          Participantes
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {item.participantesCount}
                        </p>
                      </article>
                    </section>
                    <section className="border-t border-border pt-3">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        Tema
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {item.tema}
                      </p>
                    </section>
                    <section className="border-t border-border pt-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Participantes
                      </h3>
                      <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-2">
                        {item.participantes.map((participant, index) => (
                          <div
                            key={participant._id}
                            className="border-b border-border px-2 py-1.5 text-sm text-muted-foreground"
                          >
                            {index + 1}. {participant.lastName},{" "}
                            {participant.name}
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="border-t border-border pt-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Temario y desarrollo
                      </h3>
                      <div className="mt-2 space-y-3">
                        {item.temario.map((topic) => (
                          <article
                            key={`${item._id}-${topic.orden}`}
                            className="border-b border-border pb-3"
                          >
                            <div className="text-sm font-semibold text-foreground">
                              {topic.orden}. {topic.nombre}
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                              {topic.desarrollo}
                            </p>
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
