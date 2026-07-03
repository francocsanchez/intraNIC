import Loading from "@/components/Loading";
import { getPlanNegocioResumen } from "@/api/dms/planNegocioAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const MONTH_COLUMNS = [
  ["ene", "ENE"],
  ["feb", "FEB"],
  ["mar", "MAR"],
  ["abr", "ABR"],
  ["may", "MAY"],
  ["jun", "JUN"],
  ["jul", "JUL"],
  ["ago", "AGO"],
  ["sep", "SEP"],
  ["oct", "OCT"],
  ["nov", "NOV"],
  ["dic", "DIC"],
] as const;

export default function PlanNegocioView() {
  const currentYear = new Date().getFullYear();
  const [anio, setAnio] = useState(currentYear);
  const years = useMemo(() => Array.from({ length: 6 }, (_, index) => currentYear + 1 - index), [currentYear]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["plan-negocio-resumen", anio],
    queryFn: () => getPlanNegocioResumen(anio),
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Plan de negocio</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const total = data?.total;

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Plan de negocio</h1>
            <p className="mt-1 text-sm text-gray-500">Seguimiento anual del objetivo por modelo contra asignaciones recibidas.</p>
          </div>

          <div className="flex items-center gap-3 self-start">
            <label htmlFor="plan-negocio-anio" className="text-sm font-semibold text-gray-900">
              Seleccione un año
            </label>
            <select
              id="plan-negocio-anio"
              value={anio}
              onChange={(event) => setAnio(Number(event.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Tablero anual</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1400px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left">Modelo</th>
                <th className="px-4 py-3 text-center">Objetivo</th>
                {MONTH_COLUMNS.map(([, label]) => (
                  <th key={label} className="px-4 py-3 text-center">
                    {label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center">% avance</th>
                <th className="px-4 py-3 text-center">Restante</th>
                <th className="px-4 py-3 text-center">x mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.modelo} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-4 py-3 font-semibold text-gray-900">{row.modelo}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{row.objetivo}</td>
                  {MONTH_COLUMNS.map(([key]) => (
                    <td key={key} className="px-4 py-3 text-center text-gray-700">
                      {row[key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-semibold text-[#15aa9a]">{row.avance}%</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{row.restante}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">{row.xMes}</td>
                </tr>
              ))}

              {total ? (
                <tr className="bg-gray-100">
                  <td className="sticky left-0 bg-gray-100 px-4 py-3 font-bold text-gray-900">{total.modelo}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{total.objetivo}</td>
                  {MONTH_COLUMNS.map(([key]) => (
                    <td key={key} className="px-4 py-3 text-center font-bold text-gray-900">
                      {total[key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold text-[#15aa9a]">{total.avance}%</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{total.restante}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{total.xMes}</td>
                </tr>
              ) : null}

              {!rows.length ? (
                <tr>
                  <td colSpan={16} className="px-4 py-12 text-center text-sm text-gray-500">
                    No hay objetivos o asignaciones para {anio}.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
