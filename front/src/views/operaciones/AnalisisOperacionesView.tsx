import { Dialog, Transition } from "@headlessui/react";
import Loading from "@/components/Loading";
import {
  getAnalisisOperacionesPreventaCreditoMensual,
  getAnalisisOperacionesPreventaDescuentoMensual,
  getAnalisisOperacionesPreventa,
  getAnalisisOperacionesPreventaFormaPago,
  getAnalisisOperacionesPreventaResumenFinanciacion,
  getAnalisisOperacionesPreventaUsadosMensual,
} from "@/services/operacionesService";
import type {
  AnalisisOperacionesPreventaDescuentoMensualItem,
  AnalisisOperacionesPreventaFormaPago,
  AnalisisOperacionesPreventaItem,
} from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarRange, FileText, Inbox, Rows3 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import type { EChartsCoreOption } from "echarts/core";
import EChart from "@/components/charts/EChart";
import { getPresetChartColors } from "@/components/charts/presetChartTheme";
import { toast } from "sonner";

const MONTH_OPTIONS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
] as const;

const MONEY_COLUMNS: Array<keyof AnalisisOperacionesPreventaItem> = [
  "precio",
  "patentamiento",
  "flete",
  "formulario",
  "prenda",
  "equipamiento",
  "otro",
  "bonificacion",
];

type TableColumn =
  | { kind: "field"; key: keyof AnalisisOperacionesPreventaItem; label: string }
  | { kind: "derived"; key: "descuentoPorcentaje" | "total"; label: string }
  | { kind: "action"; key: "formaPago" | "facturada"; label: string };

const TABLE_COLUMNS: TableColumn[] = [
  { kind: "field", key: "numero", label: "OP" },
  { kind: "field", key: "interno", label: "Stoauto" },
  { kind: "field", key: "fecha", label: "Fecha" },
  { kind: "field", key: "cliente", label: "Cliente" },
  { kind: "field", key: "modelo", label: "Modelo" },
  { kind: "field", key: "version", label: "Version" },
  { kind: "field", key: "precio", label: "Precio" },
  { kind: "derived", key: "descuentoPorcentaje", label: "Desc" },
  { kind: "field", key: "formulario", label: "Form" },
  { kind: "field", key: "flete", label: "Flete" },
  { kind: "field", key: "prenda", label: "Prenda" },
  { kind: "field", key: "patentamiento", label: "Paten" },
  { kind: "field", key: "equipamiento", label: "Eq" },
  { kind: "field", key: "otro", label: "Otro" },
  { kind: "derived", key: "total", label: "Total" },
  { kind: "action", key: "formaPago", label: "F. Pago" },
  { kind: "action", key: "facturada", label: "F" },
];

const monthShortNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const IVA_RATE = 0.21;

type ChartPoint = Record<string, string | number | null | undefined>;
type ChartSeries = {
  key: string;
  label: string;
  type?: "bar" | "line";
  yAxisIndex?: number;
  color?: string;
  showValueLabel?: boolean;
  valueFormatter?: (value: number) => string;
};

// Soft chart colors were requested for the preventa operations analysis only.
const SOFT_BLUE = "oklch(0.69 0.1 245)";
const SOFT_RED = "oklch(0.68 0.11 25)";
const SOFT_LINE_COLORS = [
  "oklch(0.66 0.1 245)",
  "oklch(0.68 0.09 155)",
  "oklch(0.72 0.1 75)",
  "oklch(0.66 0.09 320)",
  "oklch(0.68 0.08 205)",
  "oklch(0.7 0.08 120)",
  "oklch(0.62 0.08 35)",
] as const;

const formatChartCurrency = (value: number) => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

const formatChartInteger = (value: number) => new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
}).format(value);

const formatChartPercentage = (value: number) => `${new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value)}%`;

function AnalyticsChart({ data, xKey, series }: { data: ChartPoint[]; xKey: string; series: ChartSeries[] }) {
  const option = useMemo<EChartsCoreOption>(() => {
    const axisFormatter = (axisIndex: number) => series.find((item) => item.yAxisIndex === axisIndex)?.valueFormatter;
    const primaryAxisFormatter = series.find((item) => item.yAxisIndex === undefined)?.valueFormatter;

    return {
    color: getPresetChartColors(), grid: { top: 30, right: series.some((item) => item.yAxisIndex) ? 54 : 18, bottom: 40, left: 42 }, legend: { bottom: 0 },
    tooltip: { trigger: "axis", backgroundColor: "var(--popover)", borderColor: "var(--border)", textStyle: { color: "var(--popover-foreground)" } },
    xAxis: { type: "category", data: data.map((item) => String(item[xKey] ?? "")), axisTick: { show: false }, axisLabel: { color: "var(--muted-foreground)", fontSize: 11 } },
    yAxis: series.some((item) => item.yAxisIndex) ? [{ type: "value", axisLabel: { color: "var(--muted-foreground)", fontSize: 11, formatter: primaryAxisFormatter }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } }, { type: "value", axisLabel: { color: "var(--muted-foreground)", fontSize: 11, formatter: axisFormatter(1) }, splitLine: { show: false } }] : { type: "value", axisLabel: { color: "var(--muted-foreground)", fontSize: 11, formatter: primaryAxisFormatter }, splitLine: { lineStyle: { color: "var(--border)", type: "dashed" } } },
    series: series.map((item) => ({
      type: item.type ?? "bar",
      name: item.label,
      yAxisIndex: item.yAxisIndex,
      data: data.map((point) => Number(point[item.key] ?? 0)),
      smooth: item.type === "line",
      barMaxWidth: 30,
      symbolSize: 5,
      itemStyle: item.color ? { color: item.color } : undefined,
      lineStyle: item.type === "line" && item.color ? { color: item.color, width: 2 } : undefined,
      label: item.showValueLabel ? { show: true, position: "top", color: "var(--foreground)", fontSize: 11, formatter: ({ value }: { value: number }) => item.valueFormatter?.(value) ?? String(value) } : undefined,
      tooltip: item.valueFormatter ? { valueFormatter: item.valueFormatter } : undefined,
      emphasis: {
        focus: "series",
        itemStyle: { opacity: 1 },
        lineStyle: { opacity: 1, width: item.type === "line" ? 3 : undefined },
      },
      blur: {
        itemStyle: { opacity: 0.2 },
        lineStyle: { opacity: 0.2 },
      },
    })),
    };
  }, [data, series, xKey]);
  return <EChart option={option} enableHoverEmphasis />;
}

const formatDate = (value: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    day: "2-digit",
  }).format(date).replace(/\//g, "") + `-${monthShortNames[date.getUTCMonth()] ?? ""}`;
};

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value) || value === 0) {
    return "-";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getDescuentoPorcentaje = (row: AnalisisOperacionesPreventaItem) => {
  if (!row.precio || !row.bonificacion || row.bonificacion <= 0) {
    return null;
  }

  return (row.bonificacion / row.precio) * 100;
};

const getTotalOperacion = (row: AnalisisOperacionesPreventaItem) =>
  [
    row.precio,
    row.formulario,
    row.flete,
    row.prenda,
    row.patentamiento,
    row.equipamiento,
    row.otro,
  ].reduce<number>((acc, value) => acc + Number(value ?? 0), 0);

const formatPercentage = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value)}%`;
};

const formatPercentageCompact = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
};

const formatPercentageDetailed = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
};

const getDescuentoCellClassName = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  if (value > 9) {
    return "bg-destructive/10/70 text-destructive";
  }

  if (value >= 6) {
    return "bg-secondary/70 text-secondary-foreground";
  }

  return "bg-secondary/70 text-secondary-foreground";
};

const formatCellValue = (row: AnalisisOperacionesPreventaItem, column: Exclude<TableColumn, { kind: "action" }>) => {
  if (column.kind === "derived") {
    if (column.key === "descuentoPorcentaje") {
      return formatPercentage(getDescuentoPorcentaje(row));
    }

    return formatMoney(getTotalOperacion(row));
  }

  const key = column.key;
  const value = row[key];

  if (key === "fecha") {
    return formatDate(value as string | null);
  }

  if (MONEY_COLUMNS.includes(key)) {
    return formatMoney(value as number | null);
  }

  if (value === null || value === "") {
    return "-";
  }

  return String(value);
};

const buildPromedioDescuento = (
  rows: AnalisisOperacionesPreventaItem[],
  key: "modelo" | "sucursal",
  emptyLabel: string,
) =>
  rows
    .reduce<Array<{ nombre: string; promedio: number }>>((acc, row) => {
      const nombre = row[key].trim();
      const descuento = getDescuentoPorcentaje(row);

      if (!nombre || descuento === null || Number.isNaN(descuento)) {
        return acc;
      }

      const existing = acc.find((item) => item.nombre === nombre);

      if (existing) {
        existing.promedio = existing.promedio + descuento;
        (existing as typeof existing & { cantidad?: number }).cantidad =
          ((existing as typeof existing & { cantidad?: number }).cantidad ?? 1) + 1;
        return acc;
      }

      acc.push({
        nombre,
        promedio: descuento,
        cantidad: 1,
      } as { nombre: string; promedio: number } & { cantidad: number });

      return acc;
    }, [])
    .map((item) => {
      const cantidad = (item as typeof item & { cantidad?: number }).cantidad ?? 1;
      return {
        nombre: item.nombre || emptyLabel,
        promedio: item.promedio / cantidad,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

const buildChartData = (
  rows: AnalisisOperacionesPreventaDescuentoMensualItem[],
  dimension: "modelo" | "sucursal" | "vendedor",
) => {
  const points = MONTH_OPTIONS.map((month) => ({
    mes: month.label.slice(0, 3),
    monthValue: month.value,
  })) as Array<{ mes: string; monthValue: number } & Record<string, string | number | null>>;

  const itemSet = new Set<string>();

  rows.forEach((row) => {
    const seriesName =
      dimension === "modelo" ? row.modelo : dimension === "sucursal" ? row.sucursal : row.vendedor;

    if (!seriesName) {
      return;
    }

    itemSet.add(seriesName);
    const point = points.find((item) => item.monthValue === row.mes);

    if (point) {
      point[seriesName] = Math.round(row.descuentoPromedio);
    }
  });

  return {
    chartData: points,
    items: Array.from(itemSet).sort((a, b) => a.localeCompare(b)),
  };
};

const buildMonthlyBaseData = () =>
  MONTH_OPTIONS.map((month) => ({
    mes: month.label.slice(0, 3),
    monthValue: month.value,
  }));

type FormaPagoModalProps = {
  detalle: AnalisisOperacionesPreventaFormaPago | null;
  errorMessage: string | null;
  numero: number | null;
  onClose: () => void;
  open: boolean;
  isLoading: boolean;
};

function FormaPagoModal({ detalle, errorMessage, numero, onClose, open, isLoading }: FormaPagoModalProps) {
  const items = [
    { label: "Contado", value: detalle?.contado ?? null },
    { label: "Usado", value: detalle?.usados ?? null },
    { label: "Cheque", value: detalle?.cheque ?? null },
    { label: "Cred", value: detalle?.credito_bancario ?? null },
  ];
  const cheques = detalle?.cheques ?? [];
  const chequesDetallados = cheques.map((cheque, index) => {
    const saldoFinanciado = cheques
      .slice(index)
      .reduce<number>((acc, item) => acc + Number(item.capital ?? 0), 0);
    const interes = Number(cheque.interes ?? 0);
    const tasaMensualConIva = saldoFinanciado > 0 && interes > 0 ? (interes / saldoFinanciado) * 100 : null;
    const tasaAnual = tasaMensualConIva !== null ? (tasaMensualConIva / (1 + IVA_RATE)) * 12 : null;

    return {
      ...cheque,
      saldoFinanciado,
      tasaAnual,
    };
  });
  const totalCapitalCheques = cheques.reduce<number>((acc, cheque) => acc + Number(cheque.capital ?? 0), 0);
  const totalInteresCheques = cheques.reduce<number>((acc, cheque) => acc + Number(cheque.interes ?? 0), 0);
  const totalImporteCheques = totalCapitalCheques + totalInteresCheques;
  const tasaAnualCheques =
    chequesDetallados.find((cheque) => cheque.tasaAnual !== null)?.tasaAnual ??
    (totalCapitalCheques > 0 ? ((totalInteresCheques / totalCapitalCheques) * 100 * 12) / (1 + IVA_RATE) : null);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-secondary/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-card shadow-xl">
                <div className="border-b border-border px-5 py-4">
                  <p className="text-primary font-semibold uppercase tracking-[0.16em] text-primary">Analisis</p>
                  <Dialog.Title className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                    Forma de pago {numero ? `OP ${numero}` : ""}
                  </Dialog.Title>
                </div>

                <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 7 }).map((_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-lg bg-muted" />
                      ))}
                    </div>
                  ) : errorMessage ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {errorMessage}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3 md:col-span-2">
                          <span className="text-sm font-medium text-muted-foreground">Vendedor</span>
                          <span className="text-sm font-semibold text-foreground">{detalle?.vendedor ?? "-"}</span>
                        </div>
                        {items.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3"
                          >
                            <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                            <span className="text-sm font-semibold text-foreground">{formatMoney(item.value)}</span>
                          </div>
                        ))}
                      </div>

                      <section className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-4 py-3">
                          <h3 className="text-sm font-semibold text-foreground">Detalle de cheques</h3>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Interes por cheque, tasa anual aplicada y resumen total del capital financiado.
                          </p>
                        </div>

                        {cheques.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-muted-foreground">
                            Esta operación no tiene cheques asociados para mostrar.
                          </div>
                        ) : (
                          <div className="space-y-4 p-4">
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                              <div className="rounded-lg border border-border bg-muted px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                  Capital financiado
                                </p>
                                <p className="mt-1 text-base font-semibold text-foreground">
                                  {formatMoney(totalCapitalCheques)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                  Interes total
                                </p>
                                <p className="mt-1 text-base font-semibold text-foreground">
                                  {formatMoney(totalInteresCheques)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                  Tasa anual
                                </p>
                                <p className="mt-1 text-base font-semibold text-foreground">
                                  {formatPercentageDetailed(tasaAnualCheques)}
                                </p>
                              </div>
                              <div className="rounded-lg border border-border bg-muted px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                  Total cheques
                                </p>
                                <p className="mt-1 text-base font-semibold text-foreground">
                                  {formatMoney(totalImporteCheques)}
                                </p>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                              <thead className="bg-muted">
                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                  <th className="px-4 py-3">Cheque</th>
                                  <th className="px-4 py-3">Fecha</th>
                                  <th className="px-4 py-3 text-right">Capital</th>
                                  <th className="px-4 py-3 text-right">Interes</th>
                                  <th className="px-4 py-3 text-right">Tasa</th>
                                  <th className="px-4 py-3 text-right">Importe</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border bg-card">
                                {chequesDetallados.map((cheque) => (
                                  <tr key={`${cheque.renglon ?? "sin-renglon"}-${cheque.fecha ?? "sin-fecha"}`}>
                                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                                      {cheque.renglon !== null ? `Cheque ${cheque.renglon}` : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(cheque.fecha)}</td>
                                    <td className="px-4 py-3 text-right text-sm text-foreground">
                                      {formatMoney(cheque.capital)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-foreground">
                                      {formatMoney(cheque.interes)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-foreground">
                                      {formatPercentageDetailed(cheque.tasaAnual)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                                      {formatMoney(cheque.importeTotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                </div>

                <div className="border-t border-border px-5 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-muted"
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
  );
}

export default function AnalisisOperacionesView() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [anio, setAnio] = useState(currentYear);
  const [mes, setMes] = useState(currentMonth);
  const [numeroFormaPago, setNumeroFormaPago] = useState<number | null>(null);

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - 5 + index),
    [currentYear],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["analisis-operaciones-preventa", anio, mes],
    queryFn: () => getAnalisisOperacionesPreventa({ anio, mes }),
    refetchOnWindowFocus: true,
  });

  const {
    data: formaPagoData,
    isLoading: isFormaPagoLoading,
    error: formaPagoError,
  } = useQuery({
    queryKey: ["analisis-operaciones-preventa-forma-pago", numeroFormaPago],
    queryFn: () => getAnalisisOperacionesPreventaFormaPago(numeroFormaPago!),
    enabled: numeroFormaPago !== null,
    refetchOnWindowFocus: false,
  });

  const {
    data: descuentoMensualData,
    isLoading: isDescuentoMensualLoading,
    error: descuentoMensualError,
  } = useQuery({
    queryKey: ["analisis-operaciones-preventa-descuento-mensual", anio],
    queryFn: () => getAnalisisOperacionesPreventaDescuentoMensual(anio),
    refetchOnWindowFocus: false,
  });

  const {
    data: resumenFinanciacionData,
    isLoading: isResumenFinanciacionLoading,
    error: resumenFinanciacionError,
  } = useQuery({
    queryKey: ["analisis-operaciones-preventa-resumen-financiacion", anio, mes],
    queryFn: () => getAnalisisOperacionesPreventaResumenFinanciacion({ anio, mes }),
    refetchOnWindowFocus: false,
  });

  const {
    data: usadosMensualData,
    isLoading: isUsadosMensualLoading,
    error: usadosMensualError,
  } = useQuery({
    queryKey: ["analisis-operaciones-preventa-usados-mensual", anio],
    queryFn: () => getAnalisisOperacionesPreventaUsadosMensual(anio),
    refetchOnWindowFocus: false,
  });

  const {
    data: creditoMensualData,
    isLoading: isCreditoMensualLoading,
    error: creditoMensualError,
  } = useQuery({
    queryKey: ["analisis-operaciones-preventa-credito-mensual", anio],
    queryFn: () => getAnalisisOperacionesPreventaCreditoMensual(anio),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  useEffect(() => {
    if (formaPagoError instanceof Error) {
      toast.error(formaPagoError.message);
    }
  }, [formaPagoError]);

  useEffect(() => {
    if (descuentoMensualError instanceof Error) {
      toast.error(descuentoMensualError.message);
    }
  }, [descuentoMensualError]);

  useEffect(() => {
    if (resumenFinanciacionError instanceof Error) {
      toast.error(resumenFinanciacionError.message);
    }
  }, [resumenFinanciacionError]);

  useEffect(() => {
    if (usadosMensualError instanceof Error) {
      toast.error(usadosMensualError.message);
    }
  }, [usadosMensualError]);

  useEffect(() => {
    if (creditoMensualError instanceof Error) {
      toast.error(creditoMensualError.message);
    }
  }, [creditoMensualError]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-destructive/30 bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle size={18} />
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar Analisis Operaciones</h1>
          </div>
          <p className="mt-2 text-sm text-destructive">
            {error instanceof Error ? error.message : "No fue posible obtener los registros solicitados."}
          </p>
        </section>
      </div>
    );
  }

  if (!data) return <Loading />;

  const currentMonthLabel = MONTH_OPTIONS.find((item) => item.value === mes)?.label ?? String(mes);
  const promedioDescuentoPorModelo = buildPromedioDescuento(data.data, "modelo", "SIN MODELO");
  const promedioDescuentoPorSucursal = buildPromedioDescuento(data.data, "sucursal", "SIN SUCURSAL");
  const { chartData: chartDataModelos, items: chartModels } = buildChartData(
    (descuentoMensualData?.data ?? []).filter((item) => Boolean(item.modelo)),
    "modelo",
  );
  const { chartData: chartDataSucursales, items: chartSucursales } = buildChartData(
    (descuentoMensualData?.data ?? []).filter((item) => Boolean(item.sucursal)),
    "sucursal",
  );
  const usadosChartData = buildMonthlyBaseData().map((month) => {
    const match = usadosMensualData?.data.find((item) => item.mes === month.monthValue);
    const porcentajeToma = match && match.totalOperaciones > 0
      ? (match.cantidadUsados / match.totalOperaciones) * 100
      : null;
    return {
      mes: month.mes,
      porcentajeToma,
      cantidadUsados: match?.cantidadUsados ?? 0,
      promedioValorUsado: match?.promedioValorUsado ?? null,
    };
  });
  const creditoChartData = buildMonthlyBaseData().map((month) => {
    const match = creditoMensualData?.data.find((item) => item.mes === month.monthValue);
    const porcentajeCredito = match && match.totalOperaciones > 0
      ? (match.cantidadOperacionesCredito / match.totalOperaciones) * 100
      : null;
    return {
      mes: month.mes,
      porcentajeCredito,
      promedioCredito: match?.promedioCredito ?? null,
    };
  });
  const totalOperacionesMes = data.data.length;
  const cantidadOperacionesUsado = resumenFinanciacionData?.data.cantidadOperacionesUsado ?? 0;
  const porcentajeToma = totalOperacionesMes > 0
    ? (cantidadOperacionesUsado / totalOperacionesMes) * 100
    : null;

  return (
    <div className="w-full space-y-4 px-4 py-4">
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="analisis-operaciones-anio" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Ano
            </label>
            <select
              id="analisis-operaciones-anio"
              value={anio}
              onChange={(event) => setAnio(Number(event.target.value))}
              className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="analisis-operaciones-mes" className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Mes
            </label>
            <select
              id="analisis-operaciones-mes"
              value={mes}
              onChange={(event) => setMes(Number(event.target.value))}
              className="w-full rounded-lg border border-input px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.9fr)]">
        <article className="min-w-0 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex h-full flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div>
             
              <h1 className="text-base font-semibold tracking-tight text-foreground">Analisis Operaciones</h1>
         
            </div>

            <div className="grid grid-cols-2 gap-2">
              <article className="rounded-md bg-secondary px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="rounded-md bg-card p-1.5 text-primary shadow-sm">
                    <Rows3 size={13} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Registros</p>
                    <p className="text-base font-bold text-foreground">{data.data.length}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-md bg-secondary px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="rounded-md bg-card p-1.5 text-primary shadow-sm">
                    <CalendarRange size={13} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Periodo</p>
                    <p className="text-xs font-bold text-foreground">
                      {currentMonthLabel} {anio}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </article>

        <article className="min-w-0 rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex h-full flex-col">
         
            <h2 className="text-base font-semibold tracking-tight text-foreground">PROM DESC.</h2>
        

            <div className="mt-2 grid flex-1 grid-cols-1 gap-2 xl:grid-cols-2">
              {promedioDescuentoPorModelo.length || promedioDescuentoPorSucursal.length ? (
                <>
                  <div className="rounded-md bg-secondary px-2 py-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Modelos</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground">
                      {promedioDescuentoPorModelo.map((item) => (
                        <div key={item.nombre} className="inline-flex items-center gap-1.5">
                          <span className="font-semibold uppercase text-muted-foreground">{item.nombre}</span>
                          <span className="font-bold text-primary">{formatPercentage(item.promedio)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md bg-secondary px-2 py-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sucursales</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground">
                      {promedioDescuentoPorSucursal.map((item) => (
                        <div key={item.nombre} className="inline-flex items-center gap-1.5">
                          <span className="font-semibold uppercase text-muted-foreground">{item.nombre}</span>
                          <span className="font-bold text-primary">{formatPercentage(item.promedio)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="inline-flex items-center rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  Sin datos para calcular promedio.
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex h-full flex-col">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Financiacion</h2>
            

            <div className="mt-2 grid flex-1 grid-cols-2 gap-2 xl:grid-cols-4">
              <div className="rounded-md bg-secondary px-2 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cant. con credito</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {isResumenFinanciacionLoading ? "..." : (resumenFinanciacionData?.data.cantidadOperacionesCredito ?? 0)}
                </p>
              </div>

              <div className="rounded-md bg-secondary px-2 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cant. con usado</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {isResumenFinanciacionLoading ? "..." : (resumenFinanciacionData?.data.cantidadOperacionesUsado ?? 0)}
                </p>
              </div>

              <div className="rounded-md bg-secondary px-2 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">% Toma</p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {isResumenFinanciacionLoading ? "..." : formatPercentageCompact(porcentajeToma)}
                </p>
              </div>

              <div className="rounded-md bg-secondary px-2 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Promedio valor de usado</p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {isResumenFinanciacionLoading
                    ? "..."
                    : formatMoney(resumenFinanciacionData?.data.promedioValorUsado ?? null)}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="flex h-full flex-col">
            <h2 className="text-base font-semibold tracking-tight text-foreground">PROM CREDITO</h2>
           

            <div className="mt-2 flex flex-1 flex-wrap content-start gap-1.5">
              {isResumenFinanciacionLoading ? (
                <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
              ) : resumenFinanciacionData?.data.promedioCreditoPorModelo.length ? (
                resumenFinanciacionData.data.promedioCreditoPorModelo.map((item) => (
                  <div
                    key={item.modelo}
                    className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1.5 text-xs text-foreground"
                  >
                    <span className="font-semibold uppercase text-muted-foreground">{item.modelo}</span>
                    <span className="font-bold text-primary">{formatMoney(item.promedioCredito)}</span>
                  </div>
                ))
              ) : (
                <div className="inline-flex items-center rounded-lg bg-secondary px-3 py-2 text-sm text-muted-foreground">
                  Sin operaciones con credito en el periodo.
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Usados Anualizado</h2>
            <p className="text-xs text-muted-foreground">Cantidad de usados por mes y valor promedio de usado durante {anio}.</p>
          </div>

          <div className="mt-4 h-[320px] min-w-0">
            {isUsadosMensualLoading ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : (
              <AnalyticsChart data={usadosChartData as ChartPoint[]} xKey="mes" series={[{ key: "cantidadUsados", label: "Cantidad usados", color: SOFT_BLUE, showValueLabel: true, valueFormatter: formatChartInteger }, { key: "promedioValorUsado", label: "Promedio valor usado", type: "line", yAxisIndex: 1, color: "var(--foreground)", valueFormatter: formatChartCurrency }]} />
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Monto Promedio de Credito</h2>
            <p className="text-xs text-muted-foreground">Promedio mensual de credito bancario durante {anio}.</p>
          </div>

          <div className="mt-4 h-[320px] min-w-0">
            {isCreditoMensualLoading ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : (
              <AnalyticsChart data={creditoChartData as ChartPoint[]} xKey="mes" series={[{ key: "promedioCredito", label: "Promedio credito", color: SOFT_RED, valueFormatter: formatChartCurrency }]} />
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Descuento Por Mes</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Evolucion mensual del porcentaje de descuento por modelo durante {anio}.
              </p>
            </div>

            <div className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              {chartModels.length} modelos
            </div>
          </div>

          <div className="mt-4 h-[340px] min-w-0">
            {isDescuentoMensualLoading ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : !chartModels.length ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground">
                Sin datos de descuento por modelo en {anio}.
              </div>
            ) : (
              <AnalyticsChart data={chartDataModelos as ChartPoint[]} xKey="mes" series={chartModels.map((model, index) => ({ key: model, label: model, type: "line" as const, color: SOFT_LINE_COLORS[index % SOFT_LINE_COLORS.length], valueFormatter: formatChartPercentage }))} />
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Descuento Anual Sucursal</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Evolucion mensual del porcentaje de descuento por sucursal durante {anio}.
              </p>
            </div>

            <div className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
              {chartSucursales.length} sucursales
            </div>
          </div>

          <div className="mt-4 h-[340px] min-w-0">
            {isDescuentoMensualLoading ? (
              <div className="h-full animate-pulse rounded-lg bg-muted" />
            ) : !chartSucursales.length ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground">
                Sin datos de descuento por sucursal en {anio}.
              </div>
            ) : (
              <AnalyticsChart data={chartDataSucursales as ChartPoint[]} xKey="mes" series={chartSucursales.map((sucursal, index) => ({ key: sucursal, label: sucursal, type: "line" as const, color: SOFT_LINE_COLORS[index % SOFT_LINE_COLORS.length], valueFormatter: formatChartPercentage }))} />
            )}
          </div>
        </article>
      </section>

      {!data.data.length ? (
        <section className="rounded-lg border border-dashed border-border bg-card px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
            <Inbox size={20} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-foreground">No hay registros para mostrar</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Proba cambiar el ano o el mes para ampliar el resultado.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-muted-foreground">
              {data.data.length} registros encontrados para {currentMonthLabel.toLowerCase()} de {anio}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-xs">
              <thead className="bg-muted">
                <tr>
                  {TABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-2 py-1.5 text-left text-primary font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border bg-card">
                {data.data.map((row) => (
                  <tr key={`${row.numero ?? "sin-numero"}-${row.fecha ?? "sin-fecha"}-${row.modelo}`} className="hover:bg-muted/70">
                    {TABLE_COLUMNS.map((column) => (
                      (() => {
                        const descuentoValue =
                          column.kind === "derived" && column.key === "descuentoPorcentaje"
                            ? getDescuentoPorcentaje(row)
                            : null;

                        const colorClassName =
                          column.kind === "derived" && column.key === "descuentoPorcentaje"
                            ? getDescuentoCellClassName(descuentoValue)
                            : "";

                        return (
                      <td
                        key={`${row.numero ?? "sin-numero"}-${row.fecha ?? "sin-fecha"}-${String(column.key)}`}
                        className={`whitespace-nowrap px-2 py-1.5 text-xs text-muted-foreground ${colorClassName}`}
                      >
                        {column.kind === "action" ? (
                          column.key === "formaPago" ? (
                            row.numero ? (
                              <button
                                type="button"
                                onClick={() => setNumeroFormaPago(row.numero)}
                                className="inline-flex rounded-full bg-primary px-3 py-1 text-primary font-semibold uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-muted"
                              >
                                Ver
                              </button>
                            ) : (
                              "-"
                            )
                          ) : row.fechaFactura ? (
                            <span
                              className="inline-flex items-center justify-center text-primary"
                              title="Operacion facturada"
                            >
                              <FileText size={14} />
                            </span>
                          ) : (
                            "-"
                          )
                        ) : (
                          formatCellValue(row, column)
                        )}
                      </td>
                        );
                      })()
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <FormaPagoModal
        open={numeroFormaPago !== null}
        numero={numeroFormaPago}
        detalle={formaPagoData?.data ?? null}
        isLoading={isFormaPagoLoading}
        errorMessage={formaPagoError instanceof Error ? formaPagoError.message : null}
        onClose={() => setNumeroFormaPago(null)}
      />
    </div>
  );
}
