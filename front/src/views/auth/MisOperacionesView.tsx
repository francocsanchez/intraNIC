import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import { useAuth } from "@/hooks/useAuthe";
import { misOperaciones } from "@/api/convencional/stockAPI";
import { misOperacionesUsados } from "@/api/usados/stockAPI";
import type { MisOperacionesResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MESES = [
  { label: "ENERO", value: 1 },
  { label: "FEBRERO", value: 2 },
  { label: "MARZO", value: 3 },
  { label: "ABRIL", value: 4 },
  { label: "MAYO", value: 5 },
  { label: "JUNIO", value: 6 },
  { label: "JULIO", value: 7 },
  { label: "AGOSTO", value: 8 },
  { label: "SEPTIEMBRE", value: 9 },
  { label: "OCTUBRE", value: 10 },
  { label: "NOVIEMBRE", value: 11 },
  { label: "DICIEMBRE", value: 12 },
];

const CHART_COLORS = ["#15aa9a", "#7bc8c2", "#b8e0d2", "#a7d8de", "#9fc3e6", "#b7b5e8", "#d2b7e5", "#e3bfd3"];
const COMBINED_MODEL_COLORS = ["#15aa9a", "#0f766e", "#3b82f6", "#f59e0b"];
const MONTH_SHORT_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function buildFullName(name?: string, lastName?: string) {
  return `${name ?? ""} ${lastName ?? ""}`.trim().toUpperCase() || "MIS OPERACIONES";
}

function formatShortDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatPercentage(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  return `${value.toFixed(1)}%`;
}

function buildCombinedAnnualChartData(resumen?: MisOperacionesResponse["resumen"]) {
  const anual = resumen?.anual ?? [];
  const modelTotals = new Map<string, number>();

  for (const month of anual) {
    for (const [modelo, total] of Object.entries(month.porModelo)) {
      modelTotals.set(modelo, (modelTotals.get(modelo) ?? 0) + total);
    }
  }

  const topModels = Array.from(modelTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([modelo]) => modelo);

  const data = anual.map((month: MisOperacionesResponse["resumen"]["anual"][number]) => {
    const point: Record<string, number | string> = {
      mes: MONTH_SHORT_LABELS[month.mes - 1] ?? String(month.mes),
      total: month.total,
      otros: 0,
    };

    for (const modelo of topModels) {
      point[modelo] = month.porModelo[modelo] ?? 0;
    }

    for (const [modelo, total] of Object.entries(month.porModelo) as Array<[string, number]>) {
      if (!topModels.includes(modelo)) {
        point.otros = Number(point.otros ?? 0) + total;
      }
    }

    return point;
  });

  const visibleModels = topModels.filter((modelo) => data.some((item) => Number(item[modelo] ?? 0) > 0));
  const showOtros = data.some((item) => Number(item.otros ?? 0) > 0);

  return {
    data,
    modelKeys: showOtros ? [...visibleModels, "otros"] : visibleModels,
  };
}

function buildMonthlyDiscountByModel(rows: MisOperacionesResponse["data"]) {
  const accumulator = new Map<string, { total: number; count: number }>();

  for (const row of rows) {
    const descuento = row.descuentoPorcentaje;
    if (descuento === null || descuento === undefined || Number.isNaN(descuento)) continue;

    const modelo = row.modelo?.trim() || "SIN MODELO";
    const current = accumulator.get(modelo) ?? { total: 0, count: 0 };
    current.total += descuento;
    current.count += 1;
    accumulator.set(modelo, current);
  }

  return Array.from(accumulator.entries())
    .map(([modelo, value]) => ({
      modelo,
      promedio: value.count > 0 ? value.total / value.count : 0,
      cantidad: value.count,
    }))
    .sort((a, b) => b.promedio - a.promedio);
}

function ChartPlaceholder({ className = "" }: { className?: string }) {
  return <div className={`h-full w-full animate-pulse rounded-xl bg-gray-100 ${className}`.trim()} />;
}

export default function MisOperacionesView() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const negocio = pathname.startsWith("/usados/") ? "usados" : "convencional";

  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState<number>(anioActual);
  const [mes, setMes] = useState<number>(() => new Date().getMonth() + 1);
  const [readyChartKey, setReadyChartKey] = useState("");

  const ANIOS = Array.from({ length: 5 }, (_, i) => anioActual - i);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["misVentas", negocio, mes, anio, user?._id],
    queryFn: () => (negocio === "usados" ? misOperacionesUsados(mes, anio) : misOperaciones(mes, anio)),
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
  });

  const operaciones = useMemo(() => data?.data ?? [], [data?.data]);
  const resumen = data?.resumen;
  const showConvencionalExtraCharts = negocio === "convencional";

  const ventasPorDia = useMemo(() => {
    return (Object.entries(resumen?.porDia ?? {}) as Array<[string, number]>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, total]) => ({
        fecha,
        fechaCorta: formatShortDate(fecha),
        total,
      }));
  }, [resumen]);

  const distribucionPorModelo = useMemo(() => {
    return (Object.entries(resumen?.porModelo ?? {}) as Array<[string, number]>)
      .sort((a, b) => b[1] - a[1])
      .map(([modelo, total]) => ({
        modelo,
        total,
      }));
  }, [resumen]);

  const annualChart = useMemo(() => buildCombinedAnnualChartData(resumen), [resumen]);
  const descuentoPromedioMes = resumen?.descuentoPromedioMes ?? null;
  const descuentoPromedioPorModelo = useMemo(() => buildMonthlyDiscountByModel(operaciones), [operaciones]);
  const totalOperaciones = resumen?.total ?? operaciones.length;
  const nombreUsuario = buildFullName(user?.name, user?.lastName);
  const mesActivo = MESES.find((item) => item.value === mes)?.label ?? "";
  const chartKey = `${negocio}-${anio}-${mes}`;
  const chartsReady = readyChartKey === chartKey;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setReadyChartKey(chartKey);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [chartKey]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar operaciones</h1>
          <p className="mt-2 text-sm text-red-600">No fue posible obtener la informacion.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{nombreUsuario}</h1>
            <p className="mt-1 text-sm text-gray-500">Analisis de operaciones.</p>
          </div>

          <div className="flex items-center gap-3 self-start">
            <label htmlFor="anio" className="text-sm font-semibold text-gray-900">
              Seleccione un ano
            </label>

            <select
              id="anio"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            >
              {ANIOS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-12">
        {MESES.map((item) => {
          const activo = mes === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setMes(item.value)}
              className={[
                "h-12 rounded-xl border text-sm font-semibold transition-colors",
                activo ? "border-gray-950 bg-gray-950 text-white shadow-sm" : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </section>

      {showConvencionalExtraCharts ? (
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Operaciones anualizadas del vendedor</h2>
              <p className="text-sm text-gray-500">Linea de total mensual y barras apiladas por modelo durante {anio}.</p>
            </div>

            <p className="text-sm text-gray-500">{nombreUsuario} · vendedor {user?.numberSaleNic ?? "-"}</p>
          </div>

          <div className="mt-5 h-[19rem] min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
                <ComposedChart data={annualChart.data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} />
                  <Tooltip />
                  <Legend />
                {annualChart.modelKeys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={key === "otros" ? "#cbd5e1" : COMBINED_MODEL_COLORS[index % COMBINED_MODEL_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    name={key === "otros" ? "OTROS" : key}
                    maxBarSize={28}
                  />
                ))}
                <Line type="monotone" dataKey="total" name="TOTAL" stroke="#111827" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }}>
                  <LabelList dataKey="total" position="top" style={{ fill: "#111827", fontSize: 12, fontWeight: 700 }} />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
              <ChartPlaceholder />
            )}
          </div>
        </section>
      ) : null}

      <section className={`grid grid-cols-1 gap-6 ${showConvencionalExtraCharts ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
        <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Ventas por dia</h2>

          <div className={`mt-6 min-w-0 ${showConvencionalExtraCharts ? "h-60" : "h-72"}`}>
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <BarChart data={ventasPorDia}>
                  <XAxis dataKey="fechaCorta" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} />
                  <Tooltip formatter={(value) => [Number(value ?? 0), "Ventas"]} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#15aa9a" maxBarSize={42}>
                    <LabelList dataKey="total" position="top" style={{ fill: "#374151", fontSize: 12 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder />
            )}
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Distribucion por modelo</h2>

          <div className={`relative mt-6 min-w-0 ${showConvencionalExtraCharts ? "h-60" : "h-72"}`}>
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
                <PieChart>
                  <Pie data={distribucionPorModelo} dataKey="total" nameKey="modelo" innerRadius={showConvencionalExtraCharts ? 48 : 60} outerRadius={showConvencionalExtraCharts ? 84 : 95} paddingAngle={3}>
                    {distribucionPorModelo.map((entry, index) => (
                      <Cell key={entry.modelo} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, _name, props) => [Number(value ?? 0), props?.payload?.modelo ?? "Modelo"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder className="absolute inset-0" />
            )}

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{totalOperaciones}</p>
                <p className="text-xs uppercase tracking-wider text-gray-500">Total</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {distribucionPorModelo.map((item, index) => (
              <div key={item.modelo} className="flex items-center gap-2 text-sm text-gray-700">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span>{item.modelo}</span>
              </div>
            ))}
          </div>
        </article>

        {showConvencionalExtraCharts ? (
          <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-gray-900">Descuento promedio</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Resumen de descuento aplicado en {mesActivo.toLowerCase()} de {anio}.
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold tracking-tight text-gray-900">{formatPercentage(descuentoPromedioMes)}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Promedio total</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Promedio total del mes</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-950">{formatPercentage(descuentoPromedioMes)}</p>
              </div>

              <div className="rounded-xl border border-gray-200">
                <div className="border-b border-gray-200 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">Promedio por modelo</p>
                </div>

                <div className="max-h-52 overflow-y-auto">
                  {descuentoPromedioPorModelo.length ? (
                    <div className="divide-y divide-gray-100">
                      {descuentoPromedioPorModelo.map((item) => (
                        <div key={item.modelo} className="flex items-center justify-between gap-4 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">{item.modelo}</p>
                            <p className="text-xs text-gray-500">{item.cantidad} operaciones</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-gray-900">{formatPercentage(item.promedio)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-sm text-gray-500">Sin descuentos registrados para este mes.</div>
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Operaciones del mes</h2>

          <p className="mt-1 text-sm text-gray-500">
            {totalOperaciones} operaciones registradas en {mesActivo.toLowerCase()} de {anio}.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Operacion</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left">Interno</th>
                <th className="px-6 py-3 text-left">Modelo</th>
                <th className="px-6 py-3 text-left">Version</th>
                <th className="px-6 py-3 text-left">Color</th>
                <th className="px-6 py-3 text-center">Fac</th>
                <th className="px-6 py-3 text-center">Entregado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {operaciones.map((item, index) => (
                <tr key={item.opera} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{index + 1}</td>
                  <td className="px-6 py-3 font-medium">{item.opera}</td>
                  <td className="px-6 py-3">{item.clienteNombre}</td>
                  <td className="px-6 py-3">{item.interno}</td>
                  <td className="px-6 py-3">{item.modelo}</td>
                  <td className="px-6 py-3">{item.version}</td>
                  <td className="px-4 py-4">
                    <div className={`inline-block rounded-md border border-slate-200 px-2 py-1 text-xs font-medium ${textToColor(item.color)} `}>
                      {item.color}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-center">
                      {item.fechaFactura ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-1 text-green-700">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 p-1 text-red-700">
                          <X size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-3">
                    <div className="flex justify-center">
                      {item.fechaEntrega ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-1 text-green-700">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 p-1 text-red-700">
                          <X size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
