import * as XLSX from "xlsx";
import PatentamientoDataset from "../models/PatentamientoDataset";

export type PatentamientosDatasetType =
  | "pais-marcas"
  | "zona-nic-marcas"
  | "pais-modelos"
  | "zona-nic-modelos";

type PatentamientosImportFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type PatentamientosDatasetConfig = {
  dataset: PatentamientosDatasetType;
  label: string;
  scope: "pais" | "zona-nic";
  entity: "marca" | "modelo";
  primaryColumn: "marca" | "modelo";
  requiredHeaders: string[];
};

type PatentamientosPreparedRecord = {
  primaryValue: string;
  months: Record<string, number>;
  total: number;
};

type PatentamientosImportResult = {
  dataset: PatentamientosDatasetType;
  worksheetName: string;
  totalRows: number;
  message: string;
};

type WorksheetColumnMap = {
  baseColumns: Record<string, number>;
  monthColumns: Array<{ index: number; key: string; label: string; monthNumber: number }>;
  totalColumn: number;
  headers: string[];
};

const MONTH_ALIASES: Record<string, string> = {
  ene: "enero",
  enero: "enero",
  feb: "febrero",
  febrero: "febrero",
  mar: "marzo",
  marzo: "marzo",
  abr: "abril",
  abril: "abril",
  may: "mayo",
  mayo: "mayo",
  jun: "junio",
  junio: "junio",
  jul: "julio",
  julio: "julio",
  ago: "agosto",
  agosto: "agosto",
  sep: "septiembre",
  sept: "septiembre",
  septiembre: "septiembre",
  oct: "octubre",
  octubre: "octubre",
  nov: "noviembre",
  noviembre: "noviembre",
  dic: "diciembre",
  diciembre: "diciembre",
};

const MONTH_KEYS_BY_NUMBER = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const DATASET_CONFIGS: Record<PatentamientosDatasetType, PatentamientosDatasetConfig> = {
  "pais-marcas": {
    dataset: "pais-marcas",
    label: "PAIS - Marcas",
    scope: "pais",
    entity: "marca",
    primaryColumn: "marca",
    requiredHeaders: ["marca"],
  },
  "zona-nic-marcas": {
    dataset: "zona-nic-marcas",
    label: "Zona NIC - Marcas",
    scope: "zona-nic",
    entity: "marca",
    primaryColumn: "marca",
    requiredHeaders: ["marca"],
  },
  "pais-modelos": {
    dataset: "pais-modelos",
    label: "PAIS - Modelos",
    scope: "pais",
    entity: "modelo",
    primaryColumn: "modelo",
    requiredHeaders: ["modelo"],
  },
  "zona-nic-modelos": {
    dataset: "zona-nic-modelos",
    label: "Zona NIC - Modelos",
    scope: "zona-nic",
    entity: "modelo",
    primaryColumn: "modelo",
    requiredHeaders: ["modelo"],
  },
};

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeCell = (value: unknown) => String(value ?? "").trim();
const normalizeCellToken = (value: unknown) => normalizeHeader(value).replace(/\s+/g, "");

const isRowEmpty = (row: unknown[]) => row.every((cell) => normalizeCell(cell) === "");

const getWorkbookRows = (file: PatentamientosImportFile) => {
  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("El archivo Excel no contiene hojas para procesar");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: false,
  });

  if (!rows.length) {
    throw new Error("El archivo Excel no contiene filas para procesar");
  }

  return { rows, worksheetName: firstSheetName };
};

const findHeaderRowIndex = (rows: unknown[][], requiredHeaders: string[]) =>
  rows.findIndex((row) => {
    const normalizedHeaders = row.map((cell) => normalizeHeader(cell));

    return requiredHeaders.every((requiredHeader) => normalizedHeaders.includes(requiredHeader));
  });

const getMonthKey = (header: string) => {
  const normalized = normalizeHeader(header).replace(/\s+/g, "");
  const aliasMatch = MONTH_ALIASES[normalized];

  if (aliasMatch) {
    return aliasMatch;
  }

  const shortDateMatch = String(header)
    .trim()
    .match(/^(\d{1,2})[\/\-](\d{2,4})$/);

  if (shortDateMatch) {
    const firstSegment = Number(shortDateMatch[1]);

    if (firstSegment >= 1 && firstSegment <= 12) {
      return MONTH_KEYS_BY_NUMBER[firstSegment - 1] ?? null;
    }
  }

  const dateLikeMatch = String(header)
    .trim()
    .match(/^(\d{1,2})[\/\-](\d{1,2}|\d{2,4})[\/\-](\d{1,2}|\d{2,4})$/);

  if (!dateLikeMatch) {
    return null;
  }

  const firstSegment = Number(dateLikeMatch[1]);

  if (firstSegment < 1 || firstSegment > 12) {
    return null;
  }

  return MONTH_KEYS_BY_NUMBER[firstSegment - 1] ?? null;
};

const getMonthNumberFromKey = (monthKey: string) => {
  const index = MONTH_KEYS_BY_NUMBER.findIndex((item) => item === monthKey);
  return index === -1 ? null : index + 1;
};

const buildColumnMap = (
  headerRow: unknown[],
  requiredHeaders: string[],
): WorksheetColumnMap => {
  const headers = headerRow.map((cell) => normalizeCell(cell));
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));

  const baseColumns = requiredHeaders.reduce<Record<string, number>>((acc, field) => {
    const index = normalizedHeaders.findIndex((header) => header === field);

    if (index === -1) {
      throw new Error(`No se encontro la columna requerida "${field}"`);
    }

    acc[field] = index;
    return acc;
  }, {});

  const totalColumn = normalizedHeaders.findIndex((header) => header === "total");

  if (totalColumn === -1) {
    throw new Error('No se encontro la columna requerida "Total"');
  }

  const monthColumns = headers.reduce<Array<{ index: number; key: string; label: string; monthNumber: number }>>((acc, header, index) => {
    const monthKey = getMonthKey(header);

    if (monthKey) {
      const monthNumber = getMonthNumberFromKey(monthKey);

      if (monthNumber) {
        acc.push({ index, key: monthKey, label: header, monthNumber });
      }
    }

    return acc;
  }, []);

  if (!monthColumns.length) {
    throw new Error("No se encontraron columnas mensuales reconocibles en el archivo");
  }

  return {
    baseColumns,
    monthColumns,
    totalColumn,
    headers,
  };
};

const parseNumericCell = (value: unknown) => {
  if (typeof value === "number") return value;

  const raw = normalizeCell(value);
  if (!raw) return 0;

  const sanitized = raw.replace(/\s+/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const parsed = Number(sanitized);

  return Number.isFinite(parsed) ? parsed : 0;
};

const extractPreparedRecords = (
  rows: unknown[][],
  headerRowIndex: number,
  columnMap: WorksheetColumnMap,
) => {
  const records: PatentamientosPreparedRecord[] = [];

  rows.slice(headerRowIndex + 1).forEach((row) => {
    if (isRowEmpty(row)) return;

    const baseValues = Object.entries(columnMap.baseColumns).reduce<Record<string, string>>((acc, [key, index]) => {
      acc[key] = normalizeCell(row[index]);
      return acc;
    }, {});

    const primaryValue = Object.values(baseValues)[0] ?? "";
    const months = columnMap.monthColumns.reduce<Record<string, number>>((acc, monthColumn) => {
      acc[monthColumn.key] = parseNumericCell(row[monthColumn.index]);
      return acc;
    }, {});

    const record: PatentamientosPreparedRecord = {
      primaryValue,
      months,
      total: parseNumericCell(row[columnMap.totalColumn]),
    };

    const hasPrimaryValue = normalizeCell(record.primaryValue) !== "";
    const isTotalRow = normalizeCellToken(record.primaryValue) === "total";

    if (hasPrimaryValue && !isTotalRow) {
      records.push(record);
    }
  });

  return records;
};

const prepareWorksheetData = (
  file: PatentamientosImportFile,
  config: PatentamientosDatasetConfig,
) => {
  const { rows, worksheetName } = getWorkbookRows(file);
  const headerRowIndex = findHeaderRowIndex(rows, config.requiredHeaders);

  if (headerRowIndex === -1) {
    throw new Error(
      `No se encontro una fila de encabezados valida para ${config.label}. Verifica que existan las columnas esperadas.`,
    );
  }

  const columnMap = buildColumnMap(rows[headerRowIndex], config.requiredHeaders);
  const records = extractPreparedRecords(rows, headerRowIndex, columnMap);

  if (!records.length) {
    throw new Error("No se detectaron filas de datos utiles para importar");
  }

  return {
    worksheetName,
    headers: columnMap.headers,
    monthColumns: columnMap.monthColumns,
    records,
  };
};

const replaceDatasetData = async (
  config: PatentamientosDatasetConfig,
  file: PatentamientosImportFile,
  monthColumns: WorksheetColumnMap["monthColumns"],
  records: PatentamientosPreparedRecord[],
) => {
  await PatentamientoDataset.findOneAndUpdate(
    { datasetType: config.dataset },
    {
      datasetType: config.dataset,
      label: config.label,
      scope: config.scope,
      entity: config.entity,
      primaryColumn: config.primaryColumn,
      sourceFileName: file.originalname,
      monthColumns: monthColumns.map((monthColumn) => ({
        key: monthColumn.key,
        monthNumber: monthColumn.monthNumber,
        header: monthColumn.label,
      })),
      rows: records.map((record) => ({
        primaryValue: record.primaryValue,
        total: record.total,
        months: record.months,
      })),
      rowCount: records.length,
      importedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );
};

export class PatentamientosService {
  static async importDataset(
    dataset: PatentamientosDatasetType,
    file: PatentamientosImportFile,
  ): Promise<PatentamientosImportResult> {
    const config = DATASET_CONFIGS[dataset];

    if (!config) {
      throw new Error("El tipo de importacion solicitado no existe");
    }

    const prepared = prepareWorksheetData(file, config);

    // Pipeline de importacion preparado para la etapa siguiente:
    // 1. parsear workbook en memoria
    // 2. identificar encabezados y filas utiles
    // 3. mapear columnas base, meses y total
    // 4. extraer registros normalizados
    // 5. reemplazar completamente el dataset vigente
    await replaceDatasetData(config, file, prepared.monthColumns, prepared.records);

    return {
      dataset,
      worksheetName: prepared.worksheetName,
      totalRows: prepared.records.length,
      message: `Archivo ${config.label} importado correctamente. Se prepararon ${prepared.records.length} filas desde la hoja ${prepared.worksheetName}.`,
    };
  }
}
