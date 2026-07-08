import type { TransferenciasDashboardGeneral } from "@/services/transferenciasDashboardService";
import { ArrowLeft, ArrowRight, Percent, Trophy, TrendingUp } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TransferenciasGeneralSectionProps = {
  data: TransferenciasDashboardGeneral;
  onPageChange?: (page: number) => void;
};

const formatInteger = (value: number) => value.toLocaleString("es-AR");

const formatPercentage = (value: number) =>
  `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] ${className}`}>
      {children}
    </div>
  );
}

export default function TransferenciasGeneralSection({
  data,
  onPageChange,
}: TransferenciasGeneralSectionProps) {
  const hasTrend = data.trend.length > 0;
  const hasTopVehicles = data.topVehicles.length > 0;
  const averageTrendValue = hasTrend
    ? data.trend.reduce((sum, point) => sum + point.total, 0) / data.trend.length
    : 0;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total transferencias</p>
              <div className="mt-4 flex items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {formatInteger(data.summary.totalTransferencias)}
                </h3>
              </div>
              <p className="mt-2 text-sm text-slate-500">Acumulado del anio seleccionado en Zona NIC.</p>
            </div>
            <div className="rounded-2xl bg-[#ecfdf8] p-3 text-[#128c80]">
              <TrendingUp size={20} />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Market share NIC</p>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {formatPercentage(data.summary.marketShare)}
                </h3>
                <span className="text-sm font-semibold text-slate-500">
                  {formatInteger(data.summary.totalOperaciones)} / {formatInteger(data.summary.totalTransferencias)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Porcentaje de operaciones propias sobre el total de transferencias del anio en Zona NIC.
              </p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
              <Percent size={20} />
            </div>
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Marca lider</p>
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {data.summary.marketLeader?.brand ?? "-"}
                </h3>
                {data.summary.marketLeader ? (
                  <span className="text-sm font-semibold text-slate-500">
                    {formatPercentage(data.summary.marketLeader.percentage)} share
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {data.summary.marketLeader
                  ? `${formatInteger(data.summary.marketLeader.total)} transferencias acumuladas en Zona NIC.`
                  : "Todavia no hay datos importados para calcular la marca lider."}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <Trophy size={20} />
            </div>
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <DashboardCard className="overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">Tendencia de transferencias</h3>
              <p className="text-sm text-slate-500">Transferencias de Zona NIC y operaciones asignadas por mes.</p>
              </div>
              <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                Market share anual {formatPercentage(data.summary.marketShare)}
              </div>
            </div>
          </div>

          <div className="px-5 py-6">
            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top,_rgba(21,170,154,0.1),_transparent_50%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] p-4">
              <div className="h-72 rounded-[18px] bg-white/60 p-2">
                {hasTrend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.trend} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid stroke="#dbeafe" strokeDasharray="3 3" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        tickFormatter={(value) => formatInteger(Number(value))}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 16,
                          borderColor: "#cfe7ee",
                          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                        }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) {
                            return null;
                          }

                          const transferencias = Number(payload.find((item) => item.dataKey === "total")?.value ?? 0);
                          const operaciones = Number(payload.find((item) => item.dataKey === "operaciones")?.value ?? 0);
                          const marketShare = Number(payload[0]?.payload?.marketShare ?? 0);

                          return (
                            <div className="rounded-2xl border border-[#cfe7ee] bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
                              <div className="mt-2 space-y-1 text-sm text-slate-700">
                                <div className="flex items-center justify-between gap-4">
                                  <span>Transferencias</span>
                                  <span className="font-semibold text-slate-950">{formatInteger(transferencias)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span>Operaciones</span>
                                  <span className="font-semibold text-slate-950">{formatInteger(operaciones)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span>Market share</span>
                                  <span className="font-semibold text-[#0f766e]">{formatPercentage(marketShare)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine
                        y={averageTrendValue}
                        stroke="#0f766e"
                        strokeDasharray="6 6"
                        strokeWidth={2}
                        ifOverflow="extendDomain"
                        label={{
                          value: `Promedio ${formatInteger(Math.round(averageTrendValue))}`,
                          position: "insideTopRight",
                          fill: "#0f766e",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="operaciones"
                        fill="#cbd5e1"
                        radius={[10, 10, 0, 0]}
                        barSize={26}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#15aa9a"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#15aa9a", stroke: "#15aa9a" }}
                        activeDot={{ r: 6, fill: "#15aa9a", stroke: "#15aa9a" }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 text-center text-sm text-slate-500">
                    No hay informacion suficiente para graficar la tendencia mensual de Zona NIC.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DashboardCard>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <DashboardCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">Top marca / modelo / ano</h3>
              <p className="text-sm text-slate-500">Ranking de transferencias de Zona NIC ordenado de mayor a menor.</p>
            </div>
          </div>

          <div className="overflow-x-auto px-4 py-3">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Rank</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Marca</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Modelo</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Ano</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Unidades</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasTopVehicles ? (
                  data.topVehicles.map((vehicle) => (
                    <tr key={`${vehicle.rank}-${vehicle.brand}-${vehicle.model}-${vehicle.year}`} className="transition hover:bg-slate-50">
                      <td className="py-2.5 text-xs text-slate-500">{String(vehicle.rank).padStart(2, "0")}</td>
                      <td className="py-2.5 text-xs text-slate-700">{vehicle.brand}</td>
                      <td className="py-2.5 text-xs font-semibold text-slate-950">{vehicle.model}</td>
                      <td className="py-2.5 text-xs text-slate-700">{vehicle.year}</td>
                      <td className="py-2.5 text-xs text-slate-700">{formatInteger(vehicle.total)}</td>
                      <td className="py-2.5 text-xs font-semibold text-[#128c80]">{formatPercentage(vehicle.percentage)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      No hay transferencias disponibles para el anio seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {data.pagination.total > 0
                ? `Mostrando ${data.topVehicles.length} de ${formatInteger(data.pagination.total)} combinaciones.`
                : "No hay resultados disponibles para paginar."}
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">
                Pagina {data.pagination.page} de {Math.max(data.pagination.totalPages, 1)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange?.(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft size={16} />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => onPageChange?.(data.pagination.page + 1)}
                  disabled={data.pagination.totalPages === 0 || data.pagination.page >= data.pagination.totalPages}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </DashboardCard>
      </section>
    </div>
  );
}
