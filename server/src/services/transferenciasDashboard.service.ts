import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import TransferenciaTotalizada from "../models/TransferenciaTotalizada";
import { ZONA_NIC_LOCALITIES } from "../constants/zonaNic";

type DashboardMonthColumn = {
  key: string;
  monthNumber: number;
  year: number;
  label: string;
};

type DashboardAvailableYearsResponse = {
  years: number[];
  selectedYear: number | null;
};

type DashboardGeneralSummary = {
  totalTransferencias: number;
  totalOperaciones: number;
  marketShare: number;
  marketLeader: {
    brand: string;
    total: number;
    percentage: number;
  } | null;
};

type DashboardGeneralTrendPoint = {
  key: string;
  label: string;
  total: number;
  operaciones: number;
  marketShare: number;
};

type DashboardGeneralTopVehicle = {
  rank: number;
  brand: string;
  model: string;
  year: number;
  total: number;
  percentage: number;
};

type DashboardGeneralPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type DashboardGeneralResponse = {
  title: string;
  summary: DashboardGeneralSummary;
  months: DashboardMonthColumn[];
  trend: DashboardGeneralTrendPoint[];
  topVehicles: DashboardGeneralTopVehicle[];
  pagination: DashboardGeneralPagination;
};

const MONTH_LABELS_SHORT: Record<number, string> = {
  1: "ene",
  2: "feb",
  3: "mar",
  4: "abr",
  5: "may",
  6: "jun",
  7: "jul",
  8: "ago",
  9: "sep",
  10: "oct",
  11: "nov",
  12: "dic",
};

const roundPercentage = (value: number) => Math.round(value * 100) / 100;

const operacionesByMonthQuery = `
SELECT
  MONTH(ope.ope_fecasig) AS "monthNumber",
  COUNT(*) AS "total"
FROM
  opera ope
WHERE
  ope.ope_fecbaj IS NULL
  AND ope.ope_tipo = 10
  AND ope.ope_fecasig IS NOT NULL
  AND YEAR(ope.ope_fecasig) = :year
GROUP BY
  MONTH(ope.ope_fecasig)
ORDER BY
  MONTH(ope.ope_fecasig) ASC;
`;

const buildDashboardMonthKey = (year: number, monthNumber: number) =>
  `${year}-${String(monthNumber).padStart(2, "0")}`;

const buildDashboardMonthLabel = (year: number, monthNumber: number) => {
  const shortMonth = MONTH_LABELS_SHORT[monthNumber];
  return shortMonth ? `${shortMonth}-${String(year).slice(-2)}` : String(monthNumber);
};

const getGeneralMonths = async (year: number): Promise<DashboardMonthColumn[]> => {
  const [transferMonthNumbers, operationsByMonth] = await Promise.all([
    TransferenciaTotalizada.distinct("mes", {
      anio: year,
      registroLocalidad: { $in: ZONA_NIC_LOCALITIES },
    }),
    sequelizeNIC.query<{ monthNumber: number; total: number }>(operacionesByMonthQuery, {
      type: QueryTypes.SELECT,
      replacements: { year },
    }),
  ]);

  const monthNumbers = Array.from(
    new Set([
      ...transferMonthNumbers,
      ...operationsByMonth.map((row) => row.monthNumber),
    ]),
  );

  return monthNumbers
    .filter((monthNumber): monthNumber is number => Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12)
    .sort((left, right) => left - right)
    .map((monthNumber) => ({
      key: buildDashboardMonthKey(year, monthNumber),
      monthNumber,
      year,
      label: buildDashboardMonthLabel(year, monthNumber),
    }));
};

const getGeneralSummary = async (year: number): Promise<DashboardGeneralSummary> => {
  const [rows, operationRows] = await Promise.all([
    TransferenciaTotalizada.aggregate<{ brand: string; total: number }>([
      {
        $match: {
          anio: year,
          registroLocalidad: { $in: ZONA_NIC_LOCALITIES },
          marca: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$marca",
          total: { $sum: "$total" },
        },
      },
      {
        $project: {
          _id: 0,
          brand: "$_id",
          total: 1,
        },
      },
      {
        $sort: {
          total: -1,
          brand: 1,
        },
      },
    ]),
    sequelizeNIC.query<{ monthNumber: number; total: number }>(operacionesByMonthQuery, {
      type: QueryTypes.SELECT,
      replacements: { year },
    }),
  ]);

  const totalTransferencias = rows.reduce((sum, row) => sum + row.total, 0);
  const totalOperaciones = operationRows.reduce((sum, row) => sum + row.total, 0);
  const leader = rows[0];

  return {
    totalTransferencias,
    totalOperaciones,
    marketShare: totalTransferencias > 0 ? roundPercentage((totalOperaciones / totalTransferencias) * 100) : 0,
    marketLeader: leader
      ? {
          brand: leader.brand,
          total: leader.total,
          percentage: totalTransferencias > 0 ? roundPercentage((leader.total / totalTransferencias) * 100) : 0,
        }
      : null,
  };
};

const getGeneralTrend = async (year: number, months: DashboardMonthColumn[]): Promise<DashboardGeneralTrendPoint[]> => {
  const [rows, operationRows] = await Promise.all([
    TransferenciaTotalizada.aggregate<{ monthNumber: number; total: number }>([
      {
        $match: {
          anio: year,
          registroLocalidad: { $in: ZONA_NIC_LOCALITIES },
        },
      },
      {
        $group: {
          _id: "$mes",
          total: { $sum: "$total" },
        },
      },
      {
        $project: {
          _id: 0,
          monthNumber: "$_id",
          total: 1,
        },
      },
      { $sort: { monthNumber: 1 } },
    ]),
    sequelizeNIC.query<{ monthNumber: number; total: number }>(operacionesByMonthQuery, {
      type: QueryTypes.SELECT,
      replacements: { year },
    }),
  ]);

  const totalsByMonth = new Map(rows.map((row) => [row.monthNumber, row.total]));
  const operationsByMonth = new Map(operationRows.map((row) => [row.monthNumber, row.total]));

  return months.map((month) => ({
    key: month.key,
    label: month.label,
    total: totalsByMonth.get(month.monthNumber) ?? 0,
    operaciones: operationsByMonth.get(month.monthNumber) ?? 0,
    marketShare:
      (totalsByMonth.get(month.monthNumber) ?? 0) > 0
        ? roundPercentage(
            ((operationsByMonth.get(month.monthNumber) ?? 0) / (totalsByMonth.get(month.monthNumber) ?? 0)) * 100,
          )
        : 0,
  }));
};

const getGeneralTopVehicles = async (
  year: number,
  page: number,
  pageSize: number,
): Promise<Pick<DashboardGeneralResponse, "topVehicles" | "pagination">> => {
  const rows = await TransferenciaTotalizada.aggregate<{
    brand: string;
    model: string;
    year: number;
    total: number;
  }>([
    {
      $match: {
        anio: year,
        registroLocalidad: { $in: ZONA_NIC_LOCALITIES },
        marca: { $exists: true, $ne: "" },
        modelo: { $exists: true, $ne: "" },
      },
    },
    {
      $group: {
        _id: {
          brand: "$marca",
          model: "$modelo",
          year: "$anioModelo",
        },
        total: { $sum: "$total" },
      },
    },
    {
      $project: {
        _id: 0,
        brand: "$_id.brand",
        model: "$_id.model",
        year: "$_id.year",
        total: 1,
      },
    },
    {
      $sort: {
        total: -1,
        brand: 1,
        model: 1,
        year: -1,
      },
    },
  ]);

  const totalRows = rows.length;
  const rankingTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const totalPages = totalRows > 0 ? Math.ceil(totalRows / pageSize) : 0;
  const normalizedPage = totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
  const startIndex = (normalizedPage - 1) * pageSize;

  return {
    topVehicles: rows.slice(startIndex, startIndex + pageSize).map((row, index) => ({
      rank: startIndex + index + 1,
      brand: row.brand,
      model: row.model,
      year: row.year,
      total: row.total,
      percentage: rankingTotal > 0 ? roundPercentage((row.total / rankingTotal) * 100) : 0,
    })),
    pagination: {
      page: normalizedPage,
      pageSize,
      total: totalRows,
      totalPages,
    },
  };
};

export class TransferenciasDashboardService {
  static async getAvailableYears(): Promise<DashboardAvailableYearsResponse> {
    const years = (await TransferenciaTotalizada.distinct("anio"))
      .filter((year): year is number => Number.isInteger(year))
      .sort((a, b) => b - a);

    return {
      years,
      selectedYear: years[0] ?? null,
    };
  }

  static async getGeneralZonaNic(year: number, page: number, pageSize: number): Promise<DashboardGeneralResponse> {
    const [summary, months, topVehiclesData] = await Promise.all([
      getGeneralSummary(year),
      getGeneralMonths(year),
      getGeneralTopVehicles(year, page, pageSize),
    ]);

    if (!months.length) {
      return {
        title: "General - Zona NIC",
        summary,
        months,
        trend: [],
        topVehicles: topVehiclesData.topVehicles,
        pagination: topVehiclesData.pagination,
      };
    }

    const trend = await getGeneralTrend(year, months);

    return {
      title: "General - Zona NIC",
      summary,
      months,
      trend,
      topVehicles: topVehiclesData.topVehicles,
      pagination: topVehiclesData.pagination,
    };
  }
}
