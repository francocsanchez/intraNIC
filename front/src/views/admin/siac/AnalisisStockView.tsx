import { getAnalisisStock } from "@/api/dms/analisisStockAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import type { AnalisisStockRow as AnalisisStockRowType } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { X } from "lucide-react";

type StockCellDetail = {
  modelo: string;
  version: string;
  monthLabel: string;
  units: AnalisisStockRowType["unitsTotal"];
};

function AnalisisStockDetailModal({
  open,
  onClose,
  detail,
}: {
  open: boolean;
  onClose: () => void;
  detail: StockCellDetail | null;
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
              <Dialog.Panel className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Detalle de stock</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {detail?.modelo ?? "-"} | {detail?.version ?? "-"}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">Periodo: {detail?.monthLabel ?? "-"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-x-auto p-5">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Interno</th>
                        <th className="px-4 py-3 text-left">Nro. fab</th>
                        <th className="px-4 py-3 text-left">Color</th>
                        <th className="px-4 py-3 text-left">Fecha recepcion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detail?.units ?? []).map((unit) => (
                        <tr key={`${unit.interno}-${unit.nrofab}-${unit.fechaRecepcion}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{unit.interno}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.nrofab}</td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(unit.color)}`}>
                              {unit.color}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{unit.fechaRecepcion}</td>
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

export default function AnalisisStockView() {
  const [detail, setDetail] = useState<StockCellDetail | null>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["analisis-stock"],
    queryFn: getAnalisisStock,
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Analisis de stock</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const months = data?.data.months ?? [];
  const groups = data?.data.groups ?? [];
  const totals = data?.data.totals;
  const totalUnidades = data?.data.meta.totalUnidades ?? 0;
  const totalRows = groups.reduce((acc, group) => acc + group.rows.length, 0);
  const isModalOpen = Boolean(detail);

  const openDetail = (payload: StockCellDetail) => {
    if (!payload.units.length) {
      return;
    }

    setDetail(payload);
  };

  const closeDetail = () => setDetail(null);
  const summaryLabel = detail?.units.length ? `${detail.units.length} unidades encontradas` : "";

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Gestion</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Analisis de stock</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Matriz de unidades agrupadas por modelo y version, distribuidas por mes de recepcion calculado desde SIAC.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelos</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{groups.length}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Versiones</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{totalRows}</p>
        </article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Unidades</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{totalUnidades}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Analisis stock / meses</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="sticky left-0 z-20 min-w-[180px] bg-gray-50 px-4 py-3 text-left">Modelo</th>
                <th className="sticky left-[180px] z-20 min-w-[320px] bg-gray-50 px-4 py-3 text-left">Version</th>
                {months.map((month) => (
                  <th key={month.key} className="px-4 py-3 text-center">
                    {month.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Total modelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((group) =>
                group.rows.map((row, rowIndex) => (
                  <tr key={`${group.modelo}-${row.version}`} className="hover:bg-gray-50">
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="sticky left-0 z-10 min-w-[180px] border-r border-t-4 border-t-gray-900 border-gray-100 bg-white px-4 py-3 align-middle font-bold text-gray-900"
                      >
                        {group.modelo}
                      </td>
                    ) : null}
                    <td
                      className={[
                        "sticky left-[180px] z-10 min-w-[320px] border-r border-gray-100 bg-white px-4 py-3 text-gray-700",
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                      ].join(" ")}
                    >
                      {row.version}
                    </td>
                    {months.map((month) => (
                      <td
                        key={`${group.modelo}-${row.version}-${month.key}`}
                        className={[
                          "px-4 py-3 text-center text-gray-700",
                          rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                        ].join(" ")}
                      >
                        {(() => {
                          const value = row.countsByMonth[month.key] ?? 0;
                          const units = row.unitsByMonth[month.key] ?? [];

                          if (value <= 0) {
                            return 0;
                          }

                          return (
                            <button
                              type="button"
                              onClick={() =>
                                openDetail({
                                  modelo: group.modelo,
                                  version: row.version,
                                  monthLabel: month.label,
                                  units,
                                })
                              }
                              className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-[#e4f3fa] px-2 py-1 font-semibold text-[#0f766e] transition hover:bg-[#cbe7e2]"
                            >
                              {value}
                            </button>
                          );
                        })()}
                      </td>
                    ))}
                    <td
                      className={[
                        "px-4 py-3 text-center font-semibold text-gray-900",
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                      ].join(" ")}
                    >
                      {row.total > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            openDetail({
                              modelo: group.modelo,
                              version: row.version,
                              monthLabel: "TOTAL",
                              units: row.unitsTotal,
                            })
                          }
                          className="inline-flex min-w-[2.5rem] items-center justify-center rounded-lg bg-gray-900 px-2 py-1 text-white transition hover:bg-gray-700"
                        >
                          {row.total}
                        </button>
                      ) : (
                        0
                      )}
                    </td>
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="border-t-4 border-t-gray-900 px-4 py-3 text-center align-middle font-bold text-gray-900"
                      >
                        {group.total}
                      </td>
                    ) : null}
                  </tr>
                )),
              )}

              {!groups.length ? (
                <tr>
                  <td colSpan={months.length + 4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay unidades para analizar en este momento.
                  </td>
                </tr>
              ) : null}

              {groups.length && totals ? (
                <tr className="bg-gray-100">
                  <td className="sticky left-0 z-10 min-w-[180px] border-r border-gray-200 bg-gray-100 px-4 py-3 font-bold text-gray-900">
                    {totals.modelo}
                  </td>
                  <td className="sticky left-[180px] z-10 min-w-[320px] border-r border-gray-200 bg-gray-100 px-4 py-3 font-bold text-gray-900">
                    Total general
                  </td>
                  {months.map((month) => (
                    <td key={`total-${month.key}`} className="px-4 py-3 text-center font-bold text-gray-900">
                      {totals.countsByMonth[month.key] ?? 0}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{totals.total}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{totals.total}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <AnalisisStockDetailModal open={isModalOpen} onClose={closeDetail} detail={detail} />
      {summaryLabel ? <span className="sr-only">{summaryLabel}</span> : null}
    </div>
  );
}
