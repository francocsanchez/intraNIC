import type { PatentamientosDashboardTable } from "@/services/patentamientosDashboardService";
import { Fragment } from "react";

type PatentamientosComparisonTableProps = {
  data: PatentamientosDashboardTable;
  showMonthlyParticipation?: boolean;
};

const ZONA_NIC_LEGEND = [
  "Zona NIC - ALLEN, BARILOCHE, CENTENARIO, CHOELE CHOEL, CINCO SALTOS, CIPOLLETTI, CUTRAL CO, GENERAL ROCA, MAQUINCHAO, NEUQUEN, PLAZA HUINCUL, PLOTTIER, SAN MARTIN DE LOS ANDES, VILLA LA ANGOSTURA, VILLA REGINA, ZAPALA",
];

const formatInteger = (value: number) => value.toLocaleString("es-AR");

const formatPercentage = (value: number) =>
  `${value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const isToyotaRow = (label: string) => normalizeText(label).startsWith("TOYOTA");

const getHeatmapStyle = (value: number, min: number, max: number) => {
  if (max <= min) {
    return {
      backgroundColor: "rgb(254, 243, 199)",
      color: "#111827",
    };
  }

  const ratio = (value - min) / (max - min);
  const hue = Math.round(ratio * 120);
  const saturation = 75;
  const lightness = 58 - ratio * 16;

  return {
    backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    color: ratio > 0.58 ? "#ffffff" : "#111827",
  };
};

export default function PatentamientosComparisonTable({
  data,
  showMonthlyParticipation = false,
}: PatentamientosComparisonTableProps) {
  const percentages = data.rows.map((row) => row.percentage);
  const minPercentage = percentages.length ? Math.min(...percentages) : 0;
  const maxPercentage = percentages.length ? Math.max(...percentages) : 0;
  const isZonaNicTable = data.title.includes("Zona NIC");
  const getMonthlyParticipation = (value: number, monthKey: string) => {
    const monthTotal = data.totalRow.months[monthKey] ?? 0;

    if (monthTotal <= 0) {
      return 0;
    }

    return (value / monthTotal) * 100;
  };

  return (
    <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-3 py-2">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">{data.title}</h2>
        {isZonaNicTable ? (
          <div className="mt-2 space-y-1 text-[11px] leading-snug text-gray-400">
            {ZONA_NIC_LEGEND.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className='min-w-full border-collapse text-[12px] font-["IBM_Plex_Mono"]'>
          <thead className="bg-black text-white">
            <tr>
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">{data.entityLabel}</th>
              {data.months.map((month) => (
                <Fragment key={`${data.title}-${month.key}-${month.year}-group`}>
                  <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">
                    {month.label}
                  </th>
                  {showMonthlyParticipation ? (
                    <th
                      className="border border-gray-300 px-2 py-1.5 text-center font-semibold"
                    >
                      %
                    </th>
                  ) : null}
                </Fragment>
              ))}
              <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">Total</th>
              <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold">%</th>
            </tr>
          </thead>

          <tbody>
            {data.rows.length ? (
              <>
                {data.rows.map((row, index) => (
                  <tr key={`${data.title}-${row.label}`} className={index % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                    <td
                      className={`border border-gray-200 px-2 py-1.5 text-left font-medium text-gray-900 ${
                        isToyotaRow(row.label) ? "bg-red-100" : ""
                      }`}
                    >
                      {row.label}
                    </td>
                    {data.months.map((month) => (
                      <Fragment key={`${row.label}-${month.key}-group`}>
                        <td
                          className={`border border-gray-200 px-2 py-1.5 text-center text-gray-700 ${
                            isToyotaRow(row.label) ? "bg-red-100" : ""
                          }`}
                        >
                          {formatInteger(row.months[month.key] ?? 0)}
                        </td>
                        {showMonthlyParticipation ? (
                          <td
                            className={`border border-gray-200 px-2 py-1.5 text-center text-gray-700 ${
                              isToyotaRow(row.label) ? "bg-red-100" : ""
                            }`}
                          >
                            {formatPercentage(getMonthlyParticipation(row.months[month.key] ?? 0, month.key))}
                          </td>
                        ) : null}
                      </Fragment>
                    ))}
                    <td
                      className={`border border-gray-200 px-2 py-1.5 text-center font-bold text-gray-900 ${
                        isToyotaRow(row.label) ? "bg-red-100" : ""
                      }`}
                    >
                      {formatInteger(row.total)}
                    </td>
                    <td
                      className={`border border-gray-200 px-2 py-1.5 text-center font-bold ${
                        isToyotaRow(row.label) ? "border-red-300" : ""
                      }`}
                      style={getHeatmapStyle(row.percentage, minPercentage, maxPercentage)}
                    >
                      {formatPercentage(row.percentage)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-gray-100">
                  <td className="border border-gray-300 px-2 py-1.5 text-left font-bold text-gray-900">
                    {data.totalRow.label}
                  </td>
                  {data.months.map((month) => (
                    <Fragment key={`total-${month.key}-group`}>
                      <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-gray-900">
                        {formatInteger(data.totalRow.months[month.key] ?? 0)}
                      </td>
                      {showMonthlyParticipation ? (
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-gray-900">
                          {formatPercentage(data.totalRow.months[month.key] > 0 ? 100 : 0)}
                        </td>
                      ) : null}
                    </Fragment>
                  ))}
                  <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-gray-900">
                    {formatInteger(data.totalRow.total)}
                  </td>
                  <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-gray-900">
                    {formatPercentage(data.totalRow.percentage)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td
                  colSpan={data.months.length * (showMonthlyParticipation ? 2 : 1) + 3}
                  className="border border-gray-200 px-3 py-6 text-center text-sm text-gray-500"
                >
                  No hay informacion importada para esta comparativa en el ano seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
