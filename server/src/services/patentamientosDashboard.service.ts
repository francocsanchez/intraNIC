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
  brand: string;
  model: string;
  total: number;
  percentage: number;
};

type DashboardGeneralTopModelsPagination = {
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
  topBrands: DashboardGeneralTopBrand[];
  topModels: DashboardGeneralTopModel[];
  topModelsPagination: DashboardGeneralTopModelsPagination;
};

type DashboardPlanFilter = "with-plan" | "without-plan";

type DashboardLocationFilters = {
  province: string | null;
  locality: string | null;
};

type DashboardLocationOptionsResponse = {
  provinces: string[];
  localities: string[];
};

type DashboardLocationAnalysisResponse = {
  title: string;
  filters: DashboardLocationFilters;
  tables: {
    hilux: DashboardTableResponse;
    sw4: DashboardTableResponse;
    cCross: DashboardTableResponse;
    yCross: DashboardTableResponse;
    yaris: DashboardTableResponse;
  };
};

type SegmentModelDefinition = {
  label: string;
  aliases: readonly string[];
};

type SegmentDefinition = {
  title: string;
  models: readonly SegmentModelDefinition[];
};

const HILUX_MODELS: readonly SegmentModelDefinition[] = [
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

const SW4_MODELS: readonly SegmentModelDefinition[] = [
  { label: "Toyota SW4", aliases: ["SW4", "TOYOTA SW4"] },
  { label: "Ford Everest", aliases: ["EVEREST", "FORD EVEREST"] },
  { label: "Jeep Commander", aliases: ["COMMANDER", "JEEP COMMANDER"] },
  { label: "Mitsubishi Outlander", aliases: ["OUTLANDER", "MITSUBISHI OUTLANDER"] },
  { label: "Hyundai Santa Fe", aliases: ["SANTA FE", "HYUNDAI SANTA FE"] },
  { label: "BAIC BJ60", aliases: ["BJ60", "BAIC BJ60"] },
  { label: "Jeep Grand Cherokee", aliases: ["GRAND CHEROKEE", "JEEP GRAND CHEROKEE"] },
  { label: "GAC GS8", aliases: ["GS8", "GAC GS8"] },
] as const;

const C_CROSS_MODELS: readonly SegmentModelDefinition[] = [
  { label: "Ford Territory", aliases: ["TERRITORY", "FORD TERRITORY"] },
  { label: "Volkswagen Taos", aliases: ["TAOS", "VOLKSWAGEN TAOS"] },
  { label: "Toyota Corolla Cross", aliases: ["COROLLA CROSS", "TOYOTA COROLLA CROSS"] },
  { label: "Jeep Compass", aliases: ["COMPASS", "JEEP COMPASS"] },
  { label: "BAIC BJ30", aliases: ["BJ30", "BAIC BJ30"] },
  { label: "BYD Song Pro", aliases: ["SONG PRO", "BYD SONG PRO", "KIA SONG PRO"] },
  { label: "Chevrolet Captiva", aliases: ["CAPTIVA", "CHEVROLET CAPTIVA"] },
  { label: "Chery Tiggo 7", aliases: ["TIGGO 7", "CHERY TIGGO 7"] },
  { label: "Ford Bronco Sport", aliases: ["BRONCO SPORT", "FORD BRONCO SPORT"] },
  { label: "Jaecoo J7", aliases: ["J7", "JAECOO J7"] },
  { label: "Chevrolet Trailblazer", aliases: ["TRAILBLAZER", "CHEVROLET TRAILBLAZER"] },
] as const;

const YARIS_MODELS: readonly SegmentModelDefinition[] = [
  { label: "Peugeot 208", aliases: ["208", "PEUGEOT 208"] },
  { label: "Fiat Cronos", aliases: ["CRONOS", "FIAT CRONOS"] },
  { label: "Chevrolet Onix", aliases: ["ONIX", "CHEVROLET ONIX"] },
  { label: "Toyota Yaris", aliases: ["YARIS", "TOYOTA YARIS"] },
  { label: "Volkswagen Polo", aliases: ["POLO", "VOLKSWAGEN POLO"] },
  { label: "Fiat Argo", aliases: ["ARGO", "FIAT ARGO"] },
  { label: "Citroen C3", aliases: ["C3", "CITROEN C3", "CITROËN C3"] },
  { label: "Hyundai HB20", aliases: ["HB20", "HB 20", "HYUNDAI HB20", "HYUNDAI HB 20"] },
  { label: "BYD Dolphin Mini", aliases: ["DOLPHIN MINI", "BYD DOLPHIN MINI"] },
  { label: "Volkswagen Virtus", aliases: ["VIRTUS", "VOLKSWAGEN VIRTUS", "RENAULT VIRTUS"] },
] as const;

const Y_CROSS_MODELS: readonly SegmentModelDefinition[] = [
  { label: "Volkswagen Tera", aliases: ["TERA", "VOLKSWAGEN TERA"] },
  { label: "Chevrolet Tracker", aliases: ["TRACKER", "CHEVROLET TRACKER"] },
  { label: "Peugeot 2008", aliases: ["2008", "PEUGEOT 2008"] },
  { label: "Renault Kardian", aliases: ["KARDIAN", "RENAULT KARDIAN"] },
  { label: "Toyota Yaris Cross", aliases: ["YARIS CROSS", "TOYOTA YARIS CROSS"] },
  { label: "Volkswagen T-Cross", aliases: ["T-CROSS", "TCROSS", "VOLKSWAGEN T-CROSS", "VOLKSWAGEN TCROSS"] },
  { label: "Nissan Kicks", aliases: ["KICKS", "NISSAN KICKS"] },
  { label: "Jeep Renegade", aliases: ["RENEGADE", "JEEP RENEGADE"] },
  { label: "BYD Atto 2", aliases: ["ATTO 2", "BYD ATTO 2", "GWM HAVAL H2", "HAVAL H2"] },
  { label: "Fiat Pulse", aliases: ["PULSE", "FIAT PULSE"] },
] as const;

const SEGMENT_DEFINITIONS = {
  hilux: {
    title: "Comparativa Hilux",
    models: HILUX_MODELS,
  },
  sw4: {
    title: "Comparativa SW4",
    models: SW4_MODELS,
  },
  "c-cross": {
    title: "Comparativa C. Cross",
    models: C_CROSS_MODELS,
  },
  yaris: {
    title: "Comparativa Yaris",
    models: YARIS_MODELS,
  },
  "y-cross": {
    title: "Comparativa Y. Cross",
    models: Y_CROSS_MODELS,
  },
} as const satisfies Record<string, SegmentDefinition>;

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

  return rowsWithYearTotal
    .map((row) => ({
      label: row.primaryValue,
      months: months.reduce<Record<string, number>>((acc, month) => {
        acc[month.key] = row.months[month.key] ?? 0;
        return acc;
      }, {}),
      total: row.yearTotal,
      percentage: totalBase > 0 ? roundPercentage((row.yearTotal / totalBase) * 100) : 0,
    }))
    .sort((a, b) => {
      const aIsOtherBrands = normalizeText(a.label) === "OTRAS MARCAS";
      const bIsOtherBrands = normalizeText(b.label) === "OTRAS MARCAS";

      if (aIsOtherBrands && !bIsOtherBrands) return 1;
      if (!aIsOtherBrands && bIsOtherBrands) return -1;

      return b.total - a.total || a.label.localeCompare(b.label, "es");
    });
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

const buildLocationMatch = ({ province, locality }: DashboardLocationFilters) => {
  const matchStage: Record<string, unknown> = {};

  if (province) {
    matchStage.registroProvincia = province;
  }

  if (locality) {
    matchStage.registroLocalidad = locality;
  }

  return matchStage;
};

const buildLocationTitleSuffix = ({ province, locality }: DashboardLocationFilters) => {
  if (province && locality) {
    return ` - ${province} / ${locality}`;
  }

  if (province) {
    return ` - ${province}`;
  }

  return " - Todas las provincias";
};

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

const getSegmentRowsFromCustomLocation = async (
  title: string,
  year: number,
  models: readonly SegmentModelDefinition[],
  planFilter: DashboardPlanFilter,
  locationFilters: DashboardLocationFilters,
): Promise<DashboardTableResponse> => {
  const matchStage: Record<string, unknown> = {
    anio: year,
    modelo: {
      $exists: true,
      $ne: "",
    },
    ...buildPlanFilterMatch(planFilter),
    ...buildLocationMatch(locationFilters),
  };

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

const getGeneralSummaryFromTotalizados = async (year: number): Promise<DashboardGeneralSummary> => {
  const rows = await PatentamientoTotalizado.aggregate<{
    brand: string;
    total: number;
  }>([
    {
      $match: {
        anio: year,
        registroLocalidad: { $in: Array.from(ZONA_NIC_LOCALITIES) },
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
  ]);

  const totalPatentamientos = rows.reduce((sum, row) => sum + row.total, 0);
  const leader = rows[0];

  return {
    totalPatentamientos,
    marketLeader: leader
      ? {
          brand: leader.brand,
          total: leader.total,
          percentage: totalPatentamientos > 0 ? roundPercentage((leader.total / totalPatentamientos) * 100) : 0,
        }
      : null,
  };
};

const getGeneralMonthsFromTotalizados = async (year: number): Promise<DashboardMonthColumn[]> => {
  const monthNumbers = await PatentamientoTotalizado.distinct("mes", {
    anio: year,
    registroLocalidad: { $in: Array.from(ZONA_NIC_LOCALITIES) },
  });

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

const getGeneralTrendFromTotalizados = async (
  year: number,
  month: number | null,
  months: DashboardMonthColumn[],
): Promise<DashboardGeneralTrendPoint[]> => {
  if (month) {
    const rows = await PatentamientoTotalizado.aggregate<{ dayNumber: number; total: number }>([
      {
        $match: {
          anio: year,
          mes: month,
          registroLocalidad: { $in: Array.from(ZONA_NIC_LOCALITIES) },
        },
      },
      {
        $group: {
          _id: "$dia",
          total: { $sum: "$total" },
        },
      },
      {
        $project: {
          _id: 0,
          dayNumber: "$_id",
          total: 1,
        },
      },
      { $sort: { dayNumber: 1 } },
    ]);

    const totalsByDay = new Map(rows.map((row) => [row.dayNumber, row.total]));
    const totalDays = new Date(year, month, 0).getDate();

    return Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1;
      const monthKey = String(month).padStart(2, "0");
      const dayKey = String(dayNumber).padStart(2, "0");

      return {
        key: `${year}-${monthKey}-${dayKey}`,
        label: dayKey,
        total: totalsByDay.get(dayNumber) ?? 0,
      };
    });
  }

  const rows = await PatentamientoTotalizado.aggregate<{ monthNumber: number; total: number }>([
    {
      $match: {
        anio: year,
        registroLocalidad: { $in: Array.from(ZONA_NIC_LOCALITIES) },
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
  ]);

  const totalsByMonth = new Map(rows.map((row) => [row.monthNumber, row.total]));

  return months.map((monthItem) => ({
    key: monthItem.key,
    label: monthItem.label,
    total: totalsByMonth.get(monthItem.monthNumber) ?? 0,
  }));
};

const getGeneralTopModelsFromTotalizados = async (
  year: number,
  month: number | null,
  page: number,
  pageSize: number,
): Promise<Pick<DashboardGeneralResponse, "topModels" | "topModelsPagination">> => {
  const matchStage: Record<string, unknown> = {
    anio: year,
    registroLocalidad: { $in: Array.from(ZONA_NIC_LOCALITIES) },
    modelo: { $exists: true, $ne: "" },
    marca: { $exists: true, $ne: "" },
  };

  if (month !== null) {
    matchStage.mes = month;
  }

  const rows = await PatentamientoTotalizado.aggregate<{
    brand: string;
    model: string;
    total: number;
  }>([
    { $match: matchStage },
    {
      $group: {
        _id: {
          brand: "$marca",
          model: "$modelo",
        },
        total: { $sum: "$total" },
      },
    },
    {
      $project: {
        _id: 0,
        brand: "$_id.brand",
        model: "$_id.model",
        total: 1,
      },
    },
    {
      $sort: {
        total: -1,
        brand: 1,
        model: 1,
      },
    },
  ]);

  const totalModels = rows.length;
  const totalPatentamientos = rows.reduce((sum, row) => sum + row.total, 0);
  const totalPages = totalModels > 0 ? Math.ceil(totalModels / pageSize) : 0;
  const normalizedPage = totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
  const startIndex = (normalizedPage - 1) * pageSize;
  const topModels = rows
    .slice(startIndex, startIndex + pageSize)
    .map<DashboardGeneralTopModel>((row, index) => ({
      rank: startIndex + index + 1,
      brand: row.brand,
      model: row.model,
      total: row.total,
      percentage: totalPatentamientos > 0 ? roundPercentage((row.total / totalPatentamientos) * 100) : 0,
    }));

  return {
    topModels,
    topModelsPagination: {
      page: normalizedPage,
      pageSize,
      total: totalModels,
      totalPages,
    },
  };
};

const getGeneralZonaNic = async (
  year: number,
  month: number | null,
  page: number,
  pageSize: number,
): Promise<DashboardGeneralResponse> => {
  const [summary, months, topModelsData] = await Promise.all([
    getGeneralSummaryFromTotalizados(year),
    getGeneralMonthsFromTotalizados(year),
    getGeneralTopModelsFromTotalizados(year, month, page, pageSize),
  ]);

  const title = "General - Zona NIC";

  if (!months.length) {
    return {
      title,
      months,
      summary,
      trend: [],
      topBrands: [],
      topModels: topModelsData.topModels,
      topModelsPagination: topModelsData.topModelsPagination,
    };
  }

  const trend = await getGeneralTrendFromTotalizados(year, month, months);

  return {
    title,
    months,
    summary,
    trend,
    topBrands: [],
    topModels: topModelsData.topModels,
    topModelsPagination: topModelsData.topModelsPagination,
  };
};

const getLocationOptions = async (year: number, province: string | null): Promise<DashboardLocationOptionsResponse> => {
  const provinceMatch: Record<string, unknown> = {
    anio: year,
    registroProvincia: { $exists: true, $ne: "" },
  };
  const localityMatch: Record<string, unknown> = {
    anio: year,
    registroLocalidad: { $exists: true, $ne: "" },
  };

  if (province) {
    localityMatch.registroProvincia = province;
  }

  const [provinces, localities] = await Promise.all([
    PatentamientoTotalizado.distinct("registroProvincia", provinceMatch),
    PatentamientoTotalizado.distinct("registroLocalidad", localityMatch),
  ]);

  return {
    provinces: provinces.map(String).filter(Boolean).sort((a, b) => a.localeCompare(b, "es")),
    localities: localities.map(String).filter(Boolean).sort((a, b) => a.localeCompare(b, "es")),
  };
};

const getLocationAnalysis = async (
  year: number,
  planFilter: DashboardPlanFilter,
  filters: DashboardLocationFilters,
): Promise<DashboardLocationAnalysisResponse> => {
  const title = `Analisis por localidad${buildLocationTitleSuffix(filters)}`;
  const titleSuffix = buildLocationTitleSuffix(filters);

  const [hilux, sw4, cCross, yCross, yaris] = await Promise.all([
    getSegmentRowsFromCustomLocation(`${SEGMENT_DEFINITIONS.hilux.title}${titleSuffix}`, year, SEGMENT_DEFINITIONS.hilux.models, planFilter, filters),
    getSegmentRowsFromCustomLocation(`${SEGMENT_DEFINITIONS.sw4.title}${titleSuffix}`, year, SEGMENT_DEFINITIONS.sw4.models, planFilter, filters),
    getSegmentRowsFromCustomLocation(`${SEGMENT_DEFINITIONS["c-cross"].title}${titleSuffix}`, year, SEGMENT_DEFINITIONS["c-cross"].models, planFilter, filters),
    getSegmentRowsFromCustomLocation(`${SEGMENT_DEFINITIONS["y-cross"].title}${titleSuffix}`, year, SEGMENT_DEFINITIONS["y-cross"].models, planFilter, filters),
    getSegmentRowsFromCustomLocation(`${SEGMENT_DEFINITIONS.yaris.title}${titleSuffix}`, year, SEGMENT_DEFINITIONS.yaris.models, planFilter, filters),
  ]);

  return {
    title,
    filters,
    tables: {
      hilux,
      sw4,
      cCross,
      yCross,
      yaris,
    },
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
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS.hilux.title} - PAIS`, year, "pais", SEGMENT_DEFINITIONS.hilux.models, planFilter);
  }

  static getSegmentoPickupZonaNic(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS.hilux.title} - Zona NIC`, year, "zona-nic", SEGMENT_DEFINITIONS.hilux.models, planFilter);
  }

  static getSegmentoSw4Pais(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS.sw4.title} - PAIS`, year, "pais", SEGMENT_DEFINITIONS.sw4.models, planFilter);
  }

  static getSegmentoSw4ZonaNic(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS.sw4.title} - Zona NIC`, year, "zona-nic", SEGMENT_DEFINITIONS.sw4.models, planFilter);
  }

  static getSegmentoCCrossPais(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS["c-cross"].title} - PAIS`, year, "pais", SEGMENT_DEFINITIONS["c-cross"].models, planFilter);
  }

  static getSegmentoCCrossZonaNic(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS["c-cross"].title} - Zona NIC`, year, "zona-nic", SEGMENT_DEFINITIONS["c-cross"].models, planFilter);
  }

  static getSegmentoYarisPais(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS.yaris.title} - PAIS`, year, "pais", SEGMENT_DEFINITIONS.yaris.models, planFilter);
  }

  static getSegmentoYarisZonaNic(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS.yaris.title} - Zona NIC`, year, "zona-nic", SEGMENT_DEFINITIONS.yaris.models, planFilter);
  }

  static getSegmentoYCrossPais(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS["y-cross"].title} - PAIS`, year, "pais", SEGMENT_DEFINITIONS["y-cross"].models, planFilter);
  }

  static getSegmentoYCrossZonaNic(year: number, planFilter: DashboardPlanFilter) {
    return getSegmentRowsFromTotalizados(`${SEGMENT_DEFINITIONS["y-cross"].title} - Zona NIC`, year, "zona-nic", SEGMENT_DEFINITIONS["y-cross"].models, planFilter);
  }

  static getToyotaEvolution(year: number, planFilter: DashboardPlanFilter) {
    return getToyotaEvolution(year, planFilter);
  }

  static getGeneralZonaNic(year: number, month: number | null, page: number, pageSize: number) {
    return getGeneralZonaNic(year, month, page, pageSize);
  }

  static getLocationOptions(year: number, province: string | null) {
    return getLocationOptions(year, province);
  }

  static getLocationAnalysis(year: number, planFilter: DashboardPlanFilter, filters: DashboardLocationFilters) {
    return getLocationAnalysis(year, planFilter, filters);
  }
}
