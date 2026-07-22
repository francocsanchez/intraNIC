import { Dialog, Transition } from "@headlessui/react";
import Loading from "@/components/Loading";
import {
  getAnalisisOperacionesPreventaDescuentoMensual,
  getAnalisisOperacionesPreventa,
  getAnalisisOperacionesPreventaFormaPago,
  getAnalisisOperacionesPreventaResumenFinanciacion,
} from "@/services/operacionesService";
import type {
  AnalisisOperacionesPreventaDescuentoMensualItem,
  AnalisisOperacionesPreventaFormaPago,
  AnalisisOperacionesPreventaItem,
} from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarRange, Inbox, Rows3 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  | { kind: "action"; key: "formaPago"; label: string };

const TABLE_COLUMNS: TableColumn[] = [
  { kind: "field", key: "numero", label: "OP" },
  { kind: "field", key: "interno", label: "Stoauto" },
  { kind: "field", key: "fecha", label: "Fecha" },
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
];

const monthShortNames = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const CHART_COLORS = ["#128c80", "#1d4ed8", "#f59e0b", "#dc2626", "#7c3aed", "#059669", "#ea580c", "#475569"];

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
  if (!row.precio || !row.bonificacion) {
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

const buildPromedioDescuentoPorModelo = (rows: AnalisisOperacionesPreventaItem[]) =>
  rows
    .reduce<Array<{ modelo: string; promedio: number }>>((acc, row) => {
      const modelo = row.modelo.trim();
      const descuento = getDescuentoPorcentaje(row);

      if (!modelo || descuento === null || Number.isNaN(descuento)) {
        return acc;
      }

      const existing = acc.find((item) => item.modelo === modelo);

      if (existing) {
        existing.promedio = existing.promedio + descuento;
        (existing as typeof existing & { cantidad?: number }).cantidad =
          ((existing as typeof existing & { cantidad?: number }).cantidad ?? 1) + 1;
        return acc;
      }

      acc.push({
        modelo,
        promedio: descuento,
        cantidad: 1,
      } as { modelo: string; promedio: number } & { cantidad: number });

      return acc;
    }, [])
    .map((item) => {
      const cantidad = (item as typeof item & { cantidad?: number }).cantidad ?? 1;
      return {
        modelo: item.modelo,
        promedio: item.promedio / cantidad,
      };
    })
    .sort((a, b) => a.modelo.localeCompare(b.modelo));

const buildChartData = (rows: AnalisisOperacionesPreventaDescuentoMensualItem[]) => {
  const points = MONTH_OPTIONS.map((month) => ({
    mes: month.label.slice(0, 3),
    monthValue: month.value,
  })) as Array<{ mes: string; monthValue: number } & Record<string, string | number | null>>;

  const modelSet = new Set<string>();

  rows.forEach((row) => {
    modelSet.add(row.modelo);
    const point = points.find((item) => item.monthValue === row.mes);

    if (point) {
      point[row.modelo] = Math.round(row.descuentoPromedio);
    }
  });

  return {
    chartData: points,
    models: Array.from(modelSet).sort((a, b) => a.localeCompare(b)),
  };
};

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
          <div className="fixed inset-0 bg-black/40" />
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
              <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-200 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#128c80]">Analisis</p>
                  <Dialog.Title className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                    Forma de pago {numero ? `OP ${numero}` : ""}
                  </Dialog.Title>
                </div>

                <div className="px-5 py-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-10 animate-pulse rounded-xl bg-gray-100" />
                      ))}
                    </div>
                  ) : errorMessage ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {errorMessage}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <span className="text-sm font-medium text-gray-600">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-900">{formatMoney(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 px-5 py-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
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

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={18} />
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Analisis Operaciones</h1>
          </div>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener los registros solicitados."}
          </p>
        </section>
      </div>
    );
  }

  if (!data) return <Loading />;

  const currentMonthLabel = MONTH_OPTIONS.find((item) => item.value === mes)?.label ?? String(mes);
  const promedioDescuentoPorModelo = buildPromedioDescuentoPorModelo(data.data);
  const { chartData, models: chartModels } = buildChartData(descuentoMensualData?.data ?? []);

  return (
    <div className="w-full space-y-4 px-4 py-4">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-[#c7e7e2] bg-white p-4 shadow-sm">
          <div className="flex h-full flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
             
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">Analisis Operaciones</h1>
         
            </div>

            <div className="grid grid-cols-2 gap-2">
              <article className="rounded-lg bg-[#e4f3fa] px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-white p-2 text-[#15aa9a] shadow-sm">
                    <Rows3 size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Registros</p>
                    <p className="text-lg font-bold text-gray-900">{data.data.length}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-lg bg-[#e4f3fa] px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-white p-2 text-[#15aa9a] shadow-sm">
                    <CalendarRange size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Periodo</p>
                    <p className="text-sm font-bold text-gray-900">
                      {currentMonthLabel} {anio}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#c7e7e2] bg-white p-4 shadow-sm">
          <div className="flex h-full flex-col">
         
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">PROM DESC.</h2>
            <p className="mt-1 text-xs text-gray-600">Promedio de descuento por modelo para el periodo filtrado.</p>

            <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
              {promedioDescuentoPorModelo.length ? (
                promedioDescuentoPorModelo.map((item) => (
                  <div
                    key={item.modelo}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#e4f3fa] px-3 py-2 text-sm text-gray-800"
                  >
                    <span className="font-semibold uppercase text-gray-700">{item.modelo}</span>
                    <span className="font-bold text-[#128c80]">{formatPercentage(item.promedio)}</span>
                  </div>
                ))
              ) : (
                <div className="inline-flex items-center rounded-lg bg-[#e4f3fa] px-3 py-2 text-sm text-gray-600">
                  Sin datos para calcular promedio.
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-[#c7e7e2] bg-white p-4 shadow-sm">
          <div className="flex h-full flex-col">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Financiacion</h2>
            <p className="mt-1 text-xs text-gray-600">Indicadores del periodo filtrado para credito y usado.</p>

            <div className="mt-4 grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Cant. con credito</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {isResumenFinanciacionLoading ? "..." : (resumenFinanciacionData?.data.cantidadOperacionesCredito ?? 0)}
                </p>
              </div>

              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Cant. con usado</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {isResumenFinanciacionLoading ? "..." : (resumenFinanciacionData?.data.cantidadOperacionesUsado ?? 0)}
                </p>
              </div>

              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Promedio valor de usado</p>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  {isResumenFinanciacionLoading
                    ? "..."
                    : formatMoney(resumenFinanciacionData?.data.promedioValorUsado ?? null)}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#c7e7e2] bg-white p-4 shadow-sm">
          <div className="flex h-full flex-col">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">PROM CREDITO</h2>
            <p className="mt-1 text-xs text-gray-600">Promedio de credito por modelo en el periodo filtrado.</p>

            <div className="mt-4 flex flex-1 flex-wrap content-start gap-2">
              {isResumenFinanciacionLoading ? (
                <div className="h-24 w-full animate-pulse rounded-xl bg-gray-100" />
              ) : resumenFinanciacionData?.data.promedioCreditoPorModelo.length ? (
                resumenFinanciacionData.data.promedioCreditoPorModelo.map((item) => (
                  <div
                    key={item.modelo}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#e4f3fa] px-3 py-2 text-sm text-gray-800"
                  >
                    <span className="font-semibold uppercase text-gray-700">{item.modelo}</span>
                    <span className="font-bold text-[#128c80]">{formatMoney(item.promedioCredito)}</span>
                  </div>
                ))
              ) : (
                <div className="inline-flex items-center rounded-lg bg-[#e4f3fa] px-3 py-2 text-sm text-gray-600">
                  Sin operaciones con credito en el periodo.
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">Descuento Por Mes</h2>
            <p className="mt-1 text-xs text-gray-600">
              Evolucion mensual del porcentaje de descuento por modelo durante {anio}.
            </p>
          </div>

          <div className="inline-flex w-fit rounded-full bg-[#e4f3fa] px-3 py-1 text-xs font-semibold text-[#128c80]">
            {chartModels.length} modelos
          </div>
        </div>

        <div className="mt-4 h-[340px] min-w-0">
          {isDescuentoMensualLoading ? (
            <div className="h-full animate-pulse rounded-xl bg-gray-100" />
          ) : !chartModels.length ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#b7d8e3] bg-[#f8fcff] text-sm text-gray-500">
              Sin datos de descuento para graficar en {anio}.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#4b5563" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    borderColor: "#cfe7ee",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                {chartModels.map((model, index) => (
                  <Line
                    key={model}
                    type="monotone"
                    dataKey={model}
                    name={model}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="analisis-operaciones-anio" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Ano
            </label>
            <select
              id="analisis-operaciones-anio"
              value={anio}
              onChange={(event) => setAnio(Number(event.target.value))}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            >
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="analisis-operaciones-mes" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Mes
            </label>
            <select
              id="analisis-operaciones-mes"
              value={mes}
              onChange={(event) => setMes(Number(event.target.value))}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
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

      {!data.data.length ? (
        <section className="rounded-xl border border-dashed border-[#b7d8e3] bg-white px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4f3fa] text-[#15aa9a]">
            <Inbox size={20} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">No hay registros para mostrar</h2>
          <p className="mt-1 text-sm text-gray-500">
            Proba cambiar el ano o el mes para ampliar el resultado.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-medium text-gray-600">
              {data.data.length} registros encontrados para {currentMonthLabel.toLowerCase()} de {anio}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {TABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-2.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {data.data.map((row) => (
                  <tr key={`${row.numero ?? "sin-numero"}-${row.fecha ?? "sin-fecha"}-${row.modelo}`} className="hover:bg-gray-50/70">
                    {TABLE_COLUMNS.map((column) => (
                      <td
                        key={`${row.numero ?? "sin-numero"}-${row.fecha ?? "sin-fecha"}-${String(column.key)}`}
                        className="whitespace-nowrap px-2.5 py-2.5 text-xs text-gray-700"
                      >
                        {column.kind === "action" ? (
                          row.numero ? (
                            <button
                              type="button"
                              onClick={() => setNumeroFormaPago(row.numero)}
                              className="inline-flex rounded-full bg-gray-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-gray-700"
                            >
                              Ver
                            </button>
                          ) : (
                            "-"
                          )
                        ) : (
                          formatCellValue(row, column)
                        )}
                      </td>
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
