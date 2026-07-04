import { getAnalisisStock, saveAnalisisStockPed } from "@/api/dms/analisisStockAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import { paths } from "@/routes/paths";
import type { AnalisisStockRow as AnalisisStockRowType } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { GitMerge, Printer, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type StockCellDetail = {
  modelo: string;
  version: string;
  monthLabel: string;
  units: AnalisisStockRowType["unitsTotal"];
};

const formatPromedioVenta = (value: number) => value.toFixed(1);
const formatMesesStock = (total: number, promedioVenta: number) =>
  promedioVenta > 0 ? (total / promedioVenta).toFixed(1) : "0.0";
const getMesesStockAlertClass = (value: number) =>
  value >= 2.5 ? "bg-red-100 text-red-700" : "text-gray-900";

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
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<StockCellDetail | null>(null);
  const [pedDrafts, setPedDrafts] = useState<Record<string, string>>({});
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["analisis-stock"],
    queryFn: getAnalisisStock,
  });

  const savePedMutation = useMutation({
    mutationFn: saveAnalisisStockPed,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["analisis-stock"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
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
  const isModalOpen = Boolean(detail);
  const pedByRowKey = groups.reduce<Record<string, number>>((acc, group) => {
    group.rows.forEach((row) => {
      acc[`${group.modelo}::${row.versionKey}`] = row.ped;
    });
    return acc;
  }, {});

  const openDetail = (payload: StockCellDetail) => {
    if (!payload.units.length) {
      return;
    }

    setDetail(payload);
  };

  const closeDetail = () => setDetail(null);
  const summaryLabel = detail?.units.length ? `${detail.units.length} unidades encontradas` : "";
  const getRowPedValue = (modelo: string, versionKey: string) => {
    const rowKey = `${modelo}::${versionKey}`;
    if (pedDrafts[rowKey] !== undefined) {
      const parsedDraft = Number(pedDrafts[rowKey]);
      return Number.isFinite(parsedDraft) && parsedDraft >= 0 ? parsedDraft : 0;
    }

    return pedByRowKey[rowKey] ?? 0;
  };

  const groupsWithPed = groups.map((group) => ({
    ...group,
    rows: group.rows.map((row) => {
      const ped = getRowPedValue(group.modelo, row.versionKey);
      return {
        ...row,
        ped,
        total: row.stockTotal + ped,
      };
    }),
  }));

  const totalsWithPed = totals
    ? {
        ...totals,
        ped: groupsWithPed.reduce(
          (groupTotal, group) => groupTotal + group.rows.reduce((rowTotal, row) => rowTotal + row.ped, 0),
          0,
        ),
        total: groupsWithPed.reduce(
          (groupTotal, group) => groupTotal + group.rows.reduce((rowTotal, row) => rowTotal + row.total, 0),
          0,
        ),
      }
    : null;

  const groupsWithTotals = groupsWithPed.map((group) => ({
    ...group,
    total: group.rows.reduce((acc, row) => acc + row.total, 0),
    promedioVenta: Number(group.rows.reduce((acc, row) => acc + row.promedioVenta, 0).toFixed(1)),
    mesesStock: Number(
      (
        (() => {
          const total = group.rows.reduce((acc, row) => acc + row.total, 0);
          const promedioVenta = group.rows.reduce((acc, row) => acc + row.promedioVenta, 0);
          return promedioVenta > 0 ? total / promedioVenta : 0;
        })()
      ).toFixed(1),
    ),
  }));
  const totalMesesStockNegocio = totalsWithPed
    ? Number((totalsWithPed.promedioVenta > 0 ? totalsWithPed.total / totalsWithPed.promedioVenta : 0).toFixed(1))
    : 0;

  return (
    <div className="w-full space-y-6 px-4 py-6 print:space-y-2 print:px-0 print:py-0">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 6mm;
          }

          html, body {
            background: #fff !important;
          }

          body * {
            visibility: hidden;
          }

          .analisis-stock-print,
          .analisis-stock-print * {
            visibility: visible;
          }

          .analisis-stock-print {
            position: absolute;
            inset: 0;
            width: 100%;
          }
        }
      `}</style>

      <section className="print:hidden rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Gestion</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Analisis de stock</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Matriz de unidades agrupadas por modelo y version, distribuidas por mes de recepcion calculado desde SIAC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <Link
              to={paths.convencional.analisisStockDiccionarioVersiones}
              className="inline-flex items-center gap-2 rounded-xl border border-[#15aa9a]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0f766e] transition hover:bg-[#f3fbfa]"
            >
              <GitMerge size={16} />
              Diccionario de versiones
            </Link>
          </div>
        </div>
      </section>

      <section className="print:hidden overflow-hidden rounded-[1.6rem] border border-gray-200 bg-white shadow-sm">
        <div className="px-6 pt-5 text-xs font-semibold uppercase tracking-[0.28em] text-[#5b7197]">
          Meses de stock
        </div>
        <div className="grid grid-cols-2 px-6 py-4 md:grid-cols-4 xl:grid-cols-8">
          {groupsWithTotals.map((group, index) => (
            <div
              key={group.modelo}
              className={[
                "min-w-0 px-3 py-1",
                index > 0 ? "border-l border-gray-200" : "",
              ].join(" ")}
            >
              <p className="truncate text-[11px] uppercase text-[#5b7197]">{group.modelo}</p>
              <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-[#0f172a]">
                {formatMesesStock(group.total, group.promedioVenta)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="print:hidden grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7197]">Unidades</p>
          <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-[#0f172a]">{totalUnidades}</p>
        </article>
        <article className="rounded-[1.4rem] border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5b7197]">M. stock negocio</p>
          <p className="mt-2 text-[2rem] font-semibold leading-none tracking-tight text-[#0f172a]">
            {formatPromedioVenta(totalMesesStockNegocio)}
          </p>
        </article>
      </section>

      <section className="analisis-stock-print overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="border-b border-gray-200 px-6 py-4 print:border-b print:px-0 print:py-1">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Analisis stock / meses</h2>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="min-w-[900px] text-xs print:min-w-0 print:w-full print:table-fixed print:text-[9px]">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500 print:text-[8px] print:tracking-[0.1em]">
              <tr>
                <th className="sticky left-0 z-20 min-w-[180px] bg-gray-50 px-2 py-1 text-left print:static print:min-w-0 print:w-[8%] print:px-1 print:py-1">Modelo</th>
                <th className="sticky left-[180px] z-20 min-w-[320px] bg-gray-50 px-2 py-1 text-left print:static print:min-w-0 print:w-[24%] print:px-1 print:py-1">Version</th>
                {months.map((month) => (
                  <th key={month.key} className="px-2 py-1 text-center print:px-1 print:py-1">
                    {month.label}
                  </th>
                ))}
                <th className="bg-gray-100 px-2 py-1 text-center print:px-1 print:py-1">PED</th>
                <th className="px-2 py-1 text-center print:px-1 print:py-1">Total</th>
                <th className="px-2 py-1 text-center print:px-1 print:py-1">P. VTA</th>
                <th className="px-2 py-1 text-center print:px-1 print:py-1">M. STOCK</th>
                <th className="px-2 py-1 text-center print:px-1 print:py-1">Total modelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groupsWithTotals.map((group) =>
                group.rows.map((row, rowIndex) => (
                  <tr key={`${group.modelo}-${row.version}`} className="hover:bg-gray-50">
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="sticky left-0 z-10 min-w-[180px] border-r border-t-4 border-t-gray-900 border-gray-100 bg-white px-2 py-1 align-middle font-bold text-gray-900 print:static print:min-w-0 print:px-1 print:py-1"
                      >
                        {group.modelo}
                      </td>
                    ) : null}
                    <td
                      className={[
                        "sticky left-[180px] z-10 min-w-[320px] border-r border-gray-100 bg-white px-2 py-1 text-gray-700 print:static print:min-w-0 print:px-1 print:py-1",
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                      ].join(" ")}
                    >
                      {row.version}
                    </td>
                    {months.map((month) => (
                      <td
                        key={`${group.modelo}-${row.version}-${month.key}`}
                        className={[
                          "px-2 py-1 text-center text-gray-700 print:px-1 print:py-1",
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
                            <>
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
                                className="inline-flex min-w-[1.8rem] items-center justify-center rounded-md bg-[#e4f3fa] px-1 py-0.5 font-semibold text-[#0f766e] transition hover:bg-[#cbe7e2] print:hidden"
                              >
                                {value}
                              </button>
                              <span className="hidden print:inline">{value}</span>
                            </>
                          );
                        })()}
                      </td>
                    ))}
                    <td
                      className={[
                        "bg-gray-50 px-2 py-1 text-center text-gray-700 print:px-1 print:py-1",
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                      ].join(" ")}
                    >
                      <div className="flex min-w-[112px] items-center justify-center gap-1 print:hidden">
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={pedDrafts[`${group.modelo}::${row.versionKey}`] ?? String(row.ped)}
                          onChange={(event) =>
                            setPedDrafts((current) => ({
                              ...current,
                              [`${group.modelo}::${row.versionKey}`]: event.target.value,
                            }))
                          }
                          className="w-12 rounded-md border border-gray-300 px-1 py-0.5 text-center text-xs outline-none transition-colors focus:border-[#15aa9a]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            savePedMutation.mutate({
                              modelo: group.modelo,
                              version: row.version,
                              cantidad: getRowPedValue(group.modelo, row.versionKey),
                            })
                          }
                          disabled={savePedMutation.isPending}
                          className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Guardar
                        </button>
                      </div>
                      <span className="hidden print:inline">{row.ped}</span>
                    </td>
                    <td
                      className={[
                        "px-2 py-1 text-center font-semibold text-gray-900 print:px-1 print:py-1",
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                      ].join(" ")}
                    >
                      {row.total}
                    </td>
                    <td
                      className={[
                        "px-2 py-1 text-center font-semibold text-gray-900 print:px-1 print:py-1",
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                      ].join(" ")}
                    >
                      {formatPromedioVenta(row.promedioVenta)}
                    </td>
                    <td
                      className={[
                        "px-2 py-1 text-center font-semibold print:px-1 print:py-1",
                        getMesesStockAlertClass(row.total / (row.promedioVenta > 0 ? row.promedioVenta : Number.POSITIVE_INFINITY)),
                        rowIndex === 0 ? "border-t-4 border-t-gray-900" : "",
                      ].join(" ")}
                    >
                      {formatMesesStock(row.total, row.promedioVenta)}
                    </td>
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="border-t-4 border-t-gray-900 px-2 py-1 text-center align-middle font-bold text-gray-900 print:px-1 print:py-1"
                      >
                        {group.total}
                      </td>
                    ) : null}
                  </tr>
                )),
              )}

              {!groups.length ? (
                <tr>
                  <td colSpan={months.length + 7} className="px-6 py-12 text-center text-sm text-gray-500 print:px-1 print:py-2">
                    No hay unidades para analizar en este momento.
                  </td>
                </tr>
              ) : null}

              {groups.length && totalsWithPed ? (
                <tr className="bg-gray-100">
                  <td className="sticky left-0 z-10 min-w-[180px] border-r border-gray-200 bg-gray-100 px-2 py-1 font-bold text-gray-900 print:static print:min-w-0 print:px-1 print:py-1">
                    {totalsWithPed.modelo}
                  </td>
                  <td className="sticky left-[180px] z-10 min-w-[320px] border-r border-gray-200 bg-gray-100 px-2 py-1 font-bold text-gray-900 print:static print:min-w-0 print:px-1 print:py-1">
                    Total general
                  </td>
                  {months.map((month) => (
                    <td key={`total-${month.key}`} className="px-2 py-1 text-center font-bold text-gray-900 print:px-1 print:py-1">
                      {totalsWithPed.countsByMonth[month.key] ?? 0}
                    </td>
                  ))}
                  <td className="bg-gray-200 px-2 py-1 text-center font-bold text-gray-900 print:px-1 print:py-1">{totalsWithPed.ped}</td>
                  <td className="px-2 py-1 text-center font-bold text-gray-900 print:px-1 print:py-1">{totalsWithPed.total}</td>
                  <td className="px-2 py-1 text-center font-bold text-gray-900 print:px-1 print:py-1">
                    {formatPromedioVenta(totalsWithPed.promedioVenta)}
                  </td>
                  <td
                    className={[
                      "px-2 py-1 text-center font-bold print:px-1 print:py-1",
                      getMesesStockAlertClass(
                        totalsWithPed.total /
                          (totalsWithPed.promedioVenta > 0 ? totalsWithPed.promedioVenta : Number.POSITIVE_INFINITY),
                      ),
                    ].join(" ")}
                  >
                    {formatMesesStock(totalsWithPed.total, totalsWithPed.promedioVenta)}
                  </td>
                  <td className="px-2 py-1 text-center font-bold text-gray-900 print:px-1 print:py-1">{totalsWithPed.total}</td>
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
