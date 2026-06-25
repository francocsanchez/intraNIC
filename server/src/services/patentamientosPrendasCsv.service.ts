import fs from "fs";
import csv from "csv-parser";
import PatentamientoTotalizado from "../models/PatentamientoTotalizado";
import type { IImportExecutionErrorDetail } from "../models/ImportExecutionLog";

const CSV_HEADERS = [
  "IdentificadorUnico",
  "Marca",
  "Modelo",
  "FechaPatentamiento",
  "RegistroLocalidad",
  "RegistroProvincia",
  "Prendado",
  "TipoAcreedorPrendario",
] as const;

type CsvHeader = (typeof CSV_HEADERS)[number];
type CsvRow = Record<CsvHeader, string>;

type PatentamientoTotalizadoWritePayload = {
  anio: number;
  mes: number;
  dia: number;
  marca: string;
  ranger: boolean;
  registroProvincia: string;
  registroLocalidad: string;
  prendado: boolean | null;
  tipoAcreedorPrendario: string;
  total: number;
  sourceUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type PatentamientosCsvImportSummary = {
  totalRead: number;
  inserted: number;
  updated: number;
  discarded: number;
  errored: number;
  totalizedRows: number;
  errorSummary: string[];
  errorDetailsSample: IImportExecutionErrorDetail[];
};

const ERROR_SAMPLE_LIMIT = 20;
const LEGACY_TOTALIZED_UNIQUE_INDEX = "patentamientos_totalizados_unique_dim_idx";
const EMPTY_PROVINCE_LABEL = "SIN PROVINCIA";
const EMPTY_LOCALITY_LABEL = "SIN LOCALIDAD";
const EMPTY_ACREEDOR_LABEL = "SIN ACREEDOR";

const trimCell = (value: unknown) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (value: unknown) =>
  trimCell(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const normalizeDimensionValue = (value: unknown, fallback: string) => trimCell(value) || fallback;

const parseNullableBoolean = (value: unknown, fieldName: string) => {
  const raw = trimCell(value);

  if (!raw) {
    return null;
  }

  const normalized = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  if (["si", "s", "true", "1", "y", "yes"].includes(normalized)) {
    return true;
  }

  if (["no", "n", "false", "0"].includes(normalized)) {
    return false;
  }

  throw new Error(`El campo "${fieldName}" no contiene un booleano valido`);
};

const buildUtcDate = (year: number, month: number, day: number, fieldName: string) => {
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsedDate.getTime())
    || parsedDate.getUTCFullYear() !== year
    || parsedDate.getUTCMonth() !== month - 1
    || parsedDate.getUTCDate() !== day
  ) {
    throw new Error(`El campo "${fieldName}" contiene una fecha invalida`);
  }

  return parsedDate;
};

const parseRequiredDate = (value: unknown, fieldName: string) => {
  const raw = trimCell(value);

  if (!raw) {
    throw new Error(`El campo "${fieldName}" es obligatorio`);
  }

  const dayFirstMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);

  if (dayFirstMatch) {
    return buildUtcDate(
      Number(dayFirstMatch[3]),
      Number(dayFirstMatch[2]),
      Number(dayFirstMatch[1]),
      fieldName,
    );
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);

  if (isoMatch) {
    return buildUtcDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]), fieldName);
  }

  throw new Error(`El campo "${fieldName}" no tiene un formato de fecha valido`);
};

const validateHeaders = (headers: string[]) => {
  const normalizedHeaders = headers.map((header) => trimCell(header).replace(/^\uFEFF/, ""));
  const missingHeaders = CSV_HEADERS.filter((header) => !normalizedHeaders.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(", ")}`);
  }
};

const buildAggregationKey = (
  payload: Omit<PatentamientoTotalizadoWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt">,
) =>
  [
    payload.anio,
    payload.mes,
    payload.dia,
    payload.marca,
    payload.ranger ? "1" : "0",
    payload.registroProvincia,
    payload.registroLocalidad,
    payload.prendado === null ? "null" : payload.prendado ? "1" : "0",
    payload.tipoAcreedorPrendario,
  ].join("|");

const buildTotalizadoPayload = (
  row: CsvRow,
): Omit<PatentamientoTotalizadoWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt"> => {
  const identificadorUnico = trimCell(row.IdentificadorUnico);

  if (!identificadorUnico) {
    throw new Error('El campo "IdentificadorUnico" es obligatorio');
  }

  const fechaPatentamiento = parseRequiredDate(row.FechaPatentamiento, "FechaPatentamiento");
  const marca = normalizeText(row.Marca);
  const modelo = normalizeText(row.Modelo);

  if (!marca) {
    throw new Error('El campo "Marca" es obligatorio');
  }

  return {
    anio: fechaPatentamiento.getUTCFullYear(),
    mes: fechaPatentamiento.getUTCMonth() + 1,
    dia: fechaPatentamiento.getUTCDate(),
    marca,
    ranger: modelo.includes("RANGER"),
    registroProvincia: normalizeDimensionValue(row.RegistroProvincia, EMPTY_PROVINCE_LABEL),
    registroLocalidad: normalizeDimensionValue(row.RegistroLocalidad, EMPTY_LOCALITY_LABEL),
    prendado: parseNullableBoolean(row.Prendado, "Prendado"),
    tipoAcreedorPrendario: normalizeDimensionValue(row.TipoAcreedorPrendario, EMPTY_ACREEDOR_LABEL),
  };
};

const pushError = (
  summary: PatentamientosCsvImportSummary,
  line: number,
  message: string,
  identificadorUnico = "",
) => {
  summary.discarded += 1;
  summary.errored += 1;

  if (summary.errorDetailsSample.length < ERROR_SAMPLE_LIMIT) {
    summary.errorDetailsSample.push({
      line,
      identificadorUnico,
      message,
    });
  }
};

export class PatentamientosPrendasCsvService {
  static async processFile(filePath: string): Promise<PatentamientosCsvImportSummary> {
    const summary: PatentamientosCsvImportSummary = {
      totalRead: 0,
      inserted: 0,
      updated: 0,
      discarded: 0,
      errored: 0,
      totalizedRows: 0,
      errorSummary: [],
      errorDetailsSample: [],
    };

    const totalsByKey = new Map<
      string,
      Omit<PatentamientoTotalizadoWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt"> & {
        total: number;
      }
    >();
    let lineNumber = 1;
    let hasHeaders = false;
    let hasAtLeastOneDataRow = false;

    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      const parser = csv({
        separator: ";",
        strict: true,
        mapHeaders: ({ header }) => trimCell(header).replace(/^\uFEFF/, ""),
      });

      let isSettled = false;

      const rejectOnce = (error: unknown) => {
        if (isSettled) {
          return;
        }

        isSettled = true;
        reject(error);
      };

      parser.on("headers", (headers: string[]) => {
        try {
          validateHeaders(headers);
          hasHeaders = true;
        } catch (error) {
          rejectOnce(error);
        }
      });

      parser.on("data", (rawRow: Record<string, string>) => {
        lineNumber += 1;

        try {
          hasAtLeastOneDataRow = true;
          summary.totalRead += 1;

          const row = rawRow as CsvRow;
          const payload = buildTotalizadoPayload(row);
          const key = buildAggregationKey(payload);
          const current = totalsByKey.get(key);

          if (current) {
            current.total += 1;
          } else {
            totalsByKey.set(key, {
              ...payload,
              total: 1,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "No se pudo procesar la fila";
          pushError(summary, lineNumber, errorMessage, trimCell(rawRow.IdentificadorUnico));
        }
      });

      parser.on("end", () => {
        if (isSettled) {
          return;
        }

        try {
          if (!hasHeaders) {
            throw new Error("El archivo CSV no contiene cabeceras validas");
          }

          if (!hasAtLeastOneDataRow) {
            throw new Error("El archivo CSV no contiene registros para importar");
          }

          isSettled = true;
          resolve();
        } catch (error) {
          rejectOnce(error);
        }
      });

      parser.on("error", (error) => {
        rejectOnce(new Error(`CSV corrupto o invalido: ${error.message}`));
      });

      fileStream.on("error", (error) => {
        rejectOnce(error);
      });

      fileStream.pipe(parser);
    });

    const sourceUpdatedAt = new Date();
    const timestamps = {
      createdAt: sourceUpdatedAt,
      updatedAt: sourceUpdatedAt,
    };
    const totalizedRows = Array.from(totalsByKey.values()).map((row) => ({
      ...row,
      sourceUpdatedAt,
      ...timestamps,
    }));

    await PatentamientoTotalizado.deleteMany({});
    const existingIndexes = await PatentamientoTotalizado.collection.indexes().catch(() => []);

    if (existingIndexes.some((index) => index.name === LEGACY_TOTALIZED_UNIQUE_INDEX)) {
      await PatentamientoTotalizado.collection.dropIndex(LEGACY_TOTALIZED_UNIQUE_INDEX);
    }

    await PatentamientoTotalizado.syncIndexes();

    if (totalizedRows.length) {
      await PatentamientoTotalizado.collection.insertMany(totalizedRows, { ordered: false });
    }

    const insertedAggregation = await PatentamientoTotalizado.aggregate([
      { $group: { _id: null, total: { $sum: "$total" }, rows: { $sum: 1 } } },
    ]);

    const persistedRowCount = insertedAggregation[0]?.rows ?? 0;
    const persistedTotalCount = insertedAggregation[0]?.total ?? 0;
    const validReadCount = summary.totalRead - summary.discarded;

    if (persistedTotalCount !== validReadCount) {
      throw new Error(
        `La totalizacion quedo inconsistente. Filas validas=${validReadCount}, total persistido=${persistedTotalCount}`,
      );
    }

    summary.inserted = persistedRowCount;
    summary.totalizedRows = totalizedRows.length;

    if (summary.errorDetailsSample.length) {
      summary.errorSummary = summary.errorDetailsSample.map((detail) =>
        detail.line ? `Linea ${detail.line}: ${detail.message}` : detail.message,
      );
    }

    return summary;
  }
}
