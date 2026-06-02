import PatentamientoDataset, {
  type IPatentamientoDataset,
  type PatentamientoDatasetType,
} from "../models/PatentamientoDataset";

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

const PICKUP_MODELS = [
  "TOYOTA HILUX",
  "FORD RANGER",
  "VOLKSWAGEN AMAROK",
  "CHEVROLET S10",
  "NISSAN FRONTIER",
  "BYD SHARK",
] as const;

const SUV_MODELS = [
  "FORD TERRITORY",
  "VOLKSWAGEN TAOS",
  "TOYOTA COROLLA CROSS",
  "JEEP COMPASS",
  "PEUGEOT 3008",
] as const;

const B_SUV_MODELS = [
  "TOYOTA TERA",
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

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const roundPercentage = (value: number) => Math.round(value * 100) / 100;

const parseHeaderYear = (header: string) => {
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
  const year = parseHeaderYear(column.header);

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

const getYearsFromDataset = (dataset: PatentamientoDatasetLean | null) =>
  (dataset?.monthColumns ?? [])
    .map((column) => parseHeaderYear(column.header))
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

const buildTableRows = (
  rows: PatentamientoRowNormalized[],
  months: DashboardMonthColumn[],
): DashboardTableRow[] => {
  const totalBase = rows.reduce((acc, row) => acc + row.total, 0);

  return rows.map((row) => ({
    label: row.primaryValue,
    months: months.reduce<Record<string, number>>((acc, month) => {
      acc[month.key] = row.months[month.key] ?? 0;
      return acc;
    }, {}),
    total: row.total,
    percentage: totalBase > 0 ? roundPercentage((row.total / totalBase) * 100) : 0,
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
    .sort((a, b) => b.total - a.total || a.primaryValue.localeCompare(b.primaryValue))
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

const getSegmentRows = async (
  datasetType: PatentamientoDatasetType,
  title: string,
  models: readonly string[],
  year: number,
): Promise<DashboardTableResponse> => {
  const dataset = await getDataset(datasetType);
  const months = getFilteredMonths(dataset, year);
  const entityLabel = "Modelo";

  if (!dataset || !months.length) {
    return buildEmptyTable(title, entityLabel, months);
  }

  const allowedModels = new Set(models.map(normalizeText));
  const rows = normalizeRows(dataset)
    .filter((row) => allowedModels.has(normalizeText(row.primaryValue)))
    .sort((a, b) => b.total - a.total || a.primaryValue.localeCompare(b.primaryValue));

  const tableRows = buildTableRows(rows, months);

  return {
    title,
    entityLabel,
    months,
    rows: tableRows,
    totalRow: buildTotalRow(tableRows, months),
  };
};

const getToyotaEvolution = async (year: number): Promise<DashboardEvolutionResponse> => {
  const [paisDataset, zonaNicDataset] = await Promise.all([
    getDataset("pais-marcas"),
    getDataset("zona-nic-marcas"),
  ]);

  const title = "Toyota - Evolucion Mensual PAIS vs Zona NIC";

  if (!paisDataset || !zonaNicDataset) {
    return { title, series: [] };
  }

  const paisMonths = getFilteredMonths(paisDataset, year);
  const zonaNicMonths = getFilteredMonths(zonaNicDataset, year);

  if (!paisMonths.length || !zonaNicMonths.length) {
    return { title, series: [] };
  }

  const toyotaPais = normalizeRows(paisDataset).find((row) => normalizeText(row.primaryValue) === "TOYOTA");
  const toyotaZonaNic = normalizeRows(zonaNicDataset).find((row) => normalizeText(row.primaryValue) === "TOYOTA");

  if (!toyotaPais || !toyotaZonaNic) {
    return { title, series: [] };
  }

  const monthMap = new Map<string, DashboardMonthColumn>();
  [...paisMonths, ...zonaNicMonths].forEach((month) => {
    if (!monthMap.has(month.key)) {
      monthMap.set(month.key, month);
    }
  });

  const series = Array.from(monthMap.values())
    .sort((a, b) => a.monthNumber - b.monthNumber)
    .map((month) => {
      const paisTotal = normalizeRows(paisDataset).reduce((sum, row) => sum + (row.months[month.key] ?? 0), 0);
      const zonaNicTotal = normalizeRows(zonaNicDataset).reduce((sum, row) => sum + (row.months[month.key] ?? 0), 0);
      const toyotaPaisValue = toyotaPais.months[month.key] ?? 0;
      const toyotaZonaNicValue = toyotaZonaNic.months[month.key] ?? 0;

      return {
        label: month.label,
        pais: paisTotal > 0 ? roundPercentage((toyotaPaisValue / paisTotal) * 100) : 0,
        zonaNic: zonaNicTotal > 0 ? roundPercentage((toyotaZonaNicValue / zonaNicTotal) * 100) : 0,
      };
    });

  return {
    title,
    series,
  };
};

export class PatentamientosDashboardService {
  static async getAvailableYears(): Promise<DashboardAvailableYearsResponse> {
    const datasets = await PatentamientoDataset.find(
      {},
      { monthColumns: 1, _id: 0 },
    ).lean<Array<Pick<PatentamientoDatasetLean, "monthColumns">>>();

    const years = Array.from(
      new Set(
        datasets.flatMap((dataset) =>
          dataset.monthColumns
            .map((column) => parseHeaderYear(column.header))
            .filter((year): year is number => Boolean(year)),
        ),
      ),
    ).sort((a, b) => b - a);

    return {
      years,
      selectedYear: years[0] ?? null,
    };
  }

  static getTopMarcasPais(year: number) {
    return getTopRows("pais-marcas", "Top 10 Marcas Patentadas - PAIS", year);
  }

  static getTopMarcasZonaNic(year: number) {
    return getTopRows("zona-nic-marcas", "Top 10 Marcas Patentadas - Zona NIC", year);
  }

  static getSegmentoPickupPais(year: number) {
    return getSegmentRows("pais-modelos", "Segmento Pickup - PAIS", PICKUP_MODELS, year);
  }

  static getSegmentoPickupZonaNic(year: number) {
    return getSegmentRows("zona-nic-modelos", "Segmento Pickup - Zona NIC", PICKUP_MODELS, year);
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

  static getToyotaEvolution(year: number) {
    return getToyotaEvolution(year);
  }
}
