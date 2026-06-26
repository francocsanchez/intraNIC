import PatentamientoDataset, {
  type IPatentamientoDataset,
  type PatentamientoDatasetType,
} from "../models/PatentamientoDataset";
import PatentamientoTotalizado from "../models/PatentamientoTotalizado";

type PatentamientoDatasetLean = Pick<
  IPatentamientoDataset,
  "datasetType" | "label" | "monthColumns" | "rows" | "primaryColumn"
>;

type PatentamientoRowNormalized = {
  primaryValue: string;
  total: number;
  months: Record<string, number>;
};

type DashboardMonthColumn = {
  key: string;
  monthNumber: number;
  year: number;
  label: string;
};

type DashboardTableRow = {
  label: string;
  months: Record<string, number>;
  total: number;
  percentage: number;
};

type DashboardTableResponse = {
  title: string;
  entityLabel: "Marca" | "Modelo";
  months: DashboardMonthColumn[];
  rows: DashboardTableRow[];
  totalRow: DashboardTableRow;
};

type DashboardEvolutionPoint = {
  label: string;
  pais: number;
  zonaNic: number;
};

type DashboardEvolutionResponse = {
  title: string;
  series: DashboardEvolutionPoint[];
};

type DashboardAvailableYearsResponse = {
  years: number[];
  selectedYear: number | null;
};

type DashboardGeneralSummary = {
  totalPatentamientos: number;
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
};

type DashboardGeneralTopBrand = {
  brand: string;
  total: number;
  percentage: number;
};

type DashboardGeneralTopModel = {
  rank: number;
  model: string;
  total: number;
  percentage: number;
};

type DashboardGeneralResponse = {
  title: string;
  summary: DashboardGeneralSummary;
  months: DashboardMonthColumn[];
  trend: DashboardGeneralTrendPoint[];
  topBrands: DashboardGeneralTopBrand[];
  topModels: DashboardGeneralTopModel[];
};

type DashboardPlanFilter = "with-plan" | "without-plan";

type SegmentModelDefinition = {
  label: string;
  aliases: readonly string[];
};

const PICKUP_MODELS: readonly SegmentModelDefinition[] = [
  { label: "Toyota Hilux", aliases: ["HILUX", "TOYOTA HILUX"] },
  { label: "Ford Ranger", aliases: ["RANGER", "FORD RANGER"] },
  { label: "Volkswagen Amarok", aliases: ["AMAROK", "VOLKSWAGEN AMAROK", "VOLKWAGEN AMAROK"] },
  { label: "Chevrolet S10", aliases: ["S10", "S-10", "CHEVROLET S10", "CHEVROLET S-10"] },
  { label: "Fiat Titano", aliases: ["TITANO", "FIAT TITANO"] },
  { label: "Nissan Frontier", aliases: ["FRONTIER", "NISSAN FRONTIER"] },
  { label: "Ram Dakota", aliases: ["DAKOTA", "RAM DAKOTA"] },
  { label: "Ford F-150", aliases: ["F-150", "F150", "FORD F-150", "FORD F150"] },
  { label: "Renault Alaskan", aliases: ["ALASKAN", "RENAULT ALASKAN"] },
  { label: "Foton Tunland", aliases: ["TUNLAND", "TUNLAND G7", "FOTON TUNLAND", "FOTON TUNLAND G7"] },
  { label: "BYD Shark", aliases: ["SHARK", "BYD SHARK"] },
] as const;

const SUV_MODELS = [
  "FORD TERRITORY",
  "VOLKSWAGEN TAOS",
  "TOYOTA COROLLA CROSS",
  "JEEP COMPASS",
  "PEUGEOT 3008",
  "PEUGEOT NUEVO 3008",
  "NUEVO 3008",
] as const;

const B_SUV_MODELS = [
  "TOYOTA TERA",
  "VOLKSWAGEN TERA",
  "TOYOTA YARIS CROSS",
  "JEEP RENEGADE",
  "NISSAN KICKS",
] as const;

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

const ZONA_NIC_LOCALITIES = new Set([
  "ALLEN",
  "BARILOCHE",
  "CENTENARIO",
  "CHOELE CHOEL",
  "CINCO SALTOS",
  "CIPOLLETTI",
  "CUTRAL CO",
  "GENERAL ROCA",
  "MAQUINCHAO",
  "NEUQUEN",
  "PLAZA HUINCUL",
  "PLOTTIER",
  "SAN MARTIN DE LOS ANDES",
  "SAN MARTIN DE ANDES",
  "VILLA REGINA",
  "VILLA LA ANGOSTURA",
  "VILLA LANGOSTURA",
  "ZAPALA",
]);

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const roundPercentage = (value: number) => Math.round(value * 100) / 100;
const TERMINAL_AHORRO_ACREEDOR_PATTERN = /^Terminal Ahorro$/i;

const isImportedTotalRow = (value: string) => {
  const normalized = normalizeText(value);
  return normalized === "TOTAL" || normalized === "TOTALES";
};

const parseHeaderYear = (header: string, storageKey?: string) => {
  const keyMatch = String(storageKey ?? "").match(/^(\d{4})-(\d{2})$/);

  if (keyMatch) {
    return Number(keyMatch[1]);
  }

  const shortMatch = header.trim().match(/^(\d{1,2})[\/\-](\d{2,4})$/);

  if (shortMatch) {
    const rawYear = Number(shortMatch[2]);

    if (Number.isInteger(rawYear)) {
      if (rawYear >= 1000) {
        return rawYear;
      }

      if (rawYear >= 0 && rawYear <= 99) {
        return 2000 + rawYear;
      }
    }
  }

  const match = header.trim().match(/^(\d{1,2})[\/\-](\d{1,4})[\/\-](\d{1,4})$/);

  if (!match) {
    return null;
  }

  const middleSegment = Number(match[2]);
  const lastSegment = Number(match[3]);

  // Legacy compatibility:
  // previous imports transformed headers like "01/26" into "1/25/01".
  // In that case the intended year is the middle segment + 1.
  if (middleSegment > 12 && middleSegment <= 99 && lastSegment === 1) {
    return 2000 + middleSegment + 1;
  }

  const rawYear = Number(match[2]);

  if (!Number.isInteger(rawYear)) {
    return null;
  }

  if (rawYear >= 1000) {
    return rawYear;
  }

  if (rawYear >= 0 && rawYear <= 99) {
    return 2000 + rawYear;
  }

  return null;
};

const toDashboardMonth = (
  column: PatentamientoDatasetLean["monthColumns"][number],
): DashboardMonthColumn | null => {
  const year = parseHeaderYear(column.header, column.key);

  if (!year) {
    return null;
  }

  const shortMonth = MONTH_LABELS_SHORT[column.monthNumber];

  if (!shortMonth) {
    return null;
  }

  return {
    key: column.key,
    monthNumber: column.monthNumber,
    year,
    label: `${shortMonth}-${String(year).slice(-2)}`,
  };
};

const getDataset = async (datasetType: PatentamientoDatasetType) =>
  PatentamientoDataset.findOne({ datasetType }).lean<PatentamientoDatasetLean | null>();

const normalizeRowMonths = (months: unknown): Record<string, number> => {
  if (!months || typeof months !== "object" || Array.isArray(months)) {
    return {};
  }

  return Object.entries(months).reduce<Record<string, number>>((acc, [key, value]) => {
    const numericValue = typeof value === "number" ? value : Number(value);
    acc[key] = Number.isFinite(numericValue) ? numericValue : 0;
    return acc;
  }, {});
};

const normalizeRows = (dataset: PatentamientoDatasetLean): PatentamientoRowNormalized[] =>
  dataset.rows.map((row) => ({
    primaryValue: row.primaryValue,
    total: row.total,
    months: normalizeRowMonths(row.months),
  }));

const normalizeValidRows = (dataset: PatentamientoDatasetLean): PatentamientoRowNormalized[] =>
  normalizeRows(dataset).filter((row) => !isImportedTotalRow(row.primaryValue));

const getYearsFromDataset = (dataset: PatentamientoDatasetLean | null) =>
  (dataset?.monthColumns ?? [])
    .map((column) => parseHeaderYear(column.header, column.key))
    .filter((year): year is number => Boolean(year));

const getFilteredMonths = (dataset: PatentamientoDatasetLean | null, year: number) =>
  (dataset?.monthColumns ?? [])
    .map(toDashboardMonth)
    .filter((month): month is DashboardMonthColumn => Boolean(month) && month.year === year)
    .sort((a, b) => a.monthNumber - b.monthNumber);

const buildTotalRow = (rows: DashboardTableRow[], months: DashboardMonthColumn[]): DashboardTableRow => {
  const monthTotals = months.reduce<Record<string, number>>((acc, month) => {
    acc[month.key] = rows.reduce((sum, row) => sum + (row.months[month.key] ?? 0), 0);
    return acc;
  }, {});

  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return {
    label: "TOTAL",
    months: monthTotals,
    total,
    percentage: rows.length ? 100 : 0,
  };
};

const getRowTotalForMonths = (
  row: PatentamientoRowNormalized,
  months: DashboardMonthColumn[],
) => months.reduce((sum, month) => sum + (row.months[month.key] ?? 0), 0);

const matchesSegmentAlias = (primaryValue: string, alias: string) => {
  const normalizedValue = normalizeText(primaryValue);
  const normalizedAlias = normalizeText(alias);

  return normalizedValue === normalizedAlias || normalizedValue.startsWith(`${normalizedAlias} `);
};

const buildTableRows = (
  rows: PatentamientoRowNormalized[],
  months: DashboardMonthColumn[],
): DashboardTableRow[] => {
  const rowsWithYearTotal = rows.map((row) => ({
    ...row,
    yearTotal: getRowTotalForMonths(row, months),
  }));
  const totalBase = rowsWithYearTotal.reduce((acc, row) => acc + row.yearTotal, 0);

  return rowsWithYearTotal.map((row) => ({
    label: row.primaryValue,
    months: months.reduce<Record<string, number>>((acc, month) => {
      acc[month.key] = row.months[month.key] ?? 0;
      return acc;
    }, {}),
    total: row.yearTotal,
    percentage: totalBase > 0 ? roundPercentage((row.yearTotal / totalBase) * 100) : 0,
  }));
};

const buildEmptyTable = (
  title: string,
  entityLabel: "Marca" | "Modelo",
  months: DashboardMonthColumn[],
): DashboardTableResponse => ({
  title,
  entityLabel,
  months,
  rows: [],
  totalRow: {
    label: "TOTAL",
    months: months.reduce<Record<string, number>>((acc, month) => {
      acc[month.key] = 0;
      return acc;
    }, {}),
    total: 0,
    percentage: 0,
  },
});

const getTopRows = async (
  datasetType: PatentamientoDatasetType,
  title: string,
  year: number,
): Promise<DashboardTableResponse> => {
  const dataset = await getDataset(datasetType);
  const months = getFilteredMonths(dataset, year);
  const entityLabel = dataset?.primaryColumn === "modelo" ? "Modelo" : "Marca";

  if (!dataset || !months.length) {
    return buildEmptyTable(title, entityLabel, months);
  }

  const rows = normalizeRows(dataset)
    .sort(
      (a, b) =>
        getRowTotalForMonths(b, months) - getRowTotalForMonths(a, months) ||
        a.primaryValue.localeCompare(b.primaryValue),
    )
    .slice(0, 10);

  const tableRows = buildTableRows(rows, months);

  return {
    title,
    entityLabel,
    months,
    rows: tableRows,
    totalRow: buildTotalRow(tableRows, months),
  };
};

const buildDashboardMonthKey = (year: number, monthNumber: number) =>
  `${year}-${String(monthNumber).padStart(2, "0")}`;

const buildDashboardMonthLabel = (year: number, monthNumber: number) => {
  const shortMonth = MONTH_LABELS_SHORT[monthNumber];
  return shortMonth ? `${shortMonth}-${String(year).slice(-2)}` : String(monthNumber);
};

const buildPlanFilterMatch = (planFilter: DashboardPlanFilter) =>
  planFilter === "without-plan"
    ? {
        tipoAcreedorPrendario: {
          $not: TERMINAL_AHORRO_ACREEDOR_PATTERN,
        },
      }
    : {};

const getBrandRowsFromTotalizados = async (
  title: string,
  year: number,
  scope: "pais" | "zona-nic",
  planFilter: DashboardPlanFilter,
): Promise<DashboardTableResponse> => {
  const matchStage: Record<string, unknown> = {
    anio: year,
    marca: {
      $exists: true,
      $ne: "",
    },
    ...buildPlanFilterMatch(planFilter),
  };

  if (scope === "zona-nic") {
    matchStage.registroLocalidad = { $in: Array.from(ZONA_NIC_LOCALITIES) };
  }

  const monthlyCounts = await PatentamientoTotalizado.aggregate<{
    brand: string;
    monthNumber: number;
    total: number;
  }>([
    { $match: matchStage },
    {
      $group: {
        _id: {
          brand: "$marca",
          monthNumber: "$mes",
        },
        total: { $sum: "$total" },
      },
    },
    {
      $project: {
        _id: 0,
        brand: "$_id.brand",
        monthNumber: "$_id.monthNumber",
        total: 1,
      },
    },
    {
      $sort: {
        brand: 1,
        monthNumber: 1,
      },
    },
  ]);

  const monthNumbers = Array.from(
    new Set(
      monthlyCounts
        .map((item) => item.monthNumber)
        .filter((monthNumber) => Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12),
    ),
  ).sort((left, right) => left - right);

  const months: DashboardMonthColumn[] = monthNumbers.map((monthNumber) => ({
    key: buildDashboardMonthKey(year, monthNumber),
    monthNumber,
    year,
    label: buildDashboardMonthLabel(year, monthNumber),
  }));

  if (!months.length) {
    return buildEmptyTable(title, "Marca", []);
  }

  const rowsByBrand = new Map<string, PatentamientoRowNormalized>();

  monthlyCounts.forEach((item) => {
    const brand = String(item.brand ?? "").trim();

    if (!brand) {
      return;
    }

    const monthKey = buildDashboardMonthKey(year, item.monthNumber);
    const current = rowsByBrand.get(brand) ?? {
      primaryValue: brand,
      total: 0,
      months: {},
    };

    current.months[monthKey] = item.total;
    current.total += item.total;
    rowsByBrand.set(brand, current);
  });

  const allRows = Array.from(rowsByBrand.values())
    .sort((left, right) => right.total - left.total || left.primaryValue.localeCompare(right.primaryValue));
  const topRows = allRows.slice(0, 10);
  const otherRows = allRows.slice(10);
  const otherBrandsRow = otherRows.length
    ? {
        primaryValue: "OTRAS MARCAS",
        total: otherRows.reduce((sum, row) => sum + row.total, 0),
        months: months.reduce<Record<string, number>>((acc, month) => {
          acc[month.key] = otherRows.reduce((sum, row) => sum + (row.months[month.key] ?? 0), 0);
          return acc;
        }, {}),
      }
    : null;

  const rows = otherBrandsRow ? [...topRows, otherBrandsRow] : topRows;

  const tableRows = buildTableRows(rows, months);
  const totalRow = buildTotalRow(buildTableRows(allRows, months), months);

  return {
    title,
    entityLabel: "Marca",
    months,
    rows: tableRows,
    totalRow,
  };
};

const getSegmentRowsFromTotalizados = async (
  title: string,
  year: number,
  scope: "pais" | "zona-nic",
  models: readonly SegmentModelDefinition[],
  planFilter: DashboardPlanFilter,
): Promise<DashboardTableResponse> => {
  const matchStage: Record<string, unknown> = {
    anio: year,
    modelo: {
      $exists: true,
      $ne: "",
    },
    ...buildPlanFilterMatch(planFilter),
  };

  if (scope === "zona-nic") {
    matchStage.registroLocalidad = { $in: Array.from(ZONA_NIC_LOCALITIES) };
  }

  const monthlyCounts = await PatentamientoTotalizado.aggregate<{
    model: string;
    monthNumber: number;
    total: number;
  }>([
    { $match: matchStage },
    {
      $group: {
        _id: {
          model: "$modelo",
          monthNumber: "$mes",
        },
        total: { $sum: "$total" },
      },
    },
    {
      $project: {
        _id: 0,
        model: "$_id.model",
        monthNumber: "$_id.monthNumber",
        total: 1,
      },
    },
    {
      $sort: {
        model: 1,
        monthNumber: 1,
      },
    },
  ]);

  const monthNumbers = Array.from(
    new Set(
      monthlyCounts
        .map((item) => item.monthNumber)
        .filter((monthNumber) => Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12),
    ),
  ).sort((left, right) => left - right);

  const months: DashboardMonthColumn[] = monthNumbers.map((monthNumber) => ({
    key: buildDashboardMonthKey(year, monthNumber),
    monthNumber,
    year,
    label: buildDashboardMonthLabel(year, monthNumber),
  }));

  if (!months.length) {
    return buildEmptyTable(title, "Modelo", []);
  }

  const rows = models.map<PatentamientoRowNormalized>((definition) => {
    const monthsMap = months.reduce<Record<string, number>>((acc, month) => {
      const total = monthlyCounts.reduce((sum, item) => {
        if (item.monthNumber !== month.monthNumber) {
          return sum;
        }

        return definition.aliases.some((alias) => matchesSegmentAlias(item.model, alias))
          ? sum + item.total
          : sum;
      }, 0);

      acc[month.key] = total;
      return acc;
    }, {});

    return {
      primaryValue: definition.label,
      total: Object.values(monthsMap).reduce((sum, value) => sum + value, 0),
      months: monthsMap,
    };
  });

  const tableRows = buildTableRows(rows, months);

  return {
    title,
    entityLabel: "Modelo",
    months,
    rows: tableRows,
    totalRow: buildTotalRow(tableRows, months),
  };
};

const getSegmentRows = async (
  datasetType: PatentamientoDatasetType,
  title: string,
  models: readonly string[] | readonly SegmentModelDefinition[],
  year: number,
): Promise<DashboardTableResponse> => {
  const dataset = await getDataset(datasetType);
  const months = getFilteredMonths(dataset, year);
  const entityLabel = "Modelo";

  if (!dataset || !months.length) {
    return buildEmptyTable(title, entityLabel, months);
  }

  const definitions: readonly SegmentModelDefinition[] = models.map((model) =>
    typeof model === "string"
      ? {
          label: model,
          aliases: [model],
        }
      : model,
  );

  const normalizedRows = normalizeRows(dataset);
  const rows = definitions.map<PatentamientoRowNormalized>((definition) => {
    const matchedRow = normalizedRows.find((row) =>
      definition.aliases.some((alias) => matchesSegmentAlias(row.primaryValue, alias)),
    );

    if (matchedRow) {
      return {
        ...matchedRow,
        primaryValue: definition.label,
      };
    }

    return {
      primaryValue: definition.label,
      total: 0,
      months: {},
    };
  });

  const tableRows = buildTableRows(rows, months);

  return {
    title,
    entityLabel,
    months,
    rows: tableRows,
    totalRow: buildTotalRow(tableRows, months),
  };
};

const getToyotaMonthlyShareFromTotalizados = async (
  year: number,
  scope: "pais" | "zona-nic",
  planFilter: DashboardPlanFilter,
) => {
  const matchStage: Record<string, unknown> = {
    anio: year,
    ...buildPlanFilterMatch(planFilter),
  };

  if (scope === "zona-nic") {
    matchStage.registroLocalidad = { $in: Array.from(ZONA_NIC_LOCALITIES) };
  }

  const monthlyTotals = await PatentamientoTotalizado.aggregate<{
    monthNumber: number;
    total: number;
    toyota: number;
  }>([
    { $match: matchStage },
    {
      $group: {
        _id: "$mes",
        total: { $sum: "$total" },
        toyota: {
          $sum: {
            $cond: [{ $eq: ["$marca", "TOYOTA"] }, "$total", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        monthNumber: "$_id",
        total: 1,
        toyota: 1,
      },
    },
    { $sort: { monthNumber: 1 } },
  ]);

  return monthlyTotals.filter(
    (item) => Number.isInteger(item.monthNumber) && item.monthNumber >= 1 && item.monthNumber <= 12,
  );
};

const getToyotaEvolution = async (
  year: number,
  planFilter: DashboardPlanFilter,
): Promise<DashboardEvolutionResponse> => {
  const [paisMonthly, zonaNicMonthly] = await Promise.all([
    getToyotaMonthlyShareFromTotalizados(year, "pais", planFilter),
    getToyotaMonthlyShareFromTotalizados(year, "zona-nic", planFilter),
  ]);

  const title = "Toyota - Evolucion Mensual PAIS vs Zona NIC";

  if (!paisMonthly.length && !zonaNicMonthly.length) {
    return { title, series: [] };
  }

  const monthNumbers = Array.from(
    new Set([
      ...paisMonthly.map((item) => item.monthNumber),
      ...zonaNicMonthly.map((item) => item.monthNumber),
    ]),
  ).sort((left, right) => left - right);

  const monthMap = new Map<number, DashboardMonthColumn>();
  monthNumbers.forEach((monthNumber) => {
    monthMap.set(monthNumber, {
      key: buildDashboardMonthKey(year, monthNumber),
      monthNumber,
      year,
      label: buildDashboardMonthLabel(year, monthNumber),
    });
  });

  const paisByMonth = new Map(paisMonthly.map((item) => [item.monthNumber, item]));
  const zonaNicByMonth = new Map(zonaNicMonthly.map((item) => [item.monthNumber, item]));

  const series = Array.from(monthMap.values())
    .sort((a, b) => a.monthNumber - b.monthNumber)
    .map((month) => {
      const paisValue = paisByMonth.get(month.monthNumber);
      const zonaNicValue = zonaNicByMonth.get(month.monthNumber);

      return {
        label: month.label,
        pais: paisValue && paisValue.total > 0 ? roundPercentage((paisValue.toyota / paisValue.total) * 100) : 0,
        zonaNic:
          zonaNicValue && zonaNicValue.total > 0 ? roundPercentage((zonaNicValue.toyota / zonaNicValue.total) * 100) : 0,
      };
    });

  return {
    title,
    series,
  };
};

const getGeneralZonaNic = async (year: number): Promise<DashboardGeneralResponse> => {
  const [brandsDataset, modelsDataset] = await Promise.all([
    getDataset("zona-nic-marcas"),
    getDataset("zona-nic-modelos"),
  ]);

  const title = "General - Zona NIC";
  const months = getFilteredMonths(brandsDataset, year);

  if (!brandsDataset || !modelsDataset || !months.length) {
    return {
      title,
      months,
      summary: {
        totalPatentamientos: 0,
        marketLeader: null,
      },
      trend: [],
      topBrands: [],
      topModels: [],
    };
  }

  const brandRows = normalizeValidRows(brandsDataset).map((row) => ({
    ...row,
    yearTotal: getRowTotalForMonths(row, months),
  }));
  const modelRows = normalizeValidRows(modelsDataset).map((row) => ({
    ...row,
    yearTotal: getRowTotalForMonths(row, months),
  }));

  const totalPatentamientos = brandRows.reduce((sum, row) => sum + row.yearTotal, 0);

  const topBrands = brandRows
    .filter((row) => row.yearTotal > 0)
    .sort((a, b) => b.yearTotal - a.yearTotal || a.primaryValue.localeCompare(b.primaryValue))
    .slice(0, 5)
    .map<DashboardGeneralTopBrand>((row) => ({
      brand: row.primaryValue,
      total: row.yearTotal,
      percentage: totalPatentamientos > 0 ? roundPercentage((row.yearTotal / totalPatentamientos) * 100) : 0,
    }));

  const marketLeader = topBrands[0]
    ? {
        brand: topBrands[0].brand,
        total: topBrands[0].total,
        percentage: topBrands[0].percentage,
      }
    : null;

  const trend = months.map<DashboardGeneralTrendPoint>((month) => ({
    key: month.key,
    label: month.label,
    total: brandRows.reduce((sum, row) => sum + (row.months[month.key] ?? 0), 0),
  }));

  const topModels = modelRows
    .filter((row) => row.yearTotal > 0)
    .sort((a, b) => b.yearTotal - a.yearTotal || a.primaryValue.localeCompare(b.primaryValue))
    .slice(0, 10)
    .map<DashboardGeneralTopModel>((row, index) => ({
      rank: index + 1,
      model: row.primaryValue,
      total: row.yearTotal,
      percentage: totalPatentamientos > 0 ? roundPercentage((row.yearTotal / totalPatentamientos) * 100) : 0,
    }));

  return {
    title,
    months,
    summary: {
      totalPatentamientos,
      marketLeader,
    },
    trend,
    topBrands,
    topModels,
  };
};

export class PatentamientosDashboardService {
  static async getAvailableYears(): Promise<DashboardAvailableYearsResponse> {
    const [datasets, totalizadosYears] = await Promise.all([
      PatentamientoDataset.find(
      {},
      { monthColumns: 1, _id: 0 },
      ).lean<Array<Pick<PatentamientoDatasetLean, "monthColumns">>>(),
      PatentamientoTotalizado.distinct("anio"),
    ]);

    const years = Array.from(
      new Set(
        [
          ...datasets.flatMap((dataset) =>
            dataset.monthColumns
              .map((column) => parseHeaderYear(column.header, column.key))
              .filter((year): year is number => Boolean(year)),
          ),
          ...totalizadosYears.filter((year): year is number => Number.isInteger(year)),
        ],
      ),
    ).sort((a, b) => b - a);

    return {
      years,
      selectedYear: years[0] ?? null,
    };
  }

  static getTopMarcasPais(year: number, planFilter: DashboardPlanFilter) {
    return getBrandRowsFromTotalizados("Top 10 Marcas Patentadas - PAIS", year, "pais", planFilter);
  }

  static getTopMarcasZonaNic(year: number, planFilter: DashboardPlanFilter) {
    return getBrandRowsFromTotalizados("Top 10 Marcas Patentadas - Zona NIC", year, "zona-nic", planFilter);
  }

  static getSegmentoPickupPais(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados("Segmento Pickup - PAIS", year, "pais", PICKUP_MODELS, planFilter);
  }

  static getSegmentoPickupZonaNic(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados("Segmento Pickup - Zona NIC", year, "zona-nic", PICKUP_MODELS, planFilter);
  }

  static getSegmentoSuvPais(year: number) {
    return getSegmentRows("pais-modelos", "Segmento SUV - PAIS", SUV_MODELS, year);
  }

  static getSegmentoSuvZonaNic(year: number) {
    return getSegmentRows("zona-nic-modelos", "Segmento SUV - Zona NIC", SUV_MODELS, year);
  }

  static getSegmentoBSuvPais(year: number) {
    return getSegmentRows("pais-modelos", "Segmento B-SUV - PAIS", B_SUV_MODELS, year);
  }

  static getSegmentoBSuvZonaNic(year: number) {
    return getSegmentRows("zona-nic-modelos", "Segmento B-SUV - Zona NIC", B_SUV_MODELS, year);
  }

  static getToyotaEvolution(year: number, planFilter: DashboardPlanFilter) {
    return getToyotaEvolution(year, planFilter);
  }

  static getGeneralZonaNic(year: number) {
    return getGeneralZonaNic(year);
  }
}
