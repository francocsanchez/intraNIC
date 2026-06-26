import type { PatentamientosDashboardGeneral } from "@/services/patentamientosDashboardService";
import { ArrowLeft, ArrowRight, Trophy, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PatentamientosGeneralSectionProps = {
  data: PatentamientosDashboardGeneral;
  onTopModelsPageChange?: (page: number) => void;
  selectedMonthLabel?: string | null;
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

export default function PatentamientosGeneralSection({
  data,
  onTopModelsPageChange,
  selectedMonthLabel = null,
}: PatentamientosGeneralSectionProps) {
  const hasTrend = data.trend.length > 0;
  const hasTopModels = data.topModels.length > 0;
  const topModelsPagination = data.topModelsPagination;
  const averageTrendValue = hasTrend
    ? data.trend.reduce((sum, point) => sum + point.total, 0) / data.trend.length
    : 0;

  return (
    <div className="space-y-6">

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total patentamientos</p>
              <div className="mt-4 flex items-end gap-2">
                <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {formatInteger(data.summary.totalPatentamientos)}
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
                  ? `${formatInteger(data.summary.marketLeader.total)} patentamientos acumulados en Zona NIC.`
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
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">Tendencia de patentamientos</h3>
              <p className="text-sm text-slate-500">
                {selectedMonthLabel && selectedMonthLabel !== "Todos"
                  ? `Inscripciones por dia de ${selectedMonthLabel} en Zona NIC.`
                  : "Evolucion mensual de patentamientos de Zona NIC."}
              </p>
            </div>
          </div>

          <div className="px-5 py-6">
            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top,_rgba(21,170,154,0.1),_transparent_50%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] p-4">
              <div className="h-72 rounded-[18px] bg-white/60 p-2">
                {hasTrend ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
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
                        formatter={(value, name) => [
                          formatInteger(Math.round(Number(value))),
                          name === "average" ? "Promedio" : "Patentamientos",
                        ]}
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
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#15aa9a"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#15aa9a", stroke: "#15aa9a" }}
                        activeDot={{ r: 6, fill: "#15aa9a", stroke: "#15aa9a" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 text-center text-sm text-slate-500">
                    {selectedMonthLabel && selectedMonthLabel !== "Todos"
                      ? `No hay informacion suficiente para graficar las inscripciones diarias de ${selectedMonthLabel}.`
                      : "No hay informacion suficiente para graficar la tendencia mensual de Zona NIC."}
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
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">Top modelos</h3>
              <p className="text-sm text-slate-500">
                Ranking de modelos de Zona NIC ordenado de mayor a menor.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#128c80]">
              Zona NIC
              <ArrowRight size={16} />
            </span>
          </div>

          <div className="overflow-x-auto px-4 py-3">
            <table className='min-w-full text-left font-["IBM_Plex_Mono"]'>
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Rank</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Modelo</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Unidades</th>
                  <th className="pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasTopModels ? (
                  data.topModels.map((model) => (
                    <tr key={`${model.rank}-${model.model}`} className="transition hover:bg-slate-50">
                      <td className="py-2.5 text-xs text-slate-500">{String(model.rank).padStart(2, "0")}</td>
                      <td className="py-2.5 text-xs font-semibold text-slate-950">{model.model}</td>
                      <td className="py-2.5 text-xs text-slate-700">{formatInteger(model.total)}</td>
                      <td className="py-2.5 text-xs font-semibold text-[#128c80]">{formatPercentage(model.percentage)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                      No hay modelos disponibles para el anio seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className='text-xs font-["IBM_Plex_Mono"] text-slate-500'>
              {topModelsPagination.total > 0
                ? `Mostrando ${data.topModels.length} de ${formatInteger(topModelsPagination.total)} modelos.`
                : "No hay modelos disponibles para paginar."}
            </p>

            <div className="flex items-center gap-3">
              <span className='text-xs font-semibold font-["IBM_Plex_Mono"] text-slate-700'>
                Pagina {topModelsPagination.page} de {Math.max(topModelsPagination.totalPages, 1)}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTopModelsPageChange?.(topModelsPagination.page - 1)}
                  disabled={topModelsPagination.page <= 1}
                  className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold font-["IBM_Plex_Mono"] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <ArrowLeft size={16} />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => onTopModelsPageChange?.(topModelsPagination.page + 1)}
                  disabled={topModelsPagination.totalPages === 0 || topModelsPagination.page >= topModelsPagination.totalPages}
                  className='inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold font-["IBM_Plex_Mono"] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50'
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
