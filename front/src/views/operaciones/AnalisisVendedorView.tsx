import Loading from "@/components/Loading";
import { getAnalisisVendedor, getAnalisisVendedorFilters } from "@/services/operacionesService";
import type { AnalisisOperacionesPreventaItem, AnalisisVendedorFilterOption } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Inbox, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

const STACK_COLORS = [
  "#128c80",
  "#1d4ed8",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#059669",
  "#ea580c",
  "#475569",
  "#0891b2",
  "#be123c",
  "#65a30d",
  "#0f766e",
];
const MONTH_SHORT_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

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

type VendorTableColumn =
  | { kind: "field"; key: keyof AnalisisOperacionesPreventaItem; label: string }
  | { kind: "derived"; key: "descuentoPorcentaje" | "total"; label: string };

const TABLE_COLUMNS: VendorTableColumn[] = [
  { kind: "field", key: "numero", label: "OP" },
  { kind: "field", key: "interno", label: "Stoauto" },
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
];

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

const formatPercentageCompact = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
};

const formatBarLabelPercentage = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  return `${Math.round(value)}%`;
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

const getDescuentoCellClassName = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "";
  }

  if (value > 9) {
    return "bg-red-100/70 text-red-700";
  }

  if (value >= 6) {
    return "bg-amber-100/70 text-amber-700";
  }

  return "bg-emerald-100/70 text-emerald-700";
};

const formatCellValue = (row: AnalisisOperacionesPreventaItem, column: VendorTableColumn) => {
  if (column.kind === "derived") {
    if (column.key === "descuentoPorcentaje") {
      return formatPercentage(getDescuentoPorcentaje(row));
    }

    return formatMoney(getTotalOperacion(row));
  }

  const value = row[column.key];

  if (MONEY_COLUMNS.includes(column.key)) {
    return formatMoney(value as number | null);
  }

  if (value === null || value === "") {
    return "-";
  }

  return String(value);
};

export default function AnalisisVendedorView() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const [selectedVendedor, setSelectedVendedor] = useState<number | null>(null);

  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - 5 + index),
    [currentYear],
  );

  const {
    data: filtersData,
    isLoading: isFiltersLoading,
    error: filtersError,
  } = useQuery({
    queryKey: ["analisis-vendedor-filtros"],
    queryFn: getAnalisisVendedorFilters,
    refetchOnWindowFocus: false,
  });

  const vendedores = filtersData?.filters.vendedores ?? [];

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["analisis-vendedor", anio, selectedVendedor],
    queryFn: () =>
      getAnalisisVendedor({
        anio,
        vendedor: selectedVendedor,
      }),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (filtersError instanceof Error) {
      toast.error(filtersError.message);
    }
  }, [filtersError]);

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  const effectiveVendedores: AnalisisVendedorFilterOption[] = data?.filters.vendedores ?? vendedores;

  if (isFiltersLoading) {
    return <Loading />;
  }

  if (!effectiveVendedores.length) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-dashed border-[#b7d8e3] bg-white px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4f3fa] text-[#15aa9a]">
            <Users size={20} />
          </div>
          <h1 className="mt-3 text-lg font-semibold text-gray-900">No hay vendedores disponibles</h1>
          <p className="mt-1 text-sm text-gray-500">Todavia no existen vendedores activos para construir este analisis.</p>
        </section>
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={18} />
            <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Analisis Vendedor</h1>
          </div>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener la informacion solicitada."}
          </p>
        </section>
      </div>
    );
  }

  const hasData = data ? data.chartData.some((item) => item.total > 0) : false;
  const usadosChartData = data
    ? MONTH_SHORT_LABELS.map((label, index) => {
        const match = data.usadosMensual.find((item) => item.mes === index + 1);
        const porcentajeToma =
          match && match.totalOperaciones > 0 ? (match.cantidadUsados / match.totalOperaciones) * 100 : null;

        return {
          mes: label,
          porcentajeToma,
          cantidadUsados: match?.cantidadUsados ?? 0,
          promedioValorUsado: match?.promedioValorUsado ?? null,
        };
      })
    : [];
  const creditoChartData = data
    ? MONTH_SHORT_LABELS.map((label, index) => {
        const match = data.creditoMensual.find((item) => item.mes === index + 1);
        const porcentajeCredito =
          match && match.totalOperaciones > 0
            ? (match.cantidadOperacionesCredito / match.totalOperaciones) * 100
            : null;

        return {
          mes: label,
          porcentajeCredito,
          promedioCredito: match?.promedioCredito ?? null,
        };
      })
    : [];
  const descuentoChartData = data
    ? MONTH_SHORT_LABELS.map((label, index) => {
        const match = data.descuentoMensual.find((item) => item.mes === index + 1);

        return {
          mes: label,
          descuentoPromedio: match?.descuentoPromedio ?? null,
          descuentoPromedioHilux: match?.descuentoPromedioHilux ?? null,
        };
      })
    : [];

  return (
    <div className="w-full space-y-4 px-4 py-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="analisis-vendedor-vendedor" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Vendedor
            </label>
            <select
              id="analisis-vendedor-vendedor"
              value={selectedVendedor ?? ""}
              onChange={(event) => setSelectedVendedor(event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            >
              <option value="">Todos los vendedores</option>
              {effectiveVendedores.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="analisis-vendedor-anio" className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Ano
            </label>
            <select
              id="analisis-vendedor-anio"
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
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.73fr)]">
        <article className="min-w-0 rounded-xl border border-[#c7e7e2] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#128c80]">Modulo analitico</p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">Analisis vendedor anual</h1>
             
            </div>

            <div className="inline-flex w-fit rounded-full bg-[#e4f3fa] px-3 py-1 text-xs font-semibold text-[#128c80]">
              {data?.context.modelos.length ?? 0} modelos
            </div>
          </div>

          <div className="mt-4 h-[210px] min-w-0 w-full">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-xl bg-gray-100" />
            ) : !hasData ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#b7d8e3] bg-[#f8fcff] text-sm text-gray-500">
                Sin operaciones para {data.context.vendedorLabel} en {anio}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data.chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b5563" }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      borderColor: "#cfe7ee",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                    formatter={(value, name) => [`${value} operaciones`, String(name)]}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <ReferenceLine
                    y={12}
                    stroke="#dc2626"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    label={{ value: "Target 12", position: "insideTopRight", fill: "#dc2626", fontSize: 11 }}
                  />
                  <Legend />
                  {data.context.modelos.map((modelo, index) => (
                    <Bar
                      key={modelo}
                      dataKey={modelo}
                      name={modelo}
                      stackId="modelos"
                      fill={STACK_COLORS[index % STACK_COLORS.length]}
                      radius={index === data.context.modelos.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                    >
                      {index === data.context.modelos.length - 1 ? (
                        <LabelList dataKey="total" position="top" fill="#0f172a" fontSize={11} fontWeight={700} />
                      ) : null}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[#c7e7e2] bg-white p-4 shadow-sm">
          <div className="flex h-full flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#128c80]">Resumen</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">Indicadores</h2>
            <div className="mt-4 grid flex-1 grid-cols-2 gap-3 content-start">
              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Cant operaciones</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{data?.summary.totalOperaciones ?? 0}</p>
              </div>
              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Cant con credito</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{data?.summary.cantidadOperacionesCredito ?? 0}</p>
              </div>
              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Cant con usado</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{data?.summary.cantidadOperacionesUsado ?? 0}</p>
              </div>
              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">% Toma</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatPercentageCompact(data?.summary.porcentajeToma ?? null)}</p>
              </div>
              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">% Vendedor</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatPercentageCompact(data?.summary.porcentajeVendedor ?? null)}</p>
              </div>
              <div className="rounded-lg bg-[#e4f3fa] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">% Vendedor sucursal</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatPercentageCompact(data?.summary.porcentajeVendedorSucursal ?? null)}</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Usados Anualizado</h2>
          
          </div>

          <div className="mt-4 h-[260px] min-w-0">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-xl bg-gray-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={usadosChartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b5563" }} />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => formatMoney(Number(value)) as string}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      borderColor: "#cfe7ee",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                    formatter={(value, name) =>
                      name === "Cantidad usados" ? [value, name] : [formatMoney(Number(value)), name]
                    }
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="cantidadUsados" name="Cantidad usados" fill="#128c80" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="porcentajeToma"
                      position="insideTop"
                      offset={10}
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight={700}
                      formatter={(value) =>
                        formatBarLabelPercentage(
                          value === null || value === undefined || value === "" ? null : Number(value),
                        )
                      }
                    />
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="promedioValorUsado"
                    name="Promedio valor usado"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Monto Promedio de Credito</h2>
     
          </div>

          <div className="mt-4 h-[260px] min-w-0">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-xl bg-gray-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={creditoChartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b5563" }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(value) => formatMoney(Number(value)) as string}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      borderColor: "#cfe7ee",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                    formatter={(value) => [formatMoney(Number(value)), "Promedio credito"]}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="promedioCredito" name="Promedio credito" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="porcentajeCredito"
                      position="insideTop"
                      offset={10}
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight={700}
                      formatter={(value) =>
                        formatBarLabelPercentage(
                          value === null || value === undefined || value === "" ? null : Number(value),
                        )
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Descuento Promedio</h2>
         
          </div>

          <div className="mt-4 h-[260px] min-w-0">
            {isLoading || !data ? (
              <div className="h-full animate-pulse rounded-xl bg-gray-100" />
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ComposedChart data={descuentoChartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b5563" }} />
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
                    formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name)]}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <ReferenceLine
                    y={8}
                    stroke="#dc2626"
                    strokeDasharray="6 6"
                    strokeWidth={2}
                    label={{ value: "Target 8%", position: "insideTopRight", fill: "#dc2626", fontSize: 11 }}
                  />
                  <Legend />
                  <Bar dataKey="descuentoPromedio" name="Descuento promedio" fill="#7c3aed" radius={[6, 6, 0, 0]}>
                    <LabelList
                      dataKey="descuentoPromedio"
                      position="insideTop"
                      offset={10}
                      fill="#ffffff"
                      fontSize={11}
                      fontWeight={700}
                      formatter={(value) =>
                        value === null || value === undefined || value === ""
                          ? ""
                          : `${Math.round(Number(value))}%`
                      }
                    />
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="descuentoPromedioHilux"
                    name="Descuento promedio Hilux"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      {!isLoading && data && !hasData ? (
        <section className="rounded-xl border border-dashed border-[#b7d8e3] bg-white px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4f3fa] text-[#15aa9a]">
            <Inbox size={20} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">No hay operaciones para mostrar</h2>
          <p className="mt-1 text-sm text-gray-500">
            Proba cambiar el ano o el vendedor para ampliar el resultado.
          </p>
        </section>
      ) : null}

      {!isLoading && data && data.operations.length ? (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <p className="text-sm font-medium text-gray-600">
              {data.operations.length} operaciones encontradas para {data.context.vendedorLabel.toLowerCase()} en {anio}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {TABLE_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {data.operations.map((row) => (
                  <tr key={`${row.numero ?? "sin-numero"}-${row.interno ?? "sin-interno"}-${row.modelo}`} className="hover:bg-gray-50/70">
                    {TABLE_COLUMNS.map((column) => {
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
                          key={`${row.numero ?? "sin-numero"}-${String(column.key)}`}
                          className={`whitespace-nowrap px-2 py-1.5 text-xs text-gray-700 ${colorClassName}`}
                        >
                          {formatCellValue(row, column)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
