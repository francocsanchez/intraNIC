import Loading from "@/components/Loading";
import { getTrackingOperaciones } from "@/api/dms/dmsAPI";
import type { TrackingOperacionesResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { Building2, Gauge, Route, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MESES = [
  { label: "Enero", value: 1 },
  { label: "Febrero", value: 2 },
  { label: "Marzo", value: 3 },
  { label: "Abril", value: 4 },
  { label: "Mayo", value: 5 },
  { label: "Junio", value: 6 },
  { label: "Julio", value: 7 },
  { label: "Agosto", value: 8 },
  { label: "Septiembre", value: 9 },
  { label: "Octubre", value: 10 },
  { label: "Noviembre", value: 11 },
  { label: "Diciembre", value: 12 },
];

const RING_MAX_VALUE = 20;

const STATUS_STYLES = {
  bueno: {
    badge: "bg-emerald-100 text-emerald-700",
    ring: "#16a34a",
  },
  medio: {
    badge: "bg-amber-100 text-amber-700",
    ring: "#f59e0b",
  },
  malo: {
    badge: "bg-rose-100 text-rose-700",
    ring: "#ef4444",
  },
  "sin-datos": {
    badge: "bg-gray-100 text-gray-600",
    ring: "#94a3b8",
  },
} as const;

function RingIndicatorCard({
  title,
  subtitle,
  value,
  statusKey,
  statusLabel,
  totalOperaciones,
}: {
  title: string;
  subtitle: string;
  value: number;
  statusKey: keyof typeof STATUS_STYLES;
  statusLabel: string;
  totalOperaciones: number;
}) {
  const styles = STATUS_STYLES[statusKey];
  const normalizedValue = Math.max(0, Math.min(value, RING_MAX_VALUE));
  const ringData = totalOperaciones
    ? [
        { name: "valor", value: normalizedValue, fill: styles.ring },
        { name: "resto", value: Math.max(RING_MAX_VALUE - normalizedValue, 0.001), fill: "#e5e7eb" },
      ]
    : [{ name: "sin-datos", value: 1, fill: "#e5e7eb" }];

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>

        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-6">
        <div className="relative mx-auto h-[220px] w-full max-w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ringData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={86}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                cornerRadius={totalOperaciones ? 10 : 0}
                paddingAngle={totalOperaciones ? 2 : 0}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-4xl font-bold tracking-tight text-gray-900">{value.toFixed(1)}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              días
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className="mx-auto flex max-w-[280px] flex-wrap items-center justify-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">Bueno ≤ 10</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">Medio 11 a 14</span>
          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">Malo ≥ 15</span>
        </div>
        <p className="mt-3 text-sm text-gray-500">Días promedio de entrega</p>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm">
        <span className="text-gray-500">Operaciones medidas</span>
        <span className="font-semibold text-gray-900">{totalOperaciones}</span>
      </div>
    </article>
  );
}

export default function TrackingOperacionesView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [anio, setAnio] = useState<number>(currentYear);
  const anios = useMemo(() => Array.from({ length: 6 }, (_, index) => currentYear - index), [currentYear]);

  const { data, isLoading, isError, error } = useQuery<TrackingOperacionesResponse>({
    queryKey: ["tracking-operaciones", mes, anio],
    queryFn: () => getTrackingOperaciones(mes, anio),
    refetchOnWindowFocus: true,
  });

  const resumen = data?.resumen;
  const mensual = resumen?.mensual;
  const porSucursal = resumen?.porSucursal ?? [];
  const graficoAnual = resumen?.graficoAnual ?? [];
  const sucursalesVisibles = porSucursal.slice(0, 3);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar la trazabilidad operativa
          </h1>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener la información."}
          </p>
        </section>
      </div>
    );
  }

  if (!resumen || !mensual) return <Loading />;

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Convencional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Trazabilidad operativa
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Seguimiento del tiempo promedio entre facturación y entrega de unidades.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-semibold text-gray-900">Mes</span>
              <select
                value={mes}
                onChange={(event) => setMes(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                {MESES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-semibold text-gray-900">Año</span>
              <select
                value={anio}
                onChange={(event) => setAnio(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                {anios.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_2fr]">
        <RingIndicatorCard
          title="Indicador general"
          subtitle={`${resumen.periodo.label} ${resumen.periodo.ano}`}
          value={mensual.promedioDias}
          statusKey={mensual.estado.key}
          statusLabel={mensual.estado.label}
          totalOperaciones={mensual.totalOperaciones}
        />

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                Evolución mensual
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Promedio de días de entrega por mes durante {anio}.
              </p>
            </div>

            <div className="rounded-full bg-[#eef9f7] px-3 py-1 text-xs font-semibold text-[#0f8f82]">
              Bueno ≤ 10 · Medio 11 a 14 · Malo ≥ 15
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-3 text-[#15aa9a] ring-1 ring-gray-200">
                  <Gauge size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Promedio</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{mensual.promedioDias.toFixed(1)}</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-3 text-[#15aa9a] ring-1 ring-gray-200">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Operaciones</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{mensual.totalOperaciones}</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-3 text-[#15aa9a] ring-1 ring-gray-200">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sucursales</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{porSucursal.length}</p>
                </div>
              </div>
            </article>
          </div>

          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graficoAnual}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals />
                <Tooltip
                  formatter={(value) => {
                    const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                    return [`${numericValue.toFixed(1)} días`, "Promedio"];
                  }}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="promedioDias"
                  stroke="#15aa9a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#15aa9a" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {sucursalesVisibles.map((item) => (
          <RingIndicatorCard
            key={item.sucursal}
            title={item.sucursal}
            subtitle="Promedio por sucursal"
            value={item.promedioDias}
            statusKey={item.estado.key}
            statusLabel={item.estado.label}
            totalOperaciones={item.totalOperaciones}
          />
        ))}

        {!sucursalesVisibles.length ? (
          <article className="xl:col-span-3 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
              <TrendingUp size={22} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Sin datos para el período</h2>
            <p className="mt-2 text-sm text-gray-500">
              No hay entregas registradas en {resumen.periodo.label.toLowerCase()} de {resumen.periodo.ano}.
            </p>
          </article>
        ) : null}
      </section>

      {sucursalesVisibles.length ? (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {sucursalesVisibles.map((item) => (
            <article
              key={`${item.sucursal}-grafico`}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-gray-900">
                    {item.sucursal}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Evolución mensual del promedio de entrega.
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {item.totalOperaciones} operaciones
                </span>
              </div>

              <div className="mt-6 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.graficoAnual}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals />
                    <Tooltip
                      formatter={(value) => {
                        const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                        return [`${numericValue.toFixed(1)} días`, "Promedio"];
                      }}
                      labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="promedioDias"
                      stroke="#15aa9a"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#15aa9a" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
