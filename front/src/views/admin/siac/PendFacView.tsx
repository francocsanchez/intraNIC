import { exportPendFac, getPendFac } from "@/api/dms/pendFacAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import type { PendFacUnit } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";

type PendFacDetail = {
  modelo: string;
  version: string;
  ubicacion: string;
  units: PendFacUnit[];
};

const MODEL_COLUMN_WIDTH = 144;
const VERSION_COLUMN_WIDTH = 320;

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function PendFacDetailModal({
  open,
  detail,
  onClose,
}: {
  open: boolean;
  detail: PendFacDetail | null;
  onClose: () => void;
}) {
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
          <div className="fixed inset-0 bg-secondary/40" />
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
              <Dialog.Panel className="w-full max-w-7xl overflow-hidden rounded-lg border border-border bg-card shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Detalle Pend Fac</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {detail?.modelo ?? "-"} | {detail?.version ?? "-"}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-muted-foreground">Ubicacion: {detail?.ubicacion ?? "-"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-x-auto p-5">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Interno</th>
                        <th className="px-4 py-3 text-left">Nro. fab</th>
                        <th className="px-4 py-3 text-left">Dias asignado</th>
                        <th className="px-4 py-3 text-left">Version</th>
                        <th className="px-4 py-3 text-left">Modelo</th>
                        <th className="px-4 py-3 text-left">Chasis</th>
                        <th className="px-4 py-3 text-left">Color</th>
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Vendedor</th>
                        <th className="px-4 py-3 text-left">Ubicacion</th>
                        <th className="px-4 py-3 text-left">Opera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(detail?.units ?? []).map((unit) => (
                        <tr key={`${unit.interno}-${unit.nrofab}-${unit.opera}`} className="hover:bg-muted">
                          <td className="px-4 py-3 text-foreground">{unit.interno}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.nrofab}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.diasAsignado}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.version}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.modelo}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.chasis}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className={`inline-block rounded-md border border-border px-2 py-1 text-xs font-medium ${textToColor(unit.color)}`}>
                              {unit.color}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.cliente}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.vendedor}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.ubicacion}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.opera}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function PendFacView() {
  const [detail, setDetail] = useState<PendFacDetail | null>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pend-fac"],
    queryFn: getPendFac,
  });
  const exportMutation = useMutation({
    mutationFn: exportPendFac,
    onSuccess: (blob) => {
      const today = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `pend-fac-detalle-${today}.xlsx`);
      toast.success("Excel exportado correctamente");
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message);
    },
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar Pend Fac</h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const locations = data?.data.locations ?? [];
  const groups = data?.data.groups ?? [];
  const totals = data?.data.totals;
  const totalUnidades = data?.data.meta.totalUnidades ?? 0;

  const openDetail = (payload: PendFacDetail) => {
    if (!payload.units.length) {
      return;
    }

    setDetail(payload);
  };

  return (
    <div className="w-full max-w-none space-y-6 px-3 py-6">
      <section className="rounded-lg border border-border bg-secondary p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gestion</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Pend Fac</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Matriz de operaciones pendientes de factura agrupadas por modelo, version y ubicacion.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              type="button"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={16} />
              {exportMutation.isPending ? "Exportando..." : "Exportar detalle a Excel"}
            </button>

            <article className="rounded-[1.4rem] border border-border bg-card px-6 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Unidades</p>
              <p className="mt-2 text-primary font-semibold leading-none tracking-tight text-primary">{totalUnidades}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-border bg-card px-6 py-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {locations.map((location) => (
            <article key={location.key} className="rounded-lg border border-border bg-muted px-4 py-3">
              <p className="text-primary font-semibold uppercase tracking-[0.16em] text-primary">{location.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                {totals?.countsByLocation[location.key] ?? 0}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Pend Fac / ubicaciones</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-primary">
            <colgroup>
              <col style={{ width: `${MODEL_COLUMN_WIDTH}px` }} />
              <col style={{ width: `${VERSION_COLUMN_WIDTH}px` }} />
              {locations.map((location) => (
                <col key={`col-${location.key}`} style={{ width: "8rem" }} />
              ))}
              <col style={{ width: "6rem" }} />
            </colgroup>
            <thead className="bg-muted text-primary uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th
                  className="sticky left-0 z-20 bg-muted px-1 py-0.5 text-left"
                  style={{ width: MODEL_COLUMN_WIDTH }}
                >
                  Modelo
                </th>
                <th
                  className="sticky z-20 bg-muted px-1 py-0.5 text-left"
                  style={{ left: MODEL_COLUMN_WIDTH, width: VERSION_COLUMN_WIDTH }}
                >
                  Version
                </th>
                {locations.map((location) => (
                  <th key={location.key} className="px-1 py-0.5 text-center">
                    {location.label}
                  </th>
                ))}
                <th className="px-1 py-0.5 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((group) =>
                group.rows.map((row, rowIndex) => (
                  <tr key={`${group.modelo}-${row.versionKey}`} className="hover:bg-muted">
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="sticky left-0 z-10 border-r border-t-4 border-t-foreground border-border bg-card px-1 py-0.5 align-middle font-bold text-foreground"
                        style={{ width: MODEL_COLUMN_WIDTH }}
                      >
                        {group.modelo}
                      </td>
                    ) : null}
                    <td
                      className={[
                        "sticky z-10 border-r border-border bg-card px-1 py-0.5 text-muted-foreground",
                        rowIndex === 0 ? "border-t-4 border-t-foreground" : "",
                      ].join(" ")}
                      style={{ left: MODEL_COLUMN_WIDTH, width: VERSION_COLUMN_WIDTH }}
                    >
                      {row.version}
                    </td>
                    {locations.map((location) => {
                      const value = row.countsByLocation[location.key] ?? 0;
                      const units = row.unitsByLocation[location.key] ?? [];

                      return (
                        <td
                          key={`${group.modelo}-${row.versionKey}-${location.key}`}
                          className={[
                            "px-1 py-0.5 text-center text-muted-foreground",
                            rowIndex === 0 ? "border-t-4 border-t-foreground" : "",
                          ].join(" ")}
                        >
                          {value > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                openDetail({
                                  modelo: group.modelo,
                                  version: row.version,
                                  ubicacion: location.label,
                                  units,
                                })
                              }
                              className="min-w-[2.25rem] rounded-lg bg-secondary px-2 py-1 font-semibold text-primary transition hover:bg-secondary"
                            >
                              {value}
                            </button>
                          ) : (
                            0
                          )}
                        </td>
                      );
                    })}
                    <td
                      className={[
                        "px-1 py-0.5 text-center font-semibold text-foreground",
                        rowIndex === 0 ? "border-t-4 border-t-foreground" : "",
                      ].join(" ")}
                    >
                      {row.total > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            openDetail({
                              modelo: group.modelo,
                              version: row.version,
                              ubicacion: "Total",
                              units: row.unitsTotal,
                            })
                          }
                          className="min-w-[2.5rem] rounded-lg bg-muted px-2 py-1 transition hover:bg-muted"
                        >
                          {row.total}
                        </button>
                      ) : (
                        0
                      )}
                    </td>
                  </tr>
                )),
              )}
              {totals ? (
                <tr className="bg-muted font-semibold text-foreground">
                  <td className="sticky left-0 z-10 border-r border-border bg-muted px-1 py-1">{totals.modelo}</td>
                  <td className="sticky z-10 border-r border-border bg-muted px-1 py-1" style={{ left: MODEL_COLUMN_WIDTH }}>
                    Total general
                  </td>
                  {locations.map((location) => (
                    <td key={`total-${location.key}`} className="px-1 py-1 text-center">
                      {totals.countsByLocation[location.key] ?? 0}
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center">{totals.total}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <PendFacDetailModal open={Boolean(detail)} detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
