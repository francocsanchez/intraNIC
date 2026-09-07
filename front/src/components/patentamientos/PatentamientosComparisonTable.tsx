import type { PatentamientosDashboardTable } from "@/services/patentamientosDashboardService";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Fragment } from "react";

type PatentamientosComparisonTableProps = {
  data: PatentamientosDashboardTable;
  showMonthlyParticipation?: boolean;
  showMonthlyTrendArrows?: boolean;
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

// Escala de negocio solicitada: menor participacion en rojo suave y mayor en verde suave.
const SOFT_HEATMAP_RED_HUE = 8;
const SOFT_HEATMAP_GREEN_HUE = 142;
const SOFT_HEATMAP_SATURATION = 58;
const SOFT_HEATMAP_LIGHTNESS = 86;

const getHeatmapStyle = (value: number, min: number, max: number) => {
  if (max <= min) {
    return {
      backgroundColor: "var(--secondary)",
      color: "var(--secondary-foreground)",
    };
  }

  const ratio = (value - min) / (max - min);
  const hue = SOFT_HEATMAP_RED_HUE + ratio * (SOFT_HEATMAP_GREEN_HUE - SOFT_HEATMAP_RED_HUE);

  return {
    backgroundColor: `hsl(${hue} ${SOFT_HEATMAP_SATURATION}% ${SOFT_HEATMAP_LIGHTNESS}%)`,
    color: "var(--foreground)",
  };
};

export default function PatentamientosComparisonTable({
  data,
  showMonthlyParticipation = false,
  showMonthlyTrendArrows = false,
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
  const getPreviousMonthKey = (monthIndex: number) => {
    if (monthIndex <= 0) {
      return null;
    }

    return data.months[monthIndex - 1]?.key ?? null;
  };
  const getMonthlyTrendDirection = (rowMonths: Record<string, number>, monthIndex: number) => {
    const currentMonthKey = data.months[monthIndex]?.key;
    const previousMonthKey = getPreviousMonthKey(monthIndex);

    if (!currentMonthKey || !previousMonthKey) {
      return null;
    }

    const currentMonthTotal = data.totalRow.months[currentMonthKey] ?? 0;
    const previousMonthTotal = data.totalRow.months[previousMonthKey] ?? 0;

    if (currentMonthTotal <= 0 || previousMonthTotal <= 0) {
      return null;
    }

    const currentParticipation = getMonthlyParticipation(rowMonths[currentMonthKey] ?? 0, currentMonthKey);
    const previousParticipation = getMonthlyParticipation(rowMonths[previousMonthKey] ?? 0, previousMonthKey);

    if (currentParticipation > previousParticipation) {
      return "up";
    }

    if (currentParticipation < previousParticipation) {
      return "down";
    }

    return null;
  };

  return (
    <section className="print-comparison-card overflow-hidden rounded-lg border border-input bg-card shadow-sm">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{data.title}</h2>
        {isZonaNicTable ? (
          <div className="print-comparison-legend mt-2 space-y-1 text-primary leading-snug text-muted-foreground">
            {ZONA_NIC_LEGEND.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="print-comparison-scroll overflow-x-auto">
        <table className="print-comparison-table min-w-full border-collapse text-primary">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              <th className="border border-input px-2 py-1.5 text-left font-semibold">{data.entityLabel}</th>
              {data.months.map((month) => (
                <Fragment key={`${data.title}-${month.key}-${month.year}-group`}>
                  <th className="border border-input px-2 py-1.5 text-center font-semibold">
                    {month.label}
                  </th>
                  {showMonthlyParticipation ? (
                    <th
                      className="border border-input px-2 py-1.5 text-center font-semibold"
                    >
                      %
                    </th>
                  ) : null}
                </Fragment>
              ))}
              <th className="border border-input px-2 py-1.5 text-center font-semibold">Total</th>
              <th className="border border-input px-2 py-1.5 text-center font-semibold">%</th>
            </tr>
          </thead>

          <tbody>
            {data.rows.length ? (
              <>
                {data.rows.map((row, index) => (
                  <tr key={`${data.title}-${row.label}`} className={index % 2 === 0 ? "bg-card" : "bg-secondary"}>
                    <td
                      className={`border border-border px-2 py-1.5 text-left font-medium text-foreground ${
                        isToyotaRow(row.label) ? "bg-destructive/10" : ""
                      }`}
                    >
                      {row.label}
                    </td>
                    {data.months.map((month, monthIndex) => (
                      <Fragment key={`${row.label}-${month.key}-group`}>
                        <td
                          className={`border border-border px-2 py-1.5 text-center text-muted-foreground ${
                            isToyotaRow(row.label) ? "bg-destructive/10" : ""
                          }`}
                        >
                          {formatInteger(row.months[month.key] ?? 0)}
                        </td>
                        {showMonthlyParticipation ? (
                          <td
                            className={`border border-border px-2 py-1.5 text-center text-muted-foreground ${
                              isToyotaRow(row.label) ? "bg-destructive/10" : ""
                            }`}
                          >
                            <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                              <span>{formatPercentage(getMonthlyParticipation(row.months[month.key] ?? 0, month.key))}</span>
                              {showMonthlyTrendArrows ? (
                                (() => {
                                  const trendDirection = getMonthlyTrendDirection(row.months, monthIndex);

                                  if (trendDirection === "up") {
                                    return <ArrowUp size={12} className="text-foreground" aria-hidden="true" />;
                                  }

                                  if (trendDirection === "down") {
                                    return <ArrowDown size={12} className="text-destructive" aria-hidden="true" />;
                                  }

                                  return null;
                                })()
                              ) : null}
                            </span>
                          </td>
                        ) : null}
                      </Fragment>
                    ))}
                    <td
                      className={`border border-border px-2 py-1.5 text-center font-bold text-foreground ${
                        isToyotaRow(row.label) ? "bg-destructive/10" : ""
                      }`}
                    >
                      {formatInteger(row.total)}
                    </td>
                    <td
                      className={`border border-border px-2 py-1.5 text-center font-bold ${
                        isToyotaRow(row.label) ? "border-destructive/30" : ""
                      }`}
                      style={getHeatmapStyle(row.percentage, minPercentage, maxPercentage)}
                    >
                      {formatPercentage(row.percentage)}
                    </td>
                  </tr>
                ))}

                <tr className="bg-muted">
                  <td className="border border-input px-2 py-1.5 text-left font-bold text-foreground">
                    {data.totalRow.label}
                  </td>
                  {data.months.map((month) => (
                    <Fragment key={`total-${month.key}-group`}>
                      <td className="border border-input px-2 py-1.5 text-center font-bold text-foreground">
                        {formatInteger(data.totalRow.months[month.key] ?? 0)}
                      </td>
                      {showMonthlyParticipation ? (
                        <td className="border border-input px-2 py-1.5 text-center font-bold text-foreground">
                          {formatPercentage(data.totalRow.months[month.key] > 0 ? 100 : 0)}
                        </td>
                      ) : null}
                    </Fragment>
                  ))}
                  <td className="border border-input px-2 py-1.5 text-center font-bold text-foreground">
                    {formatInteger(data.totalRow.total)}
                  </td>
                  <td className="border border-input px-2 py-1.5 text-center font-bold text-foreground">
                    {formatPercentage(data.totalRow.percentage)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td
                  colSpan={data.months.length * (showMonthlyParticipation ? 2 : 1) + 3}
                  className="border border-border px-3 py-6 text-center text-sm text-muted-foreground"
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
