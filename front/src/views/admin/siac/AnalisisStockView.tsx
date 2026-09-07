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
  value >= 2.5 ? "bg-destructive/10 text-destructive" : "text-foreground";
const formatTableCount = (value: number | null | undefined) => (value ? String(value) : "");
const MODEL_COLUMN_WIDTH = 144;
const VERSION_COLUMN_WIDTH = 320;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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
          <div className="fixed inset-0 bg-foreground/20" />
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
              <Dialog.Panel className="w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Detalle de stock</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {detail?.modelo ?? "-"} | {detail?.version ?? "-"}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-muted-foreground">Periodo: {detail?.monthLabel ?? "-"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="overflow-x-auto p-3">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left">Interno</th>
                        <th className="px-4 py-3 text-left">Nro. fab</th>
                        <th className="px-4 py-3 text-left">Color</th>
                        <th className="px-4 py-3 text-left">Fecha recepcion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(detail?.units ?? []).map((unit) => (
                        <tr key={`${unit.interno}-${unit.nrofab}-${unit.fechaRecepcion}`} className="hover:bg-muted">
                          <td className="px-4 py-3 text-foreground">{unit.interno}</td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.nrofab}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className={`inline-block rounded-md border border-border px-2 py-1 text-xs font-medium ${textToColor(unit.color)}`}>
                              {unit.color}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{unit.fechaRecepcion}</td>
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
      <div className="font-preset w-full bg-muted px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar Analisis de stock</h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
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
  const handlePrint = () => {
    if (!totalsWithPed) {
      toast.error("No se pudo preparar la impresion");
      return;
    }

    const monthColumns = months
      .map((month) => `<th class="month">${escapeHtml(month.label)}</th>`)
          .join("");

    const groupRows = groupsWithTotals
      .map((group) =>
        group.rows
          .map((row, rowIndex) => {
            const countsCells = months
              .map((month) => `<td class="number">${formatTableCount(row.countsByMonth[month.key])}</td>`)
              .join("");
            const mesesStock = row.promedioVenta > 0 ? row.total / row.promedioVenta : 0;
            const mesesStockClass = mesesStock >= 2.5 ? "number danger" : "number";

            return `
              <tr class="${rowIndex === 0 ? "group-start" : ""}">
                ${
                  rowIndex === 0
                    ? `<td class="model" rowspan="${group.rows.length}">${escapeHtml(group.modelo)}</td>`
                    : ""
                }
                <td class="version">${escapeHtml(row.version)}</td>
                ${countsCells}
                <td class="number ped">${row.ped}</td>
                <td class="number total">${row.total}</td>
                <td class="number total">${formatPromedioVenta(row.promedioVenta)}</td>
                <td class="${mesesStockClass}">${formatMesesStock(row.total, row.promedioVenta)}</td>
                ${
                  rowIndex === 0
                    ? `<td class="number model-total" rowspan="${group.rows.length}">${group.total}</td>`
                    : ""
                }
              </tr>
            `;
          })
          .join(""),
      )
      .join("");

    const totalsCounts = months
      .map((month) => `<td class="number total-row">${formatTableCount(totalsWithPed.countsByMonth[month.key])}</td>`)
      .join("");
    const totalMesesStock = totalsWithPed.promedioVenta > 0 ? totalsWithPed.total / totalsWithPed.promedioVenta : 0;
    const mesesStockCards = groupsWithTotals
      .map(
        (group) => `
          <div class="stock-card">
            <div class="stock-card-label">${escapeHtml(group.modelo)}</div>
            <div class="stock-card-value">${formatMesesStock(group.total, group.promedioVenta)}</div>
          </div>
        `,
      )
      .join("");
    const negocioCards = `
      <div class="stock-card stock-card-wide">
        <div class="stock-card-label">Unidades</div>
        <div class="stock-card-value">${totalUnidades}</div>
      </div>
      <div class="stock-card stock-card-wide">
        <div class="stock-card-label">M. stock negocio</div>
        <div class="stock-card-value">${formatPromedioVenta(totalMesesStockNegocio)}</div>
      </div>
    `;

    const html = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Analisis de stock</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 4mm;
            }

            * {
              box-sizing: border-box;
            }

            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: oklch(0.145 0 0);
              background: oklch(1 0 0);
            }

            body {
              padding: 0;
            }

            h1 {
              margin: 0 0 4px 0;
              font-size: 13px;
              font-weight: 700;
            }

            .stock-summary {
              display: grid;
              grid-template-columns: repeat(8, minmax(0, 1fr));
              border: 1px solid oklch(0.922 0 0);
              margin: 0 0 6px 0;
            }

            .stock-summary-secondary {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              border: 1px solid oklch(0.922 0 0);
              border-top: 0;
              margin: -6px 0 6px 0;
            }

            .stock-card {
              padding: 2px 4px;
              min-height: 34px;
            }

            .stock-card + .stock-card {
              border-left: 1px solid oklch(0.922 0 0);
            }

            .stock-card-wide {
              min-height: 30px;
            }

            .stock-card-label {
              font-size: 8px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: oklch(0.556 0 0);
              line-height: 1;
            }

            .stock-card-value {
              margin-top: 4px;
              font-size: 14px;
              font-weight: 700;
              line-height: 1;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              font-size: 10.5px;
              line-height: 1.04;
            }

            thead th {
              border-bottom: 1.5px solid oklch(0.145 0 0);
              color: oklch(0.556 0 0);
              font-size: 9px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              padding: 2px 2px;
              text-align: center;
            }

            th.model,
            td.model {
              width: 7%;
            }

            th.version,
            td.version {
              width: 24%;
            }

            th.month,
            td.month {
              width: 5.1%;
            }

            tbody td {
              border-bottom: 0.5px solid oklch(0.922 0 0);
              padding: 1px 2px;
              vertical-align: middle;
            }

            td.model {
              font-weight: 700;
              border-top: 2px solid oklch(0.145 0 0);
              white-space: normal;
              word-break: break-word;
            }

            td.version {
              white-space: normal;
              word-break: break-word;
            }

            td.number {
              text-align: center;
            }

            td.ped {
              background: oklch(0.97 0 0);
            }

            td.total,
            td.model-total,
            td.total-row {
              font-weight: 700;
            }

            td.model-total {
              border-top: 2px solid oklch(0.145 0 0);
            }

            tr.group-start td.version,
            tr.group-start td.number {
              border-top: 2px solid oklch(0.145 0 0);
            }

            tr.totals td {
              background: oklch(0.97 0 0);
              font-weight: 700;
            }

            .danger {
              color: oklch(0.577 0.245 27.325);
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <h1>Analisis stock / meses</h1>
          <div class="stock-summary">
            ${mesesStockCards}
          </div>
          <div class="stock-summary-secondary">
            ${negocioCards}
          </div>
          <table>
            <thead>
              <tr>
                <th class="model" style="text-align:left;">Modelo</th>
                <th class="version" style="text-align:left;">Version</th>
                ${monthColumns}
                <th>PED</th>
                <th>Total</th>
                <th>P. VTA</th>
                <th>M. Stock</th>
                <th>Total modelo</th>
              </tr>
            </thead>
            <tbody>
              ${groupRows}
              <tr class="totals">
                <td class="model">${escapeHtml(totalsWithPed.modelo)}</td>
                <td class="version">Total general</td>
                ${totalsCounts}
                <td class="number ped">${totalsWithPed.ped}</td>
                <td class="number total">${totalsWithPed.total}</td>
                <td class="number total">${formatPromedioVenta(totalsWithPed.promedioVenta)}</td>
                <td class="number ${totalMesesStock >= 2.5 ? "danger" : ""}">${formatMesesStock(
                  totalsWithPed.total,
                  totalsWithPed.promedioVenta,
                )}</td>
                <td class="number total">${totalsWithPed.total}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
      }, 500);
    };

    iframe.onload = () => {
      const iframeWindow = iframe.contentWindow;

      if (!iframeWindow) {
        cleanup();
        toast.error("No se pudo abrir la impresion");
        return;
      }

      iframeWindow.focus();
      iframeWindow.print();
      cleanup();
    };

    const iframeDocument = iframe.contentDocument;

    if (!iframeDocument) {
      cleanup();
      toast.error("No se pudo preparar la impresion");
      return;
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();
  };

  return (
    <div className="font-preset w-full max-w-none space-y-3 bg-muted px-2 py-3 print:space-y-2 print:px-0 print:py-0">
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 3mm;
          }

          html, body {
            background: oklch(1 0 0) !important;
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

          .analisis-stock-print .print-title {
            padding: 0 0 2px 0 !important;
          }

          .analisis-stock-print .print-title h2 {
            font-size: 12px !important;
            line-height: 1.1 !important;
          }

          .analisis-stock-print table {
            table-layout: fixed;
            width: 100%;
          }

          .analisis-stock-print th,
          .analisis-stock-print td {
            font-size: 11.5px !important;
            line-height: 1.05 !important;
            padding: 1px 2px !important;
          }

          .analisis-stock-print .print-version-cell,
          .analisis-stock-print .print-model-cell {
            white-space: normal !important;
            word-break: break-word;
            overflow-wrap: anywhere;
            hyphens: auto;
          }

          .analisis-stock-print .print-table col.print-col-model {
            width: 6% !important;
          }

          .analisis-stock-print .print-table col.print-col-version {
            width: 24% !important;
          }

          .analisis-stock-print .print-table col.print-col-month {
            width: 5.2% !important;
          }

          .analisis-stock-print .print-table col.print-col-ped,
          .analisis-stock-print .print-table col.print-col-total,
          .analisis-stock-print .print-table col.print-col-pvta {
            width: 5% !important;
          }

          .analisis-stock-print .print-table col.print-col-mstock {
            width: 6% !important;
          }

          .analisis-stock-print .print-table col.print-col-total-modelo {
            width: 7.8% !important;
          }
        }
      `}</style>

      <section className="print:hidden overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gestion convencional</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Analisis de stock</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Matriz de unidades agrupadas por modelo y version, distribuidas por mes de recepcion calculado desde SIAC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary"
            >
              <Printer size={16} />
              Imprimir
            </button>
            <Link
              to={paths.convencional.analisisStockDiccionarioVersiones}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary"
            >
              <GitMerge size={16} />
              Diccionario de versiones
            </Link>
          </div>
        </div>

        <div className="grid border-t border-border md:grid-cols-4 xl:grid-cols-8">
          {groupsWithTotals.map((group, index) => (
            <div
              key={group.modelo}
              className={[
                "min-w-0 border-b border-border px-3 py-2 xl:border-b-0",
                index > 0 ? "md:border-l md:border-border" : "",
              ].join(" ")}
            >
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{group.modelo}</p>
              <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-foreground">
                {formatMesesStock(group.total, group.promedioVenta)}
              </p>
            </div>
          ))}
          <div className="min-w-0 border-b border-border px-3 py-2 md:border-l xl:border-b-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Unidades</p>
            <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-foreground">{totalUnidades}</p>
          </div>
          <div className="min-w-0 border-b border-border px-3 py-2 md:border-l xl:border-b-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">M. stock negocio</p>
            <p className="mt-1 text-lg font-semibold leading-none tracking-tight text-foreground">
              {formatPromedioVenta(totalMesesStockNegocio)}
            </p>
          </div>
        </div>
      </section>

      <section className="analisis-stock-print overflow-hidden rounded-lg border border-border bg-card shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="print-title border-b border-border px-6 py-4 print:border-b print:px-0 print:py-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Analisis stock / meses</h2>
        </div>

        <div className="overflow-hidden print:overflow-visible">
          <table className="print-table w-full table-fixed text-foreground print:text-foreground">
            <colgroup>
              <col className="print-col-model" style={{ width: `${MODEL_COLUMN_WIDTH}px` }} />
              <col className="print-col-version" style={{ width: `${VERSION_COLUMN_WIDTH}px` }} />
              {months.map((month) => (
                <col key={`col-${month.key}`} className="print-col-month" style={{ width: "4.5rem" }} />
              ))}
              <col className="print-col-ped" style={{ width: "5rem" }} />
              <col className="print-col-total" style={{ width: "4.75rem" }} />
              <col className="print-col-pvta" style={{ width: "5rem" }} />
              <col className="print-col-mstock" style={{ width: "5.25rem" }} />
              <col className="print-col-total-modelo" style={{ width: "6.25rem" }} />
            </colgroup>
            <thead className="bg-muted text-xs uppercase tracking-[0.16em] text-muted-foreground print:tracking-[0.08em]">
              <tr>
                <th
                  className="sticky left-0 z-20 bg-muted px-1 py-0.5 text-left print:static print:w-[9%] print:px-1 print:py-0.5"
                  style={{ width: MODEL_COLUMN_WIDTH }}
                >
                  Modelo
                </th>
                <th
                  className="sticky z-20 bg-muted px-1 py-0.5 text-left print:static print:w-[23%] print:px-1 print:py-0.5"
                  style={{ left: MODEL_COLUMN_WIDTH, width: VERSION_COLUMN_WIDTH }}
                >
                  Version
                </th>
                {months.map((month) => (
                  <th key={month.key} className="px-1 py-0.5 text-center print:px-0.5 print:py-0.5">
                    {month.label}
                  </th>
                ))}
                <th className="bg-muted px-1 py-0.5 text-center print:px-0.5 print:py-0.5">PED</th>
                <th className="px-1 py-0.5 text-center print:px-0.5 print:py-0.5">Total</th>
                <th className="px-1 py-0.5 text-center print:px-0.5 print:py-0.5">P. VTA</th>
                <th className="px-1 py-0.5 text-center print:px-0.5 print:py-0.5">M. STOCK</th>
                <th className="px-1 py-0.5 text-center print:px-0.5 print:py-0.5">Total modelo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupsWithTotals.map((group) =>
                group.rows.map((row, rowIndex) => (
                  <tr key={`${group.modelo}-${row.version}`} className="hover:bg-muted">
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="print-model-cell sticky left-0 z-10 border-r border-t border-border bg-card px-1 py-0.5 align-middle font-bold text-foreground print:static print:px-1 print:py-0.5"
                        style={{ width: MODEL_COLUMN_WIDTH }}
                      >
                        {group.modelo}
                      </td>
                    ) : null}
                    <td
                      className={[
                        "print-version-cell sticky z-10 border-r border-border bg-card px-1 py-0.5 text-muted-foreground print:static print:px-1 print:py-0.5",
                        rowIndex === 0 ? "border-t border-border" : "",
                      ].join(" ")}
                      style={{ left: MODEL_COLUMN_WIDTH, width: VERSION_COLUMN_WIDTH }}
                    >
                      {row.version}
                    </td>
                    {months.map((month) => (
                      <td
                        key={`${group.modelo}-${row.version}-${month.key}`}
                        className={[
                          "px-1 py-0.5 text-center text-muted-foreground print:px-0.5 print:py-0.5",
                          rowIndex === 0 ? "border-t border-border" : "",
                        ].join(" ")}
                      >
                        {(() => {
                          const value = row.countsByMonth[month.key] ?? 0;
                          const units = row.unitsByMonth[month.key] ?? [];

                          if (value <= 0) return null;

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
                        className="inline-flex min-w-[1.8rem] items-center justify-center rounded-md bg-muted px-1 py-0.5 font-semibold text-foreground transition hover:bg-secondary print:hidden"
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
                        "bg-muted px-1 py-0.5 text-center text-muted-foreground print:px-0.5 print:py-0.5",
                        rowIndex === 0 ? "border-t border-border" : "",
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
                          className="w-12 rounded-md border border-input px-1 py-0.5 text-center text-xs outline-none transition-colors focus:border-ring"
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
                          className="rounded-md border border-border bg-card px-1.5 py-0.5 font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Guardar
                        </button>
                      </div>
                      <span className="hidden print:inline">{row.ped}</span>
                    </td>
                    <td
                      className={[
                        "px-1 py-0.5 text-center font-semibold text-foreground print:px-0.5 print:py-0.5",
                        rowIndex === 0 ? "border-t border-border" : "",
                      ].join(" ")}
                    >
                      {row.total}
                    </td>
                    <td
                      className={[
                        "px-1 py-0.5 text-center font-semibold text-foreground print:px-0.5 print:py-0.5",
                        rowIndex === 0 ? "border-t border-border" : "",
                      ].join(" ")}
                    >
                      {formatPromedioVenta(row.promedioVenta)}
                    </td>
                    <td
                      className={[
                        "px-1 py-0.5 text-center font-semibold print:px-0.5 print:py-0.5",
                        getMesesStockAlertClass(row.total / (row.promedioVenta > 0 ? row.promedioVenta : Number.POSITIVE_INFINITY)),
                        rowIndex === 0 ? "border-t border-border" : "",
                      ].join(" ")}
                    >
                      {formatMesesStock(row.total, row.promedioVenta)}
                    </td>
                    {rowIndex === 0 ? (
                      <td
                        rowSpan={group.rows.length}
                        className="border-t border-border px-1 py-0.5 text-center align-middle font-bold text-foreground print:px-0.5 print:py-0.5"
                      >
                        {group.total}
                      </td>
                    ) : null}
                  </tr>
                )),
              )}

              {!groups.length ? (
                <tr>
                  <td colSpan={months.length + 7} className="px-4 py-8 text-center text-sm text-muted-foreground print:px-1 print:py-2">
                    No hay unidades para analizar en este momento.
                  </td>
                </tr>
              ) : null}

              {groups.length && totalsWithPed ? (
                <tr className="bg-muted">
                  <td
                    className="print-model-cell sticky left-0 z-10 border-r border-border bg-muted px-1 py-0.5 font-bold text-foreground print:static print:px-1 print:py-0.5"
                    style={{ width: MODEL_COLUMN_WIDTH }}
                  >
                    {totalsWithPed.modelo}
                  </td>
                  <td
                    className="print-version-cell sticky z-10 border-r border-border bg-muted px-1 py-0.5 font-bold text-foreground print:static print:px-1 print:py-0.5"
                    style={{ left: MODEL_COLUMN_WIDTH, width: VERSION_COLUMN_WIDTH }}
                  >
                    Total general
                  </td>
                  {months.map((month) => (
                    <td key={`total-${month.key}`} className="px-1 py-0.5 text-center font-bold text-foreground print:px-0.5 print:py-0.5">
                      {formatTableCount(totalsWithPed.countsByMonth[month.key])}
                    </td>
                  ))}
                  <td className="bg-muted px-1 py-0.5 text-center font-bold text-foreground print:px-0.5 print:py-0.5">{totalsWithPed.ped}</td>
                  <td className="px-1 py-0.5 text-center font-bold text-foreground print:px-0.5 print:py-0.5">{totalsWithPed.total}</td>
                  <td className="px-1 py-0.5 text-center font-bold text-foreground print:px-0.5 print:py-0.5">
                    {formatPromedioVenta(totalsWithPed.promedioVenta)}
                  </td>
                  <td
                    className={[
                      "px-1 py-0.5 text-center font-bold print:px-0.5 print:py-0.5",
                      getMesesStockAlertClass(
                        totalsWithPed.total /
                          (totalsWithPed.promedioVenta > 0 ? totalsWithPed.promedioVenta : Number.POSITIVE_INFINITY),
                      ),
                    ].join(" ")}
                  >
                    {formatMesesStock(totalsWithPed.total, totalsWithPed.promedioVenta)}
                  </td>
                  <td className="px-1 py-0.5 text-center font-bold text-foreground print:px-0.5 print:py-0.5">{totalsWithPed.total}</td>
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
