import { getPendFac } from "@/api/dms/pendFacAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import type { PendFacUnit } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { X } from "lucide-react";

type PendFacDetail = {
  modelo: string;
  version: string;
  ubicacion: string;
  units: PendFacUnit[];
};

const MODEL_COLUMN_WIDTH = 144;
const VERSION_COLUMN_WIDTH = 320;

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
              <Dialog.Panel className="w-full max-w-7xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Detalle Pend Fac</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {detail?.modelo ?? "-"} | {detail?.version ?? "-"}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">Ubicacion: {detail?.ubicacion ?? "-"}</p>
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
                    <thead className="bg-gray-50 text-xs uppercase tracking-[0.16em] text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Interno</th>
                        <th className="px-4 py-3 text-left">Nro. fab</th>
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
                    <tbody className="divide-y divide-gray-100">
                      {(detail?.units ?? []).map((unit) => (
                        <tr key={`${unit.interno}-${unit.nrofab}-${unit.opera}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{unit.interno}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.nrofab}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.version}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.modelo}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.chasis}</td>
                          <td className="px-4 py-3 text-gray-700">
                            <span className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(unit.color)}`}>
                              {unit.color}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{unit.cliente}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.vendedor}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.ubicacion}</td>
                          <td className="px-4 py-3 text-gray-700">{unit.opera}</td>
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

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Pend Fac</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
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
      <section className="rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Gestion</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Pend Fac</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Matriz de operaciones pendientes de factura agrupadas por modelo, version y ubicacion.
            </p>
          </div>

          <article className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7197]">Unidades</p>
            <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-[#0f172a]">{totalUnidades}</p>
          </article>
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {locations.map((location) => (
            <article key={location.key} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5b7197]">{location.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#0f172a]">
                {totals?.countsByLocation[location.key] ?? 0}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Pend Fac / ubicaciones</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-[11px]">
            <colgroup>
              <col style={{ width: `${MODEL_COLUMN_WIDTH}px` }} />
              <col style={{ width: `${VERSION_COLUMN_WIDTH}px` }} />
              {locations.map((location) => (
                <col key={`col-${location.key}`} style={{ width: "8rem" }} />
              ))}
              <col style={{ width: "6rem" }} />
            </colgroup>
            <thead className="bg-gray-50 text-[10px] uppercase tracking-[0.16em] text-gray-500">
              <tr>
                <th
                  className="sticky left-0 z-20 bg-gray-50 px-1 py-0.5 text-left"
                  style={{ width: MODEL_COLUMN_WIDTH }}
                >
                  Modelo
                </th>
                <th
                  className="sticky z-20 bg-gray-50 px-1 py-0.5 text-left"
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
            <tbody className="divide-y divide-gray-100">
              {groups.map((group) =>
                group.rows.map((row, rowIndex) => (
                  <tr key={`${group.modelo}-${row.versionKey}`} className="hover:bg-gray-50">
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="sticky left-0 z-10 border-r border-t-4 border-t-gray-900 border-gray-100 bg-white px-1 py-0.5 align-middle font-bold text-gray-900"
                        style={{ width: MODEL_COLUMN_WIDTH }}
                      >
                        {group.modelo}
                      </td>
                    ) : null}
                    <td
                      className={[
                        "sticky z-10 border-r border-gray-100 bg-white px-1 py-0.5 text-gray-700",
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
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
                            "px-1 py-0.5 text-center text-gray-700",
                            rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
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
                              className="min-w-[2.25rem] rounded-lg bg-[#e4f3fa] px-2 py-1 font-semibold text-[#0f5f7a] transition hover:bg-[#d2eaf5]"
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
                        "px-1 py-0.5 text-center font-semibold text-gray-900",
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
                              ubicacion: "Total",
                              units: row.unitsTotal,
                            })
                          }
                          className="min-w-[2.5rem] rounded-lg bg-gray-100 px-2 py-1 transition hover:bg-gray-200"
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
                <tr className="bg-gray-50 font-semibold text-gray-900">
                  <td className="sticky left-0 z-10 border-r border-gray-200 bg-gray-50 px-1 py-1">{totals.modelo}</td>
                  <td className="sticky z-10 border-r border-gray-200 bg-gray-50 px-1 py-1" style={{ left: MODEL_COLUMN_WIDTH }}>
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
