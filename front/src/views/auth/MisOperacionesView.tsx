import Loading from "@/components/Loading";
import EChart from "@/components/charts/EChart";
import { textToColor } from "@/helpers/colores";
import { useAuth } from "@/hooks/useAuthe";
import { misOperaciones } from "@/api/convencional/stockAPI";
import { misOperacionesUsados } from "@/api/usados/stockAPI";
import type { MisOperacionesResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import type { EChartsCoreOption } from "echarts/core";

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

const MONTH_SHORT_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function getPresetChartPalette() {
  const styles = getComputedStyle(document.documentElement);
  return ["--foreground", "--muted-foreground", "--chart-3", "--chart-4", "--chart-5"].map((token) => styles.getPropertyValue(token).trim());
}

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
    if (descuento === null || descuento === undefined || Number.isNaN(descuento) || descuento <= 0) continue;

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

export default function MisOperacionesView() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const negocio = pathname.startsWith("/usados/") ? "usados" : "convencional";

  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState<number>(anioActual);
  const [mes, setMes] = useState<number>(() => new Date().getMonth() + 1);

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
  const chartPalette = useMemo(() => getPresetChartPalette(), []);
  const annualChartOption = useMemo<EChartsCoreOption>(() => ({
    color: chartPalette,
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, textStyle: { color: chartPalette[1] } },
    grid: { top: 20, right: 12, bottom: 36, left: 36 },
    xAxis: { type: "category", data: annualChart.data.map((item) => String(item.mes)), axisLine: { lineStyle: { color: chartPalette[1] } }, axisTick: { show: false }, axisLabel: { color: chartPalette[1] } },
    yAxis: { type: "value", minInterval: 1, axisLine: { show: false }, splitLine: { lineStyle: { color: chartPalette[1], opacity: 0.2 } }, axisLabel: { color: chartPalette[1] } },
    series: [
      ...annualChart.modelKeys.map((key, index) => ({ type: "bar" as const, name: key === "otros" ? "OTROS" : key, stack: "modelos", barMaxWidth: 28, data: annualChart.data.map((item) => Number(item[key] ?? 0)), itemStyle: { color: chartPalette[index % chartPalette.length] } })),
      { type: "line" as const, name: "TOTAL", data: annualChart.data.map((item) => Number(item.total)), smooth: true, symbolSize: 6, lineStyle: { width: 2, color: chartPalette[0] }, itemStyle: { color: chartPalette[0] }, label: { show: true, position: "top", color: chartPalette[0], fontSize: 11 } },
    ],
  }), [annualChart, chartPalette]);
  const dailyChartOption = useMemo<EChartsCoreOption>(() => ({
    color: [chartPalette[0]],
    tooltip: { trigger: "axis" },
    grid: { top: 22, right: 8, bottom: 26, left: 32 },
    xAxis: { type: "category", data: ventasPorDia.map((item) => item.fechaCorta), axisLine: { lineStyle: { color: chartPalette[1] } }, axisTick: { show: false }, axisLabel: { color: chartPalette[1] } },
    yAxis: { type: "value", minInterval: 1, axisLine: { show: false }, splitLine: { lineStyle: { color: chartPalette[1], opacity: 0.2 } }, axisLabel: { color: chartPalette[1] } },
    series: [{ type: "bar", name: "Ventas", barMaxWidth: 32, data: ventasPorDia.map((item) => item.total), label: { show: true, position: "top", color: chartPalette[0], fontSize: 11 }, itemStyle: { color: chartPalette[0], borderRadius: [3, 3, 0, 0] } }],
  }), [chartPalette, ventasPorDia]);
  const modelChartOption = useMemo<EChartsCoreOption>(() => ({
    color: chartPalette,
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    series: [{ type: "pie", radius: ["48%", "72%"], label: { color: chartPalette[1] }, data: distribucionPorModelo.map((item) => ({ name: item.modelo, value: item.total })) }],
  }), [chartPalette, distribucionPorModelo]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar operaciones</h1>
          <p className="mt-2 text-sm text-destructive">No fue posible obtener la informacion.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mis operaciones</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{nombreUsuario}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Analisis de operaciones.</p>
          </div>

          <div className="flex items-center gap-3 self-start">
            <label htmlFor="anio" className="text-sm font-semibold text-foreground">
              Seleccione un ano
            </label>

            <select
              id="anio"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
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

      <section className="flex gap-1 overflow-x-auto">
        {MESES.map((item) => {
          const activo = mes === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setMes(item.value)}
              className={[
                "h-9 min-w-24 flex-1 whitespace-nowrap rounded-md border text-xs font-semibold transition-colors",
                activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </section>

      {showConvencionalExtraCharts ? (
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border px-3 py-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">Operaciones anualizadas del vendedor</h2>
              <p className="text-sm text-muted-foreground">Linea de total mensual y barras apiladas por modelo durante {anio}.</p>
            </div>

            <p className="text-sm text-muted-foreground">{nombreUsuario} · vendedor {user?.numberSaleNic ?? "-"}</p>
          </div>

          <div className="h-72 min-w-0 p-3">
            <EChart option={annualChartOption} />
          </div>
        </section>
      ) : null}

      <section className={`grid grid-cols-1 gap-3 ${showConvencionalExtraCharts ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
        <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <h2 className="border-b border-border px-3 py-3 text-base font-semibold tracking-tight text-foreground">Ventas por dia</h2>

          <div className={`min-w-0 p-3 ${showConvencionalExtraCharts ? "h-60" : "h-72"}`}>
            <EChart option={dailyChartOption} />
          </div>
        </article>

        <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <h2 className="border-b border-border px-3 py-3 text-base font-semibold tracking-tight text-foreground">Distribucion por modelo</h2>

          <div className={`relative min-w-0 p-3 ${showConvencionalExtraCharts ? "h-60" : "h-72"}`}>
            <EChart option={modelChartOption} />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{totalOperaciones}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-3 pb-3">
            {distribucionPorModelo.map((item, index) => (
              <div key={item.modelo} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: chartPalette[index % chartPalette.length],
                  }}
                />
                <span>{item.modelo}</span>
              </div>
            ))}
          </div>
        </article>

        {showConvencionalExtraCharts ? (
          <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="px-3 py-3">
                <h2 className="text-base font-semibold tracking-tight text-foreground">Descuento promedio</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Resumen de descuento aplicado en {mesActivo.toLowerCase()} de {anio}.
                </p>
              </div>

              <div className="px-3 py-3 text-right">
                <p className="text-3xl font-bold tracking-tight text-foreground">{formatPercentage(descuentoPromedioMes)}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Promedio total</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-border p-3">
              <div className="rounded-md border border-border bg-muted px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Promedio total del mes</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{formatPercentage(descuentoPromedioMes)}</p>
              </div>

              <div className="rounded-md border border-border">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">Promedio por modelo</p>
                </div>

                <div className="max-h-52 overflow-y-auto">
                  {descuentoPromedioPorModelo.length ? (
                    <div className="divide-y divide-border">
                      {descuentoPromedioPorModelo.map((item) => (
                        <div key={item.modelo} className="flex items-center justify-between gap-4 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{item.modelo}</p>
                            <p className="text-xs text-muted-foreground">{item.cantidad} operaciones</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-foreground">{formatPercentage(item.promedio)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground">Sin descuentos registrados para este mes.</div>
                  )}
                </div>
              </div>
            </div>
          </article>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border px-3 py-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Operaciones del mes</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {totalOperaciones} operaciones registradas en {mesActivo.toLowerCase()} de {anio}.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Operacion</th>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">Interno</th>
                <th className="px-3 py-2 text-left">Modelo</th>
                <th className="px-3 py-2 text-left">Version</th>
                <th className="px-3 py-2 text-left">Color</th>
                <th className="px-3 py-2 text-center">Fac</th>
                <th className="px-3 py-2 text-center">Entregado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {operaciones.map((item, index) => (
                <tr key={item.opera} className="hover:bg-muted">
                  <td className="px-3 py-1.5">{index + 1}</td>
                  <td className="px-3 py-1.5 font-medium">{item.opera}</td>
                  <td className="px-3 py-1.5">{item.clienteNombre}</td>
                  <td className="px-3 py-1.5">{item.interno}</td>
                  <td className="px-3 py-1.5">{item.modelo}</td>
                  <td className="px-3 py-1.5">{item.version}</td>
                  <td className="px-3 py-1.5">
                    <div className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(item.color)}`}>
                      {item.color}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex justify-center">
                      {item.fechaFactura ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-primary p-1 text-primary-foreground">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full bg-muted p-1 text-muted-foreground">
                          <X size={14} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-1.5">
                    <div className="flex justify-center">
                      {item.fechaEntrega ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-primary p-1 text-primary-foreground">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full bg-muted p-1 text-muted-foreground">
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
